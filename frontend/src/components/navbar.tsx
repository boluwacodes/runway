"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, LogOut, Menu, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "./logo-mark";
import { Button } from "./ui/button";
import { useWallet } from "@/context/wallet-context";
import { shortenAddress } from "@/lib/format";
import { WalletError } from "@/lib/wallet";

const NAV_LINKS = [
  { href: "/#how-it-works", label: "the lifecycle" },
  { href: "/#why-stellar", label: "the spec" },
  { href: "/about", label: "vs. factoring" },
];

export function Navbar() {
  const pathname = usePathname();
  const { address, connecting, connectWallet, disconnectWallet } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (menuOpen) setMenuOpen(false);
    if (accountMenuOpen) setAccountMenuOpen(false);
  }

  useEffect(() => {
    if (!accountMenuOpen) return;
    function onClick(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [accountMenuOpen]);

  async function handleConnect() {
    try {
      await connectWallet();
      toast.success("Wallet connected");
    } catch (err) {
      toast.error(err instanceof WalletError ? err.message : "Could not connect wallet.");
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-border-strong bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <LogoMark size={26} />
            <span className="text-[16px] text-foreground">Runway</span>
          </Link>
          <span className="hidden items-center gap-1.5 border border-border-strong px-2 py-1 text-xs text-muted sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            testnet
          </span>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3.5 py-2 text-sm text-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {address ? (
            <div ref={accountMenuRef} className="relative">
              <button
                onClick={() => setAccountMenuOpen((open) => !open)}
                aria-expanded={accountMenuOpen}
                className="flex items-center gap-2 border border-border-strong px-3.5 py-2 text-sm text-foreground transition-colors hover:bg-foreground hover:text-background"
              >
                <span className="h-2 w-2 rounded-full bg-accent" />
                {shortenAddress(address)}
                <ChevronDown size={14} className={`transition-transform ${accountMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {accountMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="term-panel absolute right-0 mt-2 w-52 overflow-hidden py-1"
                >
                  <p className="truncate border-b border-border px-3.5 py-2.5 text-xs text-muted">{address}</p>
                  <button
                    onClick={() => {
                      disconnectWallet();
                      toast.success("Wallet disconnected");
                    }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-foreground hover:bg-background"
                  >
                    <LogOut size={15} className="text-muted" />
                    disconnect
                  </button>
                </motion.div>
              )}
            </div>
          ) : (
            <Button onClick={handleConnect} disabled={connecting} size="sm">
              <Wallet size={14} />
              {connecting ? "connecting…" : "$ connect"}
            </Button>
          )}
          <Link
            href="/invoices"
            className="border border-accent bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-85"
          >
            open app
          </Link>
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center text-foreground md:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-border px-4 py-4 md:hidden"
        >
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="px-3.5 py-2 text-sm text-muted hover:text-foreground">
                {link.label}
              </Link>
            ))}
            <Link href="/invoices" className="px-3.5 py-2 text-sm text-muted hover:text-foreground">
              open app
            </Link>
            <div className="my-2 h-px bg-border" />
            {address ? (
              <>
                <p className="truncate px-3.5 py-1 text-xs text-muted">{address}</p>
                <button onClick={disconnectWallet} className="flex items-center gap-2.5 px-3.5 py-2 text-left text-sm text-foreground">
                  <LogOut size={15} className="text-muted" />
                  disconnect
                </button>
              </>
            ) : (
              <Button onClick={handleConnect} disabled={connecting} className="mt-1">
                <Wallet size={14} />
                {connecting ? "connecting…" : "$ connect"}
              </Button>
            )}
          </nav>
        </motion.div>
      )}
    </header>
  );
}
