# Supporting multiple funders per invoice

## The current constraint

`Invoice.funder` is `Option<Address>` — a single slot. `fund_invoice`
requires the invoice to be `Open` and sets `funder` once; any second call
fails with `InvoiceNotOpen`. There's no partial funding either:
`fund_invoice` always advances `face_value * advance_bps / 10_000` in one
transfer, to one address, for the whole invoice.

This is a real limitation, not an oversight the code is hiding: a $50,000
invoice currently needs one funder willing to put up the entire advance.
Smaller funders who could each cover a slice of it can't participate.

## Why this isn't a quick fix

Splitting funding across multiple funders touches every stage of the
money flow, not just the `fund_invoice` entrypoint:

1. **Storage**: `funder: Option<Address>` has to become a collection of
   `(Address, i128)` shares — either a `Vec` on `Invoice` directly (simple,
   but every read/write of the invoice moves the whole vec, and Soroban's
   per-entry size limits cap how many funders one invoice could ever
   support) or a separate `DataKey::FunderShare(invoice_id, Address)` map
   (scales better, but `pay_invoice` then needs to enumerate an unbounded
   set of shares to pay everyone out — unbounded iteration inside a single
   contract call is exactly the kind of thing that blows a transaction's
   resource budget on a popular invoice).
2. **Payout math**: `pay_invoice` currently does one transfer of the full
   `face_value`. With N funders it must split that proportionally to each
   funder's contributed share, and the rounding remainder from integer
   division has to go somewhere deterministic (traditionally the last
   funder paid, or the payee) — get this wrong and funds don't reconcile.
3. **Partial-fund status**: a `PartiallyFunded` state needs its own rules —
   can the payee cancel a partially-funded invoice? Can a partial funder
   withdraw before it's fully funded? What happens if it's never fully
   funded by the due date? None of these have an answer yet.
4. **Downstream consumers**: `backend/src/db.ts`'s `funder` column is a
   single nullable `TEXT`, `backend/src/indexer.ts`'s `RawInvoice.funder`
   is `string | null`, and the frontend's `Invoice` type and every
   component that renders `invoice.funder` (e.g.
   `frontend/src/app/invoices/[id]/page.tsx`) all assume one funder. All of
   this needs a matching schema/type migration, not just the contract.

Shipping a wrong version of any of the above is a correctness bug in a
contract that moves real money — worse than the current limitation.

## A sketch for a future version

The least risky path is probably:

- Add a bounded `max_funders: u32` cap per invoice (configurable at
  `create_invoice` time, e.g. default 1 for exactly today's behavior,
  opt-in to more) so `pay_invoice`'s payout loop has a hard, known upper
  bound on iterations regardless of invoice size.
- Store shares as `DataKey::FunderShare(invoice_id, funder)` → `amount`,
  plus a running `invoice.total_funded: i128` and `invoice.funder_count:
  u32` on the `Invoice` record itself so `fund_invoice` can check "are we
  fully funded yet" in O(1) without enumerating shares.
- `fund_invoice` accepts an `amount` parameter (not just advancing the
  full face value), rejects an amount that would overfund the invoice,
  and flips `status` to `Funded` only once `total_funded` reaches the
  advance total.
- `pay_invoice` enumerates exactly `funder_count` share records (bounded
  by `max_funders`) and pays each funder `debtor_payment * share /
  total_funded`, with any integer-division remainder going to the payee
  (matching how the payee already absorbs the advance-rate discount — the
  rounding dust is the same order of magnitude and direction).

This is a new contract version, not a patch to the existing one — invoices
created under the current single-funder contract would need their own
migration path or simply be allowed to finish out their lifecycle under
the old rules while new invoices use the new one.

## What this means for #6 right now

No code change ships with this doc. Implementing the above correctly
needs its own dedicated review (and ideally a second set of eyes on the
payout-splitting math specifically) rather than being rushed in alongside
unrelated fixes.
