import type { UserProfile, CommunityProfile, Ranked } from "../shared/contract";
import demoCache from "./demo-cache.json";

type CachedEntry = { id: string; score: number; reason: string };

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

function resolveRanked(
  entries: CachedEntry[],
  pool: (UserProfile | CommunityProfile)[]
): Ranked[] {
  const results: Ranked[] = [];
  for (const entry of entries) {
    const target = pool.find((p) => p.id === entry.id);
    if (target) {
      results.push({ target, score: entry.score, reason: entry.reason });
    }
  }
  return results;
}

export function cachedPeopleSuggestions(pool: UserProfile[]): Ranked[] {
  return resolveRanked(demoCache.peopleTop3, pool);
}

export function cachedCommunitySuggestions(
  communities: CommunityProfile[]
): Ranked[] {
  return resolveRanked(demoCache.communitiesTop3, communities);
}

export function cachedExpansionSuggestions(pool: UserProfile[]): Ranked[] {
  return resolveRanked(demoCache.expansionTop3, pool);
}
