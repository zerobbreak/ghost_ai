"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import {
  ReactFlow,
  MiniMap,
  Panel,
  ConnectionMode,
  type NodeTypes,
  type EdgeTypes,
  type DefaultEdgeOptions,
  type ReactFlowInstance,
} from "@xyflow/react";
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow";
import { useHistory } from "@liveblocks/react";
import "@xyflow/react/dist/style.css";
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-flow/styles.css";

import { CanvasNodeRenderer } from "./canvas-node";
import { CanvasEdgeRenderer, EdgeMarkerDefs } from "./canvas-edge";
import {
  ShapePanel,
  DRAG_FALLBACK_TYPE,
  DRAG_TYPE,
  type ShapeDragPayload,
} from "./shape-panel";
import { CanvasActionsProvider } from "./canvas-actions-context";
import { ControlBar } from "./control-bar";
import { StarterTemplatesModal } from "./starter-templates-modal";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { DEFAULT_NODE_COLOR } from "@/types/canvas";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";
import type { CanvasTemplate } from "./starter-templates";

const nodeTypes: NodeTypes = {
  canvasNode: CanvasNodeRenderer,
};

const edgeTypes: EdgeTypes = {
  canvasEdge: CanvasEdgeRenderer,
};

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: "canvasEdge",
};

function generateNodeId(shape: string): string {
  return `${shape}-${crypto.randomUUID()}`;
}

interface LiveblocksCanvasProps {
  isTemplatesOpen?: boolean;
  onTemplatesOpenChange?: (open: boolean) => void;
}

export function LiveblocksCanvas({
  isTemplatesOpen = false,
  onTemplatesOpenChange,
}: LiveblocksCanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });

  const { undo, redo } = useHistory();

  const [rfInstance, setRfInstance] =
    useState<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useKeyboardShortcuts({ rfInstance, onUndo: undo, onRedo: redo });

  const updateNodeLabel = useCallback(
    (nodeId: string, label: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      onNodesChange([
        {
          id: nodeId,
          type: "replace",
          item: { ...node, data: { ...node.data, label } },
        },
      ]);
    },
    [nodes, onNodesChange],
  );

  const updateNodeColor = useCallback(
    (nodeId: string, color: string, textColor: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      onNodesChange([
        {
          id: nodeId,
          type: "replace",
          item: { ...node, data: { ...node.data, color, textColor } },
        },
      ]);
    },
    [nodes, onNodesChange],
  );

  const updateEdgeLabel = useCallback(
    (edgeId: string, label: string) => {
      const edge = edges.find((e) => e.id === edgeId);
      if (!edge) return;
      onEdgesChange([
        {
          id: edgeId,
          type: "replace",
          item: { ...edge, data: { ...edge.data, label } },
        },
      ]);
    },
    [edges, onEdgesChange],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const addShapeNode = useCallback(
    (payload: ShapeDragPayload, point: { x: number; y: number }) => {
      if (!rfInstance) return;

      const canvasBounds = canvasRef.current?.getBoundingClientRect();
      if (
        canvasBounds &&
        (point.x < canvasBounds.left ||
          point.x > canvasBounds.right ||
          point.y < canvasBounds.top ||
          point.y > canvasBounds.bottom)
      ) {
        return;
      }

      const flowPoint = rfInstance.screenToFlowPosition(point);
      const position = {
        x: flowPoint.x - payload.width / 2,
        y: flowPoint.y - payload.height / 2,
      };

      const newNode: CanvasNode = {
        id: generateNodeId(payload.shape),
        type: "canvasNode",
        position,
        data: {
          label: "",
          shape: payload.shape,
          color: DEFAULT_NODE_COLOR.fill,
          textColor: DEFAULT_NODE_COLOR.text,
        },
        style: {
          width: payload.width,
          height: payload.height,
        },
      };

      onNodesChange([{ type: "add", item: newNode }]);
    },
    [rfInstance, onNodesChange],
  );

  const importTemplate = useCallback(
    (template: CanvasTemplate) => {
      onNodesChange([
        ...nodes.map((n) => ({ type: "remove" as const, id: n.id })),
        ...template.nodes.map((n) => ({ type: "add" as const, item: n })),
      ]);
      onEdgesChange([
        ...edges.map((ed) => ({ type: "remove" as const, id: ed.id })),
        ...template.edges.map((ed) => ({ type: "add" as const, item: ed })),
      ]);
      setTimeout(() => rfInstance?.fitView({ duration: 400 }), 80);
    },
    [nodes, edges, onNodesChange, onEdgesChange, rfInstance],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();

      const raw =
        e.dataTransfer.getData(DRAG_TYPE) ||
        e.dataTransfer.getData(DRAG_FALLBACK_TYPE);
      if (!raw) return;

      let payload: ShapeDragPayload;
      try {
        payload = JSON.parse(raw) as ShapeDragPayload;
      } catch {
        return;
      }

      addShapeNode(payload, { x: e.clientX, y: e.clientY });
    },
    [addShapeNode],
  );

  return (
    <CanvasActionsProvider
      updateNodeLabel={updateNodeLabel}
      updateNodeColor={updateNodeColor}
      updateEdgeLabel={updateEdgeLabel}
    >
      <StarterTemplatesModal
        open={isTemplatesOpen}
        onOpenChange={(open) => onTemplatesOpenChange?.(open)}
        onImport={importTemplate}
      />
      <div ref={canvasRef} className="relative h-full w-full">
        <EdgeMarkerDefs />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDelete={onDelete}
          onInit={setRfInstance}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          connectionMode={ConnectionMode.Loose}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{ backgroundColor: "var(--bg-base)" }}
          fitView
        >
          <MiniMap />
          <Cursors />
          <Panel position="bottom-left" className="mb-2 ml-2">
            <ControlBar rfInstance={rfInstance} />
          </Panel>
          <Panel position="bottom-center" className="mb-2">
            <ShapePanel onShapeDrop={addShapeNode} />
          </Panel>
        </ReactFlow>
      </div>
    </CanvasActionsProvider>
  );
}
