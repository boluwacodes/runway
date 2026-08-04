# Contributing to Runway

## Layout

```
contracts/    Soroban contract (Rust) — runway-invoice
backend/      Read-only indexer/API — never holds keys, never signs
frontend/     Next.js web app — landing page + the app itself
```

Every write happens client-side, wallet-signed, directly against the
contract — the backend is a read-side convenience layer, not something in
the transaction path. See [backend/README.md](./backend/README.md).

## Getting set up

```bash
git clone https://github.com/boluwacodes/runway.git
cd runway

cd contracts
cargo test --workspace

cd ../backend
npm install
cp .env.example .env
# fill in RUNWAY_CONTRACT_ID with a deployed contract id
npm run dev

cd ../frontend
npm install
cp .env.example .env.local
# fill in NEXT_PUBLIC_RUNWAY_CONTRACT_ID with a deployed contract id
npm run dev
```

## Before opening a PR

```bash
cd contracts && cargo test --workspace

cd ../backend
npm run lint
npm run typecheck
npm run test
npm run build

cd ../frontend
npm run lint
npm run typecheck
npm run build
```

If you're adding new contract behavior, add a test for it in
`contracts/runway-invoice/src/test.rs` in the same PR — every existing
function has coverage for both its happy path and its rejected-input
cases.

## Commit messages and PRs

- Explain *why*, not just *what*.
- Reference the issue your PR closes with `Closes #123`.
- Keep PRs scoped to one logical change.

## Reporting bugs / requesting features

Use the issue templates under **New Issue**. For security vulnerabilities,
see [SECURITY.md](./SECURITY.md) instead of opening a public issue.

## Code of conduct

This project follows the [Code of Conduct](./CODE_OF_CONDUCT.md).
