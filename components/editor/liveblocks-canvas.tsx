"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent, type PointerEvent } from "react";
import {
  ReactFlow,
  MiniMap,
  Panel,
  ConnectionMode,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
  type DefaultEdgeOptions,
  type ReactFlowInstance,
} from "@xyflow/react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { useHistory, useUpdateMyPresence } from "@liveblocks/react";
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
import { LiveCursors } from "./live-cursors";
import { PresenceAvatarGroup } from "./presence-avatar-group";
import { AiStatusPanel } from "./ai-status-panel";
import { StarterTemplatesModal } from "./starter-templates-modal";
import { MermaidImportModal } from "./mermaid-import-modal";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useCanvasAutosave, type SaveStatus } from "@/hooks/use-canvas-autosave";
import { safeParseJson } from "@/lib/canvas-snapshot";
import { layoutCanvas } from "@/lib/auto-layout";
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

interface SavedCanvas {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

interface CanvasLoadResponse {
  canvas: SavedCanvas | null;
  status?: "ok" | "empty" | "invalid" | "error";
}

function isSavedCanvas(value: unknown): value is SavedCanvas {
  if (typeof value !== "object" || value === null) return false;

  const canvas = value as Partial<SavedCanvas>;
  return Array.isArray(canvas.nodes) && Array.isArray(canvas.edges);
}

function generateNodeId(shape: string): string {
  return `${shape}-${crypto.randomUUID()}`;
}

interface LiveblocksCanvasProps {
  projectId: string;
  isTemplatesOpen?: boolean;
  onTemplatesOpenChange?: (open: boolean) => void;
  isMermaidOpen?: boolean;
  onMermaidOpenChange?: (open: boolean) => void;
}

export function LiveblocksCanvas({
  projectId,
  isTemplatesOpen = false,
  onTemplatesOpenChange,
  isMermaidOpen = false,
  onMermaidOpenChange,
}: LiveblocksCanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });

  const { undo, redo } = useHistory();
  const updateMyPresence = useUpdateMyPresence();

  const [rfInstance, setRfInstance] =
    useState<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isAutosaveReady, setIsAutosaveReady] = useState(false);
  const hasLoadedRef = useRef(false);

  useKeyboardShortcuts({ rfInstance, onUndo: undo, onRedo: redo });

  useCanvasAutosave({
    projectId,
    nodes,
    edges,
    debounceMs: 2000,
    enabled: isAutosaveReady,
    onStatusChange: setSaveStatus,
  });

  useEffect(() => {
    if (hasLoadedRef.current) return;
    if (nodes.length > 0 || edges.length > 0) {
      hasLoadedRef.current = true;
      const readyTimer = window.setTimeout(() => setIsAutosaveReady(true), 0);
      return () => window.clearTimeout(readyTimer);
    }

    hasLoadedRef.current = true;
    let isCancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/canvas`);
        if (!res.ok) return;
        const text = await res.text();
        const parsed = safeParseJson(text);
        if (!parsed || typeof parsed !== "object") return;
        const data = parsed as CanvasLoadResponse;
        if (data?.status === "invalid" || data?.status === "error") {
          setSaveStatus("error");
          return;
        }
        if (!isSavedCanvas(data?.canvas)) return;
        const { nodes: savedNodes, edges: savedEdges } = data.canvas;
        if (savedNodes.length === 0 && savedEdges.length === 0) return;
        onNodesChange(savedNodes.map((n) => ({ type: "add" as const, item: n })));
        onEdgesChange(savedEdges.map((e) => ({ type: "add" as const, item: e })));
        setTimeout(() => rfInstance?.fitView({ duration: 400 }), 80);
      } catch {
        // network error or unexpected response — silently skip load
      } finally {
        if (!isCancelled) {
          setIsAutosaveReady(true);
        }
      }
    })();
    return () => {
      isCancelled = true;
    };
  // Only run once after mount — intentionally omitting nodes/edges/rfInstance
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, onNodesChange, onEdgesChange]);

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

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      const edge: CanvasEdge = {
        id: `edge-${crypto.randomUUID()}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: "canvasEdge",
        data: {},
      };

      onEdgesChange([{ type: "add", item: edge }]);
    },
    [onEdgesChange],
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

  const handleTidyLayout = useCallback(() => {
    const laidOut = layoutCanvas(nodes, edges, "TB");
    const changed = laidOut.filter((node, index) => {
      const original = nodes[index];
      return (
        node.position.x !== original.position.x ||
        node.position.y !== original.position.y
      );
    });
    if (changed.length === 0) return;

    onNodesChange(
      changed.map((node) => ({ id: node.id, type: "replace" as const, item: node })),
    );
    setTimeout(() => rfInstance?.fitView({ duration: 400 }), 80);
  }, [nodes, edges, onNodesChange, rfInstance]);

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

  const importMermaidDiagram = useCallback(
    (importedNodes: CanvasNode[], importedEdges: CanvasEdge[]) => {
      onNodesChange([
        ...nodes.map((n) => ({ type: "remove" as const, id: n.id })),
        ...importedNodes.map((n) => ({ type: "add" as const, item: n })),
      ]);
      onEdgesChange([
        ...edges.map((ed) => ({ type: "remove" as const, id: ed.id })),
        ...importedEdges.map((ed) => ({ type: "add" as const, item: ed })),
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

  const handlePointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!rfInstance) return;
      const flowPos = rfInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });
      updateMyPresence({ cursor: flowPos });
    },
    [rfInstance, updateMyPresence],
  );

  const handlePointerLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

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
      <MermaidImportModal
        open={isMermaidOpen}
        onOpenChange={(open) => onMermaidOpenChange?.(open)}
        onImport={importMermaidDiagram}
      />
      <div
        ref={canvasRef}
        className="relative h-full w-full"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <EdgeMarkerDefs />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
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
          <LiveCursors />
          <MiniMap />
          <Panel position="top-right" className="z-50 mr-3 mt-3">
            <PresenceAvatarGroup />
          </Panel>
          <Panel position="top-left" className="z-50 ml-3 mt-3">
            <AiStatusPanel />
          </Panel>
          <Panel position="bottom-left" className="z-50 mb-2 ml-2">
            <ControlBar
              rfInstance={rfInstance}
              saveStatus={saveStatus}
              onTidyLayout={handleTidyLayout}
              tidyDisabled={nodes.length === 0}
            />
          </Panel>
          <Panel position="bottom-center" className="z-50 mb-2">
            <ShapePanel onShapeDrop={addShapeNode} />
          </Panel>
        </ReactFlow>
      </div>
    </CanvasActionsProvider>
  );
}
