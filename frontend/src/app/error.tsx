"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { LogoMark } from "@/components/logo-mark";
import { Button } from "@/components/ui";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <Navbar />
      <main className="ledger-lines flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <LogoMark size={40} />
        <p className="eyebrow mt-6">Something went wrong</p>
        <h1 className="font-display mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          That didn&apos;t work.
        </h1>
        <p className="mt-3 max-w-sm text-sm text-muted">
          Nothing on-chain was affected by this — it&apos;s a page-level error, not a failed transaction. Try again,
          or head back home.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button onClick={reset}>Try again</Button>
          <Link
            href="/"
            className="border border-border-strong px-6 py-2.5 text-center text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            Back to home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
