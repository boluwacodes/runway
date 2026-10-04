export const DEFAULT_INDEXER_INTERVAL_MS = 8_000;
const MIN_INDEXER_INTERVAL_MS = 1_000;

/**
 * Reads INDEXER_INTERVAL_MS (how often the background indexer polls the
 * contract). Unset falls back to the default; anything that isn't a whole
 * number of at least 1000 ms fails fast at startup rather than silently
 * hammering the RPC node or never syncing.
 */
export function indexerIntervalMs(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.INDEXER_INTERVAL_MS;
  if (raw === undefined || raw.trim() === "") return DEFAULT_INDEXER_INTERVAL_MS;
  if (!/^\d+$/.test(raw.trim()) || Number(raw) < MIN_INDEXER_INTERVAL_MS) {
    throw new Error(
      `INDEXER_INTERVAL_MS must be a whole number of milliseconds >= ${MIN_INDEXER_INTERVAL_MS} (got "${raw}")`,
    );
  }
  return Number(raw);
}
