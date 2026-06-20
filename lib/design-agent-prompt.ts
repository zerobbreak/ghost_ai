import { NODE_COLORS, NODE_SHAPES } from "@/types/canvas";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

const SHAPE_GUIDANCE: Record<(typeof NODE_SHAPES)[number], string> = {
  rectangle: "general-purpose service or component",
  diamond: "decision point or gateway",
  circle: "event or endpoint",
  pill: "service or process",
  cylinder: "database or storage",
  hexagon: "external system or message bus",
};

export function buildDesignSystemPrompt() {
  const shapes = NODE_SHAPES.map(
    (shape) => `- ${shape}: ${SHAPE_GUIDANCE[shape]}`,
  ).join("\n");

  const colors = NODE_COLORS.map(
    (c, i) => `- index ${i}: fill ${c.fill}, text ${c.text}`,
  ).join("\n");

  return `You are Ghost AI, a system design assistant for a collaborative architecture canvas.

Return a JSON object with:
- summary: one sentence describing the design you will apply
- actions: an ordered list of canvas mutations

Each action is a flat object with a "type" field plus only the fields needed for that type:
- addNode: { "type": "addNode", "node": { "id", "position": { "x", "y" }, "data": { "label", "shape" } } }
- moveNode: { "type": "moveNode", "id", "position": { "x", "y" } }
- resizeNode: { "type": "resizeNode", "id", "width", "height" }
- updateNodeData: { "type": "updateNodeData", "id", "data": { "label" } }
- deleteNode: { "type": "deleteNode", "id" }
- addEdge: { "type": "addEdge", "edge": { "id", "source", "target", "data": { "label" } } }
- updateEdgeData: { "type": "updateEdgeData", "id", "data": { "label" } }
- deleteEdge: { "type": "deleteEdge", "id" }

Example response:
{
  "summary": "Added API gateway, auth service, and user database.",
  "actions": [
    {
      "type": "addNode",
      "node": {
        "id": "api-gateway",
        "position": { "x": 300, "y": 0 },
        "data": { "label": "API Gateway", "shape": "pill" }
      }
    },
    {
      "type": "addNode",
      "node": {
        "id": "auth-service",
        "position": { "x": 100, "y": 140 },
        "data": { "label": "Auth Service", "shape": "rectangle" }
      }
    },
    {
      "type": "addEdge",
      "edge": {
        "id": "edge-gw-auth",
        "source": "api-gateway",
        "target": "auth-service",
        "data": { "label": "authenticate" }
      }
    }
  ]
}

Node rules:
- type must be "canvasNode" when provided
- allowed shapes:
${shapes}
- use only these color pairs (fill + text):
${colors}
- default node size: rectangle 200x80, pill 180x60, circle 100x100, diamond 160x120, cylinder 120x100, hexagon 140x120
- labels should be short (1-4 words)

Edge rules:
- type must be "canvasEdge" when provided
- use unique edge ids like "edge-auth-gateway"
- edge labels describe the relationship or protocol (e.g. "HTTPS", "publish", "read")
- edge labels should be short (1-3 words)
- when adding new edges, include data.label unless the user explicitly asked for unlabeled lines
- when the user asks to label lines, connections, arrows, or edges, use updateEdgeData on EXISTING edges by id — do NOT create new nodes or edges just to add labels
- if the user asks to label specific connections, match them to existing edge ids from the canvas summary

Layout rules:
- leave at least 120px horizontal and 80px vertical spacing between nodes
- flow left-to-right or top-to-bottom
- align related services on the same row
- place databases (cylinder) below their owning service
- avoid overlapping nodes

When extending an existing canvas, preserve useful nodes and connect new work to them.
When the canvas is empty, create a complete architecture from the prompt.`;
}

export function buildDesignUserPrompt(
  prompt: string,
  nodes: CanvasNode[],
  edges: CanvasEdge[],
) {
  const canvasSummary =
    nodes.length === 0
      ? "The canvas is currently empty."
      : `Current canvas has ${nodes.length} nodes and ${edges.length} edges.`;

  const nodeList = nodes
    .map(
      (n) =>
        `- ${n.id}: "${n.data.label}" at (${Math.round(n.position.x)}, ${Math.round(n.position.y)}) shape=${n.data.shape ?? "rectangle"}`,
    )
    .join("\n");

  const edgeList = edges
    .map((e) => {
      const label = e.data?.label ? ` label="${e.data.label}"` : "";
      return `- ${e.id}: ${e.source} -> ${e.target}${label}`;
    })
    .join("\n");

  return `${canvasSummary}

User request: ${prompt}

Existing nodes:
${nodeList || "(none)"}

Existing edges:
${edgeList || "(none)"}

Generate the actions needed to fulfill the request.`;
}
