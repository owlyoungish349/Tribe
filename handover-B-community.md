# Persona Match — Handover B: COMMUNITY & CONNECTION (agent-ready)

**Owner / agent:** teammate's agent
**Module siblings:** A = Onboarding · C = Growth, Learning & Network
**Event:** VibeHack London 2026 · Track 2 · Challenge 4 (Community Builder)
**Your job in one line:** take a confirmed `UserProfile` and connect it — sneak-peek + suggest communities/people with a real "why you'd fit," run one short adaptive interview, found a community from a cluster, and show one expansion round.

> **AGENT START HERE.** (1) Read §0 and §0b — LOCKED contract. (2) Import `shared/contract.ts` + `shared/askClaude.ts` (A commits them first; until then copy the verbatim stubs from §0). (3) Build the seed pool first (§2) — everything depends on it. (4) Follow the §8 order. Do not add embeddings, a second question round, or a live growth engine.

> **Scope:** noon hackathon demo. Richness (message logs, summaries) is made demoable by **precomputing into committed fixtures**. In-memory only. If it can't survive 90 seconds on conference wifi, cut it.

---

## 0. INTEGRATION SEAM — IDENTICAL IN ALL THREE HANDOVERS (do not edit per-file)

One codebase, three agents. These shapes and signatures are the contract. Copy them verbatim; never rename a field.

```ts
// ===== shared/contract.ts — OWNED BY MODULE A, committed first 30 min =====

type Scored = { name: string; weight: number };        // weight 0..1
type Confidence = Record<string, number>;              // field name -> 0..1

// Produced by A. Consumed (read-only) by B and C.
type UserProfile = {
  id: string;                 // crypto.randomUUID()
  displayName: string;        // from intro field; default "You" if blank
  interests: Scored[];
  values: Scored[];
  comm_style: string;
  current_focus: string;
  vibe_summary: string;
  source: "chatgpt_memories" | "manual";
  confidence: Confidence;     // per-field 0..1 — low => probe in your interview
  confirmed: boolean;
};

// Owned by B (you).
type CommunityMessage = { author_id: string; text: string; ts: string };
type CommunityProfile = {
  id: string;
  name: string;
  description: string;
  interests: Scored[];
  vibe: string;
  member_ids: string[];
  messages: CommunityMessage[];   // seed log (fixture)
  summary: string;                // precomputed LLM summary
};

// Shared result + signal types.
type Ranked = { target: UserProfile | CommunityProfile; score: number; reason: string };

type FeedbackEvent = {              // YOUR UI emits these; C consumes them
  user_id: string;
  target_id: string;
  target_kind: "person" | "community";
  action: "accepted" | "skipped" | "joined";
  ts: string;
};

// Owned by C.
type SparkSuggestion = { community_id: string; quiet_member_ids: string[]; prompt: string };
type NetworkNode = { id: string; label: string; kind: "user" | "person" | "community"; round: number };
type NetworkEdge = { from: string; to: string; reason: string };
type NetworkState = { nodes: NetworkNode[]; edges: NetworkEdge[] };
```

**Module entry points (full cross-module API surface):**
```ts
// A:
onComplete(profile: UserProfile): void

// B (you) expose:
suggestPeople(user: UserProfile): Ranked[]
suggestCommunities(user: UserProfile): Ranked[]
formCommunity(user: UserProfile, pool: UserProfile[]): CommunityProfile | null
expandCommunity(community: CommunityProfile, pool: UserProfile[]): Ranked[]
communityQuestions(user: UserProfile, community: CommunityProfile): string[]
refineMatch(user: UserProfile, community: CommunityProfile, answers: string[]): Ranked

// C:
applyFeedback(user: UserProfile, events: FeedbackEvent[]): UserProfile
growNetwork(user: UserProfile, pool: UserProfile[], communities: CommunityProfile[], rounds: number): NetworkState
activateCommunity(community: CommunityProfile, pool: UserProfile[]): SparkSuggestion
```

**Shared backend — `shared/askClaude.ts`, OWNED BY MODULE A, committed first 30 min:**
```ts
export const MODEL = "claude-sonnet-4-6";   // SINGLE swap point
export async function askClaude(systemPrompt: string, userContent: string): Promise<string>
```
Until `shared/` lands, copy the verbatim stub. One implementation only.

---

## 0b. LOCKED DECISIONS (do not reopen — they are settled)

