"use client";

import { motion } from "framer-motion";
import { Zap, ShieldCheck, Receipt, Eye } from "lucide-react";

const REASONS = [
  {
    icon: Zap,
    title: "Settlement in seconds, fees in fractions of a cent",
    body: "A funder shouldn't lose their margin to network fees. Stellar makes advancing a single invoice — not a bundled portfolio — economically viable.",
  },
  {
    icon: ShieldCheck,
    title: "The contract holds nothing between transfers",
    body: "Funds move directly wallet to wallet at each step — payee, funder, debtor. Runway the app never takes custody, and can't redirect a payment once it's sent.",
  },
  {
    icon: Receipt,
    title: "No trustline setup for the common case",
    body: "Invoices default to Stellar's native asset, so financing one doesn't require the debtor or funder to set up a new token trustline first.",
  },
  {
    icon: Eye,
    title: "A public, permissionless payment history",
    body: "Every advance and every settlement is a Stellar event log entry — a funder can independently check a debtor's on-time payment history before backing an invoice.",
  },
];

export function WhyStellar() {
  return (
    <section id="why-stellar" className="border-t border-border">
      <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6">
        <div className="max-w-xl">
          <p className="eyebrow">Why Stellar</p>
          <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Built for financing single invoices, not bundles
          </h2>
        </div>

        <div className="mt-14 flex flex-col gap-10">
          {REASONS.map((reason, index) => {
            const Icon = reason.icon;
            return (
              <motion.div
                key={reason.title}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: index * 0.06 }}
                className="flex items-start gap-5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-border-strong bg-card text-accent">
                  <Icon size={19} />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-foreground">{reason.title}</h3>
                  <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-muted">{reason.body}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
