import { describe, expect, it } from "vitest";
import { InvoiceStatus } from "./contract";
import { dueStatusLabel } from "./invoice-status";

describe("dueStatusLabel (#72)", () => {
  const countdown = () => "12d overdue";

  it("shows the countdown while the debtor still owes", () => {
    expect(dueStatusLabel(InvoiceStatus.Open, 1n, countdown)).toBe("12d overdue");
    expect(dueStatusLabel(InvoiceStatus.Funded, 1n, countdown)).toBe("12d overdue");
  });

  it("never shows overdue for a paid invoice", () => {
    expect(dueStatusLabel(InvoiceStatus.Paid, 1n, countdown)).toBe("settled");
  });

  it("never shows a countdown for a cancelled invoice", () => {
    expect(dueStatusLabel(InvoiceStatus.Cancelled, 1n, countdown)).toBe("cancelled");
  });
});
