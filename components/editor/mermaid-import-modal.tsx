"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Code2 } from "lucide-react";
import { parseMermaidFlowchart } from "@/lib/mermaid-parser";
import { layoutCanvas } from "@/lib/auto-layout";
import { DEFAULT_NODE_COLOR } from "@/types/canvas";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

const PLACEHOLDER = `flowchart TD
A[Start] --> B{Decide}
B -->|yes| C[(Database)]
B -->|no| D((End))`;

interface MermaidImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (nodes: CanvasNode[], edges: CanvasEdge[]) => void;
}

export function MermaidImportModal({
  open,
  onOpenChange,
  onImport,
}: MermaidImportModalProps) {
  const [text, setText] = useState("");

  const parsed = useMemo(() => {
    if (!text.trim()) return { result: null, error: null };
    try {
      return { result: parseMermaidFlowchart(text), error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not parse this diagram.";
      return { result: null, error: message };
    }
  }, [text]);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) setText("");
  }

  function handleImport() {
    if (!parsed.result) return;

    const nodes: CanvasNode[] = parsed.result.nodes.map((node) => ({
      id: node.id,
      type: "canvasNode",
      position: node.position,
      data: {
        label: node.data.label,
        shape: node.data.shape,
        color: node.data.color ?? DEFAULT_NODE_COLOR.fill,
        textColor: node.data.textColor ?? DEFAULT_NODE_COLOR.text,
      },
      style: node.style,
    }));

    const edges: CanvasEdge[] = parsed.result.edges.map((edge) => ({
      id: edge.id,
      type: "canvasEdge",
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle ?? null,
      targetHandle: edge.targetHandle ?? null,
      data: edge.data ?? {},
    }));

    const laidOut = layoutCanvas(nodes, edges, parsed.result.direction);

    onImport(laidOut, edges);
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        style={{ width: "min(640px, 92vw)", maxWidth: "none" }}
        className="border-(--color-border-default) bg-(--color-bg-surface) p-0"
      >
        <DialogHeader className="border-b border-(--color-border-default) px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-(--color-bg-elevated)">
              <Code2 className="h-3.5 w-3.5 text-(--color-text-secondary)" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-(--color-text-primary)">
                Import from Mermaid
              </DialogTitle>
              <p className="text-xs text-(--color-text-muted)">
                Paste flowchart syntax — this replaces the current canvas
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3 px-6 py-5">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={10}
            className="border-(--color-border-subtle) bg-(--color-bg-base) font-mono text-xs text-(--color-text-primary)"
            spellCheck={false}
          />

          {parsed.error ? (
            <p role="alert" className="text-xs leading-relaxed text-red-400">
              {parsed.error}
            </p>
          ) : null}

          {parsed.result?.warnings.length ? (
            <ul className="list-disc space-y-0.5 pl-4 text-xs leading-relaxed text-(--color-text-muted)">
              {parsed.result.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-(--color-text-muted)">
              {parsed.result
                ? `${parsed.result.nodes.length} node${parsed.result.nodes.length === 1 ? "" : "s"}, ${parsed.result.edges.length} edge${parsed.result.edges.length === 1 ? "" : "s"}`
                : "Supports flowchart shapes, arrows, and edge labels"}
            </p>
            <Button
              size="sm"
              onClick={handleImport}
              disabled={!parsed.result}
              className="h-8 px-4 text-xs"
            >
              Import
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
