"use client";

import { motion } from "framer-motion";
import { Eye, Link2Off, Timer, Wallet, Zap } from "lucide-react";

const SPECS = [
  {
    key: "settlement_time",
    icon: Timer,
    value: "~5 seconds",
    note: "one Stellar transaction, not a bank wire",
  },
  {
    key: "network_fee",
    icon: Zap,
    value: "< $0.001",
    note: "financing a single $500 invoice stays worth it",
  },
  {
    key: "custody_model",
    icon: Wallet,
    value: "none",
    note: "wallet to wallet at every step — payee, funder, debtor",
  },
  {
    key: "trustline_setup",
    icon: Link2Off,
    value: "not required",
    note: "invoices default to native XLM",
  },
  {
    key: "payment_history",
    icon: Eye,
    value: "public",
    note: "a funder can check a debtor's on-time record before backing them",
  },
];

export function WhyStellar() {
  return (
    <section id="why-stellar" className="border-t border-border">
      <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6">
        <div className="max-w-xl">
          <p className="eyebrow">why stellar</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">the spec sheet</h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="term-panel mt-12 divide-y divide-border"
        >
          {SPECS.map((spec) => (
            <div
              key={spec.key}
              className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:gap-6 sm:px-6"
            >
              <span className="flex w-56 shrink-0 items-center gap-3 text-sm text-muted">
                <spec.icon size={16} className="shrink-0 text-accent" />
                {spec.key}
              </span>
              <span className="font-semibold accent-text">{spec.value}</span>
              <span className="text-sm text-muted sm:ml-auto sm:text-right">{spec.note}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
