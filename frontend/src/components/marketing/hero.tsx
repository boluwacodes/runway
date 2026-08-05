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
    <section className="term-grid relative overflow-hidden border-b border-border">
      <div className="mx-auto max-w-4xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="eyebrow">
            {total !== null ? `${total.toString()} invoices financed on testnet` : "live on Stellar testnet"}
          </p>

          <h1 className="mt-6 text-4xl font-bold leading-[1.15] tracking-tight sm:text-6xl">
            invoice.status = &apos;paid&apos;
            <br />
            <span className="text-muted">{"# used to take 60 days"}</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            You did the work. The invoice is real. The cash isn&apos;t — yet. Runway lets a funder advance it to you
            now, and the debtor settles the contract directly on-chain whenever they actually pay.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/invoices"
              className="border border-accent bg-accent px-6 py-3 text-center text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              register an invoice
            </Link>
            <a
              href="#how-it-works"
              className="border border-border-strong px-6 py-3 text-center text-sm font-medium text-foreground transition-colors hover:bg-card"
            >
              see what changes for you
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-16"
        >
          <DaysCounter />
        </motion.div>
      </div>
    </section>
  );
}

function DaysCounter() {
  return (
    <div className="hero-panel relative flex flex-col divide-y divide-border sm:flex-row sm:divide-x sm:divide-y-0">
      <div className="flex-1 p-6">
        <p className="eyebrow !text-muted">without Runway</p>
        <p className="mt-2 text-5xl font-bold text-muted line-through decoration-2">60</p>
        <p className="mt-1 text-sm text-muted">days waiting on a customer to pay</p>
      </div>
      <div className="flex-1 p-6">
        <p className="eyebrow">with Runway</p>
        <p className="mt-2 text-5xl font-bold accent-text">0</p>
        <p className="mt-1 text-sm text-muted">days — a funder advances it today</p>
      </div>
    </div>
  );
}
