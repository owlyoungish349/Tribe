import { askClaude } from "../shared/askClaude";
import type {
  UserProfile,
  CommunityProfile,
  Ranked,
} from "../shared/contract";
import communitiesFixture from "./communities.json";
import {
  isDemoMode,
  cachedPeopleSuggestions,
  cachedCommunitySuggestions,
  cachedExpansionSuggestions,
} from "./demoMode";

export type MatchProgress = {
  label: string;
  current: number;
  total: number;
};

const BATCH_JUDGE_SYSTEM = `You are a community-matching judge for Tribe, a community-matching app.
Given a USER and multiple CANDIDATES, score EACH candidate's fit with the user from 0-100.
Use the FULL range — weak fits 20-45, decent 50-70, strong 75-90, exceptional 90+.
Return ONLY valid JSON array with one entry per candidate:
[{"id": string, "score": number, "reason": string}]
Each reason: one specific human sentence, max 30 words, mention concrete interest/vibe overlap.
Include every candidate id from the input. No markdown.`;

const QUESTIONS_SYSTEM = `You generate 2-3 short adaptive interview questions to test community fit.
Questions should be pointed, conversational, and reference the community's actual vibe/summary.
Return ONLY a JSON array of strings, e.g. ["question 1", "question 2"]`;

const REFINE_SYSTEM = `You re-score community fit after the user answered interview questions.
Return ONLY valid JSON: {"score": number, "reason": string}
score MUST be an integer from 0 to 100 (e.g. 78 means 78% fit — never use 0.78 or 7.8).
The reason should reference their answers and sharpen the fit narrative. One sentence.`;

/** Normalize agent scores that may arrive on 0-1 or 0-10 scales into 0-100. */
export function normalizeFitScore(raw: number): number {
  let score = Number(raw);
  if (!Number.isFinite(score)) return 50;
  if (score > 0 && score <= 1) score *= 100;
  else if (score > 1 && score <= 10) score *= 10;
  return Math.round(Math.min(100, Math.max(0, score)));
}

const FORM_SYSTEM = `You generate a starter community profile for a newly founded space.
Return ONLY valid JSON: {"description": string, "vibe": string, "summary": string}
Keep each field 1-2 sentences. Match the niche interest and member vibes.`;

type JudgeResult = { score: number; reason: string };
type BatchJudgeResult = { id: string; score: number; reason: string };

function parseJson<T>(text: string, fallback: T): T {
  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

function profileToText(p: UserProfile): string {
  const interests = p.interests.map((i) => `${i.name}(${i.weight})`).join(", ");
  const values = p.values.map((v) => `${v.name}(${v.weight})`).join(", ");
  return `Name: ${p.displayName}
Interests: ${interests}
Values: ${values}
Comm style: ${p.comm_style}
Current focus: ${p.current_focus}
Vibe: ${p.vibe_summary}`;
}

function communityToText(c: CommunityProfile): string {
  const interests = c.interests.map((i) => `${i.name}(${i.weight})`).join(", ");
  return `id: ${c.id}
Community: ${c.name}
Description: ${c.description}
Interests: ${interests}
Vibe: ${c.vibe}
Summary: ${c.summary}
Members: ${c.member_ids.length}`;
}

function personToText(p: UserProfile): string {
  return `id: ${p.id}\n${profileToText(p)}`;
}

function candidateLabel(
  candidate: UserProfile | CommunityProfile,
  kind: "person" | "community"
): string {
  return kind === "community"
    ? communityToText(candidate as CommunityProfile)
    : personToText(candidate as UserProfile);
}

async function judgeBatchLive(
  user: UserProfile,
  candidates: (UserProfile | CommunityProfile)[],
  kind: "person" | "community",
  onProgress?: (p: MatchProgress) => void
): Promise<Ranked[]> {
  const BATCH_SIZE = 10;
  const batches: (UserProfile | CommunityProfile)[][] = [];
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    batches.push(candidates.slice(i, i + BATCH_SIZE));
  }

  const label = kind === "person" ? "people" : "communities";
  let done = 0;
  onProgress?.({
    label: `Agent scoring ${label} (0/${batches.length})`,
    current: 0,
    total: batches.length,
  });

  // Run all batches concurrently — each is an independent agent call.
  const batchResults = await Promise.all(
    batches.map(async (batch) => {
      const candidatesBlock = batch
        .map((c, idx) => `--- CANDIDATE ${idx + 1} ---\n${candidateLabel(c, kind)}`)
        .join("\n\n");

      const userContent = `USER:\n${profileToText(user)}\n\nCANDIDATES (${kind}, score each):\n${candidatesBlock}`;

      let parsed: BatchJudgeResult[] = [];
      try {
        const raw = await askClaude(BATCH_JUDGE_SYSTEM, userContent);
        parsed = parseJson<BatchJudgeResult[]>(raw, []);
      } catch {
        parsed = [];
      }

      done += 1;
      onProgress?.({
        label: `Agent scoring ${label} (${done}/${batches.length})`,
        current: done,
        total: batches.length,
      });

      return batch.map((candidate): Ranked => {
        const entry = parsed.find((r) => r.id === candidate.id);
        return {
          target: candidate,
          score: normalizeFitScore(entry?.score ?? 50),
          reason: entry?.reason ?? "Some overlap on interests and vibe.",
        };
      });
    })
  );

  return batchResults.flat().sort((a, b) => b.score - a.score);
}

