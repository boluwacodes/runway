import { beforeEach, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import { app } from "./index";
import { db, upsertInvoice, type InvoiceRow } from "./db";

beforeEach(() => {
  db.exec("DELETE FROM invoices");
});

function makeRow(overrides: Partial<InvoiceRow> = {}): InvoiceRow {
  return {
    id: "1",
    payee: "GPAYEE",
    debtor: "GDEBTOR",
    funder: null,
    token: "CNATIVE",
    face_value: "10000000",
    advance_bps: 9_500,
    due_date: "1900000000",
    created_at: "1800000000",
    status: 0,
    synced_at: Date.now(),
    ...overrides,
  };
}

// Plain node:http against an ephemeral port — no supertest dependency
// needed for a handful of routes this simple.
async function withServer<T>(fn: (baseUrl: string) => Promise<T>): Promise<T> {
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
  }
}

describe("GET /health", () => {
  it("returns ok", async () => {
    await withServer(async (base) => {
      const res = await fetch(`${base}/health`);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
    });
  });
});

describe("GET /invoices", () => {
  it("returns the paginated envelope", async () => {
    upsertInvoice(makeRow({ id: "1" }));
    upsertInvoice(makeRow({ id: "2" }));

    await withServer(async (base) => {
      const res = await fetch(`${base}/invoices`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(2);
      expect(body.invoices).toHaveLength(2);
    });
  });

  it("rejects a non-numeric limit with 400", async () => {
    await withServer(async (base) => {
      const res = await fetch(`${base}/invoices?limit=abc`);
      expect(res.status).toBe(400);
    });
  });
});

describe("GET /invoices/:id", () => {
  it("returns 404 for an id that was never synced", async () => {
    await withServer(async (base) => {
      const res = await fetch(`${base}/invoices/999`);
      expect(res.status).toBe(404);
    });
  });

  it("returns the row for a synced id", async () => {
    upsertInvoice(makeRow({ id: "42" }));

    await withServer(async (base) => {
      const res = await fetch(`${base}/invoices/42`);
      expect(res.status).toBe(200);
      expect((await res.json()).id).toBe("42");
    });
  });
});

describe("GET /stats", () => {
  it("returns the stats shape", async () => {
    await withServer(async (base) => {
      const res = await fetch(`${base}/stats`);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        total_invoices: 0,
        total_financed: 0,
        financed_count: 0,
        open_for_funding: 0,
      });
    });
  });
});

describe("POST /sync", () => {
  it("rejects a missing api key with 401 when SYNC_API_KEY is configured", async () => {
    // createSyncGuard reads SYNC_API_KEY once, at index.ts's own import time —
    // set the env var and re-import a fresh module instance so this test
    // doesn't depend on import order relative to the other describe blocks
    // above (which share the top-level, key-less `app` import).
    const original = process.env.SYNC_API_KEY;
    process.env.SYNC_API_KEY = "test-key";
    try {
      const { app: guardedApp } = await import("./index?guarded=1");
      const server = guardedApp.listen(0);
      try {
        const { port } = server.address() as AddressInfo;
        const res = await fetch(`http://127.0.0.1:${port}/sync`, { method: "POST" });
        expect(res.status).toBe(401);
      } finally {
        server.close();
      }
    } finally {
      process.env.SYNC_API_KEY = original;
    }
  });
});
