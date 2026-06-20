"use client";

import { useEffect } from "react";
import { useCreateFeed, useFeedMessages } from "@liveblocks/react/suspense";
import { AI_STATUS_FEED_ID } from "@/lib/ai-agent";
import {
  isAiGenerationActive,
  parseAiStatusFeedPayload,
  type AiStatusFeedPayload,
  type AiStatusPhase,
} from "@/types/tasks";

export interface AiStatusFeedState {
  payload: AiStatusFeedPayload | null;
  displayText: string | null;
  isActive: boolean;
  phase: AiStatusPhase | null;
}

export function useAiStatusFeed(): AiStatusFeedState {
  const createFeed = useCreateFeed();
  const { messages } = useFeedMessages(AI_STATUS_FEED_ID);

  useEffect(() => {
    void createFeed(AI_STATUS_FEED_ID, { metadata: { title: "AI Status" } }).catch(
      () => {
        // Feed already exists — safe to ignore.
      },
    );
  }, [createFeed]);
  const latest = messages.at(-1);
  const payload = latest ? parseAiStatusFeedPayload(latest.data) : null;

  return {
    payload,
    displayText: payload?.text ?? null,
    isActive: payload ? isAiGenerationActive(payload.phase) : false,
    phase: payload?.phase ?? null,
  };
}
