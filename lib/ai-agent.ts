import { mutateFlow } from "@liveblocks/react-flow/node";
import { getLiveblocks } from "@/lib/liveblocks";
import type { CanvasEdge, CanvasNode, NodeShape } from "@/types/canvas";
import {
  DEFAULT_NODE_COLOR,
  NODE_COLORS,
  NODE_SHAPES,
} from "@/types/canvas";
import type { DesignAction } from "@/lib/design-agent-schema";

export const AI_AGENT_USER_ID = "ghost-ai";
export const AI_STATUS_FEED_ID = "ai-status";

export const AI_AGENT_INFO = {
  name: "Ghost AI",
  avatar: "",
  color: "#6457f9",
} as const;

export type AiStatusPhase = "start" | "processing" | "complete" | "error";

export interface AiStatusMessage {
  text: string;
  phase: AiStatusPhase;
}

const SHAPE_DEFAULTS: Record<NodeShape, { width: number; height: number }> = {
  rectangle: { width: 200, height: 80 },
  diamond: { width: 160, height: 120 },
  circle: { width: 100, height: 100 },
  pill: { width: 180, height: 60 },
  cylinder: { width: 120, height: 100 },
  hexagon: { width: 140, height: 120 },
};

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

export async function publishAiStatus(
  roomId: string,
  message: AiStatusMessage,
) {
  const client = getLiveblocks();
  await ensureAiStatusFeed(roomId);

  await client.createFeedMessage({
    roomId,
    feedId: AI_STATUS_FEED_ID,
    data: {
      text: message.text,
      phase: message.phase,
    },
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

export function cursorForNode(node: CanvasNode) {
  const width =
    typeof node.style?.width === "number" ? node.style.width : 140;
  const height =
    typeof node.style?.height === "number" ? node.style.height : 50;

  return {
    x: node.position.x + width / 2,
    y: node.position.y + height / 2,
  };
}
