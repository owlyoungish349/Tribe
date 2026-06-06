export type Scored = { name: string; weight: number };

export type Confidence = Record<string, number>;

export type UserProfile = {
  id: string;
  displayName: string;
  interests: Scored[];
  values: Scored[];
  comm_style: string;
  current_focus: string;
  vibe_summary: string;
  source: "chatgpt_memories" | "manual";
  confidence: Confidence;
  confirmed: boolean;
};

export type CommunityMessage = { author_id: string; text: string; ts: string };

export type CommunityProfile = {
  id: string;
  name: string;
  description: string;
  interests: Scored[];
  vibe: string;
  member_ids: string[];
  messages: CommunityMessage[];
  summary: string;
};

export type Ranked = {
  target: UserProfile | CommunityProfile;
  score: number;
  reason: string;
};

export type FeedbackEvent = {
  user_id: string;
  target_id: string;
  target_kind: "person" | "community";
  action: "accepted" | "skipped" | "joined";
  ts: string;
};

export type SparkSuggestion = {
  community_id: string;
  quiet_member_ids: string[];
  prompt: string;
};

export type NetworkNode = {
  id: string;
  label: string;
  kind: "user" | "person" | "community";
  round: number;
};

export type NetworkEdge = { from: string; to: string; reason: string };

export type NetworkState = { nodes: NetworkNode[]; edges: NetworkEdge[] };
