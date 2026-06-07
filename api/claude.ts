import { askClaude } from '../server/askClaude';

export const config = {
  maxDuration: 60,
};

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as { system?: string; user?: string };
    const { system, user } = body;

    if (!system || !user) {
      return Response.json({ error: 'system and user fields required' }, { status: 400 });
    }

    const label = system.split('\n')[0].slice(0, 60);
    console.log(`[api/claude] → "${label}" (system ${system.length} / user ${user.length} chars)`);
    const started = Date.now();

    const text = await askClaude(system, user);

    console.log(`[api/claude] ← ${text.length} chars in ${((Date.now() - started) / 1000).toFixed(1)}s`);
    return Response.json({ text });
  } catch (err) {
    console.error('[api/claude] error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
