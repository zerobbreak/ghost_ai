"use client";

import { useEffect, useMemo, useRef } from "react";
import { Bot, Download, FileText, HelpCircle, Loader2 } from "lucide-react";
import type { AiChatMessage } from "@/hooks/use-ai-chat-feed";
import { parseClarificationMessage } from "@/lib/ai-clarification";
import type { ProjectSpecSummary } from "@/lib/project-specs";
import type { AiChatFeedPayload } from "@/types/tasks";
import {
  ACCENT_AI,
  ACCENT_AI_DIM,
  ACCENT_AI_RIM,
  ACCENT_AI_TEXT,
  ACCENT_PRIMARY,
  ACCENT_PRIMARY_RIM,
  alpha,
  BG_ELEVATED,
  BG_SURFACE,
  BORDER_DEFAULT,
  STATE_WARNING,
  STATE_WARNING_DIM,
  STATE_WARNING_RIM,
  TEXT_FAINT,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "@/components/editor/ai-theme";

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

/* ─── merged timeline entries ────────────────────────────── */
type TimelineEntry =
  | { kind: "message"; id: string; timestamp: number; payload: AiChatFeedPayload }
  | { kind: "spec"; id: string; timestamp: number; spec: ProjectSpecSummary };

function buildTimeline(
  messages: AiChatMessage[],
  specs: ProjectSpecSummary[],
): TimelineEntry[] {
  const messageEntries: TimelineEntry[] = messages.map((m) => ({
    kind: "message",
    id: `message-${m.id}`,
    timestamp: m.payload.timestamp,
    payload: m.payload,
  }));

  const specEntries: TimelineEntry[] = specs.map((s) => ({
    kind: "spec",
    id: `spec-${s.id}`,
    timestamp: Date.parse(s.createdAt),
    spec: s,
  }));

  return [...messageEntries, ...specEntries].sort(
    (a, b) => a.timestamp - b.timestamp,
  );
}

/* ─── public component ──────────────────────────────────── */
interface AiTimelineProps {
  messages: AiChatMessage[];
  specs: ProjectSpecSummary[];
  isDesignRunActive: boolean;
  designStatusText: string | null;
  isSpecRunActive: boolean;
  specProgressText: string | null;
  onSelectSpec: (spec: ProjectSpecSummary) => void;
  onDownloadSpec: (spec: ProjectSpecSummary) => void;
  onPromptSelect: (prompt: string) => void;
}

export function AiTimeline({
  messages,
  specs,
  isDesignRunActive,
  designStatusText,
  isSpecRunActive,
  specProgressText,
  onSelectSpec,
  onDownloadSpec,
  onPromptSelect,
}: AiTimelineProps) {
  const timeline = useMemo(
    () => buildTimeline(messages, specs),
    [messages, specs],
  );
  const isActivityLive = isDesignRunActive || isSpecRunActive;
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [timeline.length, isActivityLive]);

  if (timeline.length === 0 && !isActivityLive) {
    return <TimelineEmptyState onPromptSelect={onPromptSelect} />;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "16px",
      }}
    >
      {timeline.map((entry) =>
        entry.kind === "spec" ? (
          <SpecCard
            key={entry.id}
            spec={entry.spec}
            onSelect={onSelectSpec}
            onDownload={onDownloadSpec}
          />
        ) : (
          <MessageEntry key={entry.id} payload={entry.payload} />
        ),
      )}

      {isActivityLive ? (
        <LiveActivityCard
          text={
            isDesignRunActive
              ? (designStatusText ?? "Ghost AI is working…")
              : (specProgressText ?? "Generating specification…")
          }
        />
      ) : null}

      <div ref={bottomRef} />
    </div>
  );
}

