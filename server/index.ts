import express from "express";
import { askClaude } from "./askClaude.js";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.post("/api/claude", async (req, res) => {
  try {
    const { system, user } = req.body as { system?: string; user?: string };
    if (!system || !user) {
      res.status(400).json({ error: "Missing system or user" });
      return;
    }
    const text = await askClaude(system, user);
    res.json({ text });
  } catch (err) {
    console.error("LLM API error:", err);
    res.status(500).json({ error: "LLM request failed" });
  }
});

const PORT = 8787;
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
