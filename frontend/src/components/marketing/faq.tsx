"use client";

import { Disclosure } from "@/components/ui";

const FAQS = [
  {
    q: "What if my customer never pays the invoice at all?",
    a: "Runway can't force an off-chain business relationship to resolve — no on-chain mechanism can compel a debtor to pay. What it guarantees is that whenever payment does land, it's routed correctly: to the funder if financed, to you otherwise. A funder evaluates that risk the same way a real factoring company would, by checking the debtor's on-chain payment history first.",
  },
  {
    q: "What happens if my customer pays late?",
    a: "The invoice still settles normally — a late payment isn't blocked or penalized, it's simply recorded against the debtor's on-chain history (late_payment_count), visible to anyone deciding whether to fund that debtor's invoices in the future.",
  },
  {
    q: "How is the funder's return determined?",
    a: "You set it when you create the invoice: the advance percentage (e.g. 95% of face value) you're willing to accept today. The funder's profit is the gap between what they advance and the full face value they collect when your customer pays — the same economics as real-world invoice factoring, just transparent and fixed upfront.",
  },
  {
    q: "Can I cancel an invoice?",
    a: "Yes, as long as no funder has advanced money against it yet. Once it's funded, cancellation is disabled — that would strand the funder's capital, which they already sent to you.",
  },
  {
    q: "What currency do invoices use?",
    a: "Invoices default to Stellar's native asset (XLM), so financing one doesn't require setting up a separate token trustline first. An invoice can be created against any Stellar Asset Contract token, including stablecoins.",
  },
  {
    q: "Is this live on mainnet?",
    a: "Not yet — Runway runs on Stellar's public testnet today, with real contract logic and tests, while the model gets validated. Mainnet is the next step.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="max-w-xl">
          <p className="eyebrow">Questions</p>
          <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Common questions</h2>
        </div>

        <div className="mt-10 max-w-3xl">
          {FAQS.map((item) => (
            <Disclosure key={item.q} summary={item.q}>
              {item.a}
            </Disclosure>
          ))}
        </div>
      </div>
    </section>
  );
}
