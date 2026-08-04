import { Invoice, InvoiceStatus } from "./contract";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Shape returned by the backend's SQLite-backed API — every bigint field
// comes across as a string (SQLite has no native 128-bit integer type),
// same reasoning as the raw contract read shape in lib/contract.ts.
interface BackendInvoiceRow {
  id: string;
  payee: string;
  debtor: string;
  funder: string | null;
  token: string;
  face_value: string;
  advance_bps: number;
  due_date: string;
  created_at: string;
  status: number;
}

function parseRow(row: BackendInvoiceRow): Invoice {
  return {
    id: BigInt(row.id),
    payee: row.payee,
    debtor: row.debtor,
    funder: row.funder,
    token: row.token,
    faceValue: BigInt(row.face_value),
    advanceBps: row.advance_bps,
    dueDate: BigInt(row.due_date),
    createdAt: BigInt(row.created_at),
    status: row.status as InvoiceStatus,
  };
}

/**
 * The backend is a convenience layer, not a dependency — it's a read-only
 * indexer that never holds keys or signs anything (see backend/README.md).
 * If it's unset or unreachable, callers fall back to the slower on-chain
 * event-log discovery in lib/contract.ts. Either way, every invoice's
 * actual state for an action (fund/pay/cancel) is still read live from the
 * contract on the detail page — this only speeds up the browse list.
 */
export async function fetchInvoicesFromBackend(): Promise<Invoice[] | null> {
  if (!BACKEND_URL) return null;
  try {
    const res = await fetch(`${BACKEND_URL}/invoices`, { signal: AbortSignal.timeout(4_000) });
    if (!res.ok) return null;
    const rows = (await res.json()) as BackendInvoiceRow[];
    return rows.map(parseRow);
  } catch {
    return null;
  }
}
