import type { SpecChatHistoryItem } from "@/lib/spec-generation-schema";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

export function buildSpecSystemPrompt() {
  return `You are Ghost AI, a technical writer that produces clear architecture specifications from system design canvases and design conversations.

Write a complete technical specification in Markdown. Use these sections when relevant:

1. **Overview** — purpose, scope, and goals
2. **Architecture** — major components and their responsibilities
3. **Component Details** — one subsection per significant node/service
4. **Data Flow** — how information moves between components (reference labeled edges)
5. **Interfaces & Protocols** — APIs, events, queues, or integration points implied by the design
6. **Technology Considerations** — reasonable stack or infrastructure choices inferred from the diagram
7. **Open Questions** — gaps or ambiguities that need clarification

Rules:
- Output Markdown only. Do not wrap the document in code fences.
- Base the spec on the provided canvas nodes, edges, and chat history.
- Use precise, professional language suitable for engineering handoff.
- If the canvas is sparse, infer reasonable details but mark assumptions clearly.
- Reference component labels from the canvas rather than inventing unrelated systems.`;
}

function formatChatHistory(chatHistory: SpecChatHistoryItem[]) {
  if (chatHistory.length === 0) {
    return "(no chat history)";
  }

  return chatHistory
    .map((message) => {
      const time = new Date(message.timestamp).toISOString();
      return `[${time}] ${message.role} (${message.sender}): ${message.content}`;
    })
    .join("\n");
}

function formatNodes(nodes: CanvasNode[]) {
  if (nodes.length === 0) {
    return "(none)";
  }

  return nodes
    .map(
      (node) =>
        `- ${node.id}: "${node.data.label}" shape=${node.data.shape ?? "rectangle"} at (${Math.round(node.position.x)}, ${Math.round(node.position.y)})`,
    )
    .join("\n");
}

function formatEdges(edges: CanvasEdge[]) {
  if (edges.length === 0) {
    return "(none)";
  }

  return edges
    .map((edge) => {
      const label = edge.data?.label ? ` label="${edge.data.label}"` : "";
      return `- ${edge.id}: ${edge.source} -> ${edge.target}${label}`;
    })
    .join("\n");
}

export function buildSpecUserPrompt(
  chatHistory: SpecChatHistoryItem[],
  nodes: CanvasNode[],
  edges: CanvasEdge[],
) {
  const canvasSummary =
    nodes.length === 0
      ? "The canvas is currently empty."
      : `The canvas has ${nodes.length} nodes and ${edges.length} edges.`;

  return `${canvasSummary}

Design conversation:
${formatChatHistory(chatHistory)}

Canvas nodes:
${formatNodes(nodes)}

Canvas edges:
${formatEdges(edges)}

Generate the technical specification now.`;
}
