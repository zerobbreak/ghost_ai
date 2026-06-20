import { z } from "zod";
import { DEFAULT_NODE_COLOR, NODE_SHAPES, type NodeShape } from "@/types/canvas";

const looseRecordSchema = z.record(z.string(), z.unknown());

/**
 * Permissive schema for Gemini structured output.
 * Strict validation happens in normalizeDesignPlan after parsing.
 */
export const llmDesignPlanSchema = z.object({
  summary: z.string().optional(),
  actions: z.array(looseRecordSchema),
});

export type LlmDesignPlan = z.infer<typeof llmDesignPlanSchema>;

/** @deprecated Use llmDesignPlanSchema for generateObject. */
export const designPlanSchema = llmDesignPlanSchema;

export type LooseDesignPlan = LlmDesignPlan;

export type DesignAction =
  | { type: "addNode"; node: CanvasNodeInput }
  | { type: "moveNode"; id: string; position: { x: number; y: number } }
  | { type: "resizeNode"; id: string; width: number; height: number }
  | { type: "updateNodeData"; id: string; data: Partial<NodeDataInput> }
  | { type: "deleteNode"; id: string }
  | { type: "addEdge"; edge: CanvasEdgeInput }
  | { type: "updateEdgeData"; id: string; data: { label?: string } }
  | { type: "deleteEdge"; id: string };

export interface NodeDataInput {
  label: string;
  shape?: NodeShape;
  color?: string;
  textColor?: string;
}

export interface CanvasNodeInput {
  id: string;
  type: "canvasNode";
  position: { x: number; y: number };
  data: NodeDataInput;
  style?: { width?: number; height?: number };
}

export interface CanvasEdgeInput {
  id: string;
  type: "canvasEdge";
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  data?: { label?: string };
}

export interface DesignPlan {
  summary: string;
  actions: DesignAction[];
}

function isNodeShape(value: unknown): value is NodeShape {
  return typeof value === "string" && NODE_SHAPES.includes(value as NodeShape);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function coerceNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function coercePositiveNumber(value: unknown): number | null {
  const parsed = coerceNumber(value, Number.NaN);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeActionType(value: unknown): DesignAction["type"] | null {
  if (typeof value !== "string") return null;

  const direct = value.trim();
  const validTypes: DesignAction["type"][] = [
    "addNode",
    "moveNode",
    "resizeNode",
    "updateNodeData",
    "deleteNode",
    "addEdge",
    "updateEdgeData",
    "deleteEdge",
  ];
  if (validTypes.includes(direct as DesignAction["type"])) {
    return direct as DesignAction["type"];
  }

  const normalized = direct.replace(/[-_\s]/g, "").toLowerCase();
  const aliases: Record<string, DesignAction["type"]> = {
    addnode: "addNode",
    movenode: "moveNode",
    resizenode: "resizeNode",
    updatenodedata: "updateNodeData",
    deletenode: "deleteNode",
    addedge: "addEdge",
    updateedgedata: "updateEdgeData",
    labelEdge: "updateEdgeData",
    labeledge: "updateEdgeData",
    deleteedge: "deleteEdge",
  };

  return aliases[normalized] ?? null;
}

function defaultPosition(index: number) {
  return {
    x: 120 + (index % 4) * 220,
    y: 120 + Math.floor(index / 4) * 100,
  };
}

function normalizePosition(
  value: unknown,
  fallback: { x: number; y: number },
) {
  const record = asRecord(value);
  return {
    x: coerceNumber(record?.x, fallback.x),
    y: coerceNumber(record?.y, fallback.y),
  };
}

function normalizeNodeInput(
  node: Record<string, unknown>,
  index: number,
): CanvasNodeInput | null {
  const id = asString(node.id);
  if (!id) return null;

  const data = asRecord(node.data);
  const shape = isNodeShape(data?.shape) ? data.shape : "rectangle";
  const style = asRecord(node.style);

  return {
    id,
    type: "canvasNode",
    position: normalizePosition(node.position, defaultPosition(index)),
    data: {
      label: asString(data?.label) ?? id,
      shape,
      color:
        typeof data?.color === "string"
          ? data.color
          : DEFAULT_NODE_COLOR.fill,
      textColor:
        typeof data?.textColor === "string"
          ? data.textColor
          : DEFAULT_NODE_COLOR.text,
    },
    style: {
      width: coercePositiveNumber(style?.width) ?? undefined,
      height: coercePositiveNumber(style?.height) ?? undefined,
    },
  };
}

function normalizeEdgeInput(
  edge: Record<string, unknown>,
): CanvasEdgeInput | null {
  const id = asString(edge.id);
  const source = asString(edge.source);
  const target = asString(edge.target);
  if (!id || !source || !target) return null;

  const data = asRecord(edge.data);
  const label = asString(data?.label);

  return {
    id,
    type: "canvasEdge",
    source,
    target,
    sourceHandle:
      typeof edge.sourceHandle === "string" || edge.sourceHandle === null
        ? edge.sourceHandle
        : null,
    targetHandle:
      typeof edge.targetHandle === "string" || edge.targetHandle === null
        ? edge.targetHandle
        : null,
    data: label ? { label } : {},
  };
}

function normalizeLooseAction(
  action: Record<string, unknown>,
  index: number,
): DesignAction | null {
  const type = normalizeActionType(action.type);
  if (!type) return null;

  switch (type) {
    case "addNode": {
      const node = asRecord(action.node);
      if (!node) return null;
      const normalized = normalizeNodeInput(node, index);
      return normalized ? { type, node: normalized } : null;
    }
    case "moveNode": {
      const id = asString(action.id);
      if (!id) return null;
      return {
        type,
        id,
        position: normalizePosition(action.position, defaultPosition(index)),
      };
    }
    case "resizeNode": {
      const id = asString(action.id);
      const width = coercePositiveNumber(action.width);
      const height = coercePositiveNumber(action.height);
      if (!id || !width || !height) return null;
      return { type, id, width, height };
    }
    case "updateNodeData": {
      const id = asString(action.id);
      const data = asRecord(action.data);
      if (!id || !data) return null;
      return {
        type,
        id,
        data: {
          ...(asString(data.label) ? { label: asString(data.label)! } : {}),
          ...(isNodeShape(data.shape) ? { shape: data.shape } : {}),
          ...(typeof data.color === "string" ? { color: data.color } : {}),
          ...(typeof data.textColor === "string"
            ? { textColor: data.textColor }
            : {}),
        },
      };
    }
    case "deleteNode": {
      const id = asString(action.id);
      return id ? { type, id } : null;
    }
    case "addEdge": {
      const edge = asRecord(action.edge);
      if (!edge) return null;
      const normalized = normalizeEdgeInput(edge);
      return normalized ? { type, edge: normalized } : null;
    }
    case "updateEdgeData": {
      const id = asString(action.id);
      const data = asRecord(action.data);
      const label = asString(data?.label);
      if (!id || !label) return null;
      return { type, id, data: { label } };
    }
    case "deleteEdge": {
      const id = asString(action.id);
      return id ? { type, id } : null;
    }
  }
}

export function normalizeDesignPlan(raw: LlmDesignPlan): DesignPlan {
  const actions = raw.actions
    .map((action, index) => normalizeLooseAction(action, index))
    .filter((action): action is DesignAction => action !== null);

  if (actions.length === 0) {
    throw new Error("Model returned no valid canvas actions");
  }

  const summary =
    typeof raw.summary === "string" && raw.summary.trim().length > 0
      ? raw.summary.trim()
      : "Applied design changes.";

  return { summary, actions };
}
