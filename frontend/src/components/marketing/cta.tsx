"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function Cta() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="term-panel p-8 text-center sm:p-12"
        >
          <p className="eyebrow">free while on testnet</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            $ connect-wallet <span className="blink-cursor" />
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted">
            No signup, no account, no email — just a Stellar wallet funded with testnet XLM.
          </p>
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
        </motion.div>
      </div>
    </section>
  );
}
