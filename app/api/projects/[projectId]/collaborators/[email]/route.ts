import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ projectId: string; email: string }>;
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, email: rawEmail } = await params;

  const email = decodeURIComponent(rawEmail).trim().toLowerCase();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (project.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.projectCollaborator.deleteMany({
    where: { projectId, email },
  });

  return new Response(null, { status: 204 });
}