/* ─── message entry (plain / clarification) ─────────────── */
function formatChatTimestamp(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function MessageEntry({ payload }: { payload: AiChatFeedPayload }) {
  const isUser = payload.role === "user";
  const isAssistant = payload.role === "assistant";
  const questions = isAssistant ? parseClarificationMessage(payload.content) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          paddingInline: isUser ? "4px" : "28px",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.04em",
            color: isAssistant ? ACCENT_AI_TEXT : TEXT_MUTED,
            fontFamily: "var(--font-geist-mono), monospace",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {payload.sender}
        </span>
        <time
          dateTime={new Date(payload.timestamp).toISOString()}
          style={{
            fontSize: "9px",
            letterSpacing: "0.04em",
            color: TEXT_FAINT,
            fontFamily: "var(--font-geist-mono), monospace",
            flexShrink: 0,
          }}
        >
          {formatChatTimestamp(payload.timestamp)}
        </time>
      </div>

      {questions ? (
        <ClarificationCard questions={questions} />
      ) : (
        <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", gap: "8px" }}>
          {isAssistant && <AvatarBadge />}
          <div
            style={{
              maxWidth: "82%",
              padding: "9px 13px",
              fontSize: "13px",
              lineHeight: "1.55",
              overflowWrap: "break-word",
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
              ...(isUser
                ? {
                    borderRadius: "14px 14px 4px 14px",
                    background: alpha(ACCENT_PRIMARY, 12),
                    border: `1px solid ${ACCENT_PRIMARY_RIM}`,
                    color: TEXT_PRIMARY,
                  }
                : {
                    borderRadius: "4px 14px 14px 14px",
                    background: BG_ELEVATED,
                    border: `1px solid ${BORDER_DEFAULT}`,
                    color: TEXT_SECONDARY,
                  }),
            }}
          >
            {payload.content}
          </div>
        </div>
      )}
    </div>
  );
}

