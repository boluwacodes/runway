# Security Policy

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, use GitHub's private reporting:

1. Go to the [Security tab](https://github.com/boluwacodes/runway/security) of this repository.
2. Click **Report a vulnerability** to open a private advisory.

This applies especially to:

- `contracts/runway-invoice` — the contract that routes every advance and
  every settlement. Anything that could let funds be redirected outside
  the payee/funder/debtor roles they belong to, or let a non-participant
  manipulate an invoice's state, is critical.
- `frontend` — transaction-building logic. Since there's no backend, any
  bug that builds an incorrect transaction (wrong amount, wrong recipient)
  has a direct financial impact once signed.

## What to include

- A description of the vulnerability and its potential impact
- Steps to reproduce, or a proof of concept
- Whether it affects the contract, the frontend's transaction building, or
  both

## Scope note

Runway runs on Stellar's public testnet today, with test funds only —
there is no mainnet deployment and no real user funds at risk yet.
Non-custodial fund routing is still treated as security-sensitive
regardless of network, since the same contract is intended to run on
mainnet later without changes to its authorization logic.
