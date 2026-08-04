"use client";

import { motion } from "framer-motion";
import { FileText, HandCoins, CheckCircle2 } from "lucide-react";

const STAGES = [
  {
    icon: FileText,
    status: "Open",
    title: "Register the invoice",
    body: "Set the amount, who owes it, when it's due, and the advance you'd accept for getting paid today. Nothing moves yet.",
  },
  {
    icon: HandCoins,
    status: "Funded",
    title: "A funder advances the cash",
    body: "Any funder can back it — the advance lands in your wallet immediately. No underwriting call, no waiting on a credit check.",
  },
  {
    icon: CheckCircle2,
    status: "Paid",
    title: "The debtor settles, on-chain",
    body: "Whenever they actually pay, the contract routes it automatically — to the funder if it was financed, straight to you otherwise.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-5xl px-4 py-24 sm:px-6">
      <div className="max-w-xl">
        <p className="eyebrow">how it works</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">one invoice, three states</h2>
        <p className="mt-4 text-muted">Every invoice moves through the same lifecycle — this is it, start to finish.</p>
      </div>

      <div className="relative mt-16">
        <div className="absolute left-6 top-6 hidden h-px w-[calc(100%-3rem)] bg-border-strong sm:block" />
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ transformOrigin: "left" }}
          className="absolute left-6 top-6 hidden h-px w-[calc(100%-3rem)] bg-accent sm:block"
        />

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
          {STAGES.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <motion.div
                key={stage.status}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.2 }}
                className="relative"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ delay: 0.15 + index * 0.2, type: "spring", stiffness: 300, damping: 15 }}
                  className="relative z-10 flex h-12 w-12 items-center justify-center border-2 border-accent bg-background text-accent"
                >
                  <Icon size={20} />
                </motion.div>
                <p className="eyebrow mt-4 !text-accent">{stage.status}</p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">{stage.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">{stage.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
