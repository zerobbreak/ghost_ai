"use client";

import type { DragEvent } from "react";
import type { NodeShape } from "@/types/canvas";

export interface ShapeDragPayload {
  shape: NodeShape;
  width: number;
  height: number;
}

export const DRAG_TYPE = "application/canvas-shape";

const SHAPE_DEFAULTS: Record<NodeShape, { width: number; height: number }> = {
  rectangle: { width: 200, height: 80 },
  diamond: { width: 160, height: 120 },
  circle: { width: 100, height: 100 },
  pill: { width: 180, height: 60 },
  cylinder: { width: 120, height: 100 },
  hexagon: { width: 140, height: 120 },
};

interface ShapeIconProps {
  shape: NodeShape;
  size?: number;
}

function ShapeIcon({ shape, size = 22 }: ShapeIconProps) {
  const s = size;
  const stroke = "#c0c0cc";
  const strokeWidth = 1.5;

  switch (shape) {
    case "rectangle":
      return (
        <svg width={s} height={s} viewBox="0 0 22 22" fill="none">
          <rect x="2" y="6" width="18" height="10" rx="1.5" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
    case "diamond":
      return (
        <svg width={s} height={s} viewBox="0 0 22 22" fill="none">
          <polygon points="11,2 20,11 11,20 2,11" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
    case "circle":
      return (
        <svg width={s} height={s} viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="9" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
    case "pill":
      return (
        <svg width={s} height={s} viewBox="0 0 22 22" fill="none">
          <rect x="2" y="7" width="18" height="8" rx="4" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
    case "cylinder":
      return (
        <svg width={s} height={s} viewBox="0 0 22 22" fill="none">
          <rect x="4" y="6" width="14" height="12" rx="1" stroke={stroke} strokeWidth={strokeWidth} />
          <ellipse cx="11" cy="6" rx="7" ry="2.5" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
    case "hexagon":
      return (
        <svg width={s} height={s} viewBox="0 0 22 22" fill="none">
          <polygon points="11,2 19,6.5 19,15.5 11,20 3,15.5 3,6.5" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
  }
}

const SHAPE_LABELS: Record<NodeShape, string> = {
  rectangle: "Rectangle",
  diamond: "Diamond",
  circle: "Circle",
  pill: "Pill",
  cylinder: "Cylinder",
  hexagon: "Hexagon",
};

const SHAPES: NodeShape[] = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
];

function handleDragStart(e: DragEvent<HTMLButtonElement>, shape: NodeShape) {
  const payload: ShapeDragPayload = {
    shape,
    ...SHAPE_DEFAULTS[shape],
  };
  e.dataTransfer.setData(DRAG_TYPE, JSON.stringify(payload));
  e.dataTransfer.effectAllowed = "copy";
}

export function ShapePanel() {
  return (
    <div
      className="flex items-center gap-1 rounded-full border px-3 py-2 shadow-lg"
      style={{
        backgroundColor: "#111114",
        borderColor: "#2a2a30",
      }}
      aria-label="Shape panel"
    >
      {SHAPES.map((shape) => (
        <button
          key={shape}
          draggable
          onDragStart={(e) => handleDragStart(e, shape)}
          title={SHAPE_LABELS[shape]}
          aria-label={`Drag ${SHAPE_LABELS[shape]}`}
          className="flex cursor-grab items-center justify-center rounded-lg p-1.5 transition-colors active:cursor-grabbing"
          style={{ color: "#c0c0cc" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "#18181c";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
          }}
        >
          <ShapeIcon shape={shape} />
        </button>
      ))}
    </div>
  );
}
