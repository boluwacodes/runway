import type { NextFunction, Request, Response } from "express";

// #1: POST /sync triggers a full contract resync (one RPC read per invoice)
// and was unauthenticated and unlimited — an easy way to hammer the Soroban
// RPC node or pile up overlapping syncs. Requires a shared-secret header and
// caps calls per source IP to a small burst per minute.
export const SYNC_RATE_LIMIT_WINDOW_MS = 60_000;
export const SYNC_RATE_LIMIT_MAX = 5;

export interface SyncGuardOptions {
  apiKey?: string;
  windowMs?: number;
  max?: number;
  now?: () => number;
}

/**
 * Builds the auth + rate-limit middleware for POST /sync. A factory (rather
 * than a module-level singleton) so tests can use their own clock and a
 * fresh hit-counter per test instead of sharing state across the whole file.
 *
 * Auth is skipped entirely when `apiKey` is unset, matching local dev (see
 * .env.example) — always set SYNC_API_KEY in any deployed environment.
 */
export function createSyncGuard({
  apiKey,
  windowMs = SYNC_RATE_LIMIT_WINDOW_MS,
  max = SYNC_RATE_LIMIT_MAX,
  now = Date.now,
}: SyncGuardOptions = {}) {
  const hitsByIp = new Map<string, number[]>();

  return function syncAuthAndRateLimit(req: Request, res: Response, next: NextFunction): void {
    if (apiKey && req.header("x-api-key") !== apiKey) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    const ip = req.ip ?? "unknown";
    const t = now();
    const hits = (hitsByIp.get(ip) ?? []).filter((ts) => t - ts < windowMs);
    if (hits.length >= max) {
      res.status(429).json({ error: "too many sync requests, try again shortly" });
      return;
    }
    hits.push(t);
    hitsByIp.set(ip, hits);
    next();
  };
}
