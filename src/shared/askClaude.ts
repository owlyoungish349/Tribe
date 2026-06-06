export const MODEL = "composer-2.5";

export async function askClaude(
  systemPrompt: string,
  userContent: string
): Promise<string> {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system: systemPrompt, user: userContent }),
  });

  if (!res.ok) {
    throw new Error(`LLM API error: ${res.status}`);
  }

  const data = (await res.json()) as { text: string };
  return data.text;
}
