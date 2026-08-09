"use client";

import { createContext, useContext, type ReactNode } from "react";

interface CanvasActionsValue {
  updateNodeLabel: (nodeId: string, label: string) => void;
  updateNodeColor: (nodeId: string, color: string, textColor: string) => void;
  updateEdgeLabel: (edgeId: string, label: string) => void;
}

const CanvasActionsContext = createContext<CanvasActionsValue>({
  updateNodeLabel: () => {},
  updateNodeColor: () => {},
  updateEdgeLabel: () => {},
});

export function CanvasActionsProvider({
  children,
  updateNodeLabel,
  updateNodeColor,
  updateEdgeLabel,
}: {
  children: ReactNode;
  updateNodeLabel: (nodeId: string, label: string) => void;
  updateNodeColor: (nodeId: string, color: string, textColor: string) => void;
  updateEdgeLabel: (edgeId: string, label: string) => void;
}) {
  return (
    <CanvasActionsContext.Provider
      value={{ updateNodeLabel, updateNodeColor, updateEdgeLabel }}
    >
      {children}
    </CanvasActionsContext.Provider>
  );
}

export function useCanvasActions(): CanvasActionsValue {
  return useContext(CanvasActionsContext);
}
