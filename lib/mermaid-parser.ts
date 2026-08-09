import type { NodeShape } from "@/types/canvas";
import { getShapeDefaults } from "@/lib/shape-defaults";
import type { LayoutDirection } from "@/lib/auto-layout";
import type { CanvasEdgeInput, CanvasNodeInput } from "@/lib/design-agent-schema";

export interface MermaidParseResult {
  nodes: CanvasNodeInput[];
  edges: CanvasEdgeInput[];
  direction: LayoutDirection;
  warnings: string[];
}

const SKIP_KEYWORDS = new Set([
  "subgraph",
  "end",
  "classdef",
  "style",
  "click",
  "linkstyle",
]);

const NODE_ID = "[A-Za-z0-9_-]+";
const NODE_TOKEN_RE = new RegExp(
  `^(${NODE_ID})(\\[\\(.*?\\)\\]|\\(\\(.*?\\)\\)|\\{\\{.*?\\}\\}|\\[.*?\\]|\\(.*?\\)|\\{.*?\\})?$`,
);

interface ParsedNodeToken {
  id: string;
  shape?: NodeShape;
  label?: string;
}

function parseDirection(line: string): LayoutDirection | null {
  const match = /^(flowchart|graph)\s+(TB|TD|BT|RL|LR)\b/i.exec(line);
  if (!match) return null;
  const raw = match[2].toUpperCase();
  return raw === "LR" || raw === "RL" ? "LR" : "TB";
}

function parseNodeToken(token: string): ParsedNodeToken | null {
  const trimmed = token.trim();
  const match = NODE_TOKEN_RE.exec(trimmed);
  if (!match) return null;

  const id = match[1];
  const delimited = match[2];
  if (!delimited) return { id };

  // Order matters: check the most specific (double) delimiters before the
  // single-character ones they'd otherwise also match (e.g. "[(x)]" vs "[x]").
  if (delimited.startsWith("[(") && delimited.endsWith(")]")) {
    return { id, shape: "cylinder", label: delimited.slice(2, -2).trim() };
  }
  if (delimited.startsWith("((") && delimited.endsWith("))")) {
    return { id, shape: "circle", label: delimited.slice(2, -2).trim() };
  }
  if (delimited.startsWith("{{") && delimited.endsWith("}}")) {
    return { id, shape: "hexagon", label: delimited.slice(2, -2).trim() };
  }
  if (delimited.startsWith("[") && delimited.endsWith("]")) {
    return { id, shape: "rectangle", label: delimited.slice(1, -1).trim() };
  }
  if (delimited.startsWith("(") && delimited.endsWith(")")) {
    return { id, shape: "pill", label: delimited.slice(1, -1).trim() };
  }
  if (delimited.startsWith("{") && delimited.endsWith("}")) {
    return { id, shape: "diamond", label: delimited.slice(1, -1).trim() };
  }

  return { id };
}

interface ParsedEdgeLine {
  nodes: ParsedNodeToken[];
  labels: (string | undefined)[];
}

/** Splits "A -->|label| B --> C" into node tokens and the label following each arrow. */
function parseEdgeLine(line: string): ParsedEdgeLine | null {
  const parts = line.split("-->");
  if (parts.length < 2) return null;

  const nodes: ParsedNodeToken[] = [];
  const labels: (string | undefined)[] = [];

  for (let i = 0; i < parts.length; i++) {
    let part = parts[i].trim();

    if (i > 0) {
      const labelMatch = /^\|([^|]*)\|\s*/.exec(part);
      if (labelMatch) {
        labels.push(labelMatch[1].trim());
        part = part.slice(labelMatch[0].length).trim();
      } else {
        labels.push(undefined);
      }
    }

    const token = parseNodeToken(part);
    if (!token) return null;
    nodes.push(token);
  }

  return { nodes, labels };
}

/**
 * Parses a practical subset of Mermaid flowchart syntax into canvas nodes and
 * edges. Only flowcharts are supported (this app's canvas is a directed
 * node graph, unlike Mermaid's sequence/class/ER/gantt diagram types).
 * Unsupported lines (subgraphs, classDef, style, click bindings, …) are
 * skipped with a warning rather than failing the whole parse.
 */
export function parseMermaidFlowchart(source: string): MermaidParseResult {
  const lines = source.split(/\r?\n/);
  const warnings: string[] = [];
  const nodeMap = new Map<string, CanvasNodeInput>();
  const edges: CanvasEdgeInput[] = [];
  let direction: LayoutDirection = "TB";
  let edgeCounter = 0;

  function registerNode(token: ParsedNodeToken): void {
    const existing = nodeMap.get(token.id);
    if (existing) {
      if (token.shape && existing.data.shape === "rectangle" && !token.label) {
        existing.data.shape = token.shape;
      }
      if (token.label) {
        existing.data.label = token.label;
        if (token.shape) existing.data.shape = token.shape;
      }
      return;
    }

    const shape = token.shape ?? "rectangle";
    nodeMap.set(token.id, {
      id: token.id,
      type: "canvasNode",
      position: { x: 0, y: 0 },
      data: { label: token.label ?? token.id, shape },
      style: { ...getShapeDefaults(shape) },
    });
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.split("%%")[0].trim();
    if (!line) continue;

    const parsedDirection = parseDirection(line);
    if (parsedDirection) {
      direction = parsedDirection;
      continue;
    }
    if (/^(flowchart|graph)\s*$/i.test(line)) continue;

    const firstWord = line.split(/\s+/)[0]?.toLowerCase().replace(/:$/, "");
    if (firstWord && SKIP_KEYWORDS.has(firstWord)) {
      warnings.push(`Line ${i + 1}: unsupported syntax "${firstWord}" was skipped.`);
      continue;
    }

    const parsedEdge = parseEdgeLine(line);
    if (parsedEdge) {
      for (const token of parsedEdge.nodes) registerNode(token);

      for (let k = 0; k < parsedEdge.nodes.length - 1; k++) {
        const source = parsedEdge.nodes[k].id;
        const target = parsedEdge.nodes[k + 1].id;
        const label = parsedEdge.labels[k];
        edgeCounter += 1;
        edges.push({
          id: `edge-${source}-${target}-${edgeCounter}`,
          type: "canvasEdge",
          source,
          target,
          data: label ? { label } : {},
        });
      }
      continue;
    }

    const singleNode = parseNodeToken(line);
    if (singleNode) {
      registerNode(singleNode);
      continue;
    }

    warnings.push(`Line ${i + 1}: could not parse "${rawLine.trim()}" — skipped.`);
  }

  if (nodeMap.size === 0) {
    throw new Error("No valid nodes found in the Mermaid flowchart.");
  }

  return { nodes: Array.from(nodeMap.values()), edges, direction, warnings };
}
