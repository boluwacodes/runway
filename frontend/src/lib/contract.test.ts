import { describe, expect, it } from "vitest";
import { InvoiceStatus, parseInvoice, type RawInvoice } from "./contract";

function makeRaw(overrides: Partial<RawInvoice> = {}): RawInvoice {
  return {
    id: 1n,
    payee: "GPAYEE",
    debtor: "GDEBTOR",
    funder: undefined,
    token: "CNATIVE",
    face_value: 10_000_000n,
    advance_bps: 9_500,
    due_date: 1_900_000_000n,
    created_at: 1_800_000_000n,
    status: 0,
    ...overrides,
  };
}

describe("parseInvoice", () => {
  it("camelCases every snake_case field", () => {
    const invoice = parseInvoice(makeRaw());

    expect(invoice).toMatchObject({
      faceValue: 10_000_000n,
      advanceBps: 9_500,
      dueDate: 1_900_000_000n,
      createdAt: 1_800_000_000n,
    });
  });

  it("normalizes an undefined funder (soroban's None) to null", () => {
    expect(parseInvoice(makeRaw({ funder: undefined })).funder).toBeNull();
  });

  it("normalizes a null funder to null", () => {
    expect(parseInvoice(makeRaw({ funder: null })).funder).toBeNull();
  });

  it("preserves a real funder address", () => {
    expect(parseInvoice(makeRaw({ funder: "GFUNDER" })).funder).toBe("GFUNDER");
  });

  it("maps the numeric status onto the InvoiceStatus enum", () => {
    expect(parseInvoice(makeRaw({ status: 1 })).status).toBe(InvoiceStatus.Funded);
  });

  it("keeps bigint fields as bigints, not coerced to number", () => {
    const invoice = parseInvoice(makeRaw({ id: 42n }));
    expect(typeof invoice.id).toBe("bigint");
    expect(invoice.id).toBe(42n);
  });
});
