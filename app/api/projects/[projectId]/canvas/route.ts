import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { put, get } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { getCurrentIdentity, hasProjectAccess } from "@/lib/project-access";
import {
  isSavedCanvas,
  parseSavedCanvasText,
  type CanvasParseResult,
  type SavedCanvas,
} from "@/lib/canvas-snapshot";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

function isSavedCanvasPayload(value: unknown): value is SavedCanvas {
  return isSavedCanvas(value);
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
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

  let body: unknown;
  try {
    const text = await request.text();
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!isSavedCanvasPayload(body)) {
    return Response.json({ error: "Invalid canvas payload" }, { status: 400 });
  }

  const json = JSON.stringify(body);
  const blob = await put(`canvas/${projectId}.json`, json, {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true,
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { canvasJsonPath: blob.url },
  });

  return Response.json({ url: blob.url });
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

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { canvasJsonPath: true },
  });

  if (!project?.canvasJsonPath) {
    return Response.json({ canvas: null });
  }

  let parsed: CanvasParseResult = { ok: false, reason: "empty" };
  try {
    const blob = await get(project.canvasJsonPath, {
      access: "private",
      useCache: false,
    });
    if (!blob?.stream) return Response.json({ canvas: null });

    const text = await new Response(blob.stream).text();
    parsed = parseSavedCanvasText(text);
  } catch {
    return Response.json({ canvas: null, status: "error" });
  }

  if (!parsed.ok) {
    return Response.json({ canvas: null, status: parsed.reason });
  }

  return Response.json({ canvas: parsed.canvas, status: "ok" });
}
