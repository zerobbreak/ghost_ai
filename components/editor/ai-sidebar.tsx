"use client";

import { FormEvent, KeyboardEvent, useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { ArrowUp, Bot, Loader2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAiChatFeed } from "@/hooks/use-ai-chat-feed";
import { useAiDesignRun } from "@/hooks/use-ai-design-run";
import { useAiSpecRun } from "@/hooks/use-ai-spec-run";
import { useAiStatusFeed } from "@/hooks/use-ai-status-feed";
import { useProjectSpecs } from "@/hooks/use-project-specs";
import { toUserFriendlyError } from "@/lib/user-friendly-error";
import { AiTimeline } from "@/components/editor/ai-timeline";
import {
  ACCENT_AI,
  ACCENT_AI_DIM,
  ACCENT_AI_RIM,
  ACCENT_AI_RIM_SUBTLE,
  ACCENT_AI_TEXT,
  ACCENT_PRIMARY,
  ACCENT_PRIMARY_RIM,
  alpha,
  BG_BASE,
  BG_ELEVATED,
  BG_SUBTLE,
  BG_SURFACE,
  BORDER_DEFAULT,
  STATE_ERROR,
  STATE_SUCCESS,
  TEXT_FAINT,
  TEXT_MUTED,
  TEXT_PRIMARY,
} from "@/components/editor/ai-theme";
import type { ProjectSpecSummary } from "@/lib/project-specs";
import type { SpecChatHistoryItem } from "@/lib/spec-generation-schema";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

const SpecPreviewDialog = dynamic(
  () =>
    import("@/components/editor/spec-preview-dialog").then(
      (mod) => mod.SpecPreviewDialog,
    ),
  { ssr: false },
);

/* ─── types ────────────────────────────────────────────── */
interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

/* ═══════════════════════════════════════════════════════ */
export function AiSidebar({ isOpen, onClose, projectId }: AiSidebarProps) {
  const [draft, setDraft] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [previewSpec, setPreviewSpec] = useState<ProjectSpecSummary | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { nodes, edges } = useLiveblocksFlow<CanvasNode, CanvasEdge>({
    suspense: true,
    nodes: { initial: [] },
    edges: { initial: [] },
  });

  const { displayText, isActive: isAiGenerating, phase: aiStatusPhase } =
    useAiStatusFeed();
  const {
    messages,
    sendMessage,
    sendAssistantMessage,
    isSending,
    sendError,
    clearSendError,
  } = useAiChatFeed();
  const {
    specs,
    fetchSpecContent,
    downloadSpec,
    refreshSpecs,
  } = useProjectSpecs(projectId, true);

  const handleRunComplete = useCallback(
    async (message: string) => {
      await sendAssistantMessage(message);
    },
    [sendAssistantMessage],
  );

  const handleRunError = useCallback(
    async (message: string) => {
      await sendAssistantMessage(message);
    },
    [sendAssistantMessage],
  );

  const {
    startDesignRun,
    isSubmitting,
    submitError,
    clearSubmitError,
  } = useAiDesignRun({
    projectId,
    aiStatusPhase,
    aiStatusText: displayText,
    onRunComplete: handleRunComplete,
    onRunError: handleRunError,
  });

  const handleSpecRunComplete = useCallback(async () => {
    await refreshSpecs();
  }, [refreshSpecs]);

  const handleSpecRunError = useCallback(
    async (message: string) => {
      await sendAssistantMessage(message);
    },
    [sendAssistantMessage],
  );

  const {
    startSpecRun,
    isRunActive: isSpecRunActive,
    progressText: specProgressText,
    submitError: specSubmitError,
    clearSubmitError: clearSpecSubmitError,
  } = useAiSpecRun({
    projectId,
    onRunComplete: handleSpecRunComplete,
    onRunError: handleSpecRunError,
  });

  const isInputLocked = isSending || isSubmitting || isAiGenerating || isSpecRunActive;
  const chatError = sendError ?? submitError ?? specSubmitError;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  function resizeTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  function handleDraftChange(v: string) {
    setDraft(v);
    requestAnimationFrame(resizeTextarea);
  }

  function handlePromptSelect(p: string) {
    handleDraftChange(p);
    textareaRef.current?.focus();
  }

  async function handleSubmit(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || isInputLocked) return;

    clearSendError();
    clearSubmitError();
    clearSpecSubmitError();

    try {
      await sendMessage(trimmed);
      setDraft("");
      requestAnimationFrame(resizeTextarea);
      await startDesignRun(trimmed);
    } catch (error) {
      try {
        await sendAssistantMessage(toUserFriendlyError(error));
      } catch {
        // sendError is set inside the hook when publishing fails.
      }
    }
  }

  async function handleGenerateSpec() {
    if (isInputLocked) return;

    clearSendError();
    clearSubmitError();
    clearSpecSubmitError();

    const chatHistory: SpecChatHistoryItem[] = messages.map((m) => m.payload);

    try {
      await startSpecRun(chatHistory, nodes, edges);
    } catch {
      // specSubmitError is set inside the hook when the request fails.
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function openSpecPreview(spec: ProjectSpecSummary) {
    setPreviewSpec(spec);
    setIsPreviewOpen(true);
  }

  function handlePreviewOpenChange(open: boolean) {
    setIsPreviewOpen(open);
    if (!open) setPreviewSpec(null);
  }

  /* ── shell ─────────────────────────────────────────────── */
  return (
    <aside
      className={cn(
        "absolute bottom-0 right-0 top-12 z-70 flex flex-col",
        "transition-transform duration-200 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full",
      )}
      style={{
        width: "340px",
        maxWidth: "340px",
        overflow: "hidden",
        background: BG_BASE,
        borderLeft: `1px solid ${ACCENT_AI_RIM_SUBTLE}`,
        boxShadow: "-24px 0 64px rgba(0,0,0,0.75)",
      }}
      aria-hidden={!isOpen}
    >
      {/* ── frequency stripe ──────────────────────────────── */}
      <div style={{ height: "2px", background: ACCENT_AI, flexShrink: 0 }} />

      {/* ── header ────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 16px 12px",
        flexShrink: 0,
        borderBottom: `1px solid ${BORDER_DEFAULT}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* icon + live dot */}
          <div style={{ position: "relative" }}>
            <div style={{
              width: "34px", height: "34px",
              borderRadius: "10px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: ACCENT_AI_DIM,
              border: `1px solid ${ACCENT_AI_RIM}`,
            }}>
              <Bot className="h-4 w-4" style={{ color: ACCENT_AI_TEXT }} />
            </div>
            <span
              className={isInputLocked ? "animate-pulse" : undefined}
              style={{
                position: "absolute", top: "-2px", right: "-2px",
                width: "8px", height: "8px",
                background: isInputLocked ? ACCENT_AI : STATE_SUCCESS,
                borderRadius: "50%",
                border: `2px solid ${BG_BASE}`,
              }}
            />
          </div>

          {/* copy */}
          <div>
            <p style={{ fontSize: "13px", fontWeight: 600, color: TEXT_PRIMARY, margin: 0, letterSpacing: "-0.01em" }}>
              AI Workspace
            </p>
            <p style={{
              fontSize: "9px", margin: 0, marginTop: "2px",
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: isInputLocked ? ACCENT_AI_TEXT : TEXT_FAINT,
              fontFamily: "var(--font-geist-mono), monospace",
            }}>
              {isInputLocked ? "Ghost AI · Working" : "Ghost AI · Online"}
            </p>
          </div>
        </div>

        {/* close */}
        <button
          onClick={onClose}
          aria-label="Close AI sidebar"
          style={{
            width: "28px", height: "28px",
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: "8px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: TEXT_MUTED,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = TEXT_PRIMARY; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = TEXT_MUTED; }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── unified timeline ─────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", width: "100%" }}>
        <AiTimeline
          messages={messages}
          specs={specs}
          isDesignRunActive={isAiGenerating}
          designStatusText={displayText}
          isSpecRunActive={isSpecRunActive}
          specProgressText={specProgressText}
          onSelectSpec={openSpecPreview}
          onDownloadSpec={downloadSpec}
          onPromptSelect={handlePromptSelect}
        />
      </div>

      {/* ── input ─────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        style={{
          flexShrink: 0,
          width: "100%",
          borderTop: `1px solid ${BORDER_DEFAULT}`,
          padding: "12px",
          background: BG_SURFACE,
        }}
      >
        {chatError ? (
          <p
            role="alert"
            style={{
              margin: "0 0 8px",
              fontSize: "11px",
              lineHeight: 1.45,
              color: STATE_ERROR,
            }}
          >
            {chatError}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleGenerateSpec}
          disabled={isInputLocked}
          aria-busy={isSpecRunActive}
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            marginBottom: "8px",
            padding: "7px",
            borderRadius: "8px",
            border: `1px solid ${ACCENT_AI_RIM}`,
            background: ACCENT_AI_DIM,
            color: ACCENT_AI_TEXT,
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontFamily: "var(--font-geist-mono), monospace",
            cursor: isInputLocked ? "default" : "pointer",
            opacity: isInputLocked ? 0.55 : 1,
            transition: "background 0.15s",
          }}
        >
          {isSpecRunActive ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          Generate spec from canvas
        </button>

        <div style={{
          borderRadius: "12px",
          background: BG_ELEVATED,
          border: inputFocused
            ? `1px solid ${ACCENT_AI_RIM}`
            : `1px solid ${BORDER_DEFAULT}`,
          transition: "border-color 0.15s",
        }}>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => handleDraftChange(e.target.value)}
            onInput={resizeTextarea}
            onKeyDown={handleKeyDown}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder="Message the room…"
            disabled={isInputLocked}
            rows={3}
            style={{
              display: "block",
              width: "100%",
              resize: "none",
              border: "none",
              background: "transparent",
              padding: "12px 14px 8px",
              fontSize: "13px",
              color: TEXT_PRIMARY,
              outline: "none",
              fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
              minHeight: "68px",
              maxHeight: "140px",
              lineHeight: "1.55",
              boxSizing: "border-box",
            }}
            className="placeholder:text-(--color-text-faint)"
          />
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "4px 10px 10px 14px",
          }}>
            <span style={{
              fontSize: "9px",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: TEXT_FAINT,
              fontFamily: "var(--font-geist-mono), monospace",
            }}>
              Shift+Enter · new line
            </span>
            <button
              type="submit"
              disabled={!draft.trim() || isInputLocked}
              aria-busy={isInputLocked}
              style={{
                width: "28px", height: "28px",
                borderRadius: "8px",
                border: draft.trim() && !isInputLocked
                  ? `1px solid ${ACCENT_PRIMARY_RIM}`
                  : "1px solid transparent",
                cursor: draft.trim() && !isInputLocked ? "pointer" : "default",
                background: draft.trim() && !isInputLocked ? alpha(ACCENT_PRIMARY, 14) : BG_SUBTLE,
                color: draft.trim() && !isInputLocked ? ACCENT_PRIMARY : TEXT_FAINT,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s, color 0.15s, border-color 0.15s",
                flexShrink: 0,
                opacity: draft.trim() && !isInputLocked ? 1 : 0.55,
              }}
            >
              {isInputLocked ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowUp className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </form>

      <SpecPreviewDialog
        spec={previewSpec}
        open={isPreviewOpen}
        onOpenChange={handlePreviewOpenChange}
        fetchContent={fetchSpecContent}
        onDownload={downloadSpec}
      />
    </aside>
  );
}
