# Runway

```
$ runway create-invoice --debtor GABC..XYZ --amount 4800 --advance 95%
invoice #142 registered · status: open

$ runway fund-invoice 142
4,560.00 XLM sent to payee · status: funded

$ runway pay-invoice 142
4,800.00 XLM settled to funder · status: paid
```

That's the whole product. A funder advances 95% of an invoice's face
value the moment it's registered; the debtor settles the full amount
on-chain whenever they actually pay; the contract routes it to whichever
of them is owed it. No factoring company sitting in between, holding
funds, setting a minimum invoice size, or taking days to wire an advance.

`network: Stellar / Soroban, testnet` · `license: MIT`

## The math on one invoice

```
face_value       4,800.00 XLM
advance_bps      9500  (95%)
advance_amount   4,560.00 XLM  → paid to the payee immediately on fund_invoice
funder_profit      240.00 XLM  → the spread, collected in full on pay_invoice
```

Set `advance_bps` however you want at creation — 95% above is an example,
not a default. Lower it and the payee gets less upfront; a funder backing
a first-time, unverified debtor will usually want that lower number.

## Repo map

```
contracts/runway-invoice/   Soroban contract — create/fund/pay/cancel
frontend/                   Next.js app, talks to the contract directly
```

No `backend/`. That's not an omission — see "why no backend" below.

## Run it

```bash
git clone https://github.com/boluwacodes/runway.git && cd runway

cd contracts && cargo test --workspace && stellar contract build

cd ../frontend && npm install
cp .env.example .env.local   # fill in NEXT_PUBLIC_RUNWAY_CONTRACT_ID
npm run dev
```

`:3000`. You'll need [Freighter](https://www.freighter.app/) on Stellar
testnet, funded via [the Laboratory](https://laboratory.stellar.org/#account-creator?network=test).

## Contract interface

```
create_invoice(payee, debtor, token, face_value, advance_bps, due_date) -> invoice_id
fund_invoice(invoice_id, funder)
pay_invoice(invoice_id, debtor)
cancel_invoice(invoice_id, caller)

get_invoice(invoice_id) -> Invoice
late_payment_count(debtor) -> u32
total_invoices() -> u64
```

`cancel_invoice` only works while an invoice is still `Open` — once a
funder has advanced money, cancelling would strand their capital, so
it's disabled. `pay_invoice` works any time, including past the due
date; a late payment settles like any other, it just increments
`late_payment_count` against the debtor instead of getting blocked.

15 tests in `contracts/runway-invoice/src/test.rs` — funded and
unfunded payment paths, on-time vs. late, every rejection case.

## Why no backend

Every write in `frontend/src/lib/contract.ts` builds an *unsigned*
transaction; your wallet signs it; the frontend submits it. Reads
simulate against a throwaway account — no funds needed to look something
up. "What invoices exist" is answered by scanning the contract's own
`(invoice, created)` event log, not a database this project maintains.
There's nothing running that could go down, get hacked, or lie about
what it's returning.

## What Stellar buys you

- sub-cent fees — financing a single small invoice stays worth it
- ~5 second settlement
- native-asset invoices need no trustline setup first
- the payment history above is public and independently checkable

## Not done yet

- stablecoin invoices (any Stellar Asset Contract token, not just XLM)
- mainnet
- letting more than one funder split a single invoice's advance
