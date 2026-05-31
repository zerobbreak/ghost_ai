"use client";

import { useCallback, useMemo, useState, type DragEvent } from "react";
import {
  ReactFlow,
  MiniMap,
  Panel,
  ConnectionMode,
  type NodeTypes,
  type ReactFlowInstance,
} from "@xyflow/react";
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow";
import "@xyflow/react/dist/style.css";
import "@liveblocks/react-flow/styles.css";

import { CanvasNodeRenderer } from "./canvas-node";
import { ShapePanel, DRAG_TYPE, type ShapeDragPayload } from "./shape-panel";
import { DEFAULT_NODE_COLOR } from "@/types/canvas";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";

const nodeTypes: NodeTypes = {
  canvasNode: CanvasNodeRenderer,
};

let nodeCounter = 0;

function generateNodeId(shape: string): string {
  nodeCounter += 1;
  return `${shape}-${Date.now()}-${nodeCounter}`;
}

export function LiveblocksCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });

  const [rfInstance, setRfInstance] =
    useState<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes(DRAG_TYPE)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!rfInstance) return;

      const raw = e.dataTransfer.getData(DRAG_TYPE);
      if (!raw) return;

      let payload: ShapeDragPayload;
      try {
        payload = JSON.parse(raw) as ShapeDragPayload;
      } catch {
        return;
      }

      const position = rfInstance.screenToFlowPosition({
        x: e.clientX - payload.width / 2,
        y: e.clientY - payload.height / 2,
      });

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

  const memoizedNodeTypes = useMemo(() => nodeTypes, []);

  return (
    <div
      className="relative h-full w-full"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        onInit={setRfInstance}
        nodeTypes={memoizedNodeTypes}
        connectionMode={ConnectionMode.Loose}
        style={{ backgroundColor: "var(--bg-base)" }}
        fitView
      >
        <MiniMap />
        <Cursors />
        <Panel position="bottom-center" className="mb-2">
          <ShapePanel />
        </Panel>
      </ReactFlow>
    </div>
  );
}
