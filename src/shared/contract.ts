// ===== shared/contract.ts — OWNED BY MODULE A =====

export type Scored = { name: string; weight: number };        // weight 0..1
export type Confidence = Record<string, number>;              // field name -> 0..1

// Produced by A. Consumed (read-only) by B and C.
export type UserProfile = {
  id: string;                 // crypto.randomUUID()
  displayName: string;        // from intro field; default "You" if blank
  interests: Scored[];        // e.g. [{ name: "lo-fi production", weight: 0.9 }]
  values: Scored[];           // e.g. [{ name: "build in public", weight: 0.8 }]
  comm_style: string;
  current_focus: string;
  vibe_summary: string;
  source: "chatgpt_memories" | "manual";
  confidence: Confidence;     // per-field 0..1 — low => probe in B's interview
  confirmed: boolean;         // true when it leaves onboarding
};

// Owned by B.
export type CommunityMessage = { author_id: string; text: string; ts: string };
export type CommunityProfile = {
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
export type Ranked = { target: UserProfile | CommunityProfile; score: number; reason: string };

export type FeedbackEvent = {              // emitted by B's UI, consumed by C
  user_id: string;
  target_id: string;
  target_kind: "person" | "community";
  action: "accepted" | "skipped" | "joined";
  ts: string;
};

// Owned by C (network + activation).
export type SparkSuggestion = { community_id: string; quiet_member_ids: string[]; prompt: string };
export type NetworkNode = { id: string; label: string; kind: "user" | "person" | "community"; round: number };
export type NetworkEdge = { from: string; to: string; reason: string };
export type NetworkState = { nodes: NetworkNode[]; edges: NetworkEdge[] };
