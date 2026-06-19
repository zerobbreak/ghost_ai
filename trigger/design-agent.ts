import { task, logger } from "@trigger.dev/sdk";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateDesignPlan } from "@/lib/design-agent-generate";
import {
  applyDesignActions,
  clearAiPresence,
  cursorForNode,
  publishAiStatus,
  readCanvasState,
  updateAiPresence,
} from "@/lib/ai-agent";
import {
  buildDesignSystemPrompt,
  buildDesignUserPrompt,
} from "@/lib/design-agent-prompt";
import type { DesignAction } from "@/lib/design-agent-schema";
import type { CanvasNode } from "@/types/canvas";

function getGoogleApiKey() {
  return (
    process.env.GOOGLE_AI_API_KEY ??
    process.env.GOOGLE_GENERATIVE_AI_API_KEY
  );
}

function createGeminiModel() {
  const apiKey = getGoogleApiKey();
  if (!apiKey) {
    throw new Error(
      "GOOGLE_AI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY) is not set",
    );
  }

  const google = createGoogleGenerativeAI({ apiKey });
  return google("gemini-3.5-flash");
}

function chunkActions(actions: DesignAction[], size: number) {
  const chunks: DesignAction[][] = [];
  for (let i = 0; i < actions.length; i += size) {
    chunks.push(actions.slice(i, i + size));
  }
  return chunks;
}

function cursorForAction(action: DesignAction, nodes: CanvasNode[]) {
  if (action.type === "addNode") {
    return cursorForNode(action.node as CanvasNode);
  }

  const nodeId =
    action.type === "moveNode" ||
    action.type === "resizeNode" ||
    action.type === "updateNodeData" ||
    action.type === "deleteNode"
      ? action.id
      : null;

  if (!nodeId) return null;

  const node = nodes.find((n) => n.id === nodeId);
  return node ? cursorForNode(node) : null;
}

export const designAgentTask = task({
  id: "design-agent",
  retry: {
    maxAttempts: 2,
  },
  run: async (payload: { prompt: string; roomId: string }) => {
    const { prompt, roomId } = payload;

    logger.log("Design agent started", { prompt, roomId });

    try {
      await publishAiStatus(roomId, {
        phase: "start",
        text: "Ghost AI is starting your design…",
      });
      await updateAiPresence(roomId, { cursor: { x: 120, y: 120 }, thinking: true });

      await publishAiStatus(roomId, {
        phase: "processing",
        text: "Reading the current canvas…",
      });

      const { nodes, edges } = await readCanvasState(roomId);

      await publishAiStatus(roomId, {
        phase: "processing",
        text: "Interpreting your prompt…",
      });

      const plan = await generateDesignPlan({
        model: createGeminiModel(),
        system: buildDesignSystemPrompt(),
        prompt: buildDesignUserPrompt(prompt, nodes, edges),
      });
      logger.log("Design plan generated", {
        summary: plan.summary,
        actionCount: plan.actions.length,
      });

      await publishAiStatus(roomId, {
        phase: "processing",
        text: plan.summary,
      });

      const actionChunks = chunkActions(plan.actions, 4);
      let workingNodes = [...nodes];

      for (let index = 0; index < actionChunks.length; index++) {
        const chunk = actionChunks[index];

        const cursor =
          cursorForAction(chunk[0], workingNodes) ?? { x: 160 + index * 40, y: 160 };

        await updateAiPresence(roomId, { cursor, thinking: true });
        await applyDesignActions(roomId, chunk);

        for (const action of chunk) {
          if (action.type === "addNode") {
            workingNodes = [
              ...workingNodes.filter((n) => n.id !== action.node.id),
              action.node as CanvasNode,
            ];
          } else if (action.type === "deleteNode") {
            workingNodes = workingNodes.filter((n) => n.id !== action.id);
          } else if (action.type === "moveNode") {
            workingNodes = workingNodes.map((n) =>
              n.id === action.id ? { ...n, position: action.position } : n,
            );
          }
        }

        await publishAiStatus(roomId, {
          phase: "processing",
          text: `Applied ${Math.min((index + 1) * chunk.length, plan.actions.length)} of ${plan.actions.length} changes…`,
        });
      }

      await publishAiStatus(roomId, {
        phase: "complete",
        text: "Design complete.",
      });

      return {
        summary: plan.summary,
        actionCount: plan.actions.length,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Design generation failed";

      logger.error("Design agent failed", { roomId, message });

      try {
        await publishAiStatus(roomId, {
          phase: "error",
          text: message,
        });
      } catch (statusError) {
        logger.error("Failed to publish error status", { statusError });
      }

      throw error;
    } finally {
      try {
        await clearAiPresence(roomId);
      } catch (presenceError) {
        logger.error("Failed to clear AI presence", { presenceError });
      }
    }
  },
});
