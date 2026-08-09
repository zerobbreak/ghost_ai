import { tasks } from "@trigger.dev/sdk";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentIdentity, hasProjectAccess } from "@/lib/project-access";
import type { designAgentTask } from "@/trigger/design-agent";

interface DesignRequestBody {
  prompt?: unknown;
  roomId?: unknown;
  projectId?: unknown;
}

export async function POST(request: NextRequest) {
  const identity = await getCurrentIdentity({ loadProfile: false });

  if (!identity.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: DesignRequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { prompt, roomId, projectId } = body;

  if (typeof prompt !== "string" || !prompt.trim()) {
    return Response.json({ error: "Missing or invalid prompt" }, { status: 400 });
  }

  if (typeof roomId !== "string" || !roomId.trim()) {
    return Response.json({ error: "Missing or invalid roomId" }, { status: 400 });
  }

  if (typeof projectId !== "string" || !projectId.trim()) {
    return Response.json({ error: "Missing or invalid projectId" }, { status: 400 });
  }

  if (roomId !== projectId) {
    return Response.json({ error: "roomId and projectId must match" }, { status: 400 });
  }

  const canAccess = await hasProjectAccess(projectId, identity);
  if (!canAccess) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const handle = await tasks.trigger<typeof designAgentTask>("design-agent", {
    prompt: prompt.trim(),
    roomId,
  });

  await prisma.taskRun.create({
    data: {
      runId: handle.id,
      projectId,
      userId: identity.userId,
    },
  });

  return Response.json({ runId: handle.id });
}
