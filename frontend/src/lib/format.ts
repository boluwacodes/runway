const STROOPS_PER_XLM = 10_000_000n;

export function formatXlm(stroops: bigint): string {
  const whole = stroops / STROOPS_PER_XLM;
  const frac = stroops % STROOPS_PER_XLM;
  if (frac === 0n) return whole.toString();
  const fracStr = frac.toString().padStart(7, "0").replace(/0+$/, "");
  return `${whole}.${fracStr}`;
}

export function xlmToStroops(xlm: string): bigint {
  const [whole, frac = ""] = xlm.trim().split(".");
  const paddedFrac = (frac + "0000000").slice(0, 7);
  return BigInt(whole || "0") * STROOPS_PER_XLM + BigInt(paddedFrac || "0");
}

export function shortenAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

/** "XLM" for the native asset, otherwise a shortened contract address — invoices aren't native-only. */
export function assetLabel(token: string, nativeTokenId: string): string {
  return token === nativeTokenId ? "XLM" : shortenAddress(token, 5);
}

export function formatDueDate(dueDateSecs: bigint): string {
  return new Date(Number(dueDateSecs) * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDaysUntilDue(dueDateSecs: bigint): string {
  const now = Date.now() / 1000;
  const diffDays = Math.ceil((Number(dueDateSecs) - now) / 86_400);
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "due today";
  return `due in ${diffDays}d`;
}

export function bpsToPercent(bps: number): string {
  return (bps / 100).toFixed(bps % 100 === 0 ? 0 : 2);
}
