# Tribe — Checkpoint (B-checkpoint branch)

**Date:** 2026-06-06  
**Branch:** `B-checkpoint`  
**Last commit before this checkpoint:** `39c04a9` (merge main into B-checkpoint)  
**This checkpoint adds:** Module B join/chat/persistence, Module A reskin, shell persistence, fit-score fixes.

---

## Quick start

```bash
npm install
# .env needs CURSOR_API_KEY=...  (see .env.example)
# VITE_DEMO_MODE=false for live agent calls
npm run dev
```

- Frontend: http://localhost:5173/
- API: http://localhost:8787/ (`POST /api/claude`)
- LLM backend: **Cursor SDK** (`composer-2.5` fast, override via `LLM_MODEL`)

---

## What shipped in this checkpoint

### Module B — Community & Connection (primary)
| Feature | Status | Files |
|--------|--------|-------|
| Join flow popup with live agent status | ✅ | `JoinFlowModal.tsx`, `StatusLog.tsx` |
| Fit-check → refine → pass → chat | ✅ | `JoinFlowModal.tsx`, `InterviewPanel.tsx` |
| Community chat threads (modal) | ✅ | `ChatPanel.tsx` |
| My chats list on main page | ✅ | `CommunityModule.tsx` |
| Connection follow-through (Connect → Request sent) | ✅ | `SuggestionCard.tsx` |
| Account + B-state localStorage persistence | ✅ | `persistence.ts`, `App.tsx`, `CommunityModule.tsx` |
| Fit score normalization (0–1 → 0–100) | ✅ | `matching.ts` (`normalizeFitScore`) |
| Parallel first-run matching + StrictMode guard | ✅ (prior commit) | `CommunityModule.tsx`, `matching.ts` |

### Module A — Onboarding (visual only)
| Feature | Status | Files |
|--------|--------|-------|
| Reskin to match Module B (tribe/ember theme) | ✅ | `IntroScreen`, `PasteScreen`, `FillInScreen`, `ConsentScreen` |
| Shell reskin + Start over | ✅ | `App.tsx` |

### Module C — Growth (untouched)
- `applyFeedback`, `growNetwork`, `activateCommunity` **not implemented**
- B still emits `FeedbackEvent`s via `onFeedback` → `FeedbackContext` (console log in shell until C wires up)

---

## Handoff documents (read these)

| Doc | Audience | Contents |
|-----|----------|----------|
| [handoff-A-shell.md](./handoff-A-shell.md) | Module A owner / shell | Persistence, reskin, Start over |
| [handoff-B-community.md](./handoff-B-community.md) | Module B owner | Join popup, chat, persistence, scoring, API surface |
| [handoff-C-seam.md](./handoff-C-seam.md) | Module C owner | What B emits, what not to rebuild, contract deviations |

---

## Demo flow (rehearse this)

1. **Onboarding** → confirm profile → saved to `localStorage` (`tribe:profile`)
2. **Suggestions load** → live agent scores people + communities (progress log, ~30–60s)
3. **Join** on a community → popup opens → status log while agent writes fit questions
4. **Answer fit check** → agent re-scores → pass (≥40%) → chat modal opens
5. **My chats** → reopen any joined community; messages persist across refresh
6. **Start over** (header) → clears profile + B state for user

---

## Contract deviations (documented — do not “fix” silently)

1. **localStorage persistence** — handover Decision 7 said in-memory only; product owner requested account persistence. See `src/community/persistence.ts`.
2. **LLM backend** — handover specifies `@anthropic-ai/sdk`; this branch uses **Cursor SDK** (`server/askClaude.ts`). `MODEL` swap point unchanged in spirit.
3. **Chat + join follow-through** — scoped as **Part B**, not Part C (see `handoff-C-seam.md`).

---

## Not committed (intentionally)

- `vite.config.js`, `tailwind.config.js`, `*.d.ts` next to them — duplicate artifacts; canonical configs are `vite.config.ts` / `tailwind.config.ts`.

---

## Next work (suggested)

- **Module C:** wire `applyFeedback` + “Refine my matches” button; consume `FeedbackEvent` store
- **Module B polish:** optional fit-check retry UX; unread badges in My chats
- **Merge:** reconcile `B` and `B-checkpoint` branches before demo
