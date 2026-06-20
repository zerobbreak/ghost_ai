"use client";

import { Bot, Loader2 } from "lucide-react";
import { useAiStatusFeed } from "@/hooks/use-ai-status-feed";
import { USER_FRIENDLY_ERROR_MESSAGE } from "@/lib/user-friendly-error";

function StatusIcon({ phase }: { phase: "start" | "processing" | "complete" | "error" }) {
  if (phase === "processing" || phase === "start") {
    return <Loader2 className="h-3.5 w-3.5 animate-spin text-(--color-accent-ai-text)" />;
  }

  if (phase === "error") {
    return <span className="text-xs text-(--color-state-error)">!</span>;
  }

  return <span className="text-xs text-(--color-state-success)">✓</span>;
}

export function AiStatusPanel() {
  const { payload, displayText, isActive } = useAiStatusFeed();

  if (!payload) return null;

  const statusText =
    payload.phase === "error"
      ? USER_FRIENDLY_ERROR_MESSAGE
      : displayText;

  return (
    <div
      className="flex max-w-sm items-start gap-2.5 rounded-2xl border border-(--color-border-default) bg-(--color-bg-surface)/95 px-3 py-2.5 shadow-2xl backdrop-blur-sm"
      aria-live="polite"
    >
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-(--color-accent-ai)/30 bg-(--color-accent-ai)/10">
        <Bot className="h-3.5 w-3.5 text-(--color-accent-ai-text)" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-(--color-accent-ai-text)">
          Ghost AI {isActive ? "· Working" : payload.phase === "error" ? "· Error" : "· Done"}
        </p>
        {statusText ? (
          <p className="mt-0.5 text-xs leading-relaxed text-(--color-text-secondary)">
            {statusText}
          </p>
        ) : null}
      </div>
      <StatusIcon phase={payload.phase} />
    </div>
  );
}
