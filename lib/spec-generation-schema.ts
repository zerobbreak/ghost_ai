import { z } from "zod";
import { aiChatMessageRoleSchema } from "@/types/tasks";

export const specChatHistoryItemSchema = z.object({
  sender: z.string(),
  role: aiChatMessageRoleSchema,
  content: z.string(),
  timestamp: z.number(),
});

export const specCanvasNodeSchema = z
  .object({
    id: z.string(),
    type: z.literal("canvasNode").optional(),
    position: z.object({
      x: z.number(),
      y: z.number(),
    }),
    data: z
      .object({
        label: z.string(),
        color: z.string().optional(),
        textColor: z.string().optional(),
        shape: z.string().optional(),
      })
      .passthrough(),
  })
  .passthrough();

export const specCanvasEdgeSchema = z
  .object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    type: z.literal("canvasEdge").optional(),
    data: z
      .object({
        label: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const generateSpecPayloadSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  chatHistory: z.array(specChatHistoryItemSchema),
  nodes: z.array(specCanvasNodeSchema),
  edges: z.array(specCanvasEdgeSchema),
});

export const specTriggerRequestSchema = generateSpecPayloadSchema.omit({
  projectId: true,
});

export type SpecChatHistoryItem = z.infer<typeof specChatHistoryItemSchema>;
export type GenerateSpecPayload = z.infer<typeof generateSpecPayloadSchema>;
export type SpecTriggerRequest = z.infer<typeof specTriggerRequestSchema>;
