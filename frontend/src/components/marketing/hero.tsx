"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getTotalInvoices } from "@/lib/contract";

export function Hero() {
  const [total, setTotal] = useState<bigint | null>(null);

  useEffect(() => {
    getTotalInvoices()
      .then(setTotal)
      .catch(() => undefined);
  }, []);

  return (
    <section className="ledger-lines relative overflow-hidden border-b border-border">
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="eyebrow">
              {total !== null ? `${total.toString()} invoices financed on testnet` : "Invoice financing on Stellar"}
            </p>

            <h1 className="font-display mt-5 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Get paid today.
              <br />
              <span className="accent-text">Not in 60 days.</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
              An unpaid invoice is cash you&apos;ve already earned. Runway lets a funder advance most of its value
              right now — you get paid immediately, the funder collects in full when your customer actually settles.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/invoices"
                className="border border-border-strong bg-accent px-6 py-3 text-center text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
              >
                Finance an invoice &rarr;
              </Link>
              <a
                href="#how-it-works"
                className="border border-border-strong px-6 py-3 text-center text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
              >
                See how it works
              </a>
            </div>

            <p className="mt-6 eyebrow !text-muted">No custodian &middot; settles on-chain &middot; Stellar testnet</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24, rotate: -1 }}
            animate={{ opacity: 1, y: 0, rotate: -1.5 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mx-auto w-full max-w-sm"
          >
            <InvoiceMock />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function InvoiceMock() {
  return (
    <div className="ledger-card bg-card p-6 shadow-[6px_6px_0_0_var(--border-strong)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="eyebrow">Invoice #0142</p>
          <p className="font-display mt-1 text-2xl font-extrabold">$4,800.00</p>
        </div>
        <span className="border border-accent px-2 py-1 text-xs font-medium text-accent">Funded</span>
      </div>

      <div className="mt-6 space-y-2.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Advance (95%)</span>
          <span className="font-medium">$4,560.00</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Due date</span>
          <span className="font-medium">Sep 30, 2026</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Funder profit</span>
          <span className="font-medium text-accent">$240.00</span>
        </div>
      </div>

      <div className="perforation my-6" />

      <div className="flex items-center justify-between text-xs text-muted">
        <span>Paid to you</span>
        <span className="eyebrow !text-accent">Today</span>
      </div>
    </div>
  );
}
