// Browser wrapper — POSTs to /api/claude (proxied to server on :8787).
// Never calls Anthropic directly from the client.

export async function askClaude(systemPrompt: string, userContent: string): Promise<string> {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system: systemPrompt, user: userContent }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`askClaude failed: ${res.status} ${err}`);
  }
  const data = await res.json() as { text: string };
  return data.text;
}