export async function suggestPeople(
  user: UserProfile,
  pool: UserProfile[],
  onProgress?: (p: MatchProgress) => void
): Promise<Ranked[]> {
  const others = pool.filter((p) => p.id !== user.id);
  if (isDemoMode) {
    await new Promise((r) => setTimeout(r, 400));
    return cachedPeopleSuggestions(others);
  }
  const ranked = await judgeBatchLive(user, others, "person", onProgress);
  return ranked.slice(0, 3);
}

export async function suggestCommunities(
  user: UserProfile,
  communities: CommunityProfile[],
  onProgress?: (p: MatchProgress) => void
): Promise<Ranked[]> {
  if (isDemoMode) {
    await new Promise((r) => setTimeout(r, 400));
    return cachedCommunitySuggestions(communities);
  }
  const ranked = await judgeBatchLive(user, communities, "community", onProgress);
  return ranked.slice(0, 3);
}

export function communityQuestions(
  user: UserProfile,
  community: CommunityProfile
): string[] {
  const fallback = [
    `This crew is all about "${community.vibe.slice(0, 60)}..." — does that energy match how you like to work?`,
    `They talk a lot about ${community.interests[0]?.name ?? "shared topics"} — is that what you're looking for right now?`,
    `Would you thrive in a space where feedback is ${community.name.includes("Rough") ? "blunt and playful" : "structured and direct"}?`,
  ];
  void user;
  return fallback;
}

export async function communityQuestionsAsync(
  user: UserProfile,
  community: CommunityProfile
): Promise<string[]> {
  const userContent = `USER:\n${profileToText(user)}\n\nCOMMUNITY:\n${communityToText(community)}`;

  try {
    const raw = await askClaude(QUESTIONS_SYSTEM, userContent);
    const questions = parseJson<string[]>(raw, []);
    if (questions.length >= 2) return questions.slice(0, 3);
  } catch {
    /* fall through */
  }
  return communityQuestions(user, community);
}

export async function refineMatch(
  user: UserProfile,
  community: CommunityProfile,
  answers: string[]
): Promise<Ranked> {
  const qa = answers.map((a, i) => `Q${i + 1} answer: ${a}`).join("\n");
  const userContent = `USER:\n${profileToText(user)}\n\nCOMMUNITY:\n${communityToText(community)}\n\nINTERVIEW ANSWERS:\n${qa}`;

  try {
    const raw = await askClaude(REFINE_SYSTEM, userContent);
    const result = parseJson<JudgeResult>(raw, {
      score: 75,
      reason: "Your answers suggest strong alignment with this community's vibe.",
    });
    return {
      target: community,
      score: normalizeFitScore(result.score),
      reason: result.reason,
    };
  } catch {
    return {
      target: community,
      score: 70,
      reason: "Your answers suggest you'd fit well here.",
    };
  }
}

