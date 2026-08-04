"use client";

import { motion } from "framer-motion";

const POINTS = [
  {
    n: "01",
    title: "The work is done. The cash isn't.",
    body: "You've delivered, the invoice is out, and now you wait — 30, 60, sometimes 90 days — while payroll, rent, and suppliers don't wait with you.",
  },
  {
    n: "02",
    title: "Factoring exists, but it's slow and opaque",
    body: "Traditional invoice factoring means paperwork, a credit check on your business, and a factoring company taking days to wire an advance you needed this week.",
  },
  {
    n: "03",
    title: "Small businesses get the worst terms",
    body: "The bigger your invoice book, the better rate you get from a factor. A single freelancer or small shop with one overdue invoice gets quoted the worst, if anyone bothers to quote at all.",
  },
];

export function Problem() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="max-w-xl">
          <p className="eyebrow">The problem</p>
          <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Cash flow shouldn&apos;t depend on how fast someone else pays.
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-0 sm:grid-cols-3">
          {POINTS.map((point, index) => (
            <motion.div
              key={point.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="ledger-card p-6"
            >
              <span className="eyebrow font-mono text-2xl !text-border-strong">{point.n}</span>
              <h3 className="mt-3 text-base font-semibold text-foreground">{point.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{point.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
