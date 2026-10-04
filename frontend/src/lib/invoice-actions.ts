import { InvoiceStatus, type Invoice } from "./contract";

/**
 * Which actions the connected wallet may take on an invoice. Funding must
 * come from a third party: the payee would be funding itself, and a debtor
 * funding its own debt is the self-dealing case the contract rejects.
 */
export function availableActions(invoice: Invoice, address: string | null) {
  const isPayee = address === invoice.payee;
  const isDebtor = address === invoice.debtor;
  const unsettled =
    invoice.status === InvoiceStatus.Open || invoice.status === InvoiceStatus.Funded;
  return {
    canFund: invoice.status === InvoiceStatus.Open && !isPayee && !isDebtor,
    canPay: unsettled && isDebtor,
    canCancel: invoice.status === InvoiceStatus.Open && isPayee,
  };
}
