import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "About",
  description: "Why Runway exists, and how it compares to traditional invoice factoring.",
};

const COMPARISON = [
  { row: "Who evaluates the invoice", factor: "The factoring company, over days", runway: "Any funder, in one transaction" },
  { row: "Who holds the money in between", factor: "The factoring company's account", runway: "Nobody — direct wallet-to-wallet transfers" },
  { row: "Minimum invoice size", factor: "Often set high to make the paperwork worth it", runway: "None — a single small invoice is as viable as a portfolio" },
  { row: "Debtor payment history", factor: "The factor's private records, if they keep any", runway: "A public, on-chain late-payment count anyone can check" },
  { row: "Settlement time once approved", factor: "1-5 business days to wire the advance", runway: "One Stellar transaction, seconds" },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="ledger-lines border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <p className="eyebrow">About Runway</p>
            <h1 className="font-display mt-3 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
              Invoice factoring, minus the factoring company.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Businesses have been advancing each other cash against unpaid invoices for as long as invoices have
              existed. Runway doesn&apos;t replace that idea — it removes the intermediary sitting in the middle of
              it, holding funds, setting minimums, and taking days to move money that a contract can move in
              seconds.
            </p>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-xl">
              <p className="eyebrow">What changes</p>
              <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight">Same idea, no middleman</h2>
            </div>

            <div className="mt-10 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-border-strong">
                    <th className="py-3 pr-4 font-medium text-muted"> </th>
                    <th className="py-3 pr-4 font-medium text-muted">Traditional factoring</th>
                    <th className="py-3 font-medium accent-text">Runway</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row) => (
                    <tr key={row.row} className="border-b border-border last:border-0">
                      <td className="py-3 pr-4 font-medium text-foreground">{row.row}</td>
                      <td className="py-3 pr-4 text-muted">{row.factor}</td>
                      <td className="py-3 text-foreground">{row.runway}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-xl">
              <p className="eyebrow">Where this is today</p>
              <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight">Honest status</h2>
            </div>
            <div className="mt-8 max-w-2xl space-y-4 text-sm leading-relaxed text-muted">
              <p>
                Runway runs on Stellar&apos;s public testnet today, not mainnet — free to use while that&apos;s
                true. The contract is real and tested; the frontend talks to it directly, with no backend in
                between.
              </p>
              <p>
                Invoices currently settle in native XLM. Stablecoin-denominated invoices (any Stellar Asset Contract
                token) and a mainnet deployment are next. See{" "}
                <Link href="https://github.com/boluwacodes/runway" className="accent-text hover:underline">
                  the README
                </Link>{" "}
                for the full roadmap.
              </p>
              <p>
                Runway can&apos;t and doesn&apos;t claim to force a debtor to pay — no on-chain mechanism can compel
                an off-chain business relationship. What it guarantees is that whenever payment does land, it
                reaches whoever is actually owed it. See{" "}
                <a href="https://github.com/boluwacodes/runway" className="accent-text hover:underline">
                  the source
                </a>{" "}
                — contract, tests, and frontend are all public.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
