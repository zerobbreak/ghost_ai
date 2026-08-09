"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useCreateFeed,
  useCreateFeedMessage,
  useFeedMessages,
  useSelf,
} from "@liveblocks/react/suspense";
import { AI_AGENT_INFO, AI_CHAT_FEED_ID } from "@/lib/ai-agent";
import { toUserFriendlyError } from "@/lib/user-friendly-error";
import {
  aiChatFeedPayloadSchema,
  parseAiChatFeedPayload,
  type AiChatFeedPayload,
} from "@/types/tasks";

export interface AiChatMessage {
  id: string;
  payload: AiChatFeedPayload;
}

export interface UseAiChatFeedResult {
  messages: AiChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  sendAssistantMessage: (content: string) => Promise<void>;
  isSending: boolean;
  sendError: string | null;
  clearSendError: () => void;
}

export function useAiChatFeed(): UseAiChatFeedResult {
  const self = useSelf();
  const createFeed = useCreateFeed();
  const createFeedMessage = useCreateFeedMessage();
  const { messages: rawMessages } = useFeedMessages(AI_CHAT_FEED_ID);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    void createFeed(AI_CHAT_FEED_ID, { metadata: { title: "AI Chat" } }).catch(() => {
      // Feed already exists — safe to ignore.
    });
  }, [createFeed]);

  const messages = useMemo(
    () =>
      rawMessages.flatMap((message) => {
        const payload = parseAiChatFeedPayload(message.data);
        return payload ? [{ id: message.id, payload }] : [];
      }),
    [rawMessages],
  );

  const publishMessage = useCallback(
    async (payload: AiChatFeedPayload) => {
      setIsSending(true);
      setSendError(null);

      try {
        await createFeedMessage(AI_CHAT_FEED_ID, payload);
      } catch (error) {
        setSendError(toUserFriendlyError(error));
        throw error;
      } finally {
        setIsSending(false);
      }
    },
    [createFeedMessage],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      await publishMessage(
        aiChatFeedPayloadSchema.parse({
          sender: self.info.name || self.id,
          role: "user",
          content: trimmed,
          timestamp: Date.now(),
        }),
      );
    },
    [publishMessage, self.id, self.info.name],
  );

  const sendAssistantMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      await publishMessage(
        aiChatFeedPayloadSchema.parse({
          sender: AI_AGENT_INFO.name,
          role: "assistant",
          content: trimmed,
          timestamp: Date.now(),
        }),
      );
    },
    [publishMessage],
  );

  const clearSendError = useCallback(() => {
    setSendError(null);
  }, []);

  return {
    messages,
    sendMessage,
    sendAssistantMessage,
    isSending,
    sendError,
    clearSendError,
  };
}
