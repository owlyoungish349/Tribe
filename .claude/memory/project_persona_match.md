---
name: project-persona-match
description: VibeHack London 2026 hackathon project — Module A (Onboarding) built, shared infra committed
metadata:
  type: project
---

Persona Match — Track 2 Challenge 4 (Community Builder) at VibeHack London 2026.

Three-module app: A = Onboarding, B = Community & Connection, C = Growth & Network.

**Why:** hackathon demo app, in-memory only, no DB/auth.

**Module A status (complete):**
- `server/` (Express :8787, POST /api/claude) — owned by A
- `src/shared/contract.ts` — all cross-module types (UserProfile, CommunityProfile, etc.)
- `src/shared/askClaude.ts` — browser fetch wrapper to /api/claude
- `src/onboarding/` — IntroScreen → PasteScreen → (FillInScreen if interests<2) → ConsentScreen
- `src/fixtures/sample-user.json` — golden fixture for B and C to build against

**How to apply:** B and C import from `src/shared/contract.ts` and `src/shared/askClaude.ts`. Shell is `src/App.tsx` — B and C wire their components into the `profile` branch there.

Stack: React 18 + Vite + TypeScript + Tailwind + Node/Express + @anthropic-ai/sdk.
Run: `npm run dev` (concurrently starts server on :8787 and Vite on :5173).
Needs `.env` with `ANTHROPIC_API_KEY=...` at project root.
