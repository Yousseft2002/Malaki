import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // process.env rather than env(): `prisma generate` (run by npm install and the
  // build) must work without a database, e.g. on Vercel before DATABASE_URL is
  // set. Migrate/seed commands still need it and fail with a clear message.
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
