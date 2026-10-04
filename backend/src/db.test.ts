import { beforeEach, describe, expect, it } from "vitest";
import { db, upsertInvoice, listInvoices, getInvoiceRow, stats } from "./db";

beforeEach(() => {
  db.exec("DELETE FROM invoices");
});

describe("db", () => {
  it("upserts and lists invoices, newest id first", () => {
    upsertInvoice(makeRow({ id: "1", status: 0 }));
    upsertInvoice(makeRow({ id: "2", status: 0 }));

    const { invoices, total } = listInvoices();
    expect(invoices.map((r) => r.id)).toEqual(["2", "1"]);
    expect(total).toBe(2);
  });

  it("re-upserting the same id updates in place instead of duplicating", () => {
    upsertInvoice(makeRow({ id: "1", status: 0 }));
    upsertInvoice(makeRow({ id: "1", status: 2 }));

    const { invoices } = listInvoices();
    expect(invoices).toHaveLength(1);
    expect(invoices[0].status).toBe(2);
  });

  it("paginates with limit/offset and reports the full total (#4)", () => {
    for (let i = 1; i <= 5; i++) {
      upsertInvoice(makeRow({ id: String(i), status: 0 }));
    }

    const page1 = listInvoices({ limit: 2, offset: 0 });
    expect(page1.invoices.map((r) => r.id)).toEqual(["5", "4"]);
    expect(page1.total).toBe(5);
    expect(page1.limit).toBe(2);

    const page2 = listInvoices({ limit: 2, offset: 2 });
    expect(page2.invoices.map((r) => r.id)).toEqual(["3", "2"]);
    expect(page2.total).toBe(5);
  });

  it("caps an oversized limit at MAX_PAGE_SIZE instead of returning everything", () => {
    for (let i = 1; i <= 3; i++) {
      upsertInvoice(makeRow({ id: String(i), status: 0 }));
    }

    const { invoices, limit } = listInvoices({ limit: 1_000_000 });
    expect(limit).toBe(200);
    expect(invoices).toHaveLength(3);
  });

  it("getInvoiceRow returns undefined for an id that was never synced", () => {
    expect(getInvoiceRow("999")).toBeUndefined();
  });

  it("computes stats from funder presence and status, not guesswork", () => {
    upsertInvoice(makeRow({ id: "1", status: 0, funder: null, face_value: "100" })); // open, unfunded
    upsertInvoice(makeRow({ id: "2", status: 1, funder: "GFUNDER", face_value: "200" })); // funded
    upsertInvoice(makeRow({ id: "3", status: 2, funder: "GFUNDER", face_value: "300" })); // paid, was funded

    const result = stats();
    expect(result.total_invoices).toBe(3);
    expect(result.open_for_funding).toBe(1);
    expect(result.total_financed).toBe(500); // only the two with a funder
    expect(result.financed_count).toBe(2);
  });
});

function makeRow(overrides: Partial<Parameters<typeof upsertInvoice>[0]>) {
  return {
    id: "1",
    payee: "GPAYEE",
    debtor: "GDEBTOR",
    funder: null,
    token: "CTOKEN",
    face_value: "1000",
    advance_bps: 9500,
    due_date: "2000000000",
    created_at: "1900000000",
    status: 0,
    synced_at: Date.now(),
    ...overrides,
  };
}
