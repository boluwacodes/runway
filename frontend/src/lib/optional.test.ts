import { describe, expect, it, vi } from "vitest";
import { optional } from "./optional";

describe("optional (#78)", () => {
  it("returns the value when the read succeeds", async () => {
    expect(await optional(async () => 3)).toBe(3);
  });

  it("returns null instead of throwing when the read fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await optional(async () => Promise.reject(new Error("rpc hiccup")))).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it("preserves a legitimate zero", async () => {
    expect(await optional(async () => 0)).toBe(0);
  });
});
