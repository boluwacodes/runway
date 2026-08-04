import Link from "next/link";
import { LogoMark } from "./logo-mark";

const LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
  { href: "/invoices", label: "Launch app" },
  { href: "https://github.com/boluwacodes/runway", label: "GitHub", external: true },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t-2 border-border-strong">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-14 text-center sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark size={26} />
          <span className="text-lg">Runway</span>
        </Link>

        <p className="max-w-sm text-sm text-muted">
          Get paid on your invoices today, not in 60 days — settled trustlessly on Stellar.
        </p>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
          {LINKS.map((link) =>
            link.external ? (
              <a key={link.href} href={link.href} className="hover:text-foreground">
                {link.label}
              </a>
            ) : (
              <Link key={link.href} href={link.href} className="hover:text-foreground">
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <p className="eyebrow !text-muted">&copy; {new Date().getFullYear()} Runway &middot; Built on Stellar</p>
      </div>
    </footer>
  );
}
