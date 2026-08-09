import dagre from "@dagrejs/dagre";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";
import { getShapeDefaults } from "@/lib/shape-defaults";

export type LayoutDirection = "TB" | "LR";

interface LayoutOptions {
  nodeSep?: number;
  rankSep?: number;
}

function nodeSize(node: CanvasNode): { width: number; height: number } {
  const width = typeof node.style?.width === "number" ? node.style.width : undefined;
  const height = typeof node.style?.height === "number" ? node.style.height : undefined;
  if (width && height) return { width, height };

  const defaults = getShapeDefaults(node.data.shape ?? "rectangle");
  return { width: width ?? defaults.width, height: height ?? defaults.height };
}

function buildGraph(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  direction: LayoutDirection,
  options: LayoutOptions,
) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: direction,
    nodesep: options.nodeSep ?? 60,
    ranksep: options.rankSep ?? 90,
  });
  g.setDefaultEdgeLabel(() => ({}));

  const nodeIds = new Set(nodes.map((n) => n.id));
  for (const node of nodes) {
    g.setNode(node.id, nodeSize(node));
  }
  for (const edge of edges) {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  }

  return g;
}

/** Recomputes every node's position from the graph structure; all other node fields pass through unchanged. */
export function layoutCanvas(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  direction: LayoutDirection = "TB",
  options: LayoutOptions = {},
): CanvasNode[] {
  if (nodes.length === 0) return nodes;

  const g = buildGraph(nodes, edges, direction, options);
  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    if (!pos) return node;
    const { width, height } = nodeSize(node);
    return {
      ...node,
      position: { x: pos.x - width / 2, y: pos.y - height / 2 },
    };
  });
}

function boundingBox(nodes: CanvasNode[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const { width, height } = nodeSize(node);
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + width);
    maxY = Math.max(maxY, node.position.y + height);
  }

  return { minX, minY, maxX, maxY };
}

const SUBGRAPH_MARGIN = 160;

/**
 * Lays out only `newNodes` against edges among themselves, then shifts the
 * result clear of `existingNodes`' bounding box — nothing already on the
 * canvas ever moves or gets overlapped.
 */
export function layoutSubgraph(
  existingNodes: CanvasNode[],
  newNodes: CanvasNode[],
  allEdges: CanvasEdge[],
  direction: LayoutDirection = "TB",
  options: LayoutOptions = {},
): CanvasNode[] {
  if (newNodes.length === 0) return newNodes;

  const newIds = new Set(newNodes.map((n) => n.id));
  const relevantEdges = allEdges.filter(
    (edge) => newIds.has(edge.source) && newIds.has(edge.target),
  );

  const laidOut = layoutCanvas(newNodes, relevantEdges, direction, options);

  if (existingNodes.length === 0) return laidOut;

  const existingBounds = boundingBox(existingNodes);
  const newBounds = boundingBox(laidOut);

  const offsetX = existingBounds.maxX + SUBGRAPH_MARGIN - newBounds.minX;
  const offsetY = existingBounds.minY - newBounds.minY;

  return laidOut.map((node) => ({
    ...node,
    position: {
      x: node.position.x + offsetX,
      y: node.position.y + offsetY,
    },
  }));
}
