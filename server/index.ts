import express from 'express';
import cors from 'cors';
import { askClaude } from './askClaude.js';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/claude', async (req, res) => {
  try {
    const { system, user } = req.body as { system: string; user: string };
    if (!system || !user) {
      res.status(400).json({ error: 'system and user fields required' });
      return;
    }
    const text = await askClaude(system, user);
    res.json({ text });
  } catch (err) {
    console.error('askClaude error:', err);
    res.status(500).json({ error: String(err) });
  }
});

const PORT = 8787;
app.listen(PORT, () => console.log(`API server running on :${PORT}`));
