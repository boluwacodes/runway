# Runway — Invoice Financing on Stellar

**Get paid on your invoices today. Not in 60 days.**

An unpaid invoice is cash a business has already earned but can't spend
yet. Runway lets a funder advance most of an invoice's value right now —
the business gets paid immediately, the funder collects the full amount
once the debtor actually pays. Same economics as real-world invoice
factoring, settled trustlessly by a Soroban contract instead of a
factoring company's back office.

- **Network:** Stellar / Soroban, testnet
- **License:** MIT

## The problem

Small businesses and freelancers do the work, send the invoice, and then
wait — 30, 60, sometimes 90 days — while rent, payroll, and suppliers
don't wait with them. Traditional invoice factoring exists to bridge that
gap, but it's slow (days to get an advance wired), opaque (a factoring
company's private underwriting), and skewed toward businesses large enough
to make the paperwork worth a factor's time.

## How it works

1. **Register an invoice.** Set the face value, who owes it (the debtor),
   when it's due, and the advance percentage you're willing to accept for
   getting paid today (e.g. 95%).
2. **A funder advances you cash.** Any funder can back the invoice — the
   advance goes straight to your wallet, and the contract records who's
   owed the full amount when it's eventually collected.
3. **The debtor settles, on-chain.** Whenever they actually pay — early,
   on time, or late — the contract routes it automatically: to the funder
   if the invoice was financed, straight to the payee otherwise. A late
   payment still settles normally; it's recorded against the debtor
   rather than blocked, since nothing on-chain can force an off-chain
   payment to arrive on schedule.

## Why this belongs on Stellar

- **Fees in fractions of a cent.** Financing a single $500 invoice
  shouldn't cost a meaningful chunk of the funder's margin in network
  fees — bundling into a portfolio to make it worthwhile shouldn't be
  necessary.
- **The contract holds nothing between transfers.** Every advance and
  every settlement is a direct wallet-to-wallet transfer — payee, funder,
  debtor. Runway the app never takes custody of funds at any point.
- **No trustline setup for the common case.** Invoices default to
  Stellar's native asset, so financing one doesn't require the debtor or
  funder to set up a new token trustline first.
- **A public, permissionless payment history.** Every advance and
  settlement is a Stellar event log entry — a funder can independently
  check a debtor's on-time payment history before deciding to back their
  invoice.

## Architecture

There is deliberately no backend. The frontend talks to the deployed
Soroban contract directly over Stellar RPC, and a connected wallet (e.g.
[Freighter](https://www.freighter.app/)) signs every state-changing call.
Invoice discovery — "what invoices exist?" — is read from the contract's
own on-chain event log rather than an indexer database.

```
contracts/     Soroban contract (Rust) — invoice registration, funding,
                payment, and cancellation, all authorized via
                require_auth().
frontend/       Next.js web app — landing page and the app itself
                (register, fund, pay, cancel). Talks to the contract
                directly; no backend.
```

## Quick start

```bash
git clone https://github.com/boluwacodes/runway.git
cd runway

# Smart contract
cd contracts
cargo test --workspace
stellar contract build

# Frontend
cd ../frontend
npm install
cp .env.example .env.local
# fill in NEXT_PUBLIC_RUNWAY_CONTRACT_ID with your deployed contract id
npm run dev
```

The app runs on `:3000`. Install [Freighter](https://www.freighter.app/),
switch it to Stellar testnet, and fund a testnet account via
[the Laboratory](https://laboratory.stellar.org/#account-creator?network=test)
before registering, funding, or paying an invoice.

## The contract

`contracts/runway-invoice` — core functions:

| Function | What it does |
|---|---|
| `create_invoice` | Registers an invoice; only the payee can register one on their own behalf. |
| `fund_invoice` | A funder advances `face_value * advance_bps / 10000` to the payee immediately. |
| `pay_invoice` | The debtor settles in full — routes to the funder if financed, to the payee otherwise. Callable any time, including after the due date. |
| `cancel_invoice` | The payee cancels an invoice that was never funded. Disabled once a funder has advanced money. |
| `get_invoice` / `late_payment_count` / `total_invoices` | Read-only state, including a per-debtor late-payment strike count. |

15 unit tests cover both the funded and unfunded payment paths, late-vs-
on-time payment tracking, cancellation rules, and every rejected-input
case. See `contracts/runway-invoice/src/test.rs`.

## Roadmap

- Support for stablecoin-denominated invoices (any Stellar Asset Contract
  token, not just native XLM).
- Mainnet deployment.
- Partial funding — letting more than one funder split an advance on a
  single invoice.
