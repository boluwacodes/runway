"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { connectWallet as connect, signWithWallet, WalletError } from "@/lib/wallet";

const STORAGE_KEY = "runway_wallet_address";

interface WalletContextValue {
  address: string | null;
  connecting: boolean;
  connectWallet: () => Promise<string>;
  disconnectWallet: () => void;
  signTransaction: (unsignedXdr: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    connect()
      .then((confirmed) => setAddress(confirmed))
      .catch(() => window.localStorage.removeItem(STORAGE_KEY));
  }, []);

  const connectWallet = useCallback(async () => {
    setConnecting(true);
    try {
      const confirmed = await connect();
      setAddress(confirmed);
      window.localStorage.setItem(STORAGE_KEY, confirmed);
      return confirmed;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAddress(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const signTransactionFn = useCallback(
    async (unsignedXdr: string) => {
      if (!address) throw new WalletError("Connect a wallet first.");
      return signWithWallet(unsignedXdr, address);
    },
    [address],
  );

  return (
    <WalletContext.Provider
      value={{ address, connecting, connectWallet, disconnectWallet, signTransaction: signTransactionFn }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider");
  return ctx;
}
