"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import {
  Handle,
  NodeResizeControl,
  NodeToolbar,
  Position,
  type NodeProps,
} from "@xyflow/react";
import type { CanvasNode, NodeShape } from "@/types/canvas";
import { DEFAULT_NODE_COLOR, NODE_COLORS } from "@/types/canvas";
import { useCanvasActions } from "./canvas-actions-context";

const MIN_WIDTH = 80;
const MIN_HEIGHT = 40;

// ---------------------------------------------------------------------------
// SVG shape helpers
// ---------------------------------------------------------------------------

interface SvgShapeProps {
  fill: string;
  stroke: string;
  sw: number;
}

function Diamond({ fill, stroke, sw }: SvgShapeProps) {
  return (
    <polygon
      points="50,0.5 99.5,50 50,99.5 0.5,50"
      fill={fill}
      stroke={stroke}
      strokeWidth={sw}
      vectorEffect="non-scaling-stroke"
    />
  );
}

function Cylinder({ fill, stroke, sw }: SvgShapeProps) {
  const ex = 49.5;
  const ery = 13.5;
  const topY = 14;
  const botY = 86;
  return (
    <>
      <path
        d={`M 0.5,${topY} L 0.5,${botY} A ${ex},${ery} 0 0 0 99.5,${botY} L 99.5,${topY}`}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
        vectorEffect="non-scaling-stroke"
      />
      <ellipse
        cx="50"
        cy={topY}
        rx={ex}
        ry={ery}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={`M 0.5,${botY} A ${ex},${ery} 0 0 0 99.5,${botY}`}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        vectorEffect="non-scaling-stroke"
      />
    </>
  );
}

function Hexagon({ fill, stroke, sw }: SvgShapeProps) {
  return (
    <polygon
      points="25,0.5 75,0.5 99.5,50 75,99.5 25,99.5 0.5,50"
      fill={fill}
      stroke={stroke}
      strokeWidth={sw}
      vectorEffect="non-scaling-stroke"
    />
  );
}

const CSS_SHAPES = new Set<NodeShape>(["rectangle", "pill", "circle"]);

function cssBorderRadius(shape: NodeShape): string {
  if (shape === "rectangle") return "6px";
  if (shape === "circle") return "50%";
  return "9999px"; // pill
}

// ---------------------------------------------------------------------------
// Resize controls
// ---------------------------------------------------------------------------

const CORNER_HANDLE_STYLE: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 2,
  border: "none",
  backgroundColor: "#00c8d4",
  opacity: 0.8,
};

function ResizeHandles() {
  return (
    <>
      {(
        ["top-left", "top-right", "bottom-left", "bottom-right"] as const
      ).map((pos) => (
        <NodeResizeControl
          key={pos}
          position={pos}
          minWidth={MIN_WIDTH}
          minHeight={MIN_HEIGHT}
          style={CORNER_HANDLE_STYLE}
        />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Color toolbar
// ---------------------------------------------------------------------------

interface ColorToolbarProps {
  nodeId: string;
  activeFill: string;
  activeText: string;
}

type SwatchStyle = CSSProperties & {
  "--swatch-glow": string;
};

function ColorToolbar({ nodeId, activeFill, activeText }: ColorToolbarProps) {
  const { updateNodeColor } = useCanvasActions();

  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-border bg-popover px-2.5 py-1.5 shadow-lg"
      aria-label="Node color toolbar"
    >
      {NODE_COLORS.map((color) => {
        const active = color.fill === activeFill && color.text === activeText;
        const swatchStyle: SwatchStyle = {
          "--swatch-glow": color.text,
          backgroundColor: color.fill,
          borderColor: active ? color.text : "#2a2a30",
          boxShadow: active ? `0 0 0 2px ${color.text}` : undefined,
        };

        return (
          <button
            key={`${color.fill}-${color.text}`}
            type="button"
            className="h-4 w-4 shrink-0 rounded-full border transition-shadow hover:shadow-[0_0_6px_var(--swatch-glow)]"
            style={swatchStyle}
            aria-label="Set node color"
            aria-pressed={active}
            title="Set node color"
            onClick={(e) => {
              e.stopPropagation();
              updateNodeColor(nodeId, color.fill, color.text);
            }}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Node renderer
// ---------------------------------------------------------------------------

const CONNECTION_HANDLES = [
  { id: "top", position: Position.Top },
  { id: "right", position: Position.Right },
  { id: "bottom", position: Position.Bottom },
  { id: "left", position: Position.Left },
] as const;

function CanvasNodeComponent({ id, data, selected }: NodeProps<CanvasNode>) {
  const shape = data.shape ?? "rectangle";
  const bg = data.color ?? DEFAULT_NODE_COLOR.fill;
  const fg = data.textColor ?? DEFAULT_NODE_COLOR.text;
  const borderColor = selected ? "#00c8d4" : "#2a2a30";
  const sw = selected ? 2 : 1;

  const { updateNodeLabel } = useCanvasActions();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editing]);

  const handleDoubleClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      setDraft(data.label);
      setEditing(true);
    },
    [data.label],
  );

  const commitEdit = useCallback(() => {
    updateNodeLabel(id, draft);
    setEditing(false);
  }, [id, draft, updateNodeLabel]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Escape") {
        setDraft(data.label);
        setEditing(false);
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        commitEdit();
      }
    },
    [commitEdit, data.label],
  );

  return (
    <>
      <NodeToolbar position={Position.Top} isVisible={selected} offset={8}>
        <ColorToolbar nodeId={id} activeFill={bg} activeText={fg} />
      </NodeToolbar>

      {selected && <ResizeHandles />}

      <div className="group relative h-full w-full">
        {CSS_SHAPES.has(shape) ? (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: bg,
              border: `${sw}px solid ${borderColor}`,
              borderRadius: cssBorderRadius(shape),
              transition: "border-color 0.15s",
            }}
          />
        ) : (
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
            aria-hidden
          >
            {shape === "diamond" && (
              <Diamond fill={bg} stroke={borderColor} sw={sw} />
            )}
            {shape === "hexagon" && (
              <Hexagon fill={bg} stroke={borderColor} sw={sw} />
            )}
            {shape === "cylinder" && (
              <Cylinder fill={bg} stroke={borderColor} sw={sw} />
            )}
          </svg>
        )}

        <div
          className="relative flex h-full w-full items-center justify-center px-3 py-2"
          style={{ color: fg }}
          onDoubleClick={handleDoubleClick}
        >
          {editing ? (
            <textarea
              ref={textareaRef}
              className="nodrag nopan w-full resize-none bg-transparent text-center text-sm font-medium leading-tight outline-none"
              style={{ color: fg }}
              value={draft}
              rows={1}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="pointer-events-none select-none text-center text-sm font-medium leading-tight">
              {data.label ? (
                data.label
              ) : (
                <span className="opacity-40">Label</span>
              )}
            </span>
          )}
        </div>

        {/* Circular connection ports sit on the node boundary so edges terminate cleanly. */}
        {CONNECTION_HANDLES.map((handle) => (
          <Handle
            key={handle.id}
            type="source"
            id={handle.id}
            position={handle.position}
            isConnectable
            className="conn-handle"
          />
        ))}
      </div>
    </>
  );
}

export const CanvasNodeRenderer = memo(CanvasNodeComponent);
