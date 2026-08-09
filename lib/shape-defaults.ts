import type { NodeShape } from "@/types/canvas";

export const SHAPE_DEFAULTS: Record<NodeShape, { width: number; height: number }> = {
  rectangle: { width: 200, height: 80 },
  diamond: { width: 160, height: 120 },
  circle: { width: 100, height: 100 },
  pill: { width: 180, height: 60 },
  cylinder: { width: 120, height: 100 },
  hexagon: { width: 140, height: 120 },
};

export function getShapeDefaults(shape: NodeShape) {
  return SHAPE_DEFAULTS[shape];
}
