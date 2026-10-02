import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// One client per server process (and per dev hot-reload). Created lazily so
// that importing this module never requires DATABASE_URL (e.g. during build).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function client(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Missing environment variable DATABASE_URL (see .env.example)");
  // DATABASE_POOL_MAX caps the connection pool. Leave it unset in production; set
  // it to 1 for the local `prisma dev` database, which drops concurrent connections.
  const max = Number(process.env.DATABASE_POOL_MAX) || undefined;
  const created = new PrismaClient({ adapter: new PrismaPg({ connectionString, max }) });
  globalForPrisma.prisma = created;
  return created;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const c = client();
    const value = Reflect.get(c, prop);
    return typeof value === "function" ? value.bind(c) : value;
  },
});
