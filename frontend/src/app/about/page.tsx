import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "About",
  description: "Why Runway exists, and how it compares to traditional invoice factoring.",
};

const COMPARISON = [
  { key: "evaluated_by", factor: "a factoring company, over days", runway: "any funder, in one transaction" },
  { key: "funds_held_by", factor: "the factor's account", runway: "nobody — direct wallet transfers" },
  { key: "min_invoice_size", factor: "set high, paperwork isn't worth it below that", runway: "none" },
  { key: "debtor_history", factor: "the factor's private records, if kept", runway: "public, on-chain" },
  { key: "settlement_time", factor: "1-5 business days", runway: "~5 seconds" },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="term-grid border-b border-border">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
            <p className="eyebrow">about</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
              factoring.exe, minus the factor
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Businesses have advanced each other cash against unpaid invoices for as long as invoices have existed.
              Runway doesn&apos;t reinvent that — it just removes the company that used to sit in the middle,
              holding funds, setting minimums, and taking days to wire money a contract moves in seconds.
            </p>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-xl">
              <p className="eyebrow">diff</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">factor vs. runway</h2>
            </div>

            <div className="term-panel mt-10 divide-y divide-border overflow-x-auto">
              {COMPARISON.map((row) => (
                <div key={row.key} className="grid min-w-[560px] grid-cols-[160px_1fr_1fr] gap-4 px-5 py-4 text-sm sm:px-6">
                  <span className="text-muted">{row.key}</span>
                  <span className="text-muted line-through decoration-1">{row.factor}</span>
                  <span className="accent-text">{row.runway}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-xl">
              <p className="eyebrow">status</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">what&apos;s actually real</h2>
            </div>
            <div className="mt-8 max-w-2xl space-y-4 text-sm leading-relaxed text-muted">
              <p>
                Testnet, not mainnet — free while that&apos;s true. The contract is real, tested, and deployed; the
                frontend calls it directly. There&apos;s no backend to trust in between.
              </p>
              <p>
                Invoices settle in native XLM today. Stablecoins and mainnet are the next two things on the list —
                see{" "}
                <Link href="https://github.com/boluwacodes/runway" className="accent-text hover:underline">
                  the README
                </Link>
                .
              </p>
              <p>
                One thing Runway will never claim: that it can force a debtor to pay. It can&apos;t — no contract
                can compel an off-chain relationship to resolve. What it guarantees is narrower and real: whatever
                payment does land gets routed to whoever is actually owed it.{" "}
                <a href="https://github.com/boluwacodes/runway" className="accent-text hover:underline">
                  Read the source
                </a>{" "}
                and check for yourself.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
