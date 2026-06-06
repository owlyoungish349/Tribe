import type { CommunityProfile, CommunityMessage, UserProfile } from "../shared/contract";

// NOTE: The handover locks the app to in-memory only (Decision 7: "no DB, no auth,
// no localStorage"). Persistence below is an explicit product owner override —
// kept lightweight (localStorage) and scoped to Module B + the account profile.

const PROFILE_KEY = "tribe:profile";
const BSTATE_PREFIX = "tribe:bstate:";

export type CommunityState = {
  joinedCommunityIds: string[];
  connectedPersonIds: string[];
  // User-posted messages, appended per community. Seed messages stay in fixtures.
  postedMessages: Record<string, CommunityMessage[]>;
  // Communities founded at runtime, persisted so they survive a refresh.
  foundedCommunities: CommunityProfile[];
};

export const emptyCommunityState: CommunityState = {
  joinedCommunityIds: [],
  connectedPersonIds: [],
  postedMessages: {},
  foundedCommunities: [],
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ----- Account profile -----

export function loadProfile(): UserProfile | null {
  if (typeof localStorage === "undefined") return null;
  return safeParse<UserProfile | null>(localStorage.getItem(PROFILE_KEY), null);
}

export function saveProfile(profile: UserProfile): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function clearAccount(userId?: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(PROFILE_KEY);
  if (userId) localStorage.removeItem(BSTATE_PREFIX + userId);
}

// ----- Module B state (keyed per user) -----

export function loadCommunityState(userId: string): CommunityState {
  if (typeof localStorage === "undefined") return { ...emptyCommunityState };
  return safeParse<CommunityState>(
    localStorage.getItem(BSTATE_PREFIX + userId),
    { ...emptyCommunityState }
  );
}

export function saveCommunityState(userId: string, state: CommunityState): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(BSTATE_PREFIX + userId, JSON.stringify(state));
}
