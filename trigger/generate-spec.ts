import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { logger, metadata, schemaTask } from "@trigger.dev/sdk";
import { generateSpecMarkdown } from "@/lib/spec-generation-generate";
import {
  buildSpecSystemPrompt,
  buildSpecUserPrompt,
} from "@/lib/spec-generation-prompt";
import { generateSpecPayloadSchema } from "@/lib/spec-generation-schema";
import { persistProjectSpec } from "@/lib/spec-persistence";
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

export const generateSpecTask = schemaTask({
  id: "generate-spec",
  schema: generateSpecPayloadSchema,
  retry: {
    maxAttempts: 2,
  },
  run: async (payload) => {
    const { projectId, roomId, chatHistory, nodes, edges } = payload;

    logger.log("Spec generation started", {
      projectId,
      roomId,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      chatMessageCount: chatHistory.length,
    });

    metadata
      .set("status", "starting")
      .set("progress", 0)
      .set("phase", "start");

    try {
      metadata
        .set("status", "processing")
        .set("progress", 25)
        .set("phase", "processing")
        .set("message", "Analyzing canvas and chat context…");

      const spec = await generateSpecMarkdown({
        model: createGeminiModel(),
        system: buildSpecSystemPrompt(),
        prompt: buildSpecUserPrompt(
          chatHistory,
          nodes as CanvasNode[],
          edges as CanvasEdge[],
        ),
      });

      metadata
        .set("status", "processing")
        .set("progress", 75)
        .set("phase", "processing")
        .set("message", "Saving specification…");

      const specId = await persistProjectSpec(projectId, spec);

      metadata
        .set("status", "completed")
        .set("progress", 100)
        .set("phase", "complete")
        .set("message", "Specification generated.");

      logger.log("Spec generation completed", {
        projectId,
        roomId,
        specId,
        specLength: spec.length,
      });

      return { spec, specId };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Spec generation failed";

      logger.error("Spec generation failed", { projectId, roomId, message });

      metadata
        .set("status", "error")
        .set("phase", "error")
        .set("message", USER_FRIENDLY_ERROR_MESSAGE);

      throw error;
    }
  },
});
