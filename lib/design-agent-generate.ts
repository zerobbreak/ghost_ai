import { generateObject, generateText, type LanguageModel } from "ai";
import {
  llmDesignPlanSchema,
  normalizeDesignResult,
  type DesignAgentResult,
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

export async function generateDesignResult(options: {
  model: LanguageModel;
  system: string;
  prompt: string;
}): Promise<DesignAgentResult> {
  const { model, system, prompt } = options;

  try {
    const { object } = await generateObject({
      model,
      schema: llmDesignPlanSchema,
      schemaName: "DesignPlan",
      schemaDescription:
        "Either ordered canvas mutations (add/move/resize/update/delete nodes and edges), or a needs_clarification status with questions when the request is too ambiguous to design.",
      system,
      prompt,
      maxRetries: 2,
    });

    return normalizeDesignResult(object);
  } catch (structuredError) {
    const { text } = await generateText({
      model,
      system: `${system}

Return only one JSON object: either "summary" and "actions", or "status": "needs_clarification" and "questions". Do not use markdown code fences.`,
      prompt,
    });

    const parsed = llmDesignPlanSchema.safeParse(extractJsonObject(text));
    if (!parsed.success) {
      throw structuredError;
    }

    return normalizeDesignResult(parsed.data);
  }
}
