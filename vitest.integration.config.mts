import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src", import.meta.url));

// Integration tests talk to the database in DATABASE_URL (loaded from .env).
// Point it at a disposable development database, never production.
export default defineConfig({
  resolve: {
    alias: {
      "@": src,
      "server-only": `${src}/test/empty-module.ts`,
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.int.test.ts"],
    setupFiles: ["dotenv/config"],
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
