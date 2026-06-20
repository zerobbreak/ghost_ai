"use client";

import { FormEvent, KeyboardEvent, useCallback, useRef, useState } from "react";
import { ArrowUp, Bot, Download, FileText, Loader2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAiChatFeed } from "@/hooks/use-ai-chat-feed";
import { useAiDesignRun } from "@/hooks/use-ai-design-run";
import { useAiStatusFeed } from "@/hooks/use-ai-status-feed";
import { toUserFriendlyError } from "@/lib/user-friendly-error";
import type { AiChatFeedPayload } from "@/types/tasks";

/* ─── design constants ─────────────────────────────────── */
const AI      = "#6457f9";
const AI_TEXT = "#8b82ff";
const AI_DIM  = "rgba(100,87,249,0.08)";
const AI_MID  = "rgba(100,87,249,0.18)";
const AI_RIM  = "rgba(100,87,249,0.28)";
const CHAT_USER_GREEN = "#62C073";
const CHAT_USER_GREEN_DIM = "rgba(98, 192, 115, 0.16)";
const CHAT_USER_GREEN_RIM = "rgba(98, 192, 115, 0.32)";

/* ─── types ────────────────────────────────────────────── */
interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}
type Tab = "architect" | "specs";

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

/* ═══════════════════════════════════════════════════════ */
export function AiSidebar({ isOpen, onClose, projectId }: AiSidebarProps) {
  const [activeTab,   setActiveTab]   = useState<Tab>("architect");
  const [draft,       setDraft]       = useState("");
  const [inputFocused, setInputFocused] = useState(false);
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

  const isInputLocked = isSending || isSubmitting || isAiGenerating;
  const showStatusStrip = isAiGenerating || isSubmitting;
  const chatError = sendError ?? submitError;
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

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
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
        background: "#08080a",
        borderLeft: `1px solid rgba(100,87,249,0.15)`,
        boxShadow: "-24px 0 64px rgba(0,0,0,0.75)",
      }}
      aria-hidden={!isOpen}
    >
      {/* ── frequency stripe ──────────────────────────────── */}
      <div style={{ height: "2px", background: AI, flexShrink: 0 }} />

      {/* ── header ────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 16px 12px",
        flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* icon + live dot */}
          <div style={{ position: "relative" }}>
            <div style={{
              width: "34px", height: "34px",
              borderRadius: "10px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: AI_DIM,
              border: `1px solid ${AI_RIM}`,
            }}>
              <Bot className="h-4 w-4" style={{ color: AI_TEXT }} />
            </div>
            <span
              className="animate-pulse"
              style={{
                position: "absolute", top: "-2px", right: "-2px",
                width: "8px", height: "8px",
                background: "#34d399",
                borderRadius: "50%",
                border: "2px solid #08080a",
              }}
            />
          </div>

          {/* copy */}
          <div>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#f0f0f4", margin: 0, letterSpacing: "-0.01em" }}>
              AI Workspace
            </p>
            <p style={{
              fontSize: "9px", margin: 0, marginTop: "2px",
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: isAiGenerating ? AI_TEXT : "rgba(255,255,255,0.25)",
              fontFamily: "var(--font-geist-mono), monospace",
            }}>
              {isAiGenerating ? "Ghost AI · Working" : "Ghost AI · Online"}
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
            color: "rgba(255,255,255,0.3)",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#f0f0f4"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.3)"; }}
        >
          <X className="h-[14px] w-[14px]" />
        </button>
      </div>

      {/* ── tabs ──────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        {(["architect", "specs"] as Tab[]).map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: "10px 0 9px",
                border: "none",
                borderBottom: active ? `2px solid ${AI}` : "2px solid transparent",
                background: "transparent",
                cursor: "pointer",
                fontSize: "10px",
                fontWeight: active ? 700 : 400,
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                fontFamily: "var(--font-geist-mono), monospace",
                color: active ? AI_TEXT : "rgba(255,255,255,0.25)",
                transition: "color 0.15s, border-color 0.15s",
              }}
            >
              {tab === "architect" ? "Architect" : "Specs"}
            </button>
          );
        })}
      </div>

      {/* ══ AI Architect ════════════════════════════════════ */}
      {activeTab === "architect" && (
        <>
          {/* message area */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", width: "100%" }}>
            {messages.length === 0
              ? <ArchitectEmptyState onPromptSelect={handlePromptSelect} />
              : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px" }}>
                  {messages.map((m) => (
                    <ChatBubble key={m.id} message={m.payload} />
                  ))}
                </div>
              )
            }
          </div>

          {/* input */}
          <form
            onSubmit={handleSubmit}
            style={{
              flexShrink: 0,
              width: "100%",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              padding: "12px",
              background: "#0a0a0d",
            }}
          >
            {showStatusStrip ? (
              <AiRunStatusStrip text={displayText} />
            ) : null}
            {chatError ? (
              <p
                role="alert"
                style={{
                  margin: "0 0 8px",
                  fontSize: "11px",
                  lineHeight: 1.45,
                  color: "#f87171",
                }}
              >
                {chatError}
              </p>
            ) : null}
            <div style={{
              borderRadius: "12px",
              background: "#111116",
              border: inputFocused
                ? `1px solid ${AI_RIM}`
                : "1px solid rgba(255,255,255,0.07)",
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
                  color: "#f0f0f4",
                  outline: "none",
                  fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
                  minHeight: "68px",
                  maxHeight: "140px",
                  lineHeight: "1.55",
                  boxSizing: "border-box",
                }}
                className="placeholder:text-[rgba(255,255,255,0.2)]"
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
                  color: "rgba(255,255,255,0.18)",
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
                    border: "none",
                    cursor: draft.trim() && !isInputLocked ? "pointer" : "default",
                    background: draft.trim() && !isInputLocked ? CHAT_USER_GREEN : "rgba(255,255,255,0.05)",
                    color: draft.trim() && !isInputLocked ? "#08140b" : "rgba(255,255,255,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.15s, color 0.15s",
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
        </>
      )}

      {/* ══ Specs ════════════════════════════════════════════ */}
      {activeTab === "specs" && (
        <div style={{
          width: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          padding: "16px",
          boxSizing: "border-box",
        }}>
          {/* generate button */}
          <button
            type="button"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "11px",
              borderRadius: "10px",
              border: `1px solid ${AI_RIM}`,
              background: AI_DIM,
              color: AI_TEXT,
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontFamily: "var(--font-geist-mono), monospace",
              cursor: "pointer",
              boxSizing: "border-box",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = AI_MID; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = AI_DIM; }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Generate Spec
          </button>

          {/* spec card */}
          <div style={{
            width: "100%",
            boxSizing: "border-box",
            overflow: "hidden",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.07)",
            background: "#111116",
          }}>
            {/* card top row */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              gap: "8px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                <div style={{
                  width: "32px", height: "32px",
                  flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: "8px",
                  background: "rgba(0,200,212,0.08)",
                  border: "1px solid rgba(0,200,212,0.15)",
                }}>
                  <FileText className="h-[15px] w-[15px]" style={{ color: "#00c8d4" }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    margin: 0,
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#f0f0f4",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    System design spec
                  </p>
                  <p style={{
                    margin: 0,
                    marginTop: "2px",
                    fontSize: "9px",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.25)",
                    fontFamily: "var(--font-geist-mono), monospace",
                  }}>
                    Not yet generated
                  </p>
                </div>
              </div>

              <button
                disabled
                style={{
                  width: "28px", height: "28px",
                  flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: "8px",
                  border: "none",
                  background: "transparent",
                  color: "rgba(255,255,255,0.18)",
                  cursor: "not-allowed",
                  opacity: 0.5,
                }}
              >
                <Download className="h-[14px] w-[14px]" />
              </button>
            </div>

            {/* card body */}
            <div style={{ padding: "12px 14px" }}>
              <p style={{
                margin: 0,
                fontSize: "12px",
                lineHeight: "1.65",
                color: "rgba(255,255,255,0.4)",
                overflowWrap: "break-word",
                wordBreak: "break-word",
              }}>
                A generated architecture specification will summarize services, data flow,
                deployment notes, and operational risks from the current canvas.
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

