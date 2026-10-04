import { describe, expect, it } from "vitest";
import { collectNewestIds, InvoiceStatus, parseInvoice, type RawInvoice } from "./contract";

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

describe("collectNewestIds (#71)", () => {
  // Simulates getEvents paging over ids 1..total, oldest first.
  function pager(total: number, pageSize: number) {
    const calls: (string | undefined)[] = [];
    const fetchPage = async (cursor?: string) => {
      calls.push(cursor);
      const from = cursor ? Number(cursor) : 0;
      const ids = Array.from({ length: Math.min(pageSize, total - from) }, (_, i) =>
        BigInt(from + i + 1),
      );
      return { ids, cursor: String(from + ids.length) };
    };
    return { fetchPage, calls };
  }

  it("returns the newest ids, newest first, when the window has more than `limit`", async () => {
    const { fetchPage } = pager(250, 100);
    const ids = await collectNewestIds(fetchPage, 5, 100);
    expect(ids).toEqual([250n, 249n, 248n, 247n, 246n]);
  });

  it("follows the cursor until a short page", async () => {
    const { fetchPage, calls } = pager(250, 100);
    await collectNewestIds(fetchPage, 5, 100);
    expect(calls).toEqual([undefined, "100", "200"]);
  });

  it("returns everything when there are fewer than `limit` ids", async () => {
    const { fetchPage, calls } = pager(3, 100);
    expect(await collectNewestIds(fetchPage, 50, 100)).toEqual([3n, 2n, 1n]);
    expect(calls).toHaveLength(1);
  });

  it("stops after maxPages even if pages stay full", async () => {
    const { fetchPage, calls } = pager(10_000, 10);
    const ids = await collectNewestIds(fetchPage, 2, 10, 3);
    expect(calls).toHaveLength(3);
    expect(ids).toEqual([30n, 29n]);
  });
});
