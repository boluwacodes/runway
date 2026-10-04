import { describe, expect, it } from "vitest";
import { InvoiceStatus, type Invoice } from "./contract";
import { loadInvoicesSettled } from "./load-invoices";

function invoice(id: bigint): Invoice {
  return {
    id,
    payee: "GPAYEE",
    debtor: "GDEBTOR",
    funder: null,
    token: "CNATIVE",
    faceValue: 10_000_000n,
    advanceBps: 9_500,
    dueDate: 1_900_000_000n,
    createdAt: 1_800_000_000n,
    status: InvoiceStatus.Open,
  };
}

describe("loadInvoicesSettled (#76)", () => {
  it("keeps every invoice that loaded when one read fails", async () => {
    const result = await loadInvoicesSettled([1n, 2n, 3n], async (id) => {
      if (id === 2n) throw new Error("simulate(get_invoice): transient RPC error");
      return invoice(id);
    });

    expect(result.invoices.map((i) => i.id)).toEqual([3n, 1n]);
    expect(result.failed).toBe(1);
  });

  it("returns newest-first with nothing failed on the happy path", async () => {
    const result = await loadInvoicesSettled([1n, 3n, 2n], async (id) => invoice(id));
    expect(result.invoices.map((i) => i.id)).toEqual([3n, 2n, 1n]);
    expect(result.failed).toBe(0);
  });

  it("reports every failure without throwing", async () => {
    const result = await loadInvoicesSettled([1n, 2n], async () => {
      throw new Error("rpc down");
    });
    expect(result).toEqual({ invoices: [], failed: 2 });
  });
});
