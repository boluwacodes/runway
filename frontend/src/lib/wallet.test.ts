import { afterEach, describe, expect, it, vi } from "vitest";
import * as freighter from "@stellar/freighter-api";
import { connectWallet, signWithWallet, WalletError } from "./wallet";

vi.mock("@stellar/freighter-api", () => ({
  isConnected: vi.fn(),
  getAddress: vi.fn(),
  signTransaction: vi.fn(),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("connectWallet", () => {
  it("throws WalletError when no wallet extension is installed", async () => {
    vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: false });

    await expect(connectWallet()).rejects.toThrow(WalletError);
  });

  it("throws WalletError when isConnected reports an error", async () => {
    vi.mocked(freighter.isConnected).mockResolvedValue({
      isConnected: false,
      error: { message: "blocked" },
    });

    await expect(connectWallet()).rejects.toThrow(WalletError);
  });

  it("throws WalletError when the wallet has no address to give", async () => {
    vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: true });
    vi.mocked(freighter.getAddress).mockResolvedValue({ address: "" });

    await expect(connectWallet()).rejects.toThrow(WalletError);
  });

  it("surfaces the wallet's own error message when address lookup fails", async () => {
    vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: true });
    vi.mocked(freighter.getAddress).mockResolvedValue({
      address: "",
      error: { message: "user rejected" },
    });

    await expect(connectWallet()).rejects.toThrow("user rejected");
  });

  it("returns the address on success", async () => {
    vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: true });
    vi.mocked(freighter.getAddress).mockResolvedValue({ address: "GADDRESS" });

    await expect(connectWallet()).resolves.toBe("GADDRESS");
  });
});

describe("signWithWallet", () => {
  it("throws WalletError when signing is cancelled or fails with no message", async () => {
    vi.mocked(freighter.signTransaction).mockResolvedValue({
      signedTxXdr: "",
      signerAddress: "GADDRESS",
    });

    await expect(signWithWallet("unsigned-xdr", "GADDRESS")).rejects.toThrow(WalletError);
  });

  it("surfaces the wallet's own error message when signing fails", async () => {
    vi.mocked(freighter.signTransaction).mockResolvedValue({
      signedTxXdr: "",
      signerAddress: "GADDRESS",
      error: { message: "declined in wallet" },
    });

    await expect(signWithWallet("unsigned-xdr", "GADDRESS")).rejects.toThrow("declined in wallet");
  });

  it("returns the signed xdr on success", async () => {
    vi.mocked(freighter.signTransaction).mockResolvedValue({
      signedTxXdr: "signed-xdr",
      signerAddress: "GADDRESS",
    });

    await expect(signWithWallet("unsigned-xdr", "GADDRESS")).resolves.toBe("signed-xdr");
  });
});
