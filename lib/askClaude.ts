import { Agent } from '@cursor/sdk';

export const MODEL = process.env.LLM_MODEL ?? 'composer-2.5';

const MODEL_PARAMS =
  MODEL === 'composer-2.5' ? [{ id: 'fast', value: 'true' }] : [];

function stripFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
}

export async function askClaude(systemPrompt: string, userContent: string): Promise<string> {
  const message = `[SYSTEM]\n${systemPrompt}\n[/SYSTEM]\n\n${userContent}`;

  console.log(`[sdk] Agent.prompt model=${MODEL} cloud`);
  const result = await Agent.prompt(message, {
    apiKey: process.env.CURSOR_API_KEY,
    model: { id: MODEL, params: MODEL_PARAMS },
    cloud: {},
  });
  console.log(`[sdk] run ${result.id} status=${result.status}`);

  if (result.status === 'error') {
    throw new Error(`Cursor agent run failed (status=error, id=${result.id})`);
  }

  return stripFences(result.result ?? '');
}
