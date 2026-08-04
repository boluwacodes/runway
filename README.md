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
backend/                    read-only indexer/API, see "the backend" below
frontend/                   Next.js app — talks to the contract directly
                             for every write, the backend only for browsing
```

## Run it

```bash
git clone https://github.com/boluwacodes/runway.git && cd runway

cd contracts && cargo test --workspace && stellar contract build

cd ../backend && npm install
cp .env.example .env   # fill in RUNWAY_CONTRACT_ID
npm run dev             # :3030

cd ../frontend && npm install
cp .env.example .env.local   # fill in NEXT_PUBLIC_RUNWAY_CONTRACT_ID
npm run dev              # :3000
```

The backend is optional — the frontend runs fine without it, just slower
to list invoices (see below). You'll need [Freighter](https://www.freighter.app/)
on Stellar testnet, funded via [the Laboratory](https://laboratory.stellar.org/#account-creator?network=test).

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

## The backend (and why it can't touch your money)

Every write still happens the same way regardless of whether the backend
is running: `frontend/src/lib/contract.ts` builds an *unsigned*
transaction, your wallet signs it, the frontend submits it. The backend is
never in that path — it holds no key, and nothing in `backend/src/` ever
constructs or signs a transaction.

What it does do: poll `total_invoices()` and refetch every invoice's
current state directly from contract storage, on a loop, into SQLite.
That's what `GET /invoices` on the frontend's browse list actually reads
— it's just a faster mirror of public on-chain state, not a new trust
requirement. If it's down, `frontend/src/lib/contract.ts` falls back to
scanning the contract's own event log directly, the same way it did before
the backend existed. Either way, the detail page that actually gates
fund/pay/cancel reads live from the contract, backend or not. See
[backend/README.md](./backend/README.md) for the reasoning in full.

## What Stellar buys you

- sub-cent fees — financing a single small invoice stays worth it
- ~5 second settlement
- native-asset invoices need no trustline setup first
- the payment history above is public and independently checkable

## Not done yet

- stablecoin invoices (any Stellar Asset Contract token, not just XLM)
- mainnet
- letting more than one funder split a single invoice's advance
