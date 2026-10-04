import type { Invoice } from "./contract";

export interface LoadedInvoices {
  invoices: Invoice[];
  /** How many ids couldn't be read (transient RPC errors, archived entries, …). */
  failed: number;
}

/**
 * Loads each id independently: one failed read shouldn't throw away every
 * invoice that did load. Mirrors the backend indexer's per-invoice
 * isolation (#17). Results come back newest-first.
 */
export async function loadInvoicesSettled(
  ids: bigint[],
  getOne: (id: bigint) => Promise<Invoice>,
): Promise<LoadedInvoices> {
  const results = await Promise.allSettled(ids.map((id) => getOne(id)));
  const invoices: Invoice[] = [];
  let failed = 0;
  for (const result of results) {
    if (result.status === "fulfilled") invoices.push(result.value);
    else failed += 1;
  }
  invoices.sort((a, b) => (a.id < b.id ? 1 : -1));
  return { invoices, failed };
}
