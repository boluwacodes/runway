# backend

A read-only indexer/API for the Runway invoice contract. It never holds a
private key and never signs or submits a transaction — every write in this
project still happens client-side, wallet-signed, straight to the
contract. All this does is mirror public on-chain state into SQLite so the
frontend's browse list doesn't depend on the Soroban event log's
searchable window (see the note in `src/indexer.ts` for why that window
turned out to be much smaller than its nominal retention period).

## How it stays honest

- Reads `total_invoices()` from the contract, then fetches `get_invoice(id)`
  for every id from 1 to that total — directly from contract storage, not
  from events. No indexer downtime or event-log gap can make an invoice
  disappear from what this serves.
- Runs that sync on a loop (every 8s by default) plus once on startup.
- The frontend still reads live, direct-from-chain state for anything
  that gates an action (can I fund this? can I pay this?) — the indexer
  only speeds up the list you browse before clicking into one.
- If this service is down, the frontend falls back to on-chain discovery
  automatically. It's a convenience layer, not a dependency.

## Run it

```bash
npm install
cp .env.example .env   # fill in RUNWAY_CONTRACT_ID
npm run dev
```

Listens on `:3030`. Uses `node:sqlite` (built into Node 22+) — no native
addon to compile, no separate database server to run.

## API

| Route | Returns |
|---|---|
| `GET /invoices` | every indexed invoice, newest id first |
| `GET /invoices/:id` | one invoice, or 404 if not indexed yet |
| `GET /stats` | `{ total_invoices, total_financed, financed_count, open_for_funding }` |
| `POST /sync` | triggers an immediate sync, mostly for local dev |
| `GET /health` | `{ ok: true }` |
