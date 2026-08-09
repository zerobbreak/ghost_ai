import { auth } from "@clerk/nextjs/server";
import { get } from "@vercel/blob";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentIdentity, hasProjectAccess } from "@/lib/project-access";
import { specDownloadFilename } from "@/lib/project-specs";

interface RouteContext {
  params: Promise<{ projectId: string; specId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, specId } = await params;

  const identity = await getCurrentIdentity({ loadProfile: false });
  const canAccess = await hasProjectAccess(projectId, identity);
  if (!canAccess) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const spec = await prisma.projectSpec.findFirst({
    where: {
      id: specId,
      projectId,
    },
    select: {
      filePath: true,
      createdAt: true,
    },
  });

  if (!spec) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const blob = await get(spec.filePath, {
      access: "private",
      useCache: false,
    });

    if (!blob?.stream) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const content = await new Response(blob.stream).text();
    const filename = specDownloadFilename(specId, spec.createdAt);

    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
}
