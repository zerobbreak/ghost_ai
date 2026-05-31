import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local so the Prisma CLI picks up the same variables Next.js uses.
// DIRECT_URL (session-mode pooler, port 5432) is used for migrations because
// the transaction-mode pooler (DATABASE_URL, port 6543) does not support DDL.
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"]!,
  },
});
