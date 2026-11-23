import { drizzle } from "drizzle-orm/postgres-js";

const connectionString = process.env.DATABASE_URL!;

const createDrizzleClient = () => drizzle(connectionString);

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof createDrizzleClient> | undefined;
};

export const db = globalForDb.db ?? createDrizzleClient();

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
