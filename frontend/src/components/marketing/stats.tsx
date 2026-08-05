"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FundingChart } from "@/components/charts/funding-chart";
import { fetchStatsFromBackend, IndexerStats } from "@/lib/backend";
import { formatXlm } from "@/lib/format";

/**
 * Backend-only, unlike the rest of the site. The indexer is what makes
 * "financed vs. not yet financed" cheap to compute (a SQL COUNT, not an
 * on-chain scan) — see backend/src/db.ts:stats(). If it's not configured
 * or unreachable, this section just doesn't render rather than showing
 * fabricated numbers.
 */
export function Stats() {
  const [stats, setStats] = useState<IndexerStats | null | "loading">("loading");

  useEffect(() => {
    fetchStatsFromBackend().then(setStats);
  }, []);

  if (stats === "loading" || stats === null) return null;

  const notFinanced = Math.max(stats.totalInvoices - stats.financedCount, 0);

  return (
    <section id="stats" className="border-t border-border">
      <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6">
        <div className="max-w-xl">
          <p className="eyebrow">the indexer, live</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">what&apos;s actually happened</h2>
          <p className="mt-3 text-muted">
            Not a projection — every number below comes straight from the invoices indexed off the deployed
            contract.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="term-panel mt-10 flex flex-col items-center gap-8 p-6 sm:flex-row sm:p-8"
        >
          <FundingChart financed={stats.financedCount} unfinanced={notFinanced} />

          <div className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-3">
            <Stat label="invoices registered" value={stats.totalInvoices.toString()} tone="text-foreground" />
            <Stat
              label="total advanced to payees"
              value={formatXlm(stats.totalFinanced)}
              suffix="XLM"
              tone="accent-text"
            />
            <Stat label="open for funding right now" value={stats.openForFunding.toString()} tone="text-accent-gold" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Stat({ label, value, suffix, tone }: { label: string; value: string; suffix?: string; tone: string }) {
  return (
    <div>
      <p className={`text-3xl font-bold ${tone}`}>
        {value}
        {suffix && <span className="ml-1.5 text-base font-medium text-muted">{suffix}</span>}
      </p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}
