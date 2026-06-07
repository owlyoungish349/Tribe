# Handoff A — Shell & Onboarding (checkpoint delta)

**Branch:** `B-checkpoint`  
**Baseline:** changes since commit `39c04a9`  
**Owner:** Module A / app shell

---

## Summary

Module A onboarding screens were **reskinned** to match Module B’s tribe/ember design system. The **app shell** gained **localStorage account persistence** and a **Start over** control. No changes to extraction logic, `contract.ts`, or `askClaude.ts`.

---

## Files changed

| File | Change |
|------|--------|
| `src/App.tsx` | Persistence, tribe theme shell, Start over button |
| `src/onboarding/IntroScreen.tsx` | Light tribe theme, Fraunces headings |
| `src/onboarding/PasteScreen.tsx` | Same reskin |
| `src/onboarding/FillInScreen.tsx` | Same reskin |
| `src/onboarding/ConsentScreen.tsx` | Same reskin + helper components updated |

---

## Shell behaviour (`App.tsx`)

### Persistence (product override)

```ts
import { loadProfile, saveProfile, clearAccount } from "./community/persistence";
```

- On mount: `loadProfile()` → if present, skip onboarding and go to `suggestions`
- On `onComplete(profile)`: `saveProfile(profile)` then navigate
- **Start over** (header, suggestions view only): `clearAccount(user?.id)` → onboarding

Keys (owned by B’s `persistence.ts` but used by shell):

- `tribe:profile` — `UserProfile` JSON
- `tribe:bstate:{userId}` — Module B state (cleared on Start over)

### Visual

- Background: `bg-tribe-50`
- Header: `font-display`, `border-tribe-200`, `bg-white/80 backdrop-blur`

### Feedback plumbing (unchanged)

- `handleFeedback` still `console.log`s — Module C not wired
- B cards call `onFeedback` via `FeedbackProvider` as before

---

## Onboarding reskin notes

- **Before:** dark violet/indigo theme
- **After:** light `tribe-*` / `ember-*` palette, white cards, Fraunces display font
- Flow unchanged: Intro → Paste → (FillIn if needed) → Consent → `onComplete`

---

## Integration points for B / C

| Export / hook | Consumer |
|---------------|----------|
| `onComplete(profile)` | Shell → `Suggestions` / `CommunityModule` |
| `onFeedback(event)` | Shell logs; C should replace with store |
| `loadProfile` / `saveProfile` | Shell only today; C should not duplicate |

---

## Do not

- Move persistence into Module C — it’s account-level, shell + B scoped
- Revert reskin without coordinating B UI (cards/modals match this theme)
