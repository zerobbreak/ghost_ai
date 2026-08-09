"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import type { designAgentTask } from "@/trigger/design-agent";
import { toUserFriendlyError } from "@/lib/user-friendly-error";
import type { AiStatusPhase } from "@/types/tasks";

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

export interface UseAiDesignRunOptions {
  projectId: string;
  aiStatusPhase?: AiStatusPhase | null;
  aiStatusText?: string | null;
  onRunComplete?: (message: string) => void | Promise<void>;
  onRunError?: (message: string) => void | Promise<void>;
}

export interface UseAiDesignRunResult {
  startDesignRun: (prompt: string) => Promise<void>;
  isRunActive: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  clearSubmitError: () => void;
}

export function useAiDesignRun({
  projectId,
  aiStatusPhase = null,
  aiStatusText = null,
  onRunComplete,
  onRunError,
}: UseAiDesignRunOptions): UseAiDesignRunResult {
  const [runId, setRunId] = useState<string | null>(null);
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const handledRunIdRef = useRef<string | null>(null);
  const previousStatusPhaseRef = useRef<AiStatusPhase | null>(null);

  const resetRun = useCallback(() => {
    setRunId(null);
    setPublicToken(null);
  }, []);

  const finishTrackedRun = useCallback(
    (trackedRunId: string, success: boolean, message: string) => {
      if (handledRunIdRef.current === trackedRunId) return;
      handledRunIdRef.current = trackedRunId;

      if (success) {
        void onRunComplete?.(message);
      } else {
        void onRunError?.(message);
      }

      resetRun();
    },
    [onRunComplete, onRunError, resetRun],
  );

  const { run, error: runSubscriptionError } = useRealtimeRun<
    typeof designAgentTask
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

      const output = completedRun.output as { summary?: string } | undefined;
      const message = output?.summary ?? "Design complete.";
      finishTrackedRun(completedRun.id, true, message);
    },
  });

  // Fallback when Trigger realtime never connects but Liveblocks status feed finishes.
  useEffect(() => {
    if (!runId) {
      previousStatusPhaseRef.current = aiStatusPhase;
      return;
    }

    const previousPhase = previousStatusPhaseRef.current;
    previousStatusPhaseRef.current = aiStatusPhase;

    if (aiStatusPhase !== "complete" && aiStatusPhase !== "error") return;
    if (previousPhase === aiStatusPhase) return;

    const message =
      aiStatusPhase === "error"
        ? toUserFriendlyError()
        : (aiStatusText ?? "Design complete.");

    finishTrackedRun(runId, aiStatusPhase === "complete", message);
  }, [aiStatusPhase, aiStatusText, finishTrackedRun, runId]);

  // Drop stale tracking if the realtime subscription errors out.
  useEffect(() => {
    if (!runSubscriptionError || !runId) return;
    if (aiStatusPhase === "complete" || aiStatusPhase === "error") return;

    finishTrackedRun(runId, false, toUserFriendlyError(runSubscriptionError));
  }, [
    aiStatusPhase,
    finishTrackedRun,
    runId,
    runSubscriptionError,
  ]);

  const isRunActive =
    isSubmitting ||
    Boolean(run?.status && isActiveRunStatus(run.status));

  const startDesignRun = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed) return;

      setIsSubmitting(true);
      setSubmitError(null);
      handledRunIdRef.current = null;
      previousStatusPhaseRef.current = aiStatusPhase;

      try {
        const designRes = await fetch("/api/ai/design", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: trimmed,
            roomId: projectId,
            projectId,
          }),
        });

        const designBody = (await designRes.json().catch(() => ({}))) as {
          runId?: string;
          publicToken?: string;
          token?: string;
          error?: string;
        };

        if (!designRes.ok) {
          throw new Error(designBody.error ?? "Failed to start design run");
        }

        const nextRunId = designBody.runId;
        if (!nextRunId) {
          throw new Error("Design run did not return a run ID");
        }

        let nextToken = designBody.publicToken ?? designBody.token;

        if (!nextToken) {
          const tokenRes = await fetch("/api/ai/design/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ runId: nextRunId }),
          });

          const tokenBody = (await tokenRes.json().catch(() => ({}))) as {
            token?: string;
            publicToken?: string;
            error?: string;
          };

          if (!tokenRes.ok) {
            throw new Error(tokenBody.error ?? "Failed to get run token");
          }

          nextToken = tokenBody.publicToken ?? tokenBody.token;
        }

        if (!nextToken) {
          throw new Error("Design run did not return an access token");
        }

        setRunId(nextRunId);
        setPublicToken(nextToken);
      } catch (error) {
        setSubmitError(toUserFriendlyError(error));
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [projectId, aiStatusPhase],
  );

  const clearSubmitError = useCallback(() => {
    setSubmitError(null);
  }, []);

  return {
    startDesignRun,
    isRunActive,
    isSubmitting,
    submitError,
    clearSubmitError,
  };
}