const FORMATION_INTEREST = "civic navigation tools";

export function detectFormationCluster(
  user: UserProfile,
  pool: UserProfile[],
  communities: CommunityProfile[]
): { niche: string; memberIds: string[] } | null {
  const userInterests = user.interests.map((i) => i.name.toLowerCase());
  const coveredInterests = new Set(
    communities.flatMap((c) => c.interests.map((i) => i.name.toLowerCase()))
  );

  const nicheCandidates = userInterests.filter(
    (interest) =>
      interest === FORMATION_INTEREST ||
      (!coveredInterests.has(interest) &&
        pool.filter((p) =>
          p.interests.some(
            (pi) => pi.name.toLowerCase() === interest && pi.weight >= 0.75
          )
        ).length >= 4)
  );

  for (const niche of nicheCandidates) {
    const matches = pool.filter(
      (p) =>
        p.id !== user.id &&
        p.interests.some(
          (pi) => pi.name.toLowerCase() === niche && pi.weight >= 0.75
        )
    );

    if (matches.length >= 4) {
      return {
        niche,
        memberIds: matches.map((p) => p.id),
      };
    }
  }

  return null;
}

export async function formCommunity(
  user: UserProfile,
  pool: UserProfile[],
  existingCommunities?: CommunityProfile[]
): Promise<CommunityProfile | null> {
  const communities =
    existingCommunities ?? (communitiesFixture as CommunityProfile[]);
  const cluster = detectFormationCluster(user, pool, communities);
  if (!cluster) return null;

  const members = pool.filter((p) => cluster.memberIds.includes(p.id));
  const nicheLabel = cluster.niche
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const memberSummary = members
    .map((m) => `${m.displayName}: ${m.vibe_summary}`)
    .join("\n");

  const userContent = `Founding a new community for: ${nicheLabel}
Founder: ${user.displayName} — ${user.vibe_summary}
Potential members:
${memberSummary}`;

  let meta = {
    description: `A new space for people obsessed with ${nicheLabel}.`,
    vibe: "Curious, experimental, prototyping futures together.",
    summary: `A fledgling community of ${members.length + 1} people united by ${nicheLabel}. Just founded — the first conversations are about to begin.`,
  };

  try {
    const raw = await askClaude(FORM_SYSTEM, userContent);
    meta = parseJson(raw, meta);
  } catch {
    /* use fallback */
  }

  return {
    id: `comm-founded-${Date.now()}`,
    name: `${nicheLabel} Lab`,
    description: meta.description,
    interests: [{ name: cluster.niche, weight: 0.95 }],
    vibe: meta.vibe,
    member_ids: [user.id, ...cluster.memberIds],
    messages: [
      {
        author_id: user.id,
        text: `Just founded this space — who else is into ${nicheLabel}?`,
        ts: new Date().toISOString(),
      },
    ],
    summary: meta.summary,
  };
}

export async function expandCommunity(
  community: CommunityProfile,
  pool: UserProfile[],
  onProgress?: (p: MatchProgress) => void
): Promise<Ranked[]> {
  const nonMembers = pool.filter((p) => !community.member_ids.includes(p.id));

  if (isDemoMode) {
    await new Promise((r) => setTimeout(r, 300));
    return cachedExpansionSuggestions(nonMembers);
  }

  const syntheticUser: UserProfile = {
    id: community.id,
    displayName: community.name,
    interests: community.interests,
    values: [],
    comm_style: community.vibe,
    current_focus: community.description,
    vibe_summary: community.summary,
    source: "manual",
    confidence: {},
    confirmed: true,
  };

  const ranked = await judgeBatchLive(
    syntheticUser,
    nonMembers,
    "person",
    onProgress
  );
  return ranked.slice(0, 3);
}

export function isCommunity(
  target: UserProfile | CommunityProfile
): target is CommunityProfile {
  return "member_ids" in target;
}

export function isUserProfile(
  target: UserProfile | CommunityProfile
): target is UserProfile {
  return "displayName" in target && !("member_ids" in target);
}
