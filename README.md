# Runway

Runway turns an unpaid invoice into cash today, without a factoring
company in the middle.

Here's the situation it's for: you've done the work, you sent the
invoice, and now you're waiting — sometimes 60 days or more — for the
customer to actually pay. Runway lets someone else advance you most of
that invoice's value right now, in a single Stellar transaction, in
exchange for collecting the full amount later when your customer
actually settles. You get paid today instead of in two months. The
funder earns the spread between what they advanced and what they
collect. The customer pays exactly the same amount, on exactly the same
schedule, to whoever ends up owed it — the only thing that changes for
them is which wallet address the payment goes to.

Nobody holds custody of anyone else's money at any point. The payee
registers the invoice, a funder advances XLM straight to the payee's
wallet, and the customer later pays straight into the contract, which
routes it automatically. There's no company sitting in the middle
collecting a fee for holding funds, no minimum invoice size because the
paperwork isn't worth it below that, and no multi-day wait for a wire
transfer to clear — a Stellar transaction settles in about five seconds
for a fraction of a cent.

It runs on Stellar's public testnet today. Contract logic and tests are
real; mainnet is the next step once the model's been exercised more.

## A concrete example

Say an invoice is worth 4,800 XLM, and at registration the payee set the
advance rate to 95%. A funder who backs it sends 4,560 XLM to the payee
immediately — that's the 95% advance. When the debtor eventually pays
the full 4,800 XLM, the contract routes all of it to the funder, who
nets 240 XLM for having supplied the cash early. That 240 XLM spread is
the funder's entire return, and it's fixed the moment the invoice is
funded — nobody renegotiates it later.

The advance rate isn't a fixed protocol parameter; whoever registers the
invoice sets it. A payee willing to accept a lower advance (say 85%
instead of 95%) is offering a funder a bigger spread, which matters most
for an unfamiliar or first-time debtor a funder is less sure about.

## What's in this repo

This is one repo with three parts that don't share a runtime, only a
contract ID:

- **`contracts/runway-invoice`** is the Soroban contract itself —
  register, fund, pay, and cancel an invoice, plus the on-chain record
  of who's paid late. This is the actual source of truth; nothing else
  in the repo can do anything the contract doesn't allow.
- **`backend`** is a small, optional, read-only service. It never holds
  a key and never signs anything — it just mirrors the contract's public
  state into a local database so the app's browse list loads fast. More
  on exactly why below.
- **`frontend`** is the Next.js app people actually use. Every action
  that moves money — registering, funding, paying, cancelling — builds
  an unsigned transaction here, hands it to the user's wallet to sign,
  and submits the signed result. The backend is never part of that path.

## Running it locally

You'll need Rust with the `wasm32v1-none` target for the contract, and
Node 22+ for the backend and frontend. You'll also want
[Freighter](https://www.freighter.app/) installed and set to Stellar's
testnet, funded with test XLM from
[the Laboratory](https://laboratory.stellar.org/#account-creator?network=test)
— that's the wallet the app will ask you to connect.

Start with the contract, since the other two pieces need a deployed
contract ID to talk to:

```bash
cd contracts && cargo test --workspace && stellar contract build
```

That builds and runs the 15 tests covering every function's happy path
and rejection cases. To actually get a contract ID for the backend and
frontend to point at, deploy the built wasm to testnet:

```bash
stellar keys generate deployer --network testnet --fund
stellar contract deploy \
  --wasm target/wasm32v1-none/release/runway_invoice.wasm \
  --source deployer --network testnet
```

That prints the contract ID you'll fill into both `.env` files below.

The backend is genuinely optional. Skip it and the app still works,
it'll just discover invoices by scanning the contract's event log
directly instead of reading from a fast local mirror — slower, but
correct either way. To run it:

```bash
cd backend && npm install
cp .env.example .env
npm run dev
```

Fill in `RUNWAY_CONTRACT_ID` in that `.env` first. It listens on port
3030 by default.

Then the frontend:

```bash
cd frontend && npm install
cp .env.example .env.local
npm run dev
```

Fill in `NEXT_PUBLIC_RUNWAY_CONTRACT_ID` there too, and optionally
`NEXT_PUBLIC_BACKEND_URL` if you're running the backend and want the
faster path. It listens on port 3000 by default.

## What the contract actually does

Seven functions, all in `contracts/runway-invoice/src/lib.rs`:

- **`create_invoice`** registers a new invoice — who's owed the money,
  who owes it, the amount, the advance rate, and the due date. Nothing
  moves yet; this just puts the invoice on record with an `Open` status.
- **`fund_invoice`** is how a funder advances cash. It sends the advance
  amount straight to the payee's wallet and moves the invoice to
  `Funded`.
- **`pay_invoice`** is how the debtor settles it — at any time, including
  after the due date. A late payment isn't blocked or penalized; it
  settles exactly like an on-time one, it's just recorded against the
  debtor's on-chain late-payment count so a future funder can see it
  before deciding whether to back that debtor again.
- **`cancel_invoice`** only works while an invoice is still `Open`. Once
  a funder has advanced real money against it, cancelling is disabled —
  there'd be no way to cancel without stranding capital the funder
  already sent.
- **`get_invoice`**, **`total_invoices`**, and **`late_payment_count`**
  are the read side — anyone can look up an invoice's current state, the
  running count, or a specific debtor's late-payment history, no
  authorization required.

Every function that moves money or changes state is gated by
`require_auth()` against whichever party the call claims to be acting
as, so nobody can fund, pay, or cancel on someone else's behalf.

## The backend, and why it can't touch your money

Regardless of whether the backend is running, every write happens the
same way: `frontend/src/lib/contract.ts` builds an unsigned transaction,
your wallet signs it, and the frontend submits the signed result. The
backend is never part of that path — nothing in `backend/src/` ever
constructs or signs a transaction, and it holds no key at all.

What it actually does is read `total_invoices()` from the contract,
then fetch every invoice's current state directly from contract
storage, on a repeating loop, into a local SQLite database. That's the
data the app's browse list reads from when it's available — a faster
mirror of state that's already public on-chain, not a new source of
trust. If the backend is down or unreachable, the frontend automatically
falls back to scanning the contract's event log directly instead, the
same way it worked before the backend existed. Either way, the invoice
detail page — where funding, paying, and cancelling actually happen —
always reads live from the contract itself, backend or not. Full
reasoning in [backend/README.md](./backend/README.md).

## Why this needed Stellar specifically

A few properties of the network end up mattering a lot for something
like this:

- **Sub-cent fees.** Financing a genuinely small invoice — a few hundred
  dollars — only makes sense if the network fee doesn't eat a meaningful
  chunk of the spread. It doesn't here.
- **Around five-second settlement.** A funder's advance and a debtor's
  payment both land in seconds, not the days a bank wire takes.
- **No trustline setup required.** Invoices default to native XLM, so
  there's no extra step before a first-time funder or debtor can
  transact.
- **Public payment history.** A debtor's on-chain late-payment record is
  something any funder can check before deciding whether to back their
  next invoice — verifiable directly, not taken on the payee's word.

## What's not built yet

- Stablecoin invoices — any Stellar Asset Contract token, not just
  native XLM.
- Mainnet deployment.
- Splitting a single invoice's advance across more than one funder.
