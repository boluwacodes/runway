import { beforeEach, describe, expect, it } from "vitest";
import { db, getInvoiceRow } from "./db";
import { syncOnce, type RawInvoice } from "./indexer";

beforeEach(() => {
  db.exec("DELETE FROM invoices");
});

function makeRawInvoice(id: bigint, overrides: Partial<RawInvoice> = {}): RawInvoice {
  return {
    id,
    payee: "GPAYEE",
    debtor: "GDEBTOR",
    funder: null,
    token: "CNATIVE",
    face_value: 10_000_000n,
    advance_bps: 9_500,
    due_date: 1_900_000_000n,
    created_at: 1_800_000_000n,
    status: 0,
    ...overrides,
  };
}

describe("syncOnce", () => {
  it("upserts every invoice from 1..=total", async () => {
    const result = await syncOnce({
      fetchTotal: async () => 3n,
      fetchOne: async (id) => makeRawInvoice(id),
    });

    expect(result).toEqual({ synced: 3, total: 3 });
    expect(getInvoiceRow("1")).toBeDefined();
    expect(getInvoiceRow("2")).toBeDefined();
    expect(getInvoiceRow("3")).toBeDefined();
  });

  it("a single failed fetch is skipped without losing its batch-mates", async () => {
    const result = await syncOnce({
      fetchTotal: async () => 3n,
      fetchOne: async (id) => {
        if (id === 2n) throw new Error("simulate(get_invoice): transient RPC error");
        return makeRawInvoice(id);
      },
    });

    expect(result).toEqual({ synced: 2, total: 3 });
    expect(getInvoiceRow("1")).toBeDefined();
    expect(getInvoiceRow("2")).toBeUndefined();
    expect(getInvoiceRow("3")).toBeDefined();
  });

  it("maps every RawInvoice field onto the stored row, stringifying bigints", async () => {
    await syncOnce({
      fetchTotal: async () => 1n,
      fetchOne: async (id) =>
        makeRawInvoice(id, { funder: "GFUNDER", face_value: 123_456_789n, status: 1 }),
    });

    const row = getInvoiceRow("1")!;
    expect(row.funder).toBe("GFUNDER");
    expect(row.face_value).toBe("123456789");
    expect(row.status).toBe(1);
  });

  it("reports total 0 and synced 0 when there are no invoices yet", async () => {
    const result = await syncOnce({
      fetchTotal: async () => 0n,
      fetchOne: async () => {
        throw new Error("should never be called");
      },
    });

    expect(result).toEqual({ synced: 0, total: 0 });
  });
});
