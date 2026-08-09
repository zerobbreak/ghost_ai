import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentIdentity, hasProjectAccess } from "@/lib/project-access";
import { toProjectSpecSummary } from "@/lib/project-specs";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const identity = await getCurrentIdentity({ loadProfile: false });
  const canAccess = await hasProjectAccess(projectId, identity);
  if (!canAccess) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const specs = await prisma.projectSpec.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
    },
  });

  return Response.json({
    specs: specs.map(toProjectSpecSummary),
  });
}
