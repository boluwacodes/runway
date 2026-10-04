import { beforeEach, describe, expect, it } from "vitest";
import { db, getInvoiceRow, upsertInvoice } from "./db";
import { isSettledInDb, syncOnce, type RawInvoice } from "./indexer";

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

  it("skips invoices already stored as Paid or Cancelled (#64)", async () => {
    const fetched: bigint[] = [];
    const fetchOne = async (id: bigint) => {
      fetched.push(id);
      return makeRawInvoice(id, { status: id === 2n ? 2 : id === 3n ? 3 : 1 });
    };

    // First pass indexes everything, including the two settled invoices.
    await syncOnce({ fetchTotal: async () => 4n, fetchOne });
    expect(fetched).toEqual([1n, 2n, 3n, 4n]);

    // Second pass only re-reads the ones that can still change.
    fetched.length = 0;
    const result = await syncOnce({ fetchTotal: async () => 4n, fetchOne });
    expect(fetched).toEqual([1n, 4n]);
    expect(result).toEqual({ synced: 2, total: 4 });
    expect(getInvoiceRow("2")!.status).toBe(2);
  });

  it("still fetches an id whose settled state is only known on-chain", async () => {
    const result = await syncOnce({
      fetchTotal: async () => 1n,
      fetchOne: async (id) => makeRawInvoice(id, { status: 2 }),
      isSettled: () => false,
    });
    expect(result).toEqual({ synced: 1, total: 1 });
  });
});

describe("isSettledInDb", () => {
  function row(id: string, status: number) {
    return {
      id,
      payee: "GPAYEE",
      debtor: "GDEBTOR",
      funder: null,
      token: "CNATIVE",
      face_value: "1",
      advance_bps: 9_500,
      due_date: "1",
      created_at: "1",
      status,
      synced_at: 0,
    };
  }

  it("is true only for stored Paid/Cancelled invoices", () => {
    upsertInvoice(row("1", 0));
    upsertInvoice(row("2", 1));
    upsertInvoice(row("3", 2));
    upsertInvoice(row("4", 3));
    expect([1n, 2n, 3n, 4n, 5n].map(isSettledInDb)).toEqual([false, false, true, true, false]);
  });
});
