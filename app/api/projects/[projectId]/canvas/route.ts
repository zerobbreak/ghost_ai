import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { put, get } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { getCurrentIdentity, hasProjectAccess } from "@/lib/project-access";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

interface SavedCanvas {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

type CanvasParseResult =
  | { ok: true; canvas: SavedCanvas }
  | { ok: false; reason: "empty" | "invalid" };

function isSavedCanvas(value: unknown): value is SavedCanvas {
  if (typeof value !== "object" || value === null) return false;

  const canvas = value as Partial<SavedCanvas>;
  return Array.isArray(canvas.nodes) && Array.isArray(canvas.edges);
}

function extractJsonObjects(text: string): string[] {
  const chunks: string[] = [];
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{" || char === "[") {
      if (depth === 0) start = i;
      depth += 1;
      continue;
    }

    if ((char === "}" || char === "]") && depth > 0) {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        chunks.push(text.slice(start, i + 1));
        start = -1;
      }
    }
  }

  return chunks;
}

function parseSavedCanvasText(text: string): CanvasParseResult {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, reason: "empty" };

  const chunks = extractJsonObjects(trimmed);
  for (let i = chunks.length - 1; i >= 0; i -= 1) {
    try {
      const parsed: unknown = JSON.parse(chunks[i]);
      if (isSavedCanvas(parsed)) {
        return { ok: true, canvas: parsed };
      }
    } catch {
      // Try the next complete JSON object if the saved blob was corrupted.
    }
  }

  return { ok: false, reason: "invalid" };
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

  if (!isSavedCanvas(body)) {
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
