"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import type { generateSpecTask } from "@/trigger/generate-spec";
import { toUserFriendlyError } from "@/lib/user-friendly-error";
import type { SpecChatHistoryItem } from "@/lib/spec-generation-schema";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

const TERMINAL_RUN_STATUSES = new Set([
  "COMPLETED",
  "FAILED",
  "CANCELED",
  "CRASHED",
  "SYSTEM_FAILURE",
  "TIMED_OUT",
  "EXPIRED",
]);

function isActiveRunStatus(status: string | undefined) {
  return Boolean(status && !TERMINAL_RUN_STATUSES.has(status));
}

export interface UseAiSpecRunOptions {
  projectId: string;
  onRunComplete?: (specId: string) => void | Promise<void>;
  onRunError?: (message: string) => void | Promise<void>;
}

export interface UseAiSpecRunResult {
  startSpecRun: (
    chatHistory: SpecChatHistoryItem[],
    nodes: CanvasNode[],
    edges: CanvasEdge[],
  ) => Promise<void>;
  isRunActive: boolean;
  isSubmitting: boolean;
  progressText: string | null;
  submitError: string | null;
  clearSubmitError: () => void;
}

export function useAiSpecRun({
  projectId,
  onRunComplete,
  onRunError,
}: UseAiSpecRunOptions): UseAiSpecRunResult {
  const [runId, setRunId] = useState<string | null>(null);
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const handledRunIdRef = useRef<string | null>(null);

  const resetRun = useCallback(() => {
    setRunId(null);
    setPublicToken(null);
  }, []);

  const finishTrackedRun = useCallback(
    (trackedRunId: string, success: boolean, result: string) => {
      if (handledRunIdRef.current === trackedRunId) return;
      handledRunIdRef.current = trackedRunId;

      if (success) {
        void onRunComplete?.(result);
      } else {
        void onRunError?.(result);
      }

      resetRun();
    },
    [onRunComplete, onRunError, resetRun],
  );

  const { run, error: runSubscriptionError } = useRealtimeRun<
    typeof generateSpecTask
  >(runId ?? undefined, {
    accessToken: publicToken ?? undefined,
    enabled: Boolean(runId && publicToken),
    onComplete: (completedRun, err) => {
      const failed =
        Boolean(err) ||
        completedRun.status === "FAILED" ||
        completedRun.status === "CANCELED" ||
        completedRun.status === "CRASHED" ||
        completedRun.status === "SYSTEM_FAILURE" ||
        completedRun.status === "TIMED_OUT" ||
        completedRun.status === "EXPIRED";

      if (failed) {
        finishTrackedRun(completedRun.id, false, toUserFriendlyError(err));
        return;
      }

      const output = completedRun.output as { specId?: string } | undefined;
      if (!output?.specId) {
        finishTrackedRun(completedRun.id, false, toUserFriendlyError());
        return;
      }

      finishTrackedRun(completedRun.id, true, output.specId);
    },
  });

  useEffect(() => {
    if (!runSubscriptionError || !runId) return;
    finishTrackedRun(runId, false, toUserFriendlyError(runSubscriptionError));
  }, [finishTrackedRun, runId, runSubscriptionError]);

  const isRunActive =
    isSubmitting || Boolean(run?.status && isActiveRunStatus(run.status));

  const progressText =
    typeof run?.metadata?.message === "string" ? run.metadata.message : null;

  const startSpecRun = useCallback(
    async (
      chatHistory: SpecChatHistoryItem[],
      nodes: CanvasNode[],
      edges: CanvasEdge[],
    ) => {
      setIsSubmitting(true);
      setSubmitError(null);
      handledRunIdRef.current = null;

      try {
        const specRes = await fetch("/api/ai/spec", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: projectId, chatHistory, nodes, edges }),
        });

        const specBody = (await specRes.json().catch(() => ({}))) as {
          runId?: string;
          error?: string;
        };

        if (!specRes.ok) {
          throw new Error(specBody.error ?? "Failed to start spec generation");
        }

        const nextRunId = specBody.runId;
        if (!nextRunId) {
          throw new Error("Spec run did not return a run ID");
        }

        const tokenRes = await fetch("/api/ai/spec/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runId: nextRunId }),
        });

        const tokenBody = (await tokenRes.json().catch(() => ({}))) as {
          token?: string;
          error?: string;
        };

        if (!tokenRes.ok) {
          throw new Error(tokenBody.error ?? "Failed to get run token");
        }

        if (!tokenBody.token) {
          throw new Error("Spec run did not return an access token");
        }

        setRunId(nextRunId);
        setPublicToken(tokenBody.token);
      } catch (error) {
        setSubmitError(toUserFriendlyError(error));
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [projectId],
  );

  const clearSubmitError = useCallback(() => {
    setSubmitError(null);
  }, []);

  return {
    startSpecRun,
    isRunActive,
    isSubmitting,
    progressText,
    submitError,
    clearSubmitError,
  };
}
