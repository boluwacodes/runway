/**
 * Awaits a secondary, nice-to-have read and returns null if it fails, so a
 * supplementary lookup (e.g. a debtor's late-payment count) can never take
 * down a page whose primary data already loaded.
 */
export async function optional<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch (err) {
    console.warn("optional read failed:", err);
    return null;
  }
}
