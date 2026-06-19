"use client";

import { Bot, Loader2 } from "lucide-react";
import { useFeedMessages } from "@liveblocks/react/suspense";
import { AI_STATUS_FEED_ID } from "@/lib/ai-agent";

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
  const { messages } = useFeedMessages(AI_STATUS_FEED_ID);
  const latest = messages.at(-1);

  if (!latest) return null;

  const { text, phase } = latest.data;
  const isActive = phase === "start" || phase === "processing";

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
          Ghost AI {isActive ? "· Working" : phase === "error" ? "· Error" : "· Done"}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-(--color-text-secondary)">
          {text}
        </p>
      </div>
      <StatusIcon phase={phase} />
    </div>
  );
}
