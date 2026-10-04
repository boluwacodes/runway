import { describe, expect, it, vi } from "vitest";
import { createSyncGuard } from "./sync-guard";

function mockReqRes(headers: Record<string, string> = {}, ip = "1.2.3.4") {
  const req = {
    ip,
    header: (name: string) => headers[name.toLowerCase()],
  } as any;
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  } as any;
  const next = vi.fn();
  return { req, res, next };
}

describe("sync-guard (#1)", () => {
  it("allows requests through when no api key is configured (local dev)", () => {
    const guard = createSyncGuard({});
    const { req, res, next } = mockReqRes();
    guard(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
  });

  it("rejects a request missing the api key when one is configured", () => {
    const guard = createSyncGuard({ apiKey: "secret" });
    const { req, res, next } = mockReqRes();
    guard(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it("rejects a request with the wrong api key", () => {
    const guard = createSyncGuard({ apiKey: "secret" });
    const { req, res, next } = mockReqRes({ "x-api-key": "wrong" });
    guard(req, res, next);
    expect(res.statusCode).toBe(401);
  });

  it("allows a request with the correct api key", () => {
    const guard = createSyncGuard({ apiKey: "secret" });
    const { req, res, next } = mockReqRes({ "x-api-key": "secret" });
    guard(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("rate-limits a single IP after the configured burst", () => {
    let now = 0;
    const guard = createSyncGuard({ max: 3, windowMs: 60_000, now: () => now });

    for (let i = 0; i < 3; i++) {
      const { req, res, next } = mockReqRes();
      guard(req, res, next);
      expect(next).toHaveBeenCalledOnce();
    }

    const { req, res, next } = mockReqRes();
    guard(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(429);
  });

  it("does not rate-limit different IPs against each other", () => {
    let now = 0;
    const guard = createSyncGuard({ max: 1, windowMs: 60_000, now: () => now });

    const first = mockReqRes({}, "1.1.1.1");
    guard(first.req, first.res, first.next);
    expect(first.next).toHaveBeenCalledOnce();

    const second = mockReqRes({}, "2.2.2.2");
    guard(second.req, second.res, second.next);
    expect(second.next).toHaveBeenCalledOnce();
  });

  it("allows requests again once the rate-limit window has passed", () => {
    let now = 0;
    const guard = createSyncGuard({ max: 1, windowMs: 60_000, now: () => now });

    const first = mockReqRes();
    guard(first.req, first.res, first.next);
    expect(first.next).toHaveBeenCalledOnce();

    const blocked = mockReqRes();
    guard(blocked.req, blocked.res, blocked.next);
    expect(blocked.res.statusCode).toBe(429);

    now += 60_001;
    const afterWindow = mockReqRes();
    guard(afterWindow.req, afterWindow.res, afterWindow.next);
    expect(afterWindow.next).toHaveBeenCalledOnce();
  });
});
