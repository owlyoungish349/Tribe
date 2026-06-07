import { Agent } from '@cursor/sdk';

// SINGLE swap point for the whole app. Override with LLM_MODEL in .env.
// Use Cursor.models.list({ apiKey: process.env.CURSOR_API_KEY }) to discover
// available model IDs. "composer-2.5" (with the fast variant) is the quickest
// option for these short JSON tasks; "claude-sonnet-4-6" gives richer prose
// but runs ~2x slower per call.
export const MODEL = process.env.LLM_MODEL ?? 'composer-2.5';

// composer-2.5 exposes a "fast" parameter — opt in for low-latency runs.
const MODEL_PARAMS =
  MODEL === 'composer-2.5' ? [{ id: 'fast', value: 'true' }] : [];

function stripFences(text: string): string {
  // Coding agents sometimes wrap JSON output in ``` fences despite instructions.
  return text
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
}

export async function askClaude(systemPrompt: string, userContent: string): Promise<string> {
  // No dedicated system field in the Cursor SDK — prepend with clear delimiters.
  const message = `[SYSTEM]\n${systemPrompt}\n[/SYSTEM]\n\n${userContent}`;

  // Agent.prompt: stateless convenience wrapper — creates, runs one turn, disposes.
  // cloud: {} → no local filesystem or codebase context attached.
  console.log(`      [sdk] Agent.prompt model=${MODEL} cloud`);
  const result = await Agent.prompt(message, {
    apiKey: process.env.CURSOR_API_KEY,
    model: { id: MODEL, params: MODEL_PARAMS },
    cloud: {},
  });
  console.log(`      [sdk] run ${result.id} status=${result.status}`);

  if (result.status === 'error') {
    throw new Error(`Cursor agent run failed (status=error, id=${result.id})`);
  }

  const raw = result.result ?? '';
  return stripFences(raw);
}
