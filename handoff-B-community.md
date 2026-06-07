# Handoff B — Community & Connection (checkpoint delta)

**Branch:** `B-checkpoint`  
**Baseline:** changes since commit `39c04a9`  
**Owner:** Module B

---

## Summary

Module B is now **demo-complete** for connection follow-through: join popup with **live agent status**, fit-check gate, **chat threads**, **My chats**, and **localStorage** for joins/connections/messages/founded communities. Fit scores are **normalized to 0–100** after agent calls.

---

## New files

| File | Purpose |
|------|---------|
| `src/community/persistence.ts` | `localStorage` for profile (used by shell) + per-user B state |
| `src/community/components/JoinFlowModal.tsx` | Join popup: load questions → interview → refine → pass → chat |
| `src/community/components/ChatPanel.tsx` | Chat modal with My chats sidebar + message thread |
| `src/community/components/StatusLog.tsx` | Reusable live agent status checklist UI |

---

## Join flow (canonical UX)

```
SuggestionCard [Join]
  → JoinFlowModal opens (centered popup)
  → Step: loading-questions (StatusLog + agent calls communityQuestionsAsync)
  → Step: interview (InterviewPanel embedded)
  → Step: refining (StatusLog + refineMatch)
  → Step: result if score ≥ 40 (PASS_THRESHOLD) → onJoined → chat opens
  → Step: failed if below threshold → Close or Join anyway
```

**Already joined:** Join / Open chat → `ChatPanel` directly (skips fit check).

**Founded community:** `formCommunity` → auto-join + open chat.

---

## Chat (`ChatPanel.tsx`)

- Centered modal, `z-50`, backdrop blur
- Left sidebar: **My chats** (all joined communities, last-message preview)
- Main pane: grouped messages, avatars/initials, user bubbles right (tribe-600)
- Seed messages from `communities.json` + user posts in `postedMessages` state
- Escape or backdrop click closes (except during refining step in join flow)

---

## Persistence (`persistence.ts`)

```ts
type CommunityState = {
  joinedCommunityIds: string[];
  connectedPersonIds: string[];
  postedMessages: Record<string, CommunityMessage[]>;
  foundedCommunities: CommunityProfile[];
};
```

- Loaded on `CommunityModule` mount per `user.id`
- Saved on every state change via `useEffect`
- **Deviation:** handover Decision 7 forbids localStorage — documented product override

---

## Suggestion cards (`SuggestionCard.tsx`)

| Action | UI after |
|--------|----------|
| Join (community) | Opens `JoinFlowModal` |
| Joined | ✓ Joined + Open chat |
| Connect (person) | ✓ Request sent |
| Skip | Emits `skipped` feedback |

Scores displayed via `normalizeFitScore(ranked.score)`.

---

## Matching (`matching.ts`)

### `normalizeFitScore(raw: number): number`

- `0 < raw ≤ 1` → ×100
- `1 < raw ≤ 10` → ×10
- Clamp 0–100, round integer

Used in: `judgeBatchLive`, `refineMatch`, `SuggestionCard`, `InterviewPanel`, `JoinFlowModal`.

### Prompt fix

`REFINE_SYSTEM` now explicitly requires score as **integer 0–100**.

### Unchanged from prior commit

- `suggestPeople` / `suggestCommunities` — parallel batches
- `formCommunity`, `expandCommunity`, `detectFormationCluster`
- `communityQuestionsAsync`, `refineMatch` — used inside `JoinFlowModal` only (not inline on page)

---

## `CommunityModule.tsx` state map

| State | Purpose |
|-------|---------|
| `joinFlowCommunity` | Community currently in join popup (null = closed) |
| `chatOpen` + `activeChatId` | Chat modal |
| `joinedIds` / `connectedIds` | Follow-through UI |
| `postedMessages` | User chat posts |
| `questionsCacheRef` | In-memory cache of fit questions per community |

---

## Feedback events (for Module C)

B emits via `onFeedback`:

```ts
{ user_id, target_id, target_kind: "person" | "community", action: "accepted" | "skipped" | "joined", ts }
```

- `joined` — fired in `handleConfirmJoin` after fit pass (or Join anyway)
- `accepted` — person Connect
- `skipped` — Skip button

---

## API surface (unchanged contract)

```ts
suggestPeople(user, pool): Ranked[]
suggestCommunities(user, communities): Ranked[]
communityQuestions(user, community): string[]
communityQuestionsAsync(user, community): Promise<string[]>
refineMatch(user, community, answers): Promise<Ranked>
formCommunity(user, pool, communities): Promise<CommunityProfile | null>
expandCommunity(community, pool): Promise<Ranked[]>
```

Plus export: `normalizeFitScore`, `isCommunity`, `isUserProfile`, `detectFormationCluster`.

---

## Testing checklist

- [ ] Join → popup shows status log while questions load
- [ ] Complete fit check → refined % is sensible (not 0–1%)
- [ ] Pass → chat opens automatically
- [ ] Refresh page → profile + joins + messages persist
- [ ] Start over → clears state, returns to onboarding
- [ ] My chats lists all joined communities
