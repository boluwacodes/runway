#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token::StellarAssetClient,
    Env,
};

fn setup(env: &Env) -> RunwayInvoiceContractClient<'_> {
    env.mock_all_auths();
    let contract_id = env.register(RunwayInvoiceContract, ());
    RunwayInvoiceContractClient::new(env, &contract_id)
}

fn create_token<'a>(env: &Env) -> (Address, token::Client<'a>, StellarAssetClient<'a>) {
    let admin = Address::generate(env);
    let sac = env.register_stellar_asset_contract_v2(admin);
    let address = sac.address();
    (
        address.clone(),
        token::Client::new(env, &address),
        StellarAssetClient::new(env, &address),
    )
}

const DAY: u64 = 86_400;

#[test]
fn creates_an_invoice_with_open_status() {
    let env = Env::default();
    let client = setup(&env);
    let (token, _, _) = create_token(&env);
    let payee = Address::generate(&env);
    let debtor = Address::generate(&env);

    let id = client.create_invoice(&payee, &debtor, &token, &100_000, &9_500, &(env.ledger().timestamp() + 30 * DAY));
    assert_eq!(id, 1);

    let invoice = client.get_invoice(&id);
    assert_eq!(invoice.payee, payee);
    assert_eq!(invoice.debtor, debtor);
    assert_eq!(invoice.funder, None);
    assert_eq!(invoice.status, InvoiceStatus::Open);
}

#[test]
fn rejects_invalid_invoice_parameters() {
    let env = Env::default();
    let client = setup(&env);
    let (token, _, _) = create_token(&env);
    let payee = Address::generate(&env);
    let debtor = Address::generate(&env);
    let future = env.ledger().timestamp() + 30 * DAY;

    assert_eq!(
        client.try_create_invoice(&payee, &debtor, &token, &0, &9_500, &future),
        Err(Ok(ContractError::InvalidParams))
    );
    assert_eq!(
        client.try_create_invoice(&payee, &debtor, &token, &100_000, &0, &future),
        Err(Ok(ContractError::InvalidParams))
    );
    assert_eq!(
        client.try_create_invoice(&payee, &debtor, &token, &100_000, &10_001, &future),
        Err(Ok(ContractError::InvalidParams))
    );
    assert_eq!(
        client.try_create_invoice(&payee, &debtor, &token, &100_000, &9_500, &0),
        Err(Ok(ContractError::InvalidParams))
    );
    assert_eq!(
        client.try_create_invoice(&payee, &payee, &token, &100_000, &9_500, &future),
        Err(Ok(ContractError::InvalidParams))
    );
}

#[test]
fn funds_an_invoice_and_advances_the_payee_immediately() {
    let env = Env::default();
    let client = setup(&env);
    let (token, token_client, asset) = create_token(&env);
    let payee = Address::generate(&env);
    let debtor = Address::generate(&env);
    let funder = Address::generate(&env);
    asset.mint(&funder, &1_000_000);

    let id = client.create_invoice(&payee, &debtor, &token, &100_000, &9_500, &(env.ledger().timestamp() + 30 * DAY));
    client.fund_invoice(&id, &funder);

    // 95% of 100_000 advanced immediately.
    assert_eq!(token_client.balance(&payee), 95_000);
    assert_eq!(token_client.balance(&funder), 905_000);

    let invoice = client.get_invoice(&id);
    assert_eq!(invoice.funder, Some(funder));
    assert_eq!(invoice.status, InvoiceStatus::Funded);
}

#[test]
fn rejects_funding_a_non_open_invoice() {
    let env = Env::default();
    let client = setup(&env);
    let (token, _, asset) = create_token(&env);
    let payee = Address::generate(&env);
    let debtor = Address::generate(&env);
    let funder_a = Address::generate(&env);
    let funder_b = Address::generate(&env);
    for f in [&funder_a, &funder_b] {
        asset.mint(f, &1_000_000);
    }

    let id = client.create_invoice(&payee, &debtor, &token, &100_000, &9_500, &(env.ledger().timestamp() + 30 * DAY));
    client.fund_invoice(&id, &funder_a);

    assert_eq!(
        client.try_fund_invoice(&id, &funder_b),
        Err(Ok(ContractError::InvoiceNotOpen))
    );
}

#[test]
fn debtor_pays_a_funded_invoice_and_the_funder_collects_full_face_value() {
    let env = Env::default();
    let client = setup(&env);
    let (token, token_client, asset) = create_token(&env);
    let payee = Address::generate(&env);
    let debtor = Address::generate(&env);
    let funder = Address::generate(&env);
    asset.mint(&funder, &1_000_000);
    asset.mint(&debtor, &1_000_000);

    let id = client.create_invoice(&payee, &debtor, &token, &100_000, &9_500, &(env.ledger().timestamp() + 30 * DAY));
    client.fund_invoice(&id, &funder);
    client.pay_invoice(&id, &debtor);

    // Funder advanced 95_000 and collected 100_000 back — 5_000 profit.
    assert_eq!(token_client.balance(&funder), 905_000 + 100_000);
    assert_eq!(token_client.balance(&debtor), 900_000);
    assert_eq!(token_client.balance(&payee), 95_000);

    assert_eq!(client.get_invoice(&id).status, InvoiceStatus::Paid);
}

