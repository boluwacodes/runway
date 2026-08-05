"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Droplets, FileEdit, Wallet } from "lucide-react";

const STEPS = [
  {
    icon: Wallet,
    title: "Connect a wallet",
    body: "Freighter, on Stellar's testnet. Runway never asks for a key — every transaction is built here and signed there.",
  },
  {
    icon: Droplets,
    title: "Fund it with testnet XLM",
    body: "Stellar's laboratory hands out testnet lumens for free — enough to register an invoice or back someone else's.",
  },
  {
    icon: FileEdit,
    title: "Register or fund an invoice",
    body: "Payees list what they're owed and by when. Funders browse open invoices and advance the cash in one transaction.",
  },
];

export function Cta() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6">
        <div className="max-w-xl">
          <p className="eyebrow">free while on testnet</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">get started in three steps</h2>
          <p className="mt-3 text-muted">No signup, no account, no email — just a Stellar wallet.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="term-panel mt-10 grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0"
        >
          {STEPS.map((step, index) => (
            <div key={step.title} className="flex flex-col gap-3 p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-border-strong text-xs text-muted">
                  {index + 1}
                </span>
                <step.icon size={18} className="text-accent" />
              </div>
              <h3 className="font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{step.body}</p>
            </div>
          ))}
        </motion.div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/invoices"
            className="border border-accent bg-accent px-6 py-3 text-center text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            launch the app
          </Link>
          <a
            href="https://laboratory.stellar.org/#account-creator?network=test"
            target="_blank"
            rel="noreferrer"
            className="border border-border-strong px-6 py-3 text-center text-sm font-medium text-foreground hover:bg-card"
          >
            fund a testnet wallet
          </a>
        </div>
      </div>
    </section>
  );
}