function AvatarBadge() {
  return (
    <div
      style={{
        width: "20px",
        height: "20px",
        flexShrink: 0,
        marginTop: "3px",
        borderRadius: "6px",
        background: ACCENT_AI_DIM,
        border: `1px solid ${ACCENT_AI_RIM}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Bot className="h-2.5 w-2.5" style={{ color: ACCENT_AI_TEXT }} />
    </div>
  );
}

/* ─── clarification card ────────────────────────────────── */
function ClarificationCard({ questions }: { questions: string[] }) {
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <div
        style={{
          width: "20px",
          height: "20px",
          flexShrink: 0,
          marginTop: "3px",
          borderRadius: "6px",
          background: STATE_WARNING_DIM,
          border: `1px solid ${STATE_WARNING_RIM}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <HelpCircle className="h-2.5 w-2.5" style={{ color: STATE_WARNING }} />
      </div>
      <div
        style={{
          maxWidth: "82%",
          padding: "11px 13px",
          borderRadius: "4px 14px 14px 14px",
          background: STATE_WARNING_DIM,
          border: `1px solid ${STATE_WARNING_RIM}`,
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: STATE_WARNING,
            fontFamily: "var(--font-geist-mono), monospace",
          }}
        >
          Needs clarification
        </p>
        <ol style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {questions.map((question, index) => (
            <li
              key={index}
              style={{ fontSize: "13px", lineHeight: 1.5, color: TEXT_SECONDARY }}
            >
              {question}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ─── spec card ──────────────────────────────────────────── */
function formatSpecDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function SpecCard({
  spec,
  onSelect,
  onDownload,
}: {
  spec: ProjectSpecSummary;
  onSelect: (spec: ProjectSpecSummary) => void;
  onDownload: (spec: ProjectSpecSummary) => void;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", gap: "8px" }}>
      <div
        style={{
          width: "20px",
          height: "20px",
          flexShrink: 0,
          marginTop: "3px",
          borderRadius: "6px",
          background: ACCENT_AI_DIM,
          border: `1px solid ${ACCENT_AI_RIM}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FileText className="h-2.5 w-2.5" style={{ color: ACCENT_AI_TEXT }} />
      </div>
      <button
        type="button"
        onClick={() => onSelect(spec)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          maxWidth: "82%",
          width: "100%",
          padding: "10px 12px",
          borderRadius: "4px 14px 14px 14px",
          border: `1px solid ${BORDER_DEFAULT}`,
          background: BG_ELEVATED,
          cursor: "pointer",
          textAlign: "left",
          transition: "border-color 0.12s, background 0.12s",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.borderColor = ACCENT_AI_RIM;
          el.style.background = ACCENT_AI_DIM;
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.borderColor = BORDER_DEFAULT;
          el.style.background = BG_ELEVATED;
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              fontWeight: 600,
              color: TEXT_PRIMARY,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {spec.filename}
          </p>
          <p
            style={{
              margin: 0,
              marginTop: "2px",
              fontSize: "9px",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: TEXT_FAINT,
              fontFamily: "var(--font-geist-mono), monospace",
            }}
          >
            Spec generated · {formatSpecDate(spec.createdAt)}
          </p>
        </div>

        <span
          role="button"
          tabIndex={0}
          aria-label={`Download ${spec.filename}`}
          onClick={(e) => {
            e.stopPropagation();
            onDownload(spec);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onDownload(spec);
            }
          }}
          style={{
            width: "24px",
            height: "24px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "6px",
            color: TEXT_MUTED,
            cursor: "pointer",
          }}
        >
          <Download className="h-[13px] w-[13px]" />
        </span>
      </button>
    </div>
  );
}

/* ─── live activity (trailing, ephemeral) ───────────────── */
function LiveActivityCard({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", gap: "8px" }}>
      <div
        style={{
          width: "20px",
          height: "20px",
          flexShrink: 0,
          marginTop: "3px",
          borderRadius: "6px",
          background: ACCENT_AI_DIM,
          border: `1px solid ${ACCENT_AI_RIM}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader2 className="h-2.5 w-2.5 animate-spin" style={{ color: ACCENT_AI_TEXT }} />
      </div>
      <div
        aria-live="polite"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          maxWidth: "82%",
          padding: "9px 13px",
          borderRadius: "4px 14px 14px 14px",
          background: ACCENT_AI_DIM,
          border: `1px solid ${ACCENT_AI_RIM}`,
        }}
      >
        <span
          className="animate-pulse"
          style={{
            width: "6px",
            height: "6px",
            flexShrink: 0,
            borderRadius: "50%",
            background: ACCENT_AI,
          }}
        />
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            lineHeight: 1.45,
            color: TEXT_SECONDARY,
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}

/* ─── empty state ────────────────────────────────────────── */
function TimelineEmptyState({
  onPromptSelect,
}: {
  onPromptSelect: (p: string) => void;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
        gap: "28px",
        textAlign: "center",
        minHeight: "100%",
      }}
    >
      <div style={{ position: "relative", width: "80px", height: "80px" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `1px dashed ${alpha(ACCENT_AI, 12)}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "10px",
            borderRadius: "50%",
            border: `1px dashed ${alpha(ACCENT_AI, 22)}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "20px",
            borderRadius: "50%",
            background: ACCENT_AI_DIM,
            border: `1px solid ${ACCENT_AI_RIM}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Bot className="h-[18px] w-[18px]" style={{ color: ACCENT_AI_TEXT }} />
        </div>
      </div>

      <div>
        <p
          style={{
            margin: 0,
            marginBottom: "8px",
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: ACCENT_AI_TEXT,
            fontFamily: "var(--font-geist-mono), monospace",
          }}
        >
          Ready to Design
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            lineHeight: "1.65",
            color: TEXT_MUTED,
            maxWidth: "220px",
          }}
        >
          Describe a system, chat with collaborators, and generate specs — all in one timeline.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", maxWidth: "260px" }}>
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPromptSelect(prompt)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 12px",
              borderRadius: "8px",
              background: BG_SURFACE,
              border: `1px solid ${BORDER_DEFAULT}`,
              cursor: "pointer",
              textAlign: "left",
              transition: "border-color 0.12s, background 0.12s",
            }}
            onMouseEnter={(e) => {
              const b = e.currentTarget;
              b.style.borderColor = ACCENT_AI_RIM;
              b.style.background = ACCENT_AI_DIM;
            }}
            onMouseLeave={(e) => {
              const b = e.currentTarget;
              b.style.borderColor = BORDER_DEFAULT;
              b.style.background = BG_SURFACE;
            }}
          >
            <span
              style={{
                fontSize: "13px",
                color: ACCENT_AI,
                fontFamily: "var(--font-geist-mono), monospace",
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              ›
            </span>
            <span style={{ fontSize: "12px", color: TEXT_SECONDARY }}>{prompt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
