import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      // In-memory for tests — isolated per test run, no file cleanup needed.
      DB_PATH: ":memory:",
      // indexer.ts throws at import time without this; tests never hit the
      // network (syncOnce takes injectable fetchers), so any well-formed
      // contract id unblocks the import.
      RUNWAY_CONTRACT_ID: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
    },
  },
});
