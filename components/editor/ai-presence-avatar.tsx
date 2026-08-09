"use client";

import { Bot } from "lucide-react";
import { shallow, useOthers } from "@liveblocks/react/suspense";
import { AI_AGENT_USER_ID } from "@/lib/ai-agent";

export function useAiAgentPresence() {
  return useOthers(
    (others) =>
      others.find((other) => other.id === AI_AGENT_USER_ID) ?? null,
    shallow,
  );
}

export function AiPresenceAvatar({ index = 0 }: { index?: number }) {
  const ai = useAiAgentPresence();

  if (!ai) return null;

  return (
    <div
      className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-(--color-bg-base) bg-(--color-accent-ai)/20 text-(--color-accent-ai-text) shadow-lg ring-1 ring-(--color-border-subtle)"
      style={{
        marginLeft: index === 0 ? 0 : -10,
        zIndex: 20 - index,
      }}
      aria-label={ai.info.name}
      title={ai.presence.thinking ? `${ai.info.name} is thinking` : ai.info.name}
    >
      <Bot className="h-3.5 w-3.5" />
      {ai.presence.thinking ? (
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-(--color-state-success) ring-2 ring-(--color-bg-base)" />
      ) : null}
    </div>
  );
}
