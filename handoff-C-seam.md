# Handoff C — Growth seam only (do not rebuild B)

**Branch:** `B-checkpoint`  
**Audience:** Module C agent  
**Read with:** original `handover-C-growth.md` spec

---

## What Module B already owns (do NOT move to C)

These were briefly mis-scoped as “Part C” but are **Part B** per product owner:

| Feature | B implementation |
|---------|------------------|
| Community messages / chat | `ChatPanel.tsx`, `CommunityMessage` in fixtures |
| Join follow-through | `JoinFlowModal`, `SuggestionCard`, `joinedIds` |
| Connection follow-through | `connectedIds`, Connect → Request sent |

Module C should **not** duplicate chat, join UI, or community message storage.

---

## What Module C still owns (unchanged spec)

1. **`applyFeedback`** — re-weight profile from accept/skip/joined signals
2. **`growNetwork`** — network graph visualization across rounds
3. **`activateCommunity`** — quiet-member detection + spark prompt

Priority per spec: pillar 1 → 2 → 3.

---

## Integration seam (ready for C)

### Feedback events

B’s cards call `onFeedback(event)` → today `App.tsx` logs to console.

```ts
type FeedbackEvent = {
  user_id: string;
  target_id: string;
  target_kind: "person" | "community";
  action: "accepted" | "skipped" | "joined";
  ts: string;
};
```

**C action:** replace shell stub with `FeedbackProvider` store (file exists: `src/growth/FeedbackContext.tsx`). Wire:

- “Refine my matches” → `applyFeedback` → re-run `suggestPeople` / `suggestCommunities`
- Optional: “See my network” → `growNetwork`
- Optional: community detail → `activateCommunity`

### Data C can import

- `src/community/pool.json`
- `src/community/communities.json`
- `UserProfile` from completed onboarding (or `fixtures/sample-user.json`)

### Do not import from B internals

- `persistence.ts` — B-owned; C stays in-memory per spec
- `JoinFlowModal` / `ChatPanel` — UI only, no growth logic

---

## Contract deviations affecting C

| Decision | Spec | This branch |
|----------|------|-------------|
| Persistence | In-memory only | localStorage for profile + B state (shell/B) |
| LLM | Anthropic SDK | Cursor SDK (`server/askClaude.ts`) |
| `joined` feedback | B emits | ✅ fired on successful join in `handleConfirmJoin` |

C should remain **in-memory** for its own state (feedback store, network graph) unless product owner says otherwise.

---

## Minimal C wiring steps

1. Implement `applyFeedback.ts` deterministic re-weighting
2. Replace `App.tsx` `handleFeedback` console.log with store append
3. Add “Refine my matches” button above suggestions in `CommunityModule` or shell
4. (Later) `NetworkView.tsx` + `growNetwork.ts`
5. (Later) `activateCommunity.ts` spark in community detail or expansion panel

---

## Files Module C should NOT edit in this checkpoint

- `src/community/components/JoinFlowModal.tsx`
- `src/community/components/ChatPanel.tsx`
- `src/community/persistence.ts`
- `src/onboarding/*` (A reskin complete)
