import { DatabaseSync } from "node:sqlite";
import path from "node:path";

// node:sqlite (built into Node 22+) instead of better-sqlite3 — no native
// addon to compile, which matters in environments where the C++ toolchain
// doesn't match the headers Node was built against (hit exactly that here).
const DB_PATH = process.env.DB_PATH ?? path.join(__dirname, "..", "runway.sqlite");

export const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    payee TEXT NOT NULL,
    debtor TEXT NOT NULL,
    funder TEXT,
    token TEXT NOT NULL,
    face_value TEXT NOT NULL,
    advance_bps INTEGER NOT NULL,
    due_date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    status INTEGER NOT NULL,
    synced_at INTEGER NOT NULL
  );
`);

export interface InvoiceRow {
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
  synced_at: number;
}

const upsertStmt = db.prepare(`
  INSERT INTO invoices (id, payee, debtor, funder, token, face_value, advance_bps, due_date, created_at, status, synced_at)
  VALUES (@id, @payee, @debtor, @funder, @token, @face_value, @advance_bps, @due_date, @created_at, @status, @synced_at)
  ON CONFLICT(id) DO UPDATE SET
    payee = excluded.payee,
    debtor = excluded.debtor,
    funder = excluded.funder,
    token = excluded.token,
    face_value = excluded.face_value,
    advance_bps = excluded.advance_bps,
    due_date = excluded.due_date,
    created_at = excluded.created_at,
    status = excluded.status,
    synced_at = excluded.synced_at
`);

export function upsertInvoice(row: InvoiceRow): void {
  upsertStmt.run({ ...row, funder: row.funder ?? null });
}

export function listInvoices(): InvoiceRow[] {
  return db
    .prepare("SELECT * FROM invoices ORDER BY CAST(id AS INTEGER) DESC")
    .all() as unknown as InvoiceRow[];
}

export function getInvoiceRow(id: string): InvoiceRow | undefined {
  return db.prepare("SELECT * FROM invoices WHERE id = ?").get(id) as InvoiceRow | undefined;
}

// InvoiceStatus: 0 Open, 1 Funded, 2 Paid, 3 Cancelled.
export function stats() {
  const row = db
    .prepare(
      `SELECT
         COUNT(*) as total_invoices,
         COALESCE(SUM(CASE WHEN funder IS NOT NULL THEN CAST(face_value AS INTEGER) ELSE 0 END), 0) as total_financed,
         COALESCE(SUM(CASE WHEN funder IS NOT NULL THEN 1 ELSE 0 END), 0) as financed_count,
         COALESCE(SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END), 0) as open_for_funding
       FROM invoices`,
    )
    .get() as unknown as {
    total_invoices: number;
    total_financed: number;
    financed_count: number;
    open_for_funding: number;
  };
  return row;
}
