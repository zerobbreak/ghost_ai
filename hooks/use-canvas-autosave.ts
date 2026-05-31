"use client";

import { useEffect, useRef, useMemo } from "react";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UseCanvasAutosaveOptions {
  projectId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  debounceMs?: number;
  enabled?: boolean;
  onStatusChange?: (status: SaveStatus) => void;
}

interface CanvasSnapshot {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  snapshot: string;
}

export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  debounceMs = 2000,
  enabled = true,
  onStatusChange,
}: UseCanvasAutosaveOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef<CanvasSnapshot | null>(null);
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const saveRef = useRef<(canvas: CanvasSnapshot) => Promise<void>>(async () => {});

  const snapshot = useMemo(() => JSON.stringify({ nodes, edges }), [nodes, edges]);

  useEffect(() => {
    saveRef.current = async (canvas: CanvasSnapshot) => {
      if (isSavingRef.current) {
        pendingSaveRef.current = canvas;
        return;
      }

      isSavingRef.current = true;
      onStatusChange?.("saving");
      try {
        const res = await fetch(`/api/projects/${projectId}/canvas`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodes: canvas.nodes, edges: canvas.edges }),
        });
        if (!isMountedRef.current) return;
        if (res.ok) {
          lastSavedSnapshotRef.current = canvas.snapshot;
          onStatusChange?.("saved");
        } else {
          onStatusChange?.("error");
        }
      } catch {
        if (isMountedRef.current) {
          onStatusChange?.("error");
        }
      } finally {
        isSavingRef.current = false;
        const pending = pendingSaveRef.current;
        pendingSaveRef.current = null;
        if (
          isMountedRef.current &&
          pending &&
          pending.snapshot !== lastSavedSnapshotRef.current
        ) {
          saveRef.current(pending).catch(() => {});
        }
      }
    };
  }, [projectId, onStatusChange]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!enabled) {
      return;
    }

    if (lastSavedSnapshotRef.current === null) {
      lastSavedSnapshotRef.current = snapshot;
      return;
    }

    if (lastSavedSnapshotRef.current === snapshot) {
      return;
    }

    timerRef.current = setTimeout(() => {
      saveRef.current({ nodes, edges, snapshot }).catch(() => {});
    }, debounceMs);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [nodes, edges, snapshot, debounceMs, enabled]);
}
