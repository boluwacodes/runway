# Contributing to Runway

## Layout

```
contracts/    Soroban contract (Rust) — runway-invoice
frontend/     Next.js web app — landing page + the app itself
```

There is no backend. The frontend talks to the deployed contract directly
over Stellar RPC.

## Getting set up

```bash
git clone https://github.com/boluwacodes/runway.git
cd runway

cd contracts
cargo test --workspace

cd ../frontend
npm install
cp .env.example .env.local
# fill in NEXT_PUBLIC_RUNWAY_CONTRACT_ID with a deployed contract id
npm run dev
```

## Before opening a PR

```bash
cd contracts && cargo test --workspace

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
