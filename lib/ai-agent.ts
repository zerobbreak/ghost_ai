import { mutateFlow } from "@liveblocks/react-flow/node";
import { getLiveblocks } from "@/lib/liveblocks";
import type { CanvasEdge, CanvasNode, NodeShape } from "@/types/canvas";
import {
  DEFAULT_NODE_COLOR,
  NODE_COLORS,
  NODE_SHAPES,
} from "@/types/canvas";
import { SHAPE_DEFAULTS } from "@/lib/shape-defaults";
import type { DesignAction } from "@/lib/design-agent-schema";
import {
  aiChatFeedPayloadSchema,
  aiStatusFeedPayloadSchema,
  type AiChatFeedPayload,
  type AiStatusFeedPayload,
} from "@/types/tasks";

export const AI_AGENT_USER_ID = "ghost-ai";
export const AI_STATUS_FEED_ID = "ai-status-feed";
export const AI_CHAT_FEED_ID = "ai-chat";

export const AI_AGENT_INFO = {
  name: "Ghost AI",
  avatar: "",
  color: "#6457f9",
} as const;

/** Flow-space home for the AI cursor — top-left margin, clear of typical diagrams. */
export const AI_CURSOR_HOME = { x: 48, y: 56 } as const;

export type AiStatusMessage = AiStatusFeedPayload;

function isNodeShape(value: unknown): value is NodeShape {
  return typeof value === "string" && NODE_SHAPES.includes(value as NodeShape);
}

function resolveColorPair(fill?: string, text?: string) {
  if (fill && text) {
    const match = NODE_COLORS.find((c) => c.fill === fill && c.text === text);
    if (match) return match;
  }

  if (fill) {
    const match = NODE_COLORS.find((c) => c.fill === fill);
    if (match) return match;
  }

  return DEFAULT_NODE_COLOR;
}

function normalizeNode(node: CanvasNode): CanvasNode {
  const shape = isNodeShape(node.data?.shape) ? node.data.shape : "rectangle";
  const defaults = SHAPE_DEFAULTS[shape];
  const colors = resolveColorPair(node.data?.color, node.data?.textColor);
  const width = node.style?.width ?? defaults.width;
  const height = node.style?.height ?? defaults.height;

  return {
    id: node.id,
    type: "canvasNode",
    position: node.position,
    data: {
      label: node.data?.label ?? "",
      shape,
      color: colors.fill,
      textColor: colors.text,
    },
    style: {
      width: typeof width === "number" ? width : defaults.width,
      height: typeof height === "number" ? height : defaults.height,
    },
  };
}

function normalizeEdge(edge: CanvasEdge): CanvasEdge {
  return {
    id: edge.id,
    type: "canvasEdge",
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? null,
    targetHandle: edge.targetHandle ?? null,
    data: edge.data?.label ? { label: edge.data.label } : {},
  };
}

export async function readCanvasState(roomId: string) {
  const client = getLiveblocks();

  let nodes: CanvasNode[] = [];
  let edges: CanvasEdge[] = [];

  await mutateFlow<CanvasNode, CanvasEdge>(
    { client, roomId },
    (flow) => {
      nodes = [...flow.nodes];
      edges = [...flow.edges];
    },
  );

  return { nodes, edges };
}

export async function applyDesignActions(roomId: string, actions: DesignAction[]) {
  const client = getLiveblocks();

  await mutateFlow<CanvasNode, CanvasEdge>(
    { client, roomId },
    (flow) => {
      for (const action of actions) {
        switch (action.type) {
          case "addNode":
            flow.addNode(normalizeNode(action.node as CanvasNode));
            break;
          case "moveNode":
            flow.updateNode(action.id, {
              position: action.position,
            });
            break;
          case "resizeNode":
            flow.updateNode(action.id, {
              style: { width: action.width, height: action.height },
            });
            break;
          case "updateNodeData":
            flow.updateNodeData(action.id, action.data);
            break;
          case "deleteNode":
            flow.removeNode(action.id);
            break;
          case "addEdge":
            flow.addEdge(normalizeEdge(action.edge as CanvasEdge));
            break;
          case "updateEdgeData":
            flow.updateEdgeData(action.id, action.data);
            break;
          case "deleteEdge":
            flow.removeEdge(action.id);
            break;
        }
      }
    },
  );
}

export async function ensureAiStatusFeed(roomId: string) {
  const client = getLiveblocks();

  try {
    await client.getFeed({ roomId, feedId: AI_STATUS_FEED_ID });
  } catch {
    await client.createFeed({
      roomId,
      feedId: AI_STATUS_FEED_ID,
      metadata: { title: "AI Status" },
    });
  }
}

