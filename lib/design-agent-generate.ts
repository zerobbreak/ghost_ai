import { generateObject, generateText, type LanguageModel } from "ai";
import {
  llmDesignPlanSchema,
  normalizeDesignPlan,
  type DesignPlan,
} from "@/lib/design-agent-schema";
import { safeParseJson } from "@/lib/canvas-snapshot";

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;

  const parsed = safeParseJson(candidate);
  if (parsed === null) {
    throw new Error("Model response did not contain JSON");
  }

  return parsed;
}

export async function generateDesignPlan(options: {
  model: LanguageModel;
  system: string;
  prompt: string;
}): Promise<DesignPlan> {
  const { model, system, prompt } = options;

  try {
    const { object } = await generateObject({
      model,
      schema: llmDesignPlanSchema,
      schemaName: "DesignPlan",
      schemaDescription:
        "Ordered canvas mutations: add/move/resize/update/delete nodes and add/update/delete edges.",
      system,
      prompt,
      maxRetries: 2,
    });

    return normalizeDesignPlan(object);
  } catch (structuredError) {
    const { text } = await generateText({
      model,
      system: `${system}

Return only one JSON object with "summary" and "actions". Do not use markdown code fences.`,
      prompt,
    });

    const parsed = llmDesignPlanSchema.safeParse(extractJsonObject(text));
    if (!parsed.success) {
      throw structuredError;
    }

    return normalizeDesignPlan(parsed.data);
  }
}
