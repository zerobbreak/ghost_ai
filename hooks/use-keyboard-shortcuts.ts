"use client";

import { useEffect } from "react";
interface ZoomActions {
  zoomIn: (options?: { duration?: number }) => void;
  zoomOut: (options?: { duration?: number }) => void;
}

interface UseKeyboardShortcutsOptions {
  rfInstance: ZoomActions | null;
  onUndo: () => void;
  onRedo: () => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea") return true;
  if (target.isContentEditable) return true;
  return false;
}

export function useKeyboardShortcuts({
  rfInstance,
  onUndo,
  onRedo,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isEditableTarget(e.target)) return;

      const isMod = e.metaKey || e.ctrlKey;

      if (!isMod) {
        if (e.key === "+" || e.key === "=") {
          e.preventDefault();
          rfInstance?.zoomIn({ duration: 200 });
        } else if (e.key === "-") {
          e.preventDefault();
          rfInstance?.zoomOut({ duration: 200 });
        }
        return;
      }

      if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        if (e.shiftKey) {
          onRedo();
        } else {
          onUndo();
        }
      } else if (e.key === "y" || e.key === "Y") {
        e.preventDefault();
        onRedo();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [rfInstance, onUndo, onRedo]);
}
