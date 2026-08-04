import { beforeEach, describe, expect, it } from "vitest";
import { db, upsertInvoice, listInvoices, getInvoiceRow, stats } from "./db";

beforeEach(() => {
  db.exec("DELETE FROM invoices");
});

describe("db", () => {
  it("upserts and lists invoices, newest id first", () => {
    upsertInvoice(makeRow({ id: "1", status: 0 }));
    upsertInvoice(makeRow({ id: "2", status: 0 }));

    const rows = listInvoices();
    expect(rows.map((r) => r.id)).toEqual(["2", "1"]);
  });

  it("re-upserting the same id updates in place instead of duplicating", () => {
    upsertInvoice(makeRow({ id: "1", status: 0 }));
    upsertInvoice(makeRow({ id: "1", status: 2 }));

    const rows = listInvoices();
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe(2);
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
