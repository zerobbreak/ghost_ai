"use client";

import type { ReactNode } from "react";
import { useHistory, useCanUndo, useCanRedo } from "@liveblocks/react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo2,
  Redo2,
  Loader2,
  Check,
  AlertCircle,
  LayoutGrid,
} from "lucide-react";
import type { SaveStatus } from "@/hooks/use-canvas-autosave";

interface ViewportActions {
  zoomIn: (options?: { duration?: number }) => void;
  zoomOut: (options?: { duration?: number }) => void;
  fitView: (options?: { duration?: number }) => void;
}

interface ControlBarProps {
  rfInstance: ViewportActions | null;
  saveStatus?: SaveStatus;
  onTidyLayout?: () => void;
  tidyDisabled?: boolean;
}

export function ControlBar({
  rfInstance,
  saveStatus = "idle",
  onTidyLayout,
  tidyDisabled = false,
}: ControlBarProps) {
  const { undo, redo } = useHistory();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  return (
    <div className="flex items-center gap-1 rounded-full bg-[#1a1a2e]/90 px-2 py-1.5 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-0.5">
        <ControlButton
          onClick={() => rfInstance?.zoomOut({ duration: 200 })}
          title="Zoom out (−)"
        >
          <ZoomOut size={14} />
        </ControlButton>
        <ControlButton
          onClick={() => rfInstance?.fitView({ duration: 300 })}
          title="Fit view"
        >
          <Maximize2 size={14} />
        </ControlButton>
        <ControlButton
          onClick={() => rfInstance?.zoomIn({ duration: 200 })}
          title="Zoom in (+)"
        >
          <ZoomIn size={14} />
        </ControlButton>
      </div>

      <div className="mx-1.5 h-4 w-px bg-white/15" />

      <div className="flex items-center gap-0.5">
        <ControlButton
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={14} />
        </ControlButton>
        <ControlButton
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 size={14} />
        </ControlButton>
      </div>

      {onTidyLayout ? (
        <>
          <div className="mx-1.5 h-4 w-px bg-white/15" />
          <ControlButton
            onClick={onTidyLayout}
            disabled={tidyDisabled}
            title="Tidy layout"
          >
            <LayoutGrid size={14} />
          </ControlButton>
        </>
      ) : null}

      {saveStatus !== "idle" && (
        <>
          <div className="mx-1.5 h-4 w-px bg-white/15" />
          <SaveIndicator status={saveStatus} />
        </>
      )}
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "saving") {
    return (
      <div
        className="flex items-center gap-1 px-1 text-white/50"
        title="Saving…"
      >
        <Loader2 size={12} className="animate-spin" />
        <span className="text-[10px] leading-none">Saving</span>
      </div>
    );
  }

  if (status === "saved") {
    return (
      <div
        className="flex items-center gap-1 px-1 text-emerald-400/80"
        title="Saved"
      >
        <Check size={12} />
        <span className="text-[10px] leading-none">Saved</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        className="flex items-center gap-1 px-1 text-red-400/80"
        title="Save failed"
      >
        <AlertCircle size={12} />
        <span className="text-[10px] leading-none">Error</span>
      </div>
    );
  }

  return null;
}

interface ControlButtonProps {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: ReactNode;
}

function ControlButton({
  onClick,
  disabled = false,
  title,
  children,
}: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={[
        "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
        disabled
          ? "cursor-not-allowed text-white/25"
          : "text-white/70 hover:bg-white/10 hover:text-white",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
