import { tasks } from "@trigger.dev/sdk";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  getAccessibleProjectById,
  getCurrentIdentity,
} from "@/lib/project-access";
import { specTriggerRequestSchema } from "@/lib/spec-generation-schema";
import type { generateSpecTask } from "@/trigger/generate-spec";

export async function POST(request: NextRequest) {
  const identity = await getCurrentIdentity({ loadProfile: false });

  if (!identity.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = specTriggerRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { roomId, chatHistory, nodes, edges } = parsed.data;

  const project = await getAccessibleProjectById(roomId, identity);
  if (!project) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const handle = await tasks.trigger<typeof generateSpecTask>("generate-spec", {
    projectId: project.id,
    roomId,
    chatHistory,
    nodes,
    edges,
  });

  await prisma.taskRun.create({
    data: {
      runId: handle.id,
      projectId: project.id,
      userId: identity.userId,
    },
  });

  return Response.json({ runId: handle.id });
}
