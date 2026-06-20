import { z } from "zod";

export const aiStatusPhaseSchema = z.enum([
  "start",
  "processing",
  "complete",
  "error",
]);

export const aiStatusFeedPayloadSchema = z.object({
  text: z.string().optional(),
  phase: aiStatusPhaseSchema,
});

export type AiStatusPhase = z.infer<typeof aiStatusPhaseSchema>;
export type AiStatusFeedPayload = z.infer<typeof aiStatusFeedPayloadSchema>;

export function parseAiStatusFeedPayload(data: unknown): AiStatusFeedPayload | null {
  const result = aiStatusFeedPayloadSchema.safeParse(data);
  return result.success ? result.data : null;
}

export function isAiGenerationActive(phase: AiStatusPhase): boolean {
  return phase === "start" || phase === "processing";
}

export const aiChatMessageRoleSchema = z.enum(["user", "assistant", "system"]);

export const aiChatFeedPayloadSchema = z.object({
  sender: z.string(),
  role: aiChatMessageRoleSchema,
  content: z.string(),
  timestamp: z.number(),
});

export type AiChatMessageRole = z.infer<typeof aiChatMessageRoleSchema>;
export type AiChatFeedPayload = z.infer<typeof aiChatFeedPayloadSchema>;

export function parseAiChatFeedPayload(data: unknown): AiChatFeedPayload | null {
  const result = aiChatFeedPayloadSchema.safeParse(data);
  return result.success ? result.data : null;
}
