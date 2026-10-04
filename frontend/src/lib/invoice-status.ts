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
