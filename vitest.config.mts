import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": src,
      "server-only": `${src}/test/empty-module.ts`,
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Integration tests need a database: run them with `npm run test:integration`.
    exclude: ["src/**/*.int.test.ts", "node_modules/**"],
  },
});
