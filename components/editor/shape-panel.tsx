"use client";

import { useEffect, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import type { NodeShape } from "@/types/canvas";
import { DEFAULT_NODE_COLOR } from "@/types/canvas";
import { SHAPE_DEFAULTS } from "@/lib/shape-defaults";

export interface ShapeDragPayload {
  shape: NodeShape;
  width: number;
  height: number;
}

export const DRAG_TYPE = "application/canvas-shape";
export const DRAG_FALLBACK_TYPE = "text/plain";

const PREVIEW_SCALE = 0.55;

// ---------------------------------------------------------------------------
// Drag ghost preview
// ---------------------------------------------------------------------------

interface PreviewShapeProps {
  shape: NodeShape;
  fill: string;
  stroke: string;
}

function PreviewShape({ shape, fill, stroke }: PreviewShapeProps) {
  if (shape === "rectangle") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: fill,
          border: `1.5px solid ${stroke}`,
          borderRadius: "6px",
        }}
      />
    );
  }
  if (shape === "pill") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: fill,
          border: `1.5px solid ${stroke}`,
          borderRadius: "9999px",
        }}
      />
    );
  }
  if (shape === "circle") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: fill,
          border: `1.5px solid ${stroke}`,
          borderRadius: "50%",
        }}
      />
    );
  }

  // SVG shapes — diamond, hexagon, cylinder
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      {shape === "diamond" && (
        <polygon
          points="50,0.5 99.5,50 50,99.5 0.5,50"
          fill={fill}
          stroke={stroke}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      )}
      {shape === "hexagon" && (
        <polygon
          points="25,0.5 75,0.5 99.5,50 75,99.5 25,99.5 0.5,50"
          fill={fill}
          stroke={stroke}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      )}
      {shape === "cylinder" && (
        <>
          <path
            d="M 0.5,14 L 0.5,86 A 49.5,13.5 0 0 0 99.5,86 L 99.5,14"
            fill={fill}
            stroke={stroke}
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
          <ellipse
            cx="50"
            cy="14"
            rx="49.5"
            ry="13.5"
            fill={fill}
            stroke={stroke}
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M 0.5,86 A 49.5,13.5 0 0 0 99.5,86"
            fill="none"
            stroke={stroke}
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        </>
      )}
    </svg>
  );
}

interface DragPreviewProps {
  shape: NodeShape;
  x: number;
  y: number;
}

function DragPreview({ shape, x, y }: DragPreviewProps) {
  const { width, height } = SHAPE_DEFAULTS[shape];
  const w = width * PREVIEW_SCALE;
  const h = height * PREVIEW_SCALE;

  return (
    <div
      className="pointer-events-none fixed z-[9999]"
      style={{
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        opacity: 0.78,
      }}
    >
      <PreviewShape
        shape={shape}
        fill={DEFAULT_NODE_COLOR.fill}
        stroke="#00c8d4"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shape icons (outline only, used in panel buttons)
// ---------------------------------------------------------------------------

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
          <rect
            x="2"
            y="6"
            width="18"
            height="10"
            rx="1.5"
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </svg>
      );
    case "diamond":
      return (
        <svg width={s} height={s} viewBox="0 0 22 22" fill="none">
          <polygon
            points="11,2 20,11 11,20 2,11"
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
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
          <rect
            x="2"
            y="7"
            width="18"
            height="8"
            rx="4"
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </svg>
      );
    case "cylinder":
      return (
        <svg width={s} height={s} viewBox="0 0 22 22" fill="none">
          <rect
            x="4"
            y="6"
            width="14"
            height="12"
            rx="1"
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <ellipse
            cx="11"
            cy="6"
            rx="7"
            ry="2.5"
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </svg>
      );
    case "hexagon":
      return (
        <svg width={s} height={s} viewBox="0 0 22 22" fill="none">
          <polygon
            points="11,2 19,6.5 19,15.5 11,20 3,15.5 3,6.5"
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
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

// ---------------------------------------------------------------------------
// ShapePanel
// ---------------------------------------------------------------------------

interface ShapePanelProps {
  onShapeDrop: (payload: ShapeDragPayload, point: { x: number; y: number }) => void;
}

interface DragState {
  payload: ShapeDragPayload;
  x: number;
  y: number;
}

export function ShapePanel({ onShapeDrop }: ShapePanelProps) {
  const [dragState, setDragState] = useState<DragState | null>(null);

  useEffect(() => {
    if (!dragState) return;

    const onPointerMove = (e: globalThis.PointerEvent) => {
      setDragState((current) =>
        current ? { ...current, x: e.clientX, y: e.clientY } : null,
      );
    };

    const onPointerUp = (e: globalThis.PointerEvent) => {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const droppedOnPanel =
        target instanceof Element && Boolean(target.closest("[data-shape-panel]"));

      if (!droppedOnPanel) {
        onShapeDrop(dragState.payload, { x: e.clientX, y: e.clientY });
      }

      setDragState(null);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp, { once: true });
    window.addEventListener("pointercancel", onPointerUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [dragState, onShapeDrop]);

  function handlePointerDown(e: PointerEvent<HTMLButtonElement>, shape: NodeShape) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const payload: ShapeDragPayload = {
      shape,
      ...SHAPE_DEFAULTS[shape],
    };

    setDragState({ payload, x: e.clientX, y: e.clientY });
  }

  return (
    <>
      <div
        data-shape-panel
        className="nopan flex items-center gap-1 rounded-full border px-3 py-2 shadow-lg"
        style={{
          backgroundColor: "#111114",
          borderColor: "#2a2a30",
        }}
        aria-label="Shape panel"
      >
        {SHAPES.map((shape) => (
          <button
            key={shape}
            type="button"
            draggable={false}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => handlePointerDown(e, shape)}
            title={SHAPE_LABELS[shape]}
            aria-label={`Drag ${SHAPE_LABELS[shape]}`}
            className="nodrag nopan flex cursor-grab items-center justify-center rounded-lg p-1.5 transition-colors active:cursor-grabbing"
            style={{ color: "#c0c0cc" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "#18181c";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                "transparent";
            }}
          >
            <ShapeIcon shape={shape} />
          </button>
        ))}
      </div>

      {dragState &&
        typeof document !== "undefined" &&
        createPortal(
          <DragPreview
            shape={dragState.payload.shape}
            x={dragState.x}
            y={dragState.y}
          />,
          document.body,
        )}
    </>
  );
}
