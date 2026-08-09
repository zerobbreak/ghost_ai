const CLARIFICATION_PREFIX = "I need a bit more detail before designing this:";

export function formatClarificationMessage(questions: string[]): string {
  const list = questions
    .map((question, index) => `${index + 1}. ${question}`)
    .join("\n");

  return `${CLARIFICATION_PREFIX}\n\n${list}`;
}

/** Returns the questions if `content` is a clarification message, otherwise null. */
export function parseClarificationMessage(content: string): string[] | null {
  if (!content.startsWith(CLARIFICATION_PREFIX)) return null;

  const questions = content
    .slice(CLARIFICATION_PREFIX.length)
    .split("\n")
    .map((line) => line.replace(/^\s*\d+\.\s*/, "").trim())
    .filter(Boolean);

  return questions.length > 0 ? questions : null;
}
