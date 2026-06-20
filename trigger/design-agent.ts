import { task, logger } from "@trigger.dev/sdk";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateDesignPlan } from "@/lib/design-agent-generate";
import {
  applyDesignActions,
  AI_CURSOR_HOME,
  clearAiPresence,
  cursorForAction,
  cursorForCanvasOverview,
  publishAiStatus,
  readCanvasState,
  updateAiPresence,
} from "@/lib/ai-agent";
import {
  buildDesignSystemPrompt,
  buildDesignUserPrompt,
} from "@/lib/design-agent-prompt";
import type { DesignAction } from "@/lib/design-agent-schema";
import { USER_FRIENDLY_ERROR_MESSAGE } from "@/lib/user-friendly-error";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

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

function applyActionToWorkingState(
  action: DesignAction,
  workingNodes: CanvasNode[],
  workingEdges: CanvasEdge[],
) {
  switch (action.type) {
    case "addNode":
      return {
        nodes: [
          ...workingNodes.filter((node) => node.id !== action.node.id),
          action.node as CanvasNode,
        ],
        edges: workingEdges,
      };
    case "moveNode":
      return {
        nodes: workingNodes.map((node) =>
          node.id === action.id ? { ...node, position: action.position } : node,
        ),
        edges: workingEdges,
      };
    case "resizeNode":
      return {
        nodes: workingNodes.map((node) =>
          node.id === action.id
            ? {
                ...node,
                style: { ...node.style, width: action.width, height: action.height },
              }
            : node,
        ),
        edges: workingEdges,
      };
    case "updateNodeData":
      return {
        nodes: workingNodes.map((node) =>
          node.id === action.id
            ? { ...node, data: { ...node.data, ...action.data } }
            : node,
        ),
        edges: workingEdges,
      };
    case "deleteNode":
      return {
        nodes: workingNodes.filter((node) => node.id !== action.id),
        edges: workingEdges.filter(
          (edge) => edge.source !== action.id && edge.target !== action.id,
        ),
      };
    case "addEdge":
      return {
        nodes: workingNodes,
        edges: [
          ...workingEdges.filter((edge) => edge.id !== action.edge.id),
          action.edge as CanvasEdge,
        ],
      };
    case "updateEdgeData":
      return {
        nodes: workingNodes,
        edges: workingEdges.map((edge) =>
          edge.id === action.id
            ? { ...edge, data: { ...edge.data, ...action.data } }
            : edge,
        ),
      };
    case "deleteEdge":
      return {
        nodes: workingNodes,
        edges: workingEdges.filter((edge) => edge.id !== action.id),
      };
  }
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
      await updateAiPresence(roomId, { cursor: AI_CURSOR_HOME, thinking: true });

      await publishAiStatus(roomId, {
        phase: "processing",
        text: "Reading the current canvas…",
      });

      const { nodes, edges } = await readCanvasState(roomId);
      await updateAiPresence(roomId, {
        cursor: cursorForCanvasOverview(nodes),
        thinking: true,
      });

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

      let workingNodes = [...nodes];
      let workingEdges = [...edges];

      for (let index = 0; index < plan.actions.length; index++) {
        const action = plan.actions[index];

        await updateAiPresence(roomId, {
          cursor: cursorForAction(action, workingNodes, workingEdges),
          thinking: true,
        });
        await applyDesignActions(roomId, [action]);

        const nextState = applyActionToWorkingState(
          action,
          workingNodes,
          workingEdges,
        );
        workingNodes = nextState.nodes;
        workingEdges = nextState.edges;

        const isProgressMilestone =
          index === 0 ||
          (index + 1) % 4 === 0 ||
          index === plan.actions.length - 1;

        if (isProgressMilestone) {
          await publishAiStatus(roomId, {
            phase: "processing",
            text: `Applied ${index + 1} of ${plan.actions.length} changes…`,
          });
        }
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
          text: USER_FRIENDLY_ERROR_MESSAGE,
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
