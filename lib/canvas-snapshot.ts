import type { CanvasEdge, CanvasNode } from "@/types/canvas";

export interface SavedCanvas {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export type CanvasParseResult =
  | { ok: true; canvas: SavedCanvas }
  | { ok: false; reason: "empty" | "invalid" };

export function isSavedCanvas(value: unknown): value is SavedCanvas {
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

export function parseSavedCanvasText(text: string): CanvasParseResult {
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

export function safeParseJson(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    const chunks = extractJsonObjects(text.trim());
    for (let i = chunks.length - 1; i >= 0; i -= 1) {
      try {
        return JSON.parse(chunks[i]);
      } catch {
        // keep trying older chunks
      }
    }
    return null;
  }
}
