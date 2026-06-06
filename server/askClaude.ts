import { Agent } from '@cursor/sdk';

// SINGLE swap point for the whole app.
// Use Cursor.models.list({ apiKey: process.env.CURSOR_API_KEY }) to discover
// available model IDs for your account. "claude-sonnet-4-6" is attempted first;
// fall back to "composer-2" if your account doesn't expose Anthropic models.
export const MODEL = 'claude-sonnet-4-6';

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
  const result = await Agent.prompt(message, {
    apiKey: process.env.CURSOR_API_KEY,
    model: { id: MODEL },
    cloud: {},
  });

  if (result.status === 'error') {
    throw new Error(`Cursor agent run failed (status=error, id=${result.id})`);
  }

  const raw = result.result ?? '';
  return stripFences(raw);
}