1. **No embeddings, project-wide.** No vectors/cosine/`embed`. **Batch-judge the whole pool** via `askClaude`.
2. **User-embedding ownership:** moot (dissolved by #1).
3. **One question moment only.** A runs no general questioning round. The sole question moment is **your adaptive interview (§5)**. Lean on `confidence` to aim it; don't assume A pre-asked anything.
4. **Shared infra owned by A**, committed first 30 min. You import it.
5. **Feedback signal:** your suggestion cards call `onFeedback(event: FeedbackEvent)` (a prop from the app shell). C owns the store + `applyFeedback`. You only emit.
6. **Display name:** A handles it. `user.displayName` is always set.
7. **Fill-in rule:** A's only question (interests < 2). Not yours.
8. **In-memory only.** No DB, no auth.
9. **Model** = `MODEL` in `shared/askClaude.ts`.

---

## 0c. TECH STACK & REPO LAYOUT — IDENTICAL IN ALL THREE HANDOVERS

**Stack (fixed):**
- Frontend: **React 18 + Vite + TypeScript + Tailwind CSS**
- Backend: **Node + Express** — small server, sole purpose is to hide the Anthropic API key
- LLM SDK: **`@anthropic-ai/sdk`** (server-side only)
- State: React state + one tiny `Context` for C's `FeedbackEvent` store
- Graph viz (Module C): **`react-force-graph-2d`** (default; d3 acceptable if preferred)
- Package manager: **npm**
- Persistence: **none** — in-memory only. No DB, no auth, no localStorage.

**Repo layout (create exactly this):**

```
persona-match/
├─ package.json
├─ vite.config.ts             # proxy /api → http://localhost:8787
├─ tailwind.config.ts
├─ index.html
├─ .env                       # ANTHROPIC_API_KEY=...  (gitignored)
├─ server/                    # OWNED BY A — committed first 30 min
│   ├─ index.ts               # Express on :8787, POST /api/claude
│   └─ askClaude.ts           # uses @anthropic-ai/sdk + process.env.ANTHROPIC_API_KEY
└─ src/
    ├─ main.tsx
    ├─ App.tsx                # shell — composes A, B, C
    ├─ shared/                # OWNED BY A — committed first 30 min
    │   ├─ contract.ts        # the types from §0, verbatim
    │   └─ askClaude.ts       # BROWSER wrapper: POSTs to /api/claude
    ├─ onboarding/            # Module A
    ├─ community/             # Module B  ← your files live here
    │   ├─ pool.json
    │   ├─ communities.json
    │   └─ precompute.ts      # build-time fixture builder
    ├─ growth/                # Module C
    └─ fixtures/
        └─ sample-user.json   # A commits day one — use this to build before onboarding is done
```

**How `askClaude` actually works (the only architecturally non-obvious piece):**

There are **two** files named `askClaude.ts`:
- **`src/shared/askClaude.ts` — browser.** Same `askClaude(system, user)` signature; internally does `fetch("/api/claude", { method:"POST", body: JSON.stringify({system, user}) })` and returns the text. **A, B, C all import only this one.** Never call Anthropic from the browser.
- **`server/askClaude.ts` — Node.** Calls `client.messages.create({ model: MODEL, max_tokens: 1024, system, messages: [{ role:"user", content: user }] })` and returns the text block. `MODEL = "claude-sonnet-4-6"` lives here as the single swap point.

`vite.config.ts` proxies `/api/*` to `http://localhost:8787` in dev so the frontend's fetch just works.

**npm scripts (in `package.json`):**
- `"dev"`: `concurrently "npm run server" "vite"`
- `"server"`: `tsx server/index.ts`
- `"build"`: `vite build`
- `"precompute"`: `tsx src/community/precompute.ts`  ← **you write and run this** to populate `communities.json` summaries

**Bootstrap checklist — A's first 30 minutes (done when you can `import`):**
1. `npm create vite@latest persona-match -- --template react-ts`
2. `npm i tailwindcss @anthropic-ai/sdk express tsx concurrently react-force-graph-2d` + `npx tailwindcss init -p`
3. Create `server/index.ts` (Express + `POST /api/claude`) and `server/askClaude.ts`.
4. Create `src/shared/contract.ts` (paste types from §0) and `src/shared/askClaude.ts` (fetch wrapper).
5. Add the `/api` proxy in `vite.config.ts`.
6. Commit `src/fixtures/sample-user.json` — your matching input until onboarding is wired.

---

## 1. What you own

1. The **seed pool** — 15–25 people personas + 2–3 communities, each with a simulated message log + precomputed summary (fixtures).
2. **Matching** — batch LLM-as-judge over the whole pool → score + rationale.
3. **Suggestion UI** — community/people cards with a sneak-peek fit preview; cards emit `onFeedback`.
4. **Adaptive match interview** — 2–3 tailored questions for a top community, then re-score.
5. **Community formation** — cluster with no home → offer to found a space.
6. **Community expansion** — one round of "more people who'd fit."

You do **not** own onboarding, extraction, the consent screen, feedback learning, or the network view.

---

## 2. The seed pool — your most important fixture

A matching demo with one live user matches nobody. Build **15–25 people personas** + **2–3 communities** as static JSON, committed. The demo lives or dies on it — design it deliberately:

- A few personas are **strong matches** for the stage demo profile (so the payoff lands).
- A few are **weak**, so scores spread (not "everyone is 90%").
- **Engineer one cluster:** 4–5 personas sharing a specific niche interest with **no existing community** — this makes formation demoable (§6).
- **Each community gets a simulated message log** (8–15 short, slightly messy messages) that sounds like the space.
- Generate personas + logs with Claude, then hand-check for variety. Don't claim the pool is real users.

**Precompute script (build-time, output committed as JSON):**
1. For each community, `askClaude(its message log)` → `summary` (Call B-summary, §3).

Runtime then only makes a handful of judge calls.

---

## 3. The LLM calls you own

**Call B-summary** (precomputed): message log → 2–3 sentence `summary` of topics + tone.

**Call B-judge** (runtime core): user + one candidate (person or community; include the community `summary`) → strict JSON `{ score: 0-100, reason }`. Run over the **whole pool** (batch several per call — trivial at ~25), sort, take top 3. Prompt `reason` to be specific and human; push the full 0–100 range.

**Call B-questions** (runtime): user + top community(+summary) → 2–3 pointed questions; then a re-score call (user + community + answers) → updated `Ranked`.

---

## 4. Suggestion UI

Show **suggested communities** and **suggested people**, each card carrying its `reason`.
- **Sneak peek = fit preview:** card leads with "why you'd fit" + score, generated from the community `summary`, specific to this user. Reading one aloud is the demo's emotional beat — style these well.
- Don't dump the message log on the card; it lives behind the summary/rationale.
- **Each card emits `onFeedback({action})`** on accept/skip/join (Decision 5) — this is C's input. Wire the callback even if C isn't done; default it to a no-op prop.
- Optional polish: a "peek inside" expand showing the `summary` + member avatars.

---

## 5. Adaptive match interview (the ONLY question moment)

Before committing to a top community, run a tiny tailored interview.
- Trigger for the **top 1–2 communities**, or where a relevant `confidence` field is low.
- `communityQuestions(user, community)` → 2–3 questions like *"This crew ships rough demos weekly and roasts each other's work — energizing or exhausting?"*
- User answers inline (chips / one-liners).
- `refineMatch(user, community, answers)` → updated `Ranked` with a sharpened `reason` ("you said you want honest feedback fast — that's literally this room").
- Keep to one community on stage (~20s). Shows the system reasoning about fit, not just emitting a number.

---

## 6. Community formation (the Challenge 4 money shot)

- `formCommunity(user, pool)`: detect the engineered cluster — personas sharing a user interest with no existing `CommunityProfile`.
- Surface: *"5 people here share your thing for [niche] — and there's no space for it yet. Start one?"*
- One tap founds a `CommunityProfile` with those `member_ids`; one `askClaude` generates a starter `summary`/`vibe` so it isn't empty.
- ~15 seconds; shows real clustering.

---

## 7. Community expansion (one round)

- `expandCommunity(community, pool)`: batch-judge the pool with the **community** as the query; return ranked non-members.
- After founding, show "3 more people who'd fit here."
- Say "and it keeps doing this as Zymix grows" — the *ongoing* growth is **Module C's** job and the narrative line; **you build one round only. No auto-growth engine, no timers.**

---

## 8. Build order (definition of done per step)

1. Seed pool JSON committed + rendering as static cards. (FIRST.)
2. Precompute script (community summaries) committed into fixtures.
3. Import `fixtures/sample-user.json` from A (or hardcode) so you build before onboarding is done.
4. Call B-judge (batched) — real scores + rationales over the people pool.
5. Suggested-communities scoring (summaries feed rationale).
6. Sneak-peek fit-preview cards (§4) + `onFeedback` wired.
7. Adaptive interview (§5).
8. Community formation (§6).
9. Expansion one round (§7).
10. Integrate: replace the hardcoded profile with the real `onComplete` output.

Demoable after step 8. If behind, **cut the interview (§5) before formation** — formation is the scored moment.

---

## 9. Testing

- Score spread (not all 85–95) — tighten the judge prompt if clustered.
- Summaries name real topics from the logs, not vague filler.
- Interview re-score actually moves score/reason.
- Formation fires for the stage profile — rehearse with the exact profile.
- Expansion excludes existing members.
- Bad JSON from any call never crashes; skip a candidate / fall back to the precomputed summary.
- `onFeedback` fires with a correct `FeedbackEvent` on every accept/skip/join.
- Keep a screen recording of the full flow.

---

## 10. Do NOT build

- Auto-growth / ongoing community engine or timers (that's C's *simulated* job, not a real engine).
- Embeddings / vector search (Decision 1).
- Runtime summarization of live messages (summaries are precomputed).
- More than ~25 personas / ~3 communities.
- A second question round (Decision 3).
- Real-time chat, auth, or a DB.

---

## 11. Cross-module facts (already fixed)

- Import `shared/` from A; do not re-implement `askClaude` or the types.
- Get `fixtures/sample-user.json` from A on day one to build matching in parallel.
- Your cards are C's data source: emit `onFeedback` on every interaction.
- The user answers questions exactly once — in your interview.
