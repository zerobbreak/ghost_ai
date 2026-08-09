import { generateText, type LanguageModel } from "ai";

export async function generateSpecMarkdown(options: {
  model: LanguageModel;
  system: string;
  prompt: string;
}): Promise<string> {
  const { model, system, prompt } = options;

  const { text } = await generateText({
    model,
    system,
    prompt,
    maxRetries: 2,
  });

  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Model returned an empty specification");
  }

  return trimmed;
}
