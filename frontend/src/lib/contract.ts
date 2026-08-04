import {
  Account,
  Address,
  Contract,
  Keypair,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
  rpc,
  xdr,
} from "@stellar/stellar-sdk";

const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL ?? "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";
const CONTRACT_ID = process.env.NEXT_PUBLIC_RUNWAY_CONTRACT_ID ?? "";
export const NATIVE_TOKEN_ID = process.env.NEXT_PUBLIC_NATIVE_TOKEN_ID ?? "";

export const server = new rpc.Server(RPC_URL);
const contract = new Contract(CONTRACT_ID);

export enum InvoiceStatus {
  Open = 0,
  Funded = 1,
  Paid = 2,
  Cancelled = 3,
}

export interface Invoice {
  id: bigint;
  payee: string;
  debtor: string;
  funder: string | null;
  token: string;
  faceValue: bigint;
  advanceBps: number;
  dueDate: bigint;
  createdAt: bigint;
  status: InvoiceStatus;
}

// soroban-sdk maps struct field names verbatim (snake_case) into the
// decoded object's keys — this is the raw shape before we camelCase it.
interface RawInvoice {
  id: bigint;
  payee: string;
  debtor: string;
  // soroban-sdk encodes Rust's Option<Address> as either the value (Some)
  // or nothing at all (None) — scValToNative surfaces the latter as
  // undefined, not null, so both need handling here.
  funder: string | null | undefined;
  token: string;
  face_value: bigint;
  advance_bps: number;
  due_date: bigint;
  created_at: bigint;
  status: number;
}

function parseInvoice(raw: RawInvoice): Invoice {
  return {
    id: raw.id,
    payee: raw.payee,
    debtor: raw.debtor,
    funder: raw.funder ?? null,
    token: raw.token,
    faceValue: raw.face_value,
    advanceBps: raw.advance_bps,
    dueDate: raw.due_date,
    createdAt: raw.created_at,
    status: raw.status as InvoiceStatus,
  };
}

export class ContractCallError extends Error {}

/** Read-only call, simulated against a throwaway account — no wallet or funds required. */
async function readCall<T>(method: string, args: xdr.ScVal[]): Promise<T> {
  const account = new Account(Keypair.random().publicKey(), "0");
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new ContractCallError(sim.error);
  }
  return scValToNative(sim.result!.retval) as T;
}

export async function getInvoice(invoiceId: bigint): Promise<Invoice> {
  const raw = await readCall<RawInvoice>("get_invoice", [nativeToScVal(invoiceId, { type: "u64" })]);
  return parseInvoice(raw);
}

export async function latePaymentCount(debtor: string): Promise<number> {
  return readCall<number>("late_payment_count", [new Address(debtor).toScVal()]);
}

export async function getTotalInvoices(): Promise<bigint> {
  return readCall<bigint>("total_invoices", []);
}

/** Build an unsigned, simulated-and-assembled transaction ready for a wallet to sign. */
async function buildTx(sourcePublicKey: string, method: string, args: xdr.ScVal[]) {
  const account = await server.getAccount(sourcePublicKey);
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call(method, ...args))
    .setTimeout(60)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new ContractCallError(sim.error);
  }
  return rpc.assembleTransaction(tx, sim).build().toXDR();
}

export function buildCreateInvoiceTx(
  payee: string,
  debtor: string,
  token: string,
  faceValue: bigint,
  advanceBps: number,
  dueDate: bigint,
) {
  return buildTx(payee, "create_invoice", [
    new Address(payee).toScVal(),
    new Address(debtor).toScVal(),
    new Address(token).toScVal(),
    nativeToScVal(faceValue, { type: "i128" }),
    nativeToScVal(advanceBps, { type: "u32" }),
    nativeToScVal(dueDate, { type: "u64" }),
  ]);
}

export function buildFundInvoiceTx(invoiceId: bigint, funder: string) {
  return buildTx(funder, "fund_invoice", [
    nativeToScVal(invoiceId, { type: "u64" }),
    new Address(funder).toScVal(),
  ]);
}

export function buildPayInvoiceTx(invoiceId: bigint, debtor: string) {
  return buildTx(debtor, "pay_invoice", [
    nativeToScVal(invoiceId, { type: "u64" }),
    new Address(debtor).toScVal(),
  ]);
}

export function buildCancelInvoiceTx(invoiceId: bigint, caller: string) {
  return buildTx(caller, "cancel_invoice", [
    nativeToScVal(invoiceId, { type: "u64" }),
    new Address(caller).toScVal(),
  ]);
}

/** Submit a wallet-signed transaction XDR and poll until it lands. */
export async function submitSignedTx(signedXdr: string): Promise<void> {
  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const sent = await server.sendTransaction(tx);
  if (sent.status === "ERROR") {
    throw new ContractCallError(`Transaction rejected: ${JSON.stringify(sent.errorResult)}`);
  }

  let result = await server.getTransaction(sent.hash);
  while (result.status === "NOT_FOUND") {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    result = await server.getTransaction(sent.hash);
  }
  if (result.status !== "SUCCESS") {
    throw new ContractCallError(`Transaction failed: ${JSON.stringify(result)}`);
  }
}

/**
 * Discover invoice ids by reading `invoice created` events — no backend or
 * indexer required.
 *
 * The default lookback (9,000 ledgers, ~12.5h) is deliberately far short of
 * the RPC node's much larger nominal retention window. Empirically, a
 * public Soroban RPC node accepts a `startLedger` anywhere inside its full
 * retention window without erroring, but silently returns zero events —
 * not an error, just an empty result — once the requested span exceeds a
 * much smaller *searchable* window (observed breaking between 10,000 and
 * 12,000 ledgers on testnet). Older invoices still resolve fine by id —
 * getInvoice reads contract storage directly, not events.
 */
export async function discoverInvoiceIds(lookbackLedgers = 9_000, limit = 50): Promise<bigint[]> {
  const latest = await server.getLatestLedger();
  const startLedger = Math.max(latest.sequence - lookbackLedgers, 1);

  const fetchEvents = (from: number) =>
    server.getEvents({
      startLedger: from,
      filters: [
        {
          type: "contract",
          contractIds: [CONTRACT_ID],
          topics: [
            [xdr.ScVal.scvSymbol("invoice").toXDR("base64"), xdr.ScVal.scvSymbol("created").toXDR("base64")],
          ],
        },
      ],
      limit,
    });

  let res;
  try {
    res = await fetchEvents(startLedger);
  } catch (err) {
    const min = minLedgerFromRangeError(err);
    if (min === null) throw err;
    res = await fetchEvents(min);
  }

  return res.events.map((e) => scValToNative(e.value) as bigint).reverse();
}

function minLedgerFromRangeError(err: unknown): number | null {
  const message =
    typeof err === "object" && err !== null && "message" in err
      ? String((err as { message: unknown }).message)
      : String(err);
  const match = /ledger range:\s*(\d+)/.exec(message);
  return match ? Number(match[1]) : null;
}
