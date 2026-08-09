import { auth } from "@trigger.dev/sdk";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentIdentity } from "@/lib/project-access";

interface TokenRequestBody {
  runId?: unknown;
}

export async function POST(request: NextRequest) {
  const identity = await getCurrentIdentity({ loadProfile: false });

  if (!identity.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: TokenRequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { runId } = body;

  if (typeof runId !== "string" || !runId.trim()) {
    return Response.json({ error: "Missing or invalid runId" }, { status: 400 });
  }

  const taskRun = await prisma.taskRun.findUnique({
    where: { runId: runId.trim() },
  });

  if (!taskRun || taskRun.userId !== identity.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = await auth.createPublicToken({
    scopes: {
      read: {
        runs: [taskRun.runId],
        tasks: ["generate-spec"],
      },
    },
    expirationTime: "1h",
  });

  return Response.json({ token });
}
