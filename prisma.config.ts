import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load .env.local so the Prisma CLI picks up the same variables Next.js uses.
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
