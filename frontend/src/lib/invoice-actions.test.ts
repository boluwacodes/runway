import { describe, expect, it } from "vitest";
import { InvoiceStatus, type Invoice } from "./contract";
import { availableActions } from "./invoice-actions";

const invoice = (status: InvoiceStatus): Invoice => ({
  id: 1n,
  payee: "GPAYEE",
  debtor: "GDEBTOR",
  funder: null,
  token: "CNATIVE",
  faceValue: 10_000_000n,
  advanceBps: 9_500,
  dueDate: 1_900_000_000n,
  createdAt: 1_800_000_000n,
  status,
});

describe("availableActions (#77)", () => {
  it("never offers Fund to the debtor", () => {
    expect(availableActions(invoice(InvoiceStatus.Open), "GDEBTOR")).toEqual({
      canFund: false,
      canPay: true,
      canCancel: false,
    });
  });

  it("never offers Fund to the payee, who can cancel instead", () => {
    expect(availableActions(invoice(InvoiceStatus.Open), "GPAYEE")).toEqual({
      canFund: false,
      canPay: false,
      canCancel: true,
    });
  });

  it("offers Fund to a third party on an open invoice", () => {
    expect(availableActions(invoice(InvoiceStatus.Open), "GFUNDER").canFund).toBe(true);
    expect(availableActions(invoice(InvoiceStatus.Open), null).canFund).toBe(true);
  });

  it("offers nothing on settled invoices", () => {
    for (const status of [InvoiceStatus.Paid, InvoiceStatus.Cancelled]) {
      for (const who of ["GPAYEE", "GDEBTOR", "GFUNDER"]) {
        expect(availableActions(invoice(status), who)).toEqual({
          canFund: false,
          canPay: false,
          canCancel: false,
        });
      }
    }
  });

  it("lets the debtor pay a funded invoice", () => {
    expect(availableActions(invoice(InvoiceStatus.Funded), "GDEBTOR").canPay).toBe(true);
  });
});
