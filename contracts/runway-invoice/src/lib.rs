#![no_std]

//! Runway — invoice financing on Stellar/Soroban.
//!
//! An unpaid invoice is cash a business has already earned but can't
//! spend yet. A business (the payee) that's owed money by a debtor
//! shouldn't have to wait 30, 60, 90 days to collect it — that wait is
//! exactly what eats a small business's runway. They register the
//! invoice here; a funder advances most of its face value immediately,
//! in exchange for collecting the full amount once the debtor actually
//! pays. The funder's profit is the discount between what they advanced
//! and what they collect — the same economics as real-world invoice
//! factoring, just settled trustlessly by a contract instead of a
//! factoring company's back office.
//!
//! The contract never forces a debtor to pay — it can't, no on-chain
//! mechanism can compel an off-chain business relationship. What it does
//! guarantee: the debtor's payment, whenever it lands, is routed to
//! whoever is actually owed it (the funder if the invoice was financed,
//! the payee directly otherwise) — never held or redirected by anything
//! else. A late payment is recorded against the debtor rather than
//! penalized, the same honest, non-punitive approach to a failure mode
//! nothing on-chain can prevent.

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env};

#[contracttype]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum InvoiceStatus {
    Open = 0,
    Funded = 1,
    Paid = 2,
    Cancelled = 3,
}

#[contracttype]
#[derive(Clone, PartialEq, Debug)]
pub struct Invoice {
    pub id: u64,
    pub payee: Address,
    pub debtor: Address,
    pub funder: Option<Address>,
    pub token: Address,
    pub face_value: i128,
    /// Basis points of face_value advanced to the payee once funded (e.g.
    /// 9500 = 95%). The funder's implied profit is the remaining spread,
    /// collected in full once the debtor pays.
    pub advance_bps: u32,
    pub due_date: u64,
    pub created_at: u64,
    pub status: InvoiceStatus,
}

#[contracttype]
pub enum DataKey {
    NextInvoiceId,
    Invoice(u64),
    LatePaymentCount(Address),
}

#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    InvoiceNotFound = 1,
    InvalidParams = 2,
    InvoiceNotOpen = 3,
    NotAuthorized = 4,
    InvoiceAlreadySettled = 5,
}

const BPS_DENOMINATOR: i128 = 10_000;

#[contract]
pub struct RunwayInvoiceContract;

#[contractimpl]
impl RunwayInvoiceContract {
    /// Register an invoice. Only the payee can register one on their own
    /// behalf — nobody can invoice a debtor for money they aren't actually
    /// owed and put someone else's name on the payee side.
    pub fn create_invoice(
        env: Env,
        payee: Address,
        debtor: Address,
        token: Address,
        face_value: i128,
        advance_bps: u32,
        due_date: u64,
    ) -> Result<u64, ContractError> {
        payee.require_auth();

        if face_value <= 0 {
            return Err(ContractError::InvalidParams);
        }
        if advance_bps == 0 || advance_bps > 10_000 {
            return Err(ContractError::InvalidParams);
        }
        if due_date <= env.ledger().timestamp() {
            return Err(ContractError::InvalidParams);
        }
        if payee == debtor {
            return Err(ContractError::InvalidParams);
        }

        let id = next_id(&env);
        let invoice = Invoice {
            id,
            payee,
            debtor,
            funder: None,
            token,
            face_value,
            advance_bps,
            due_date,
            created_at: env.ledger().timestamp(),
            status: InvoiceStatus::Open,
        };
        env.storage().persistent().set(&DataKey::Invoice(id), &invoice);

        env.events()
            .publish((symbol_short!("invoice"), symbol_short!("created")), id);

        Ok(id)
    }

