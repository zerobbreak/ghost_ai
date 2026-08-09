import { task, logger } from "@trigger.dev/sdk";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateDesignResult } from "@/lib/design-agent-generate";
import { formatClarificationMessage } from "@/lib/ai-clarification";
import { layoutCanvas, layoutSubgraph } from "@/lib/auto-layout";
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

/**
 * Only positions nodes added in this run — existing nodes the user may have
 * manually placed/dragged are left untouched.
 */
function mergeSubgraphLayout(
  workingNodes: CanvasNode[],
  workingEdges: CanvasEdge[],
  addedNodeIds: Set<string>,
): CanvasNode[] {
  const existing = workingNodes.filter((node) => !addedNodeIds.has(node.id));
  const added = workingNodes.filter((node) => addedNodeIds.has(node.id));
  const laidOutAdded = layoutSubgraph(existing, added, workingEdges, "TB");
  const laidOutById = new Map(laidOutAdded.map((node) => [node.id, node]));

  return workingNodes.map((node) => laidOutById.get(node.id) ?? node);
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

      const result = await generateDesignResult({
        model: createGeminiModel(),
        system: buildDesignSystemPrompt(),
        prompt: buildDesignUserPrompt(prompt, nodes, edges),
      });

      if (result.kind === "clarification") {
        logger.log("Design agent needs clarification", {
          roomId,
          questions: result.questions,
        });

        const message = formatClarificationMessage(result.questions);

        await publishAiStatus(roomId, {
          phase: "complete",
          text: "Ghost AI needs a bit more detail.",
        });

        return {
          summary: message,
          actionCount: 0,
          needsClarification: true,
          questions: result.questions,
        };
      }

      const plan = result;
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

      const ACTION_BATCH_SIZE = 3;

      for (
        let batchStart = 0;
        batchStart < plan.actions.length;
        batchStart += ACTION_BATCH_SIZE
      ) {
        const batch = plan.actions.slice(
          batchStart,
          batchStart + ACTION_BATCH_SIZE,
        );
        const lastAction = batch[batch.length - 1];

        await updateAiPresence(roomId, {
          cursor: cursorForAction(lastAction, workingNodes, workingEdges),
          thinking: true,
        });
        await applyDesignActions(roomId, batch);

        for (const action of batch) {
          const nextState = applyActionToWorkingState(
            action,
            workingNodes,
            workingEdges,
          );
          workingNodes = nextState.nodes;
          workingEdges = nextState.edges;
        }

        const appliedCount = batchStart + batch.length;
        await publishAiStatus(roomId, {
          phase: "processing",
          text: `Applied ${appliedCount} of ${plan.actions.length} changes…`,
        });
      }

      const addedNodeIds = new Set(
        plan.actions
          .filter((action) => action.type === "addNode")
          .map((action) => action.node.id),
      );

      const layoutedNodes =
        nodes.length === 0
          ? layoutCanvas(workingNodes, workingEdges, "TB")
          : mergeSubgraphLayout(workingNodes, workingEdges, addedNodeIds);

      const positionChanges = layoutedNodes.filter((node) => {
        const original = workingNodes.find((n) => n.id === node.id);
        return (
          !original ||
          node.position.x !== original.position.x ||
          node.position.y !== original.position.y
        );
      });

      if (positionChanges.length > 0) {
        await publishAiStatus(roomId, {
          phase: "processing",
          text: "Arranging layout…",
        });

        await applyDesignActions(
          roomId,
          positionChanges.map((node) => ({
            type: "moveNode" as const,
            id: node.id,
            position: node.position,
          })),
        );
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
