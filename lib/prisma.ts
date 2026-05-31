import { PrismaClient } from "../app/generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "";

  if (url.startsWith("prisma+postgres://") || url.startsWith("prisma://")) {
    // Accelerate path: pass the URL via accelerateUrl (Prisma 7 API).
    // Do NOT use a driver adapter here — PrismaPg expects a direct TCP URL
    // and will fail if given a prisma:// or prisma+postgres:// string.
    return new PrismaClient({ accelerateUrl: url }).$extends(
      withAccelerate()
    ) as unknown as PrismaClient;
  }

  // Direct connection path (local dev without Accelerate).
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma: PrismaClient = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;
