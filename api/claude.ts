import type { VercelRequest, VercelResponse } from '@vercel/node';
import { askClaude } from '../lib/askClaude.js';

export const config = {
  maxDuration: 60,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { system, user } = req.body as { system?: string; user?: string };
    if (!system || !user) {
      res.status(400).json({ error: 'system and user fields required' });
      return;
    }

    if (!process.env.CURSOR_API_KEY) {
      res.status(500).json({ error: 'CURSOR_API_KEY is not configured' });
      return;
    }

    const label = system.split('\n')[0].slice(0, 60);
    console.log(`[api/claude] → "${label}"`);
    const started = Date.now();

    const text = await askClaude(system, user);

    console.log(`[api/claude] ← ${text.length} chars in ${((Date.now() - started) / 1000).toFixed(1)}s`);
    res.status(200).json({ text });
  } catch (err) {
    console.error('[api/claude] error:', err);
    res.status(500).json({ error: String(err) });
  }
}
