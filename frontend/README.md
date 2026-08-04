# Runway frontend

The Next.js app — landing page and the invoice-financing app itself
(`/invoices`, `/invoices/[id]`). See the [root README](../README.md) for
the full project overview, and [../CONTRIBUTING.md](../CONTRIBUTING.md)
for setup.

```bash
npm install
cp .env.example .env.local
# fill in NEXT_PUBLIC_RUNWAY_CONTRACT_ID with a deployed contract id
npm run dev
```

No backend — `src/lib/contract.ts` talks to the deployed Soroban contract
directly over Stellar RPC, and a connected wallet signs every
state-changing call.
