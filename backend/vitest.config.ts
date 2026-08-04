import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      // In-memory for tests — isolated per test run, no file cleanup needed.
      DB_PATH: ":memory:",
    },
  },
});
