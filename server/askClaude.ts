import { Agent, CursorAgentError } from "@cursor/sdk";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

export const MODEL = "composer-2.5";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");

function buildPrompt(systemPrompt: string, userContent: string): string {
  return `IMPORTANT: Respond with ONLY the requested output. Do not use tools. Do not read or write files. No preamble.

SYSTEM:
${systemPrompt}

USER:
${userContent}`;
}

export async function askClaude(
  systemPrompt: string,
  userContent: string
): Promise<string> {
  const apiKey = process.env.CURSOR_API_KEY;
  if (!apiKey) {
    throw new Error("CURSOR_API_KEY is not set");
  }

  const prompt = buildPrompt(systemPrompt, userContent);

  try {
    const result = await Agent.prompt(prompt, {
      apiKey,
      model: { id: MODEL },
      local: { cwd: PROJECT_ROOT, settingSources: [] },
    });

    if (result.status === "error") {
      throw new Error(`Cursor agent run failed (run ${result.id})`);
    }

    return result.result ?? "";
  } catch (err) {
    if (err instanceof CursorAgentError) {
      throw new Error(`Cursor SDK error: ${err.message}`);
    }
    throw err;
  }
}
