import { InvoiceStatus } from "./contract";

export const STATUS_TONE = {
  [InvoiceStatus.Open]: "gold" as const,
  [InvoiceStatus.Funded]: "green" as const,
  [InvoiceStatus.Paid]: "blue" as const,
  [InvoiceStatus.Cancelled]: "rose" as const,
};

export const STATUS_LABEL = {
  [InvoiceStatus.Open]: "Open",
  [InvoiceStatus.Funded]: "Funded",
  [InvoiceStatus.Paid]: "Paid",
  [InvoiceStatus.Cancelled]: "Cancelled",
};

/**
 * The due-date line shown next to an invoice. Only Open and Funded invoices
 * are still waiting on the debtor, so only they get a countdown; showing
 * "12d overdue" on an invoice that was paid on time reads as a delinquency
 * that never happened.
 */
export function dueStatusLabel(
  status: InvoiceStatus,
  dueDate: bigint,
  formatCountdown: (dueDate: bigint) => string,
): string {
  if (status === InvoiceStatus.Paid) return "settled";
  if (status === InvoiceStatus.Cancelled) return "cancelled";
  return formatCountdown(dueDate);
}
