"use client";

import { motion } from "framer-motion";

const SESSION = [
  {
    prompt: "runway create-invoice --debtor GABC..XYZ --amount 4800 --advance 95%",
    output: "invoice #142 registered · status: open",
    note: "Set the amount, who owes it, when it's due, and the advance you'll accept for getting paid today.",
  },
  {
    prompt: "runway fund-invoice 142",
    output: "4,560.00 XLM sent to payee · status: funded",
    note: "Any funder can back it — the advance lands in your wallet immediately, no underwriting call.",
  },
  {
    prompt: "runway pay-invoice 142",
    output: "4,800.00 XLM settled to funder · status: paid",
    note: "Whenever the debtor actually pays, the contract routes it — to the funder if financed, to you otherwise.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-4xl px-4 py-24 sm:px-6">
      <div className="max-w-xl">
        <p className="eyebrow">how it works</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">three commands, start to finish</h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="term-panel mt-12 overflow-hidden"
      >
        <div className="flex items-center gap-1.5 border-b border-border-strong bg-card px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-accent-rose" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent-gold" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent" />
          <span className="ml-2 text-xs text-muted">invoice-142.sh</span>
        </div>

        <div className="divide-y divide-border">
          {SESSION.map((step, index) => (
            <motion.div
              key={step.prompt}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: index * 0.15 }}
              className="p-5 sm:p-6"
            >
              <p className="text-sm">
                <span className="accent-text">$</span> <span className="text-foreground">{step.prompt}</span>
              </p>
              <p className="mt-1.5 pl-4 text-sm text-muted">{step.output}</p>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">{step.note}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
