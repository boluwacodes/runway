"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button, Card, Badge, EmptyState } from "@/components/ui";
import { useWallet } from "@/context/wallet-context";
import {
  Invoice,
  InvoiceStatus,
  NATIVE_TOKEN_ID,
  buildCreateInvoiceTx,
  discoverInvoiceIds,
  getInvoice,
  getTotalInvoices,
  submitSignedTx,
  ContractCallError,
} from "@/lib/contract";
import { fetchInvoicesFromBackend } from "@/lib/backend";
import {
  assetLabel,
  bpsToPercent,
  formatDaysUntilDue,
  formatXlm,
  shortenAddress,
  xlmToStroops,
} from "@/lib/format";
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

export default function InvoicesPage() {
  const router = useRouter();
  const { address, connectWallet, connecting, signTransaction } = useWallet();

  useEffect(() => {
    document.title = "Invoices · Runway";
  }, []);

  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [total, setTotal] = useState<bigint | null>(null);
  const [source, setSource] = useState<"indexer" | "chain" | null>(null);

  const [debtor, setDebtor] = useState("");
  const [amount, setAmount] = useState("1000");
  const [advancePercent, setAdvancePercent] = useState("95");
  const [dueInDays, setDueInDays] = useState("30");
  const [creating, setCreating] = useState(false);

  const [viewId, setViewId] = useState("");

  const refresh = useCallback(async () => {
    try {
      const totalCount = await getTotalInvoices();
      setTotal(totalCount);

      const fromBackend = await fetchInvoicesFromBackend();
      if (fromBackend) {
        setInvoices(fromBackend.sort((a, b) => (a.id < b.id ? 1 : -1)));
        setSource("indexer");
        return;
      }

      // Backend unset or unreachable — fall back to on-chain discovery.
      const ids = await discoverInvoiceIds();
      const loaded = await Promise.all(ids.map((id) => getInvoice(id)));
      setInvoices(loaded.sort((a, b) => (a.id < b.id ? 1 : -1)));
      setSource("chain");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load invoices.");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch-on-mount, not derived state
    void refresh();
  }, [refresh]);

  async function ensureWallet(): Promise<string> {
    if (address) return address;
    return connectWallet();
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    try {
      const wallet = await ensureWallet();
      const advanceBps = Math.round(Number(advancePercent) * 100);
      const dueDate = BigInt(Math.floor(Date.now() / 1000) + Number(dueInDays) * 86_400);
      const unsignedXdr = await buildCreateInvoiceTx(
        wallet,
        debtor.trim(),
        NATIVE_TOKEN_ID,
        xlmToStroops(amount),
        advanceBps,
        dueDate,
      );
      const signedXdr = await signTransaction(unsignedXdr);
      await submitSignedTx(signedXdr);
      toast.success("Invoice registered");
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not register invoice."));
    } finally {
      setCreating(false);
    }
  }

  function handleView(event: React.FormEvent) {
    event.preventDefault();
    if (!viewId.trim()) return;
    router.push(`/invoices/${viewId.trim()}`);
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">invoices</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                register or fund an invoice
              </h1>
            </div>
            {total !== null && (
              <Badge tone="gold">{total.toString()} invoices registered on testnet</Badge>
            )}
          </div>
          <p className="mt-2 max-w-lg text-sm text-muted">
            Invoices run on Stellar testnet using native XLM. Connect a wallet when you&apos;re
            ready to register, fund, or pay one.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h2 className="eyebrow">New invoice</h2>
              <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3">
                <label className="text-sm">
                  <span className="mb-1.5 block text-xs text-muted">Debtor (who owes you)</span>
                  <input
                    required
                    placeholder="G…"
                    value={debtor}
                    onChange={(e) => setDebtor(e.target.value)}
                    className="w-full border border-border-strong bg-background px-3.5 py-2.5 font-mono text-sm focus:border-accent focus:outline-none"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm">
                    <span className="mb-1.5 block text-xs text-muted">Face value (XLM)</span>
                    <input
                      required
                      type="number"
                      min="0.0000001"
                      step="any"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full border border-border-strong bg-background px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1.5 block text-xs text-muted">Advance %</span>
                    <input
                      required
                      type="number"
                      min="0.01"
                      max="100"
                      step="any"
                      value={advancePercent}
                      onChange={(e) => setAdvancePercent(e.target.value)}
                      className="w-full border border-border-strong bg-background px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
                    />
                  </label>
                </div>
                <label className="text-sm">
                  <span className="mb-1.5 block text-xs text-muted">Due in (days)</span>
                  <input
                    required
                    type="number"
                    min="1"
                    value={dueInDays}
                    onChange={(e) => setDueInDays(e.target.value)}
                    className="w-full border border-border-strong bg-background px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
                  />
                </label>
                <Button type="submit" disabled={creating || connecting} className="mt-2">
                  {creating
                    ? "Registering…"
                    : address
                      ? "Register invoice"
                      : "Connect wallet & register"}
                </Button>
              </form>
            </Card>

            <Card className="p-6">
              <h2 className="eyebrow">Open an invoice by ID</h2>
              <p className="mt-2 text-sm text-muted">
                Someone shared an invoice ID with you? Enter it here to view, fund, or pay it.
              </p>
              <form onSubmit={handleView} className="mt-4 flex flex-col gap-3">
                <input
                  required
                  type="number"
                  min="1"
                  placeholder="e.g. 1"
                  value={viewId}
                  onChange={(e) => setViewId(e.target.value)}
                  className="w-full border border-border-strong bg-background px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
                />
                <Button type="submit" variant="outline">
                  Open invoice
                </Button>
              </form>
            </Card>
          </div>

          <div className="mt-16">
            <div className="flex items-center justify-between gap-3">
              <h2 className="eyebrow">Recent invoices</h2>
              {source && (
                <span className="text-xs text-muted">
                  {source === "indexer" ? "via indexer" : "via on-chain event log"}
                </span>
              )}
            </div>
            <div className="mt-4">
              {loadError ? (
                <Card className="p-6 text-sm text-accent-rose">{loadError}</Card>
              ) : invoices === null ? (
                <div
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                  role="status"
                  aria-label="Loading invoices"
                >
                  {[0, 1, 2].map((i) => (
                    <Card key={i} className="h-[140px] animate-pulse p-5" aria-hidden="true">
                      <div className="h-3 w-20 bg-border" />
                      <div className="mt-4 h-5 w-24 bg-border" />
                      <div className="mt-2 h-3 w-16 bg-border" />
                    </Card>
                  ))}
                </div>
              ) : invoices.length === 0 ? (
                <Card>
                  <EmptyState>No invoices yet. Register the first one above.</EmptyState>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {invoices.map((invoice) => (
                    <a key={invoice.id.toString()} href={`/invoices/${invoice.id}`}>
                      <Card className="h-full p-5 transition-shadow hover:shadow-md">
                        <div className="flex items-center justify-between">
                          <span className="eyebrow">Invoice #{invoice.id.toString()}</span>
                          <Badge tone={STATUS_TONE[invoice.status]}>
                            {STATUS_LABEL[invoice.status]}
                          </Badge>
                        </div>
                        <p className="mt-3 text-lg font-semibold">
                          {formatXlm(invoice.faceValue)}{" "}
                          {assetLabel(invoice.token, NATIVE_TOKEN_ID)}
                        </p>
                        <p className="text-xs text-muted">
                          {bpsToPercent(invoice.advanceBps)}% advance &middot;{" "}
                          {formatDaysUntilDue(invoice.dueDate)}
                        </p>
                        <div className="mt-4 flex items-center justify-between text-xs text-muted">
                          <span>payee {shortenAddress(invoice.payee)}</span>
                          <span>debtor {shortenAddress(invoice.debtor)}</span>
                        </div>
                      </Card>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof WalletError || err instanceof ContractCallError) return err.message;
  return fallback;
}
