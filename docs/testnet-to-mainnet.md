# Going from testnet to mainnet

This repo runs on Stellar's public testnet today (see the README). There's
no code change required to move to mainnet — only configuration — but
every step below matters, because mainnet transactions move real XLM.

## 1. Redeploy the contract

The testnet contract ID is not reusable on mainnet; a contract must be
deployed separately on each network. From `contracts/`:

```bash
stellar keys generate deployer --network public --fund
stellar contract deploy \
  --wasm target/wasm32v1-none/release/runway_invoice.wasm \
  --source deployer --network public
```

`--fund` only works on testnet — on `public` you need to send the deployer
account enough real XLM to cover the deployment fee before this will
succeed. The command prints a new contract ID; this is what goes into both
`.env` files below. **This is a different contract instance with its own,
empty invoice history** — nothing from testnet carries over.

## 2. Update environment variables

Both the network passphrase and RPC endpoint change. Nothing else in
`backend/.env` or `frontend/.env` needs a different *shape*, just these
values:

| Variable                             | Testnet                                         | Mainnet                       |
| ------------------------------------- | ------------------------------------------------ | ------------------------------ |
| `STELLAR_RPC_URL` / `NEXT_PUBLIC_STELLAR_RPC_URL` | `https://soroban-testnet.stellar.org`           | `https://mainnet.sorobanrpc.com` (or another mainnet-capable RPC provider) |
| `STELLAR_NETWORK_PASSPHRASE` / `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE` | `Test SDF Network ; September 2015`             | `Public Global Stellar Network ; September 2015` |
| `RUNWAY_CONTRACT_ID` / `NEXT_PUBLIC_RUNWAY_CONTRACT_ID` | testnet contract ID                              | the new ID from step 1         |
| `NEXT_PUBLIC_NATIVE_TOKEN_ID`         | testnet XLM's contract wrapper ID                | mainnet XLM's contract wrapper ID |

Soroban RPC providers rate-limit and sometimes require an API key on
mainnet; check your provider's docs before relying on it in production.

## 3. Point wallets at mainnet

Every signer (Freighter or otherwise) that will call `register_invoice`,
`fund_invoice`, `pay_invoice`, or `cancel_invoice` needs to switch its
active network from Testnet to Public/Mainnet, and needs to hold *real*
XLM (and whatever other Stellar asset a given invoice's `token` is) to pay
transaction fees and fund advances. There's no test-XLM faucet on mainnet.

## 4. Re-examine anything you skipped on testnet

A few things are easy to not worry about on testnet but matter once real
funds are involved:

- **Backend trust**: `backend/` never holds a key and never signs
  anything (see the README) — it's a convenience cache, not a dependency.
  Confirm that's still true if you've extended it.
- **Contract audit**: nothing in this repo has had a third-party security
  audit. Review `contracts/runway-invoice/src/lib.rs` yourself, or get it
  audited, before putting real invoice volume through it.
- **`SYNC_API_KEY`**: set this in the mainnet backend's environment — see
  `backend/.env.example`. The `/sync` endpoint is unauthenticated by
  default in local dev, which is fine on testnet but not something to
  carry into a real deployment.

## 5. Nothing else changes

The frontend, backend, and contract code are network-agnostic by design —
every network-specific value above is read from configuration, never
hardcoded. If you find a hardcoded testnet assumption anywhere, that's a
bug; please file an issue.
