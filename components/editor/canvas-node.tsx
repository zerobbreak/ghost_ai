"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CanvasNode, NodeShape } from "@/types/canvas";
import { DEFAULT_NODE_COLOR } from "@/types/canvas";

interface ShapePathProps {
  fill: string;
  stroke: string;
  sw: number; // stroke-width in screen px (via vectorEffect)
}

// All shapes use a 100×100 viewBox with preserveAspectRatio="none".
// vectorEffect="non-scaling-stroke" keeps border width uniform.

function Rectangle({ fill, stroke, sw }: ShapePathProps) {
  return (
    <rect
      x="0.5" y="0.5" width="99" height="99" rx="4"
      fill={fill} stroke={stroke} strokeWidth={sw}
      vectorEffect="non-scaling-stroke"
    />
  );
}

function Diamond({ fill, stroke, sw }: ShapePathProps) {
  return (
    <polygon
      points="50,0.5 99.5,50 50,99.5 0.5,50"
      fill={fill} stroke={stroke} strokeWidth={sw}
      vectorEffect="non-scaling-stroke"
    />
  );
}

function Circle({ fill, stroke, sw }: ShapePathProps) {
  return (
    <ellipse
      cx="50" cy="50" rx="49.5" ry="49.5"
      fill={fill} stroke={stroke} strokeWidth={sw}
      vectorEffect="non-scaling-stroke"
    />
  );
}

function Pill({ fill, stroke, sw }: ShapePathProps) {
  // rx="50" in a 100×100 viewBox gives fully-rounded ends at any aspect ratio
  return (
    <rect
      x="0.5" y="0.5" width="99" height="99" rx="50"
      fill={fill} stroke={stroke} strokeWidth={sw}
      vectorEffect="non-scaling-stroke"
    />
  );
}

function Cylinder({ fill, stroke, sw }: ShapePathProps) {
  // Top ellipse center at y=14, bottom at y=86
  const ex = 49.5;
  const ery = 13.5;
  const topY = 14;
  const botY = 86;

  return (
    <>
      {/* Body sides + bottom arc */}
      <path
        d={`M 0.5,${topY} L 0.5,${botY} A ${ex},${ery} 0 0 0 99.5,${botY} L 99.5,${topY}`}
        fill={fill} stroke={stroke} strokeWidth={sw}
        vectorEffect="non-scaling-stroke"
      />
      {/* Top cap — drawn last so it sits on top of the body */}
      <ellipse
        cx="50" cy={topY} rx={ex} ry={ery}
        fill={fill} stroke={stroke} strokeWidth={sw}
        vectorEffect="non-scaling-stroke"
      />
      {/* Bottom visible rim (front arc only) */}
      <path
        d={`M 0.5,${botY} A ${ex},${ery} 0 0 0 99.5,${botY}`}
        fill="none" stroke={stroke} strokeWidth={sw}
        vectorEffect="non-scaling-stroke"
      />
    </>
  );
}

function Hexagon({ fill, stroke, sw }: ShapePathProps) {
  return (
    <polygon
      points="25,0.5 75,0.5 99.5,50 75,99.5 25,99.5 0.5,50"
      fill={fill} stroke={stroke} strokeWidth={sw}
      vectorEffect="non-scaling-stroke"
    />
  );
}

const SHAPE_COMPONENTS: Record<NodeShape, React.FC<ShapePathProps>> = {
  rectangle: Rectangle,
  diamond: Diamond,
  circle: Circle,
  pill: Pill,
  cylinder: Cylinder,
  hexagon: Hexagon,
};

function CanvasNodeComponent({ data, selected }: NodeProps<CanvasNode>) {
  const shape = data.shape ?? "rectangle";
  const bg = data.color ?? DEFAULT_NODE_COLOR.fill;
  const fg = data.textColor ?? DEFAULT_NODE_COLOR.text;
  const stroke = selected ? "#00c8d4" : "#2a2a30";
  const sw = selected ? 2 : 1;

  const ShapeEl = SHAPE_COMPONENTS[shape];

  return (
    <div className="relative h-full w-full">
      {/* Shape SVG fills the node container */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <ShapeEl fill={bg} stroke={stroke} sw={sw} />
      </svg>

      {/* Centered label on top of SVG */}
      <div
        className="relative flex h-full w-full items-center justify-center px-3 py-2"
        style={{ color: fg }}
      >
        <span className="pointer-events-none select-none text-center text-sm font-medium leading-tight">
          {data.label}
        </span>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="h-2! w-2! border-0! bg-white! opacity-0 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="h-2! w-2! border-0! bg-white! opacity-0 transition-opacity"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="h-2! w-2! border-0! bg-white! opacity-0 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="h-2! w-2! border-0! bg-white! opacity-0 transition-opacity"
      />
    </div>
  );
}

export const CanvasNodeRenderer = memo(CanvasNodeComponent);
