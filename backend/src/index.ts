import express from "express";
import cors from "cors";
import { getInvoiceRow, listInvoices, stats } from "./db";
import { syncOnce } from "./indexer";
import { createSyncGuard } from "./sync-guard";

export const app = express();
app.use(cors());

const syncAuthAndRateLimit = createSyncGuard({ apiKey: process.env.SYNC_API_KEY });

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

/** Parses an optional query param that must be a plain non-negative integer ("12", not "1.5", "-3" or "1e2"). */
function parseNonNegativeInt(value: unknown): number | undefined | null {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  return Number(value);
}

app.get("/invoices", (req, res) => {
  const limit = parseNonNegativeInt(req.query.limit);
  const offset = parseNonNegativeInt(req.query.offset);

  if (limit === null || offset === null) {
    res.status(400).json({ error: "limit and offset must be non-negative integers" });
    return;
  }

  res.json(listInvoices({ limit, offset }));
});

app.get("/invoices/:id", (req, res) => {
  if (!/^\d+$/.test(req.params.id)) {
    res.status(400).json({ error: "id must be a non-negative integer" });
    return;
  }
  const row = getInvoiceRow(req.params.id);
  if (!row) {
    res.status(404).json({ error: "not indexed yet — it may be brand new, try /sync" });
    return;
  }
  res.json(row);
});

app.get("/stats", (_req, res) => {
  res.json(stats());
});

// Manual trigger, mostly for local dev — the background loop already
// covers normal operation on its own interval.
app.post("/sync", syncAuthAndRateLimit, (_req, res) => {
  syncOnce()
    .then((result) => res.json(result))
    .catch((err) =>
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) }),
    );
});
