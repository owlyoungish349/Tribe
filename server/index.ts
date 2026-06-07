import express from 'express';
import cors from 'cors';
import { askClaude } from './askClaude.js';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

let callId = 0;

app.post('/api/claude', async (req, res) => {
  const id = ++callId;
  try {
    const { system, user } = req.body as { system: string; user: string };
    if (!system || !user) {
      res.status(400).json({ error: 'system and user fields required' });
      return;
    }

    const label = system.split('\n')[0].slice(0, 60);
    console.log(
      `\n[#${id}] → askClaude  "${label}"  (system ${system.length} / user ${user.length} chars)`
    );
    const started = Date.now();

    const text = await askClaude(system, user);

    const ms = Date.now() - started;
    console.log(`[#${id}] ← ${text.length} chars in ${(ms / 1000).toFixed(1)}s`);
    console.log(`[#${id}]   ${text.slice(0, 200).replace(/\n/g, ' ')}${text.length > 200 ? '…' : ''}`);

    res.json({ text });
  } catch (err) {
    console.error(`[#${id}] ✗ askClaude error:`, err);
    res.status(500).json({ error: String(err) });
  }
});

const PORT = 8787;
app.listen(PORT, () => console.log(`API server running on :${PORT}`));
