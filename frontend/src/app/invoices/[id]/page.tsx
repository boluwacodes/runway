"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button, Card, Badge, Spinner, CopyButton } from "@/components/ui";
import { useWallet } from "@/context/wallet-context";
import {
  Invoice,
  InvoiceStatus,
  NATIVE_TOKEN_ID,
  ContractCallError,
  buildCancelInvoiceTx,
  buildFundInvoiceTx,
  buildPayInvoiceTx,
  getInvoice,
  latePaymentCount,
  submitSignedTx,
} from "@/lib/contract";
import { assetLabel, bpsToPercent, formatDueDate, formatDaysUntilDue, formatXlm } from "@/lib/format";
import { WalletError } from "@/lib/wallet";

const STATUS_TONE = {
  [InvoiceStatus.Open]: "gold" as const,
  [InvoiceStatus.Funded]: "green" as const,
  [InvoiceStatus.Paid]: "blue" as const,
  [InvoiceStatus.Cancelled]: "rose" as const,
};
const STATUS_LABEL = {
  [InvoiceStatus.Open]: "Open",
  [InvoiceStatus.Funded]: "Funded",
  [InvoiceStatus.Paid]: "Paid",
  [InvoiceStatus.Cancelled]: "Cancelled",
};

/** Route params are arbitrary strings — only accept a non-negative integer as an invoice id. */
function parseInvoiceId(raw: string): bigint | null {
  if (!/^\d+$/.test(raw)) return null;
  return BigInt(raw);
}

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const invoiceId = parseInvoiceId(params.id);
  const { address, connectWallet, signTransaction } = useWallet();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [debtorLateCount, setDebtorLateCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(
    invoiceId === null ? `"${params.id}" isn't a valid invoice id.` : null,
  );
  const [busy, setBusy] = useState<"fund" | "pay" | "cancel" | null>(null);

  useEffect(() => {
    document.title = invoiceId !== null ? `Invoice #${invoiceId} · Runway` : "Invoice not found · Runway";
  }, [invoiceId]);

  const refresh = useCallback(async () => {
    if (invoiceId === null) return;
    try {
      const loaded = await getInvoice(invoiceId);
      setInvoice(loaded);
      setDebtorLateCount(await latePaymentCount(loaded.debtor));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this invoice.");
    }
  }, [invoiceId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch-on-mount, not derived state
    void refresh();
  }, [refresh]);

  async function ensureWallet(): Promise<string> {
    if (address) return address;
    return connectWallet();
  }

  async function handleFund() {
    if (invoiceId === null) return;
    setBusy("fund");
    try {
      const wallet = await ensureWallet();
      const unsignedXdr = await buildFundInvoiceTx(invoiceId, wallet);
      const signedXdr = await signTransaction(unsignedXdr);
      await submitSignedTx(signedXdr);
      toast.success("Invoice funded");
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not fund invoice."));
    } finally {
      setBusy(null);
    }
  }

  async function handlePay() {
    if (invoiceId === null) return;
    setBusy("pay");
    try {
      const wallet = await ensureWallet();
      const unsignedXdr = await buildPayInvoiceTx(invoiceId, wallet);
      const signedXdr = await signTransaction(unsignedXdr);
      await submitSignedTx(signedXdr);
      toast.success("Invoice paid");
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not pay invoice."));
    } finally {
      setBusy(null);
    }
  }

  async function handleCancel() {
    if (invoiceId === null) return;
    if (!window.confirm("Cancel this invoice? It can't be undone.")) return;
    setBusy("cancel");
    try {
      const wallet = await ensureWallet();
      const unsignedXdr = await buildCancelInvoiceTx(invoiceId, wallet);
      const signedXdr = await signTransaction(unsignedXdr);
      await submitSignedTx(signedXdr);
      toast.success("Invoice cancelled");
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not cancel invoice."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          {error ? (
            <Card className="p-6 text-sm text-accent-rose">{error}</Card>
          ) : !invoice ? (
            <Spinner label="Loading invoice…" />
          ) : (
            <InvoiceDetail
              invoice={invoice}
              debtorLateCount={debtorLateCount}
              address={address}
              busy={busy}
              onFund={handleFund}
              onPay={handlePay}
              onCancel={handleCancel}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function InvoiceDetail({
  invoice,
  debtorLateCount,
  address,
  busy,
  onFund,
  onPay,
  onCancel,
}: {
  invoice: Invoice;
  debtorLateCount: number | null;
  address: string | null;
  busy: "fund" | "pay" | "cancel" | null;
  onFund: () => void;
  onPay: () => void;
  onCancel: () => void;
}) {
  const isPayee = address === invoice.payee;
  const isDebtor = address === invoice.debtor;
  const advanceAmount = (invoice.faceValue * BigInt(invoice.advanceBps)) / 10_000n;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Invoice #{invoice.id.toString()}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {formatXlm(invoice.faceValue)} {assetLabel(invoice.token, NATIVE_TOKEN_ID)}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <CopyButton value={typeof window !== "undefined" ? window.location.href : ""} label="Copy link" />
          <Badge tone={STATUS_TONE[invoice.status]}>{STATUS_LABEL[invoice.status]}</Badge>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted">Advance</p>
            <p className="mt-1 font-medium">
              {bpsToPercent(invoice.advanceBps)}% &middot; {formatXlm(advanceAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Due date</p>
            <p className="mt-1 font-medium">{formatDueDate(invoice.dueDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Status</p>
            <p className="mt-1 font-medium">{formatDaysUntilDue(invoice.dueDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Debtor history</p>
            <p className="mt-1 font-medium">
              {debtorLateCount === null ? "—" : debtorLateCount === 0 ? "No late payments" : `${debtorLateCount} late`}
            </p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-3 border-t border-border pt-4 text-xs sm:grid-cols-3">
          <div className="min-w-0">
            <dt className="text-muted">Payee</dt>
            <dd className="mt-1 break-all font-mono text-foreground">{invoice.payee}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-muted">Debtor</dt>
            <dd className="mt-1 break-all font-mono text-foreground">{invoice.debtor}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-muted">Funder</dt>
            <dd className="mt-1 break-all font-mono text-foreground">{invoice.funder ?? "Not yet funded"}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          {invoice.status === InvoiceStatus.Open && !isPayee && (
            <Button onClick={onFund} disabled={busy !== null}>
              {busy === "fund" ? "Funding…" : `Fund for ${formatXlm(advanceAmount)} ${assetLabel(invoice.token, NATIVE_TOKEN_ID)}`}
            </Button>
          )}
          {(invoice.status === InvoiceStatus.Open || invoice.status === InvoiceStatus.Funded) && isDebtor && (
            <Button onClick={onPay} disabled={busy !== null}>
              {busy === "pay" ? "Paying…" : `Pay ${formatXlm(invoice.faceValue)} ${assetLabel(invoice.token, NATIVE_TOKEN_ID)}`}
            </Button>
          )}
          {invoice.status === InvoiceStatus.Open && isPayee && (
            <Button variant="danger" onClick={onCancel} disabled={busy !== null}>
              {busy === "cancel" ? "Cancelling…" : "Cancel invoice"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof WalletError || err instanceof ContractCallError) return err.message;
  return fallback;
}
