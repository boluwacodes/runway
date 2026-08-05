import {
  Account,
  Contract,
  Keypair,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
  rpc,
  xdr,
} from "@stellar/stellar-sdk";
import { upsertInvoice, type InvoiceRow } from "./db";

const RPC_URL = process.env.STELLAR_RPC_URL ?? "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE =
  process.env.STELLAR_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";
const CONTRACT_ID = process.env.RUNWAY_CONTRACT_ID;

if (!CONTRACT_ID) {
  throw new Error("RUNWAY_CONTRACT_ID is not set — see backend/.env.example");
}

const server = new rpc.Server(RPC_URL);
const contract = new Contract(CONTRACT_ID);

interface RawInvoice {
  id: bigint;
  payee: string;
  debtor: string;
  funder: string | null | undefined;
  token: string;
  face_value: bigint;
  advance_bps: number;
  due_date: bigint;
  created_at: bigint;
  status: number;
}

async function readCall<T>(method: string, args: xdr.ScVal[]): Promise<T> {
  const account = new Account(Keypair.random().publicKey(), "0");
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(`simulate(${method}): ${sim.error}`);
  }
  return scValToNative(sim.result!.retval) as T;
}

async function fetchInvoice(id: bigint): Promise<RawInvoice> {
  return readCall<RawInvoice>("get_invoice", [nativeToScVal(id, { type: "u64" })]);
}

async function fetchTotalInvoices(): Promise<bigint> {
  return readCall<bigint>("total_invoices", []);
}

/**
 * Every invoice is refetched by id directly from contract storage — not
 * from the event log. Soroban RPC nodes accept startLedger anywhere inside
 * their nominal retention window without erroring, but silently return
 * zero events well before that window actually ends (see the frontend's
 * lib/contract.ts for where this bit us at the client level). Reading
 * total_invoices() and looping ids 1..=total sidesteps the problem
 * entirely — no event log involved, so there's no searchable-window limit
 * to hit. It also means this indexer never misses an invoice, however old.
 */
export async function syncOnce(): Promise<{ synced: number; total: number }> {
  const total = await fetchTotalInvoices();
  const ids = Array.from({ length: Number(total) }, (_, i) => BigInt(i + 1));

  const BATCH_SIZE = 10;
  let synced = 0;
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    const invoices = await Promise.all(batch.map((id) => fetchInvoice(id)));
    const now = Date.now();
    for (const inv of invoices) {
      const row: InvoiceRow = {
        id: inv.id.toString(),
        payee: inv.payee,
        debtor: inv.debtor,
        funder: inv.funder ?? null,
        token: inv.token,
        face_value: inv.face_value.toString(),
        advance_bps: inv.advance_bps,
        due_date: inv.due_date.toString(),
        created_at: inv.created_at.toString(),
        status: inv.status,
        synced_at: now,
      };
      upsertInvoice(row);
      synced += 1;
    }
  }

  return { synced, total: Number(total) };
}

export function startIndexer(intervalMs = 8_000): void {
  let running = false;

  async function tick() {
    if (running) return; // don't overlap a slow sync with the next interval
    running = true;
    try {
      const { synced, total } = await syncOnce();
      console.log(`[indexer] synced ${synced}/${total} invoices`);
    } catch (err) {
      console.error("[indexer] sync failed:", err instanceof Error ? err.message : err);
    } finally {
      running = false;
    }
  }

  void tick();
  setInterval(tick, intervalMs);
}
