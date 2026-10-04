import { describe, expect, it, vi } from "vitest";
import {
  assetLabel,
  bpsToPercent,
  formatDaysUntilDue,
  formatDueDate,
  formatXlm,
  shortenAddress,
  xlmToStroops,
} from "./format";

// #2: this frontend had no test suite at all. These cover the pure
// formatting/parsing helpers most prone to a quiet off-by-one or
// rounding bug — exactly the kind of thing that's easy to get subtly
// wrong (and hard to notice in the UI) without a test pinning it down.

describe("formatXlm", () => {
  it("formats a whole-XLM stroops amount with no decimal point", () => {
    expect(formatXlm(10_000_000n)).toBe("1");
  });

  it("formats a fractional amount, trimming trailing zeros", () => {
    expect(formatXlm(10_500_000n)).toBe("1.05");
  });

  it("keeps full 7-decimal precision when needed", () => {
    expect(formatXlm(1n)).toBe("0.0000001");
  });

  it("formats zero as a bare 0", () => {
    expect(formatXlm(0n)).toBe("0");
  });
});

describe("xlmToStroops", () => {
  it("round-trips a whole number through formatXlm", () => {
    expect(xlmToStroops("1")).toBe(10_000_000n);
  });

  it("round-trips a fractional amount through formatXlm", () => {
    expect(xlmToStroops("1.05")).toBe(10_500_000n);
  });

  it("pads a short fractional part out to 7 decimals", () => {
    expect(xlmToStroops("0.1")).toBe(1_000_000n);
  });

  it("truncates (does not round) a fractional part longer than 7 decimals", () => {
    expect(xlmToStroops("1.00000009")).toBe(10_000_000n);
  });

  it("treats a bare decimal point as zero", () => {
    expect(xlmToStroops(".")).toBe(0n);
  });

  it("is the exact inverse of formatXlm for typical amounts", () => {
    for (const stroops of [0n, 1n, 10_000_000n, 95_000_0000n, 4_800_0000000n]) {
      expect(xlmToStroops(formatXlm(stroops))).toBe(stroops);
    }
  });
});

describe("shortenAddress", () => {
  it("leaves a short string unchanged", () => {
    expect(shortenAddress("GABCDEF", 4)).toBe("GABCDEF");
  });

  it("shortens a long address to start…end", () => {
    const address = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHOQ";
    expect(shortenAddress(address, 4)).toBe("GAAA…WHOQ");
  });

  it("respects a custom character count", () => {
    const address = "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4";
    expect(shortenAddress(address, 5)).toBe("CAAAA…ABSC4");
  });
});

describe("assetLabel", () => {
  const NATIVE = "CNATIVEXLMTOKENID";

  it("labels the native token as XLM", () => {
    expect(assetLabel(NATIVE, NATIVE)).toBe("XLM");
  });

  it("shortens any other asset's contract address (#3)", () => {
    const other = "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4";
    expect(assetLabel(other, NATIVE)).toBe(shortenAddress(other, 5));
    expect(assetLabel(other, NATIVE)).not.toBe("XLM");
  });
});

describe("bpsToPercent", () => {
  it("formats a round number of bps with no decimals", () => {
    expect(bpsToPercent(9_500)).toBe("95");
  });

  it("formats a non-round bps value with 2 decimals", () => {
    expect(bpsToPercent(9_550)).toBe("95.50");
  });

  it("formats 100% correctly", () => {
    expect(bpsToPercent(10_000)).toBe("100");
  });
});

describe("formatDaysUntilDue", () => {
  it("reports an overdue invoice as N days overdue", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-10T00:00:00Z"));
    const due = BigInt(Math.floor(new Date("2026-01-05T00:00:00Z").getTime() / 1000));
    expect(formatDaysUntilDue(due)).toBe("5d overdue");
    vi.useRealTimers();
  });

  it("reports an invoice due today distinctly from N days away", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-10T12:00:00Z"));
    // Due an hour ago: Math.ceil of a small negative is 0, not -1 — still
    // "today", not yesterday.
    const due = BigInt(Math.floor(new Date("2026-01-10T11:00:00Z").getTime() / 1000));
    expect(formatDaysUntilDue(due)).toBe("due today");
    vi.useRealTimers();
  });

  it("reports a future due date as due in N days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-10T00:00:00Z"));
    const due = BigInt(Math.floor(new Date("2026-01-20T00:00:00Z").getTime() / 1000));
    expect(formatDaysUntilDue(due)).toBe("due in 10d");
    vi.useRealTimers();
  });
});

describe("formatDueDate", () => {
  it("formats a unix-seconds due date as a human-readable date", () => {
    const due = BigInt(Math.floor(new Date("2026-03-15T00:00:00Z").getTime() / 1000));
    const formatted = formatDueDate(due);
    expect(formatted).toContain("2026");
    expect(formatted).toMatch(/Mar/);
  });
});
