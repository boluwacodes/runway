import { describe, expect, it } from "vitest";
import { DEFAULT_INDEXER_INTERVAL_MS, indexerIntervalMs } from "./config";

describe("indexerIntervalMs (#67)", () => {
  it("defaults to 8s when unset or blank", () => {
    expect(indexerIntervalMs({})).toBe(DEFAULT_INDEXER_INTERVAL_MS);
    expect(indexerIntervalMs({ INDEXER_INTERVAL_MS: "" })).toBe(DEFAULT_INDEXER_INTERVAL_MS);
  });

  it("reads a valid interval", () => {
    expect(indexerIntervalMs({ INDEXER_INTERVAL_MS: "30000" })).toBe(30_000);
  });

  it.each(["abc", "1.5", "-100", "500", "1e4"])("rejects %s", (value) => {
    expect(() => indexerIntervalMs({ INDEXER_INTERVAL_MS: value })).toThrow(/INDEXER_INTERVAL_MS/);
  });
});
