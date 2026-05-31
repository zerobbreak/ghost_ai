"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import type { CanvasEdge } from "@/types/canvas";
import { useCanvasActions } from "./canvas-actions-context";

// Slightly dimmed at rest; full opacity when hovered or selected
const DIM_STROKE = "rgba(180,180,200,0.45)";
const BRIGHT_STROKE = "rgba(220,220,240,0.90)";
const SELECTED_STROKE = "#00c8d4";

function CanvasEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
}: EdgeProps<CanvasEdge>) {
  const { updateEdgeLabel } = useCanvasActions();
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data?.label ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  const label = data?.label ?? "";

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const stroke = selected
    ? SELECTED_STROKE
    : hovered
      ? BRIGHT_STROKE
      : DIM_STROKE;

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const openEditor = useCallback(() => {
    setDraft(label);
    setEditing(true);
  }, [label]);

  const commit = useCallback(() => {
    updateEdgeLabel(id, draft.trim());
    setEditing(false);
  }, [id, draft, updateEdgeLabel]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault();
        if (e.key === "Escape") {
          setDraft(label);
          setEditing(false);
        } else {
          commit();
        }
      }
    },
    [commit, label],
  );

  return (
    <>
      <g
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          openEditor();
        }}
      >
        {/* Wider invisible hit area for easier clicking */}
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={16}
          className="cursor-pointer"
        />
        {/* Visible edge line */}
        <path
          d={edgePath}
          fill="none"
          stroke={stroke}
          strokeWidth={1.5}
          strokeLinecap="round"
          style={{ transition: "stroke 0.15s, opacity 0.15s" }}
          markerEnd={`url(#arrow-${selected ? "selected" : hovered ? "bright" : "dim"})`}
        />
      </g>

      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
          onDoubleClick={(e) => {
            e.stopPropagation();
            openEditor();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {editing ? (
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={handleKeyDown}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="nodrag nopan min-w-[60px] rounded border border-[#00c8d4] bg-[#18181c] px-2 py-0.5 text-center text-xs text-[#e0e0f0] outline-none"
              style={{
                width: `${Math.max(60, draft.length * 8 + 24)}px`,
              }}
            />
          ) : label ? (
            <span
              className="cursor-pointer rounded-full border border-[#2a2a38] bg-[#18181c] px-2 py-0.5 text-xs text-[#a0a0b8] transition-colors hover:border-[#00c8d4] hover:text-[#e0e0f0]"
              title="Double-click to edit"
            >
              {label}
            </span>
          ) : (selected || hovered) ? (
            <span
              className="cursor-pointer rounded-full border border-[#2a2a38] bg-[#18181c] px-2 py-0.5 text-xs text-[#454560] transition-colors hover:text-[#a0a0b8]"
              title="Double-click to add label"
            >
              + Add label
            </span>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const CanvasEdgeRenderer = memo(CanvasEdgeComponent);

// Arrow marker defs to embed in the SVG canvas
export function EdgeMarkerDefs() {
  return (
    <svg style={{ position: "absolute", width: 0, height: 0 }}>
      <defs>
        <marker
          id="arrow-dim"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L8,3 z" fill="rgba(180,180,200,0.45)" />
        </marker>
        <marker
          id="arrow-bright"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L8,3 z" fill="rgba(220,220,240,0.90)" />
        </marker>
        <marker
          id="arrow-selected"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L8,3 z" fill="#00c8d4" />
        </marker>
      </defs>
    </svg>
  );
}
