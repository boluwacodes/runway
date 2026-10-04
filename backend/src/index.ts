import express from "express";
import cors from "cors";
import { getInvoiceRow, listInvoices, stats } from "./db";
import { startIndexer, syncOnce } from "./indexer";
import { createSyncGuard } from "./sync-guard";

const PORT = Number(process.env.PORT ?? 3030);

const app = express();
app.use(cors());

const syncAuthAndRateLimit = createSyncGuard({ apiKey: process.env.SYNC_API_KEY });

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/invoices", (req, res) => {
  const limit = req.query.limit !== undefined ? Number(req.query.limit) : undefined;
  const offset = req.query.offset !== undefined ? Number(req.query.offset) : undefined;

  if (
    (limit !== undefined && !Number.isFinite(limit)) ||
    (offset !== undefined && !Number.isFinite(offset))
  ) {
    res.status(400).json({ error: "limit and offset must be numbers" });
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

app.listen(PORT, () => {
  console.log(`[runway-backend] listening on :${PORT}`);
  startIndexer();
});
