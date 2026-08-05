"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Banknote, Building2, HandCoins, ReceiptText, ShieldCheck, TrendingUp } from "lucide-react";

const ROLES = [
  {
    key: "payee",
    label: "you're owed money",
    icon: ReceiptText,
    headline: "Stop waiting on net-60.",
    body: "You register what you're owed, by whom, and when it's due. The moment a funder backs it, the advance lands in your wallet — not a promise, an actual transaction. If nobody funds it, the debtor just pays you directly when it's due, same as any invoice.",
    points: [
      { icon: Banknote, text: "Get most of the value today instead of in 60 days" },
      { icon: ShieldCheck, text: "No application, no credit check, no waiting on approval" },
    ],
  },
  {
    key: "funder",
    label: "you want to put capital to work",
    icon: TrendingUp,
    headline: "Browse real invoices, advance real cash.",
    body: "Every open invoice shows the debtor's on-chain payment history before you commit — you're underwriting with actual data, not a pitch. Advance the funds in one transaction, then collect the full face value directly from the debtor when it settles.",
    points: [
      { icon: HandCoins, text: "Your return is the spread — fixed at funding time, not negotiated later" },
      { icon: ShieldCheck, text: "Funds move wallet-to-wallet; Runway is never in custody of them" },
    ],
  },
  {
    key: "debtor",
    label: "you owe an invoice",
    icon: Building2,
    headline: "Nothing about paying changes.",
    body: "You pay the invoice like you always would, whenever it's actually due — Runway doesn't accelerate or penalize anything on your end. The only difference is where the payment routes: to whoever funded it, or straight to the payee if nobody did.",
    points: [
      { icon: ShieldCheck, text: "Paying on time keeps your on-chain record clean for next time" },
      { icon: Banknote, text: "One on-chain payment settles the invoice in full, automatically routed" },
    ],
  },
];

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const role = ROLES[active];

  return (
    <section id="how-it-works" className="border-t border-border">
      <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6">
        <div className="max-w-xl">
          <p className="eyebrow">how it works</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">depends who you are</h2>
          <p className="mt-4 text-muted">Same invoice, three different vantage points. Pick yours.</p>
        </div>

        <div className="mt-10 flex flex-col gap-2 sm:flex-row">
          {ROLES.map((r, index) => (
            <button
              key={r.key}
              onClick={() => setActive(index)}
              className={`flex flex-1 items-center gap-3 border px-4 py-3.5 text-left transition-colors ${
                index === active
                  ? "border-accent bg-accent/10"
                  : "border-border-strong hover:border-muted"
              }`}
            >
              <r.icon size={18} className={index === active ? "text-accent" : "text-muted"} />
              <div>
                <p className={`text-sm font-semibold ${index === active ? "text-foreground" : "text-muted"}`}>
                  {r.key}
                </p>
                <p className="text-xs text-muted">{r.label}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="term-panel relative mt-4 min-h-[280px] overflow-hidden p-6 sm:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={role.key}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
            >
              <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{role.headline}</h3>
              <p className="mt-4 max-w-2xl leading-relaxed text-muted">{role.body}</p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-6">
                {role.points.map((point) => (
                  <div key={point.text} className="flex items-start gap-2.5 sm:max-w-xs">
                    <point.icon size={16} className="mt-0.5 shrink-0 text-accent" />
                    <p className="text-sm text-muted">{point.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
