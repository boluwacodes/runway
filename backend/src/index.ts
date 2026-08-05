import express from "express";
import cors from "cors";
import { getInvoiceRow, listInvoices, stats } from "./db";
import { startIndexer, syncOnce } from "./indexer";

const PORT = Number(process.env.PORT ?? 3030);

const app = express();
app.use(cors());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/invoices", (_req, res) => {
  res.json(listInvoices());
});

app.get("/invoices/:id", (req, res) => {
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
app.post("/sync", (_req, res) => {
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