export async function ensureAiChatFeed(roomId: string) {
  const client = getLiveblocks();

  try {
    await client.getFeed({ roomId, feedId: AI_CHAT_FEED_ID });
  } catch {
    await client.createFeed({
      roomId,
      feedId: AI_CHAT_FEED_ID,
      metadata: { title: "AI Chat" },
    });
  }
}

export async function publishAiChatMessage(
  roomId: string,
  message: AiChatFeedPayload,
) {
  const parsed = aiChatFeedPayloadSchema.parse(message);
  const client = getLiveblocks();
  await ensureAiChatFeed(roomId);

  await client.createFeedMessage({
    roomId,
    feedId: AI_CHAT_FEED_ID,
    data: parsed,
  });
}

export async function publishAiStatus(
  roomId: string,
  message: AiStatusMessage,
) {
  const parsed = aiStatusFeedPayloadSchema.parse(message);
  const client = getLiveblocks();
  await ensureAiStatusFeed(roomId);

  await client.createFeedMessage({
    roomId,
    feedId: AI_STATUS_FEED_ID,
    data: parsed,
  });
}

export async function updateAiPresence(
  roomId: string,
  presence: {
    cursor: { x: number; y: number } | null;
    thinking: boolean;
  },
  ttl = 120,
) {
  const client = getLiveblocks();

  await client.setPresence(roomId, {
    userId: AI_AGENT_USER_ID,
    data: presence,
    userInfo: AI_AGENT_INFO,
    ttl,
  });
}

export async function clearAiPresence(roomId: string) {
  await updateAiPresence(
    roomId,
    { cursor: null, thinking: false },
    2,
  );
}

export function cursorForNode(node: Pick<CanvasNode, "position" | "style">) {
  const width =
    typeof node.style?.width === "number" ? node.style.width : 140;

  // Hover above the node center so the badge tracks edits without covering labels.
  return {
    x: node.position.x + width * 0.35,
    y: node.position.y - 12,
  };
}

export function cursorForCanvasOverview(nodes: CanvasNode[]) {
  if (nodes.length === 0) return AI_CURSOR_HOME;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const width =
      typeof node.style?.width === "number" ? node.style.width : 140;
    const height =
      typeof node.style?.height === "number" ? node.style.height : 80;
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + width);
    maxY = Math.max(maxY, node.position.y + height);
  }

  return {
    x: (minX + maxX) / 2,
    y: minY - 24,
  };
}

export function cursorForAction(
  action: DesignAction,
  nodes: CanvasNode[],
  edges: CanvasEdge[],
) {
  switch (action.type) {
    case "addNode":
      return cursorForNode(action.node);
    case "moveNode": {
      const node = nodes.find((entry) => entry.id === action.id);
      return cursorForNode({
        position: action.position,
        style: node?.style,
      });
    }
    case "resizeNode":
    case "updateNodeData":
    case "deleteNode": {
      const node = nodes.find((entry) => entry.id === action.id);
      return node ? cursorForNode(node) : AI_CURSOR_HOME;
    }
    case "addEdge":
    case "updateEdgeData": {
      const edge =
        action.type === "addEdge"
          ? action.edge
          : edges.find((entry) => entry.id === action.id);
      if (!edge) return AI_CURSOR_HOME;

      const source = nodes.find((node) => node.id === edge.source);
      const target = nodes.find((node) => node.id === edge.target);
      if (source && target) {
        const sourceCursor = cursorForNode(source);
        const targetCursor = cursorForNode(target);
        return {
          x: (sourceCursor.x + targetCursor.x) / 2,
          y: (sourceCursor.y + targetCursor.y) / 2,
        };
      }
      if (source) return cursorForNode(source);
      if (target) return cursorForNode(target);
      return AI_CURSOR_HOME;
    }
    case "deleteEdge": {
      const edge = edges.find((entry) => entry.id === action.id);
      if (!edge) return AI_CURSOR_HOME;
      const source = nodes.find((node) => node.id === edge.source);
      const target = nodes.find((node) => node.id === edge.target);
      if (source && target) {
        const sourceCursor = cursorForNode(source);
        const targetCursor = cursorForNode(target);
        return {
          x: (sourceCursor.x + targetCursor.x) / 2,
          y: (sourceCursor.y + targetCursor.y) / 2,
        };
      }
      if (source) return cursorForNode(source);
      return AI_CURSOR_HOME;
    }
  }
}
