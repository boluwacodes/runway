"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const STEPS = [
  {
    status: "Open",
    title: "Register the invoice",
    body: "Set the amount, who owes it, when it's due, and how much you're willing to give up for early payment. Nothing moves yet.",
  },
  {
    status: "Funded",
    title: "A funder advances you cash",
    body: "Any funder can back your invoice — they send the advance straight to your wallet, and the contract records who's owed the full amount when it's collected.",
  },
  {
    status: "Paid",
    title: "Your customer settles, on-chain",
    body: "Whenever your customer actually pays, the contract routes it automatically — to the funder if the invoice was financed, straight to you if it wasn't.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <div className="max-w-xl">
        <p className="eyebrow">How it works</p>
        <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Three states, start to finish
        </h2>
        <p className="mt-4 text-muted">The same lifecycle every invoice goes through — just enforced by a contract instead of a spreadsheet.</p>
      </div>

      <div className="mt-14 flex flex-col gap-4 md:flex-row md:items-stretch md:gap-0">
        {STEPS.map((step, index) => (
          <motion.div
            key={step.status}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: index * 0.12 }}
            className="ledger-card relative flex-1 p-6"
          >
            <span className="eyebrow border border-accent px-2 py-1 !text-accent">{step.status}</span>
            <h3 className="mt-4 text-lg font-semibold text-foreground">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>

            {index < STEPS.length - 1 && (
              <ArrowRight
                size={18}
                className="absolute -right-2.5 top-1/2 z-10 hidden -translate-y-1/2 text-border-strong md:block"
              />
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
