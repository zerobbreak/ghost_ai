"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LayoutTemplate } from "lucide-react";
import { CANVAS_TEMPLATES, type CanvasTemplate } from "./starter-templates";
import type { CanvasNode } from "@/types/canvas";

interface StarterTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (template: CanvasTemplate) => void;
}

export function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
}: StarterTemplatesModalProps) {
  function handleImport(template: CanvasTemplate) {
    onImport(template);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{ width: "min(860px, 92vw)", maxWidth: "none" }}
        className="border-(--color-border-default) bg-(--color-bg-surface) p-0"
      >
        <DialogHeader className="border-b border-(--color-border-default) px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-(--color-bg-elevated)">
              <LayoutTemplate className="h-3.5 w-3.5 text-(--color-text-secondary)" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-(--color-text-primary)">
                Starter Templates
              </DialogTitle>
              <p className="text-xs text-(--color-text-muted)">
                Pick a pre-built diagram to start from
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-x-auto px-6 py-5">
          <div className="flex flex-row gap-4" style={{ minWidth: "max-content" }}>
            {CANVAS_TEMPLATES.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onImport={handleImport}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TemplateCardProps {
  template: CanvasTemplate;
  onImport: (template: CanvasTemplate) => void;
}

function TemplateCard({ template, onImport }: TemplateCardProps) {
  return (
    <div className="group flex w-64 shrink-0 flex-col overflow-hidden rounded-2xl border border-(--color-border-default) bg-(--color-bg-elevated) transition-colors hover:border-(--color-border-subtle)">
      <div className="flex h-28 items-center justify-center overflow-hidden bg-(--color-bg-base)">
        <DiagramPreview template={template} />
      </div>

      <div className="flex flex-1 flex-col justify-between p-3">
        <div className="mb-3">
          <p className="text-sm font-medium text-(--color-text-primary)">
            {template.name}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-(--color-text-muted) line-clamp-2">
            {template.description}
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => onImport(template)}
          className="h-7 w-full border-(--color-border-subtle) bg-transparent text-xs text-(--color-text-secondary) hover:bg-(--color-bg-subtle) hover:text-(--color-text-primary)"
          variant="outline"
        >
          Import
        </Button>
      </div>
    </div>
  );
}

const PREVIEW_W = 240;
const PREVIEW_H = 120;
const PREVIEW_PADDING = 12;

function getNodeDimensions(node: CanvasNode): { w: number; h: number } {
  return {
    w: (node.style?.width as number) ?? 140,
    h: (node.style?.height as number) ?? 50,
  };
}

function getPreviewTransform(nodes: CanvasNode[]): {
  toPreviewX: (x: number) => number;
  toPreviewY: (y: number) => number;
  scale: number;
} {
  if (!nodes.length) {
    return { toPreviewX: (x) => x, toPreviewY: (y) => y, scale: 1 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const { w, h } = getNodeDimensions(node);
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + w);
    maxY = Math.max(maxY, node.position.y + h);
  }

  const boundsW = maxX - minX || 1;
  const boundsH = maxY - minY || 1;
  const availW = PREVIEW_W - PREVIEW_PADDING * 2;
  const availH = PREVIEW_H - PREVIEW_PADDING * 2;
  const scale = Math.min(availW / boundsW, availH / boundsH);

  const scaledW = boundsW * scale;
  const scaledH = boundsH * scale;
  const offsetX = PREVIEW_PADDING + (availW - scaledW) / 2;
  const offsetY = PREVIEW_PADDING + (availH - scaledH) / 2;

  return {
    toPreviewX: (x: number) => offsetX + (x - minX) * scale,
    toPreviewY: (y: number) => offsetY + (y - minY) * scale,
    scale,
  };
}

function NodeShape({
  node,
  px,
  py,
  pw,
  ph,
}: {
  node: CanvasNode;
  px: number;
  py: number;
  pw: number;
  ph: number;
}) {
  const fill = node.data.color ?? "#1F1F1F";
  const stroke = node.data.textColor ?? "#EDEDED";
  const strokeProps = { stroke, strokeWidth: 0.75, strokeOpacity: 0.5 };

  switch (node.data.shape) {
    case "circle":
      return (
        <ellipse
          cx={px + pw / 2}
          cy={py + ph / 2}
          rx={pw / 2}
          ry={ph / 2}
          fill={fill}
          {...strokeProps}
        />
      );

    case "pill":
      return (
        <rect
          x={px}
          y={py}
          width={pw}
          height={ph}
          rx={ph / 2}
          fill={fill}
          {...strokeProps}
        />
      );

    case "diamond": {
      const cx = px + pw / 2;
      const cy = py + ph / 2;
      const points = `${cx},${py} ${px + pw},${cy} ${cx},${py + ph} ${px},${cy}`;
      return <polygon points={points} fill={fill} {...strokeProps} />;
    }

    case "hexagon": {
      const cx = px + pw / 2;
      const cy = py + ph / 2;
      const rx = pw / 2;
      const ry = ph / 2;
      const pts = [0, 1, 2, 3, 4, 5]
        .map((i) => {
          const angle = (Math.PI / 180) * (60 * i - 30);
          return `${cx + rx * Math.cos(angle)},${cy + ry * Math.sin(angle)}`;
        })
        .join(" ");
      return <polygon points={pts} fill={fill} {...strokeProps} />;
    }

    case "cylinder": {
      const ry = Math.min(ph * 0.18, 6);
      return (
        <g>
          <rect x={px} y={py + ry} width={pw} height={ph - ry} fill={fill} {...strokeProps} />
          <ellipse cx={px + pw / 2} cy={py + ry} rx={pw / 2} ry={ry} fill={fill} {...strokeProps} />
          <ellipse
            cx={px + pw / 2}
            cy={py + ph}
            rx={pw / 2}
            ry={ry}
            fill={fill}
            stroke={stroke}
            strokeWidth={0.75}
            strokeOpacity={0.3}
          />
        </g>
      );
    }

    default:
      return (
        <rect x={px} y={py} width={pw} height={ph} rx={2} fill={fill} {...strokeProps} />
      );
  }
}

function DiagramPreview({ template }: { template: CanvasTemplate }) {
  const { toPreviewX, toPreviewY, scale } = getPreviewTransform(template.nodes);

  const nodeMap = new Map(template.nodes.map((n) => [n.id, n]));
  const markerId = `arrow-${template.id}`;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${PREVIEW_W} ${PREVIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <marker
          id={markerId}
          markerWidth="5"
          markerHeight="5"
          refX="4"
          refY="2.5"
          orient="auto"
        >
          <path d="M0,0 L5,2.5 L0,5 Z" fill="#f8fafc" fillOpacity={0.35} />
        </marker>
      </defs>

      {template.edges.map((edge) => {
        const src = nodeMap.get(edge.source);
        const tgt = nodeMap.get(edge.target);
        if (!src || !tgt) return null;

        const { w: sw, h: sh } = getNodeDimensions(src);
        const { w: tw, h: th } = getNodeDimensions(tgt);

        const x1 = toPreviewX(src.position.x + sw / 2);
        const y1 = toPreviewY(src.position.y + sh / 2);
        const x2 = toPreviewX(tgt.position.x + tw / 2);
        const y2 = toPreviewY(tgt.position.y + th / 2);

        return (
          <line
            key={edge.id}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#f8fafc"
            strokeOpacity={0.25}
            strokeWidth={0.8}
            markerEnd={`url(#${markerId})`}
          />
        );
      })}

      {template.nodes.map((node) => {
        const { w, h } = getNodeDimensions(node);
        const px = toPreviewX(node.position.x);
        const py = toPreviewY(node.position.y);
        const pw = Math.max(w * scale, 10);
        const ph = Math.max(h * scale, 6);

        return (
          <NodeShape
            key={node.id}
            node={node}
            px={px}
            py={py}
            pw={pw}
            ph={ph}
          />
        );
      })}
    </svg>
  );
}