/* ─── compact run status strip (above input) ────────────── */
function AiRunStatusStrip({ text }: { text: string | null }) {
  return (
    <div
      aria-live="polite"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "8px",
        padding: "7px 10px",
        borderRadius: "8px",
        border: `1px solid ${CHAT_USER_GREEN_RIM}`,
        background: CHAT_USER_GREEN_DIM,
      }}
    >
      <span
        className="animate-pulse"
        style={{
          width: "6px",
          height: "6px",
          flexShrink: 0,
          borderRadius: "50%",
          background: CHAT_USER_GREEN,
        }}
      />
      <Loader2
        className="h-3 w-3 animate-spin"
        style={{ color: CHAT_USER_GREEN, flexShrink: 0 }}
      />
      <p style={{
        margin: 0,
        fontSize: "11px",
        lineHeight: 1.45,
        color: "rgba(255,255,255,0.72)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {text ?? "Ghost AI is working…"}
      </p>
    </div>
  );
}

/* ─── Architect empty state ─────────────────────────────── */
function ArchitectEmptyState({ onPromptSelect }: { onPromptSelect: (p: string) => void }) {
  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 20px",
      gap: "28px",
      textAlign: "center",
    }}>
      {/* radar target */}
      <div style={{ position: "relative", width: "80px", height: "80px" }}>
        {/* outer ring */}
        <div style={{
          position: "absolute", inset: 0,
          borderRadius: "50%",
          border: "1px dashed rgba(100,87,249,0.12)",
        }} />
        {/* mid ring */}
        <div style={{
          position: "absolute", inset: "10px",
          borderRadius: "50%",
          border: "1px dashed rgba(100,87,249,0.22)",
        }} />
        {/* inner ring */}
        <div style={{
          position: "absolute", inset: "20px",
          borderRadius: "50%",
          background: AI_DIM,
          border: `1px solid ${AI_RIM}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Bot className="h-[18px] w-[18px]" style={{ color: AI_TEXT }} />
        </div>
      </div>

      {/* copy */}
      <div>
        <p style={{
          margin: 0,
          marginBottom: "8px",
          fontSize: "9px",
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: AI_TEXT,
          fontFamily: "var(--font-geist-mono), monospace",
        }}>
          Ready to Design
        </p>
        <p style={{
          margin: 0,
          fontSize: "12px",
          lineHeight: "1.65",
          color: "rgba(255,255,255,0.35)",
          maxWidth: "220px",
        }}>
          Describe a system and chat with collaborators in this room.
        </p>
      </div>

      {/* starter chips */}
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
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              cursor: "pointer",
              textAlign: "left",
              transition: "border-color 0.12s, background 0.12s",
            }}
            onMouseEnter={(e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.borderColor = AI_RIM;
              b.style.background = AI_DIM;
            }}
            onMouseLeave={(e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.borderColor = "rgba(255,255,255,0.07)";
              b.style.background = "rgba(255,255,255,0.03)";
            }}
          >
            <span style={{
              fontSize: "13px",
              color: AI,
              fontFamily: "var(--font-geist-mono), monospace",
              flexShrink: 0,
              lineHeight: 1,
            }}>›</span>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)" }}>
              {prompt}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── chat bubble ────────────────────────────────────────── */
function formatChatTimestamp(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function ChatBubble({ message }: { message: AiChatFeedPayload }) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        paddingInline: isUser ? "4px" : "28px",
      }}>
        <span style={{
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "0.04em",
          color: isAssistant ? AI_TEXT : "rgba(255,255,255,0.45)",
          fontFamily: "var(--font-geist-mono), monospace",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {message.sender}
        </span>
        <time
          dateTime={new Date(message.timestamp).toISOString()}
          style={{
            fontSize: "9px",
            letterSpacing: "0.04em",
            color: "rgba(255,255,255,0.22)",
            fontFamily: "var(--font-geist-mono), monospace",
            flexShrink: 0,
          }}
        >
          {formatChatTimestamp(message.timestamp)}
        </time>
      </div>

      <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", gap: "8px" }}>
        {isAssistant && (
          <div style={{
            width: "20px", height: "20px",
            flexShrink: 0,
            marginTop: "3px",
            borderRadius: "6px",
            background: AI_DIM,
            border: `1px solid ${AI_RIM}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Bot className="h-2.5 w-2.5" style={{ color: AI_TEXT }} />
          </div>
        )}
        <div style={{
          maxWidth: "82%",
          padding: "9px 13px",
          fontSize: "13px",
          lineHeight: "1.55",
          overflowWrap: "break-word",
          wordBreak: "break-word",
          ...(isUser ? {
            borderRadius: "14px 14px 4px 14px",
            background: CHAT_USER_GREEN,
            border: `1px solid ${CHAT_USER_GREEN_RIM}`,
            color: "#08140b",
          } : {
            borderRadius: "4px 14px 14px 14px",
            background: "#111116",
            border: "1px solid rgba(255,255,255,0.07)",
            color: "rgba(255,255,255,0.55)",
          }),
        }}>
          {message.content}
        </div>
      </div>
    </div>
  );
}
