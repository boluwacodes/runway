"use client";

import { Disclosure } from "@/components/ui";

const FAQS = [
  {
    q: "what if the debtor never pays?",
    a: "No on-chain mechanism can force an off-chain business relationship to resolve. A funder evaluates that risk the same way a real factoring company would — by checking the debtor's on-chain payment history before backing the invoice.",
  },
  {
    q: "what happens on a late payment?",
    a: "It still settles normally. Nothing is blocked or penalized — the payment is simply logged against the debtor's on-chain record (late_payment_count), visible to anyone deciding whether to fund that debtor's invoices next.",
  },
  {
    q: "how is the funder's return set?",
    a: "You set it at creation: the advance percentage you'll accept for getting paid today. The funder's profit is the gap between what they advance and the full face value they collect — fixed and visible upfront, not negotiated after the fact.",
  },
  {
    q: "can an invoice be cancelled?",
    a: "Yes, as long as no funder has advanced money against it. Once funded, cancellation is disabled — that would strand capital the funder already sent.",
  },
  {
    q: "is this live on mainnet?",
    a: "Not yet. Runway runs on Stellar's public testnet today, with real contract logic and tests, while the model gets validated. Mainnet is next.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="max-w-xl">
          <p className="eyebrow">faq</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">common questions</h2>
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