#[test]
fn debtor_pays_an_unfunded_invoice_and_the_payee_collects_directly() {
    let env = Env::default();
    let client = setup(&env);
    let (token, token_client, asset) = create_token(&env);
    let payee = Address::generate(&env);
    let debtor = Address::generate(&env);
    asset.mint(&debtor, &1_000_000);

    let id = client.create_invoice(&payee, &debtor, &token, &100_000, &9_500, &(env.ledger().timestamp() + 30 * DAY));
    client.pay_invoice(&id, &debtor);

    assert_eq!(token_client.balance(&payee), 100_000);
    assert_eq!(token_client.balance(&debtor), 900_000);
    assert_eq!(client.get_invoice(&id).status, InvoiceStatus::Paid);
}

#[test]
fn rejects_payment_from_someone_who_is_not_the_debtor() {
    let env = Env::default();
    let client = setup(&env);
    let (token, _, asset) = create_token(&env);
    let payee = Address::generate(&env);
    let debtor = Address::generate(&env);
    let outsider = Address::generate(&env);
    asset.mint(&outsider, &1_000_000);

    let id = client.create_invoice(&payee, &debtor, &token, &100_000, &9_500, &(env.ledger().timestamp() + 30 * DAY));

    assert_eq!(
        client.try_pay_invoice(&id, &outsider),
        Err(Ok(ContractError::NotAuthorized))
    );
}

#[test]
fn rejects_paying_an_already_settled_invoice() {
    let env = Env::default();
    let client = setup(&env);
    let (token, _, asset) = create_token(&env);
    let payee = Address::generate(&env);
    let debtor = Address::generate(&env);
    asset.mint(&debtor, &1_000_000);

    let id = client.create_invoice(&payee, &debtor, &token, &100_000, &9_500, &(env.ledger().timestamp() + 30 * DAY));
    client.pay_invoice(&id, &debtor);

    assert_eq!(
        client.try_pay_invoice(&id, &debtor),
        Err(Ok(ContractError::InvoiceAlreadySettled))
    );
}

#[test]
fn late_payment_is_recorded_against_the_debtor() {
    let env = Env::default();
    let client = setup(&env);
    let (token, _, asset) = create_token(&env);
    let payee = Address::generate(&env);
    let debtor = Address::generate(&env);
    asset.mint(&debtor, &1_000_000);

    let due = env.ledger().timestamp() + 30 * DAY;
    let id = client.create_invoice(&payee, &debtor, &token, &100_000, &9_500, &due);

    assert_eq!(client.late_payment_count(&debtor), 0);

    env.ledger().with_mut(|l| l.timestamp = due + 1);
    client.pay_invoice(&id, &debtor);

    assert_eq!(client.late_payment_count(&debtor), 1);
}

#[test]
fn on_time_payment_does_not_record_a_late_strike() {
    let env = Env::default();
    let client = setup(&env);
    let (token, _, asset) = create_token(&env);
    let payee = Address::generate(&env);
    let debtor = Address::generate(&env);
    asset.mint(&debtor, &1_000_000);

    let due = env.ledger().timestamp() + 30 * DAY;
    let id = client.create_invoice(&payee, &debtor, &token, &100_000, &9_500, &due);
    client.pay_invoice(&id, &debtor);

    assert_eq!(client.late_payment_count(&debtor), 0);
}

#[test]
fn payee_can_cancel_an_unfunded_invoice() {
    let env = Env::default();
    let client = setup(&env);
    let (token, _, _) = create_token(&env);
    let payee = Address::generate(&env);
    let debtor = Address::generate(&env);

    let id = client.create_invoice(&payee, &debtor, &token, &100_000, &9_500, &(env.ledger().timestamp() + 30 * DAY));
    client.cancel_invoice(&id, &payee);

    assert_eq!(client.get_invoice(&id).status, InvoiceStatus::Cancelled);
}

#[test]
fn rejects_cancelling_a_funded_invoice() {
    let env = Env::default();
    let client = setup(&env);
    let (token, _, asset) = create_token(&env);
    let payee = Address::generate(&env);
    let debtor = Address::generate(&env);
    let funder = Address::generate(&env);
    asset.mint(&funder, &1_000_000);

    let id = client.create_invoice(&payee, &debtor, &token, &100_000, &9_500, &(env.ledger().timestamp() + 30 * DAY));
    client.fund_invoice(&id, &funder);

    assert_eq!(
        client.try_cancel_invoice(&id, &payee),
        Err(Ok(ContractError::InvoiceNotOpen))
    );
}

#[test]
fn rejects_cancellation_by_a_non_payee() {
    let env = Env::default();
    let client = setup(&env);
    let (token, _, _) = create_token(&env);
    let payee = Address::generate(&env);
    let debtor = Address::generate(&env);
    let outsider = Address::generate(&env);

    let id = client.create_invoice(&payee, &debtor, &token, &100_000, &9_500, &(env.ledger().timestamp() + 30 * DAY));

    assert_eq!(
        client.try_cancel_invoice(&id, &outsider),
        Err(Ok(ContractError::NotAuthorized))
    );
}

#[test]
fn total_invoices_tracks_the_running_count() {
    let env = Env::default();
    let client = setup(&env);
    let (token, _, _) = create_token(&env);
    let payee = Address::generate(&env);
    let debtor = Address::generate(&env);
    let future = env.ledger().timestamp() + 30 * DAY;

    assert_eq!(client.total_invoices(), 0);
    client.create_invoice(&payee, &debtor, &token, &100_000, &9_500, &future);
    assert_eq!(client.total_invoices(), 1);
    client.create_invoice(&payee, &debtor, &token, &50_000, &9_000, &future);
    assert_eq!(client.total_invoices(), 2);
}

#[test]
fn get_invoice_on_an_unknown_id_fails() {
    let env = Env::default();
    let client = setup(&env);

    assert_eq!(
        client.try_get_invoice(&99),
        Err(Ok(ContractError::InvoiceNotFound))
    );
}
