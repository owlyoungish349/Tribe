# Tribe

**Find your people from what your AI already knows about you.**

Tribe is a community-matching app built for [VibeHack London 2026](https://vibehack.london) (Track 2 · Challenge 4 — Community Builder). You paste a summary from ChatGPT (or write your own), confirm your profile, and Tribe uses live AI agents to match you with communities and people — then lets you join, pass a fit check, and chat.

**Live demo:** [tribe-orpin.vercel.app](https://tribe-orpin.vercel.app)

---

## What it does

1. **Onboarding** — Paste ChatGPT memories or describe yourself; the agent extracts interests, values, communication style, and vibe into a structured profile.
2. **Matching** — Live agent calls score every person and community in the seed pool in parallel, with human-readable reasons and fit percentages.
3. **Join flow** — Click Join → popup loads personalized fit questions (with live status) → agent re-scores your answers → pass → chat opens.
4. **Chat** — Community threads with seed messages plus your posts; **My chats** lists everything you've joined.
5. **Persistence** — Profile, joins, connections, and messages survive refresh via `localStorage`.

---

## Architecture

Three modules share one codebase and a locked type contract (`src/shared/contract.ts`):

| Module | Scope | Status |
|--------|--------|--------|
| **A — Onboarding** | Profile extraction, consent, shell | ✅ Complete |
| **B — Community** | Matching, join, chat, formation | ✅ Complete |
| **C — Growth** | Feedback learning, network graph, activation | 🔲 Stub only |

```
┌─────────────────────────────────────────────────────────┐
│  React SPA (Vite)                                       │
│  ┌─────────────┐  ┌──────────────────┐  ┌────────────┐ │
│  │ Onboarding  │→ │ CommunityModule  │  │ Growth (C) │ │
│  │ Intro→Paste │  │ match·join·chat  │  │ feedback   │ │
│  │ →Consent    │  │                  │  │ stub       │ │
│  └─────────────┘  └────────┬─────────┘  └────────────┘ │
│                            │ POST /api/claude           │
└────────────────────────────┼────────────────────────────┘
                             ▼
              ┌──────────────────────────────┐
              │  API (Express local /        │
              │  Vercel serverless prod)     │
              │  lib/askClaude.ts            │
              │  → Cursor SDK Agent.prompt   │
              └──────────────────────────────┘
```

**LLM backend:** [Cursor SDK](https://cursor.com) (`@cursor/sdk`) — cloud agents, default model `composer-2.5` (fast variant). No embeddings; all matching is batched agent judging or deterministic overlap.

**Key design choices:**
- Single `askClaude(system, user)` swap point in `lib/askClaude.ts`
- Fit scores normalized to 0–100 (`normalizeFitScore`) — agents sometimes return 0–1 scales
- Parallel batch judging on first load (`Promise.all`)
- Demo mode (`VITE_DEMO_MODE=true`) uses precomputed cache, no API key needed

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js — Express (local), Vercel serverless (prod) |
| LLM | Cursor SDK (`Agent.prompt`, cloud runtime) |
| State | React state + `localStorage` persistence |
| Fonts | DM Sans, Fraunces (Google Fonts) |

---

## Getting started

### Prerequisites

- Node.js 18+
- [Cursor API key](https://cursor.com/settings) for live agent mode

### Local development

```bash
git clone https://github.com/owlyoungish349/Tribe.git
cd Tribe
npm install

cp .env.example .env
# Edit .env — add CURSOR_API_KEY=...

npm run dev
```

- **App:** http://localhost:5173/
- **API:** http://localhost:8787/ (`POST /api/claude`)

Vite proxies `/api/*` to the Express server in dev (`vite.config.ts`).

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CURSOR_API_KEY` | Live mode | Cursor API key for agent calls |
| `LLM_MODEL` | No | Override default `composer-2.5` |
| `VITE_DEMO_MODE` | No | `true` = cached responses, no API calls |

### Production build

```bash
npm run build    # outputs to dist/
npm run preview  # preview static build locally
```

### Deploy to Vercel

See [DEPLOY.md](./DEPLOY.md). Summary:

```bash
npx vercel login
npx vercel --prod
```

Set `CURSOR_API_KEY` in Vercel project settings. Agent calls can take 15–60s — Pro plan recommended for live demos (60s function timeout configured in `vercel.json`).

---

## Project structure

```
Tribe/
├── api/claude.ts          # Vercel serverless handler
├── lib/askClaude.ts       # Shared LLM integration (single swap point)
├── server/                # Local Express API (:8787)
├── src/
│   ├── App.tsx            # Shell — onboarding ↔ suggestions routing
│   ├── shared/
│   │   ├── contract.ts    # Cross-module types (UserProfile, Ranked, …)
│   │   └── askClaude.ts   # Browser fetch wrapper → /api/claude
│   ├── onboarding/        # Module A — Intro, Paste, FillIn, Consent
│   ├── community/         # Module B — matching, join, chat, fixtures
│   │   ├── matching.ts    # suggest*, refineMatch, formCommunity, …
│   │   ├── pool.json      # Seed people
│   │   ├── communities.json
│   │   └── components/    # Cards, JoinFlowModal, ChatPanel, …
│   ├── growth/            # Module C stub — FeedbackContext only
│   └── components/        # TribeLogo, shared UI
├── vercel.json
├── checkpoint.md          # Latest feature checkpoint
├── handoff-*.md           # Per-module agent handoffs
└── DEPLOY.md
```

---

## Module B API surface

```ts
suggestPeople(user, pool): Promise<Ranked[]>
suggestCommunities(user, communities): Promise<Ranked[]>
communityQuestionsAsync(user, community): Promise<string[]>
refineMatch(user, community, answers): Promise<Ranked>
formCommunity(user, pool, communities): Promise<CommunityProfile | null>
expandCommunity(community, pool): Promise<Ranked[]>
normalizeFitScore(raw): number   // 0–100 display scale
```

B emits `FeedbackEvent`s (`accepted` | `skipped` | `joined`) for Module C to consume.

---

## Demo flow

1. Complete onboarding → profile saved to `localStorage`
2. Wait ~30–60s while agents score people + communities (progress log)
3. **Join** a community → fit-check popup → answer questions → chat opens on pass
4. **Connect** with people → **My chats** for joined communities
5. **Start over** (header) clears account state

For a quick skip: set `VITE_DEMO_MODE=true` and use the demo stub on the onboarding screen.

---

## Handoff docs

For contributors picking up a module:

- [handoff-A-shell.md](./handoff-A-shell.md) — Onboarding + shell persistence
- [handoff-B-community.md](./handoff-B-community.md) — Matching, join, chat
- [handoff-C-seam.md](./handoff-C-seam.md) — Growth module integration seam
- [checkpoint.md](./checkpoint.md) — Latest shipped feature summary

---

## License

Private — VibeHack London 2026 hackathon project.