    /// A funder advances `face_value * advance_bps / 10000` to the payee
    /// right now, in exchange for the right to collect the full
    /// `face_value` once the debtor pays.
    pub fn fund_invoice(env: Env, invoice_id: u64, funder: Address) -> Result<(), ContractError> {
        funder.require_auth();

        let mut invoice = Self::get_invoice(env.clone(), invoice_id)?;
        if invoice.status != InvoiceStatus::Open {
            return Err(ContractError::InvoiceNotOpen);
        }

        let advance_amount = invoice.face_value * (invoice.advance_bps as i128) / BPS_DENOMINATOR;
        token::Client::new(&env, &invoice.token).transfer(&funder, &invoice.payee, &advance_amount);

        invoice.funder = Some(funder);
        invoice.status = InvoiceStatus::Funded;
        env.storage().persistent().set(&DataKey::Invoice(invoice_id), &invoice);

        env.events()
            .publish((symbol_short!("invoice"), symbol_short!("funded")), invoice_id);

        Ok(())
    }

    /// The debtor settles the invoice in full. Routes to the funder if the
    /// invoice was financed, straight to the payee otherwise. Callable any
    /// time after creation — early, on time, or late; a late payment still
    /// settles normally, just gets recorded against the debtor.
    pub fn pay_invoice(env: Env, invoice_id: u64, debtor: Address) -> Result<(), ContractError> {
        debtor.require_auth();

        let mut invoice = Self::get_invoice(env.clone(), invoice_id)?;
        if debtor != invoice.debtor {
            return Err(ContractError::NotAuthorized);
        }
        if invoice.status == InvoiceStatus::Paid || invoice.status == InvoiceStatus::Cancelled {
            return Err(ContractError::InvoiceAlreadySettled);
        }

        let recipient = invoice.funder.clone().unwrap_or_else(|| invoice.payee.clone());
        token::Client::new(&env, &invoice.token).transfer(&debtor, &recipient, &invoice.face_value);

        if env.ledger().timestamp() > invoice.due_date {
            let key = DataKey::LatePaymentCount(debtor.clone());
            let count: u32 = env.storage().persistent().get(&key).unwrap_or(0);
            env.storage().persistent().set(&key, &(count + 1));
        }

        invoice.status = InvoiceStatus::Paid;
        env.storage().persistent().set(&DataKey::Invoice(invoice_id), &invoice);

        env.events()
            .publish((symbol_short!("invoice"), symbol_short!("paid")), invoice_id);

        Ok(())
    }

    /// The payee cancels an invoice that was never funded. Once a funder
    /// has advanced money, cancellation is no longer allowed — that would
    /// strand the funder's already-committed capital.
    pub fn cancel_invoice(env: Env, invoice_id: u64, caller: Address) -> Result<(), ContractError> {
        caller.require_auth();

        let mut invoice = Self::get_invoice(env.clone(), invoice_id)?;
        if caller != invoice.payee {
            return Err(ContractError::NotAuthorized);
        }
        if invoice.status != InvoiceStatus::Open {
            return Err(ContractError::InvoiceNotOpen);
        }

        invoice.status = InvoiceStatus::Cancelled;
        env.storage().persistent().set(&DataKey::Invoice(invoice_id), &invoice);

        env.events()
            .publish((symbol_short!("invoice"), symbol_short!("cancel")), invoice_id);

        Ok(())
    }

    pub fn get_invoice(env: Env, invoice_id: u64) -> Result<Invoice, ContractError> {
        env.storage()
            .persistent()
            .get(&DataKey::Invoice(invoice_id))
            .ok_or(ContractError::InvoiceNotFound)
    }

    /// Number of times this address has paid an invoice after its due
    /// date — a transparent, independently-checkable reputation signal for
    /// anyone deciding whether to fund an invoice for this debtor.
    pub fn late_payment_count(env: Env, debtor: Address) -> u32 {
        env.storage()
            .persistent()
            .get(&DataKey::LatePaymentCount(debtor))
            .unwrap_or(0)
    }

    pub fn total_invoices(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::NextInvoiceId).unwrap_or(0)
    }
}

fn next_id(env: &Env) -> u64 {
    let current: u64 = env.storage().instance().get(&DataKey::NextInvoiceId).unwrap_or(0);
    let next = current + 1;
    env.storage().instance().set(&DataKey::NextInvoiceId, &next);
    next
}

mod test;
