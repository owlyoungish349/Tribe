import { askClaude } from '../shared/askClaude';
import type { UserProfile, Scored, Confidence } from '../shared/contract';

const SYSTEM_PROMPT = `Return JSON only — no preamble, no markdown fences — matching this schema:
{"interests":[{"name":"string","weight":0.0}],"values":[{"name":"string","weight":0.0}],"comm_style":"string","current_focus":"string","vibe_summary":"string","confidence":{"interests":0.0,"values":0.0,"comm_style":0.0,"current_focus":0.0,"vibe_summary":0.0}}
weight is 0..1. If the user gave 0-10 intensities, map them to weight (n/10). For any field you had to infer, set its confidence below 0.5. Extract as many distinct interests and values as are present in the text — aim for 3-6 each.`;

type RawExtracted = {
  interests: Scored[];
  values: Scored[];
  comm_style: string;
  current_focus: string;
  vibe_summary: string;
  confidence: Confidence;
};

function stripFences(raw: string): string {
  return raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '').trim();
}

export async function extractProfile(
  pastedText: string,
  displayName: string,
  source: UserProfile['source']
): Promise<UserProfile> {
  const raw = await askClaude(SYSTEM_PROMPT, pastedText);
  const cleaned = stripFences(raw);
  const parsed = JSON.parse(cleaned) as RawExtracted;

  return {
    id: crypto.randomUUID(),
    displayName: displayName.trim() || 'You',
    interests: parsed.interests ?? [],
    values: parsed.values ?? [],
    comm_style: parsed.comm_style ?? '',
    current_focus: parsed.current_focus ?? '',
    vibe_summary: parsed.vibe_summary ?? '',
    source,
    confidence: parsed.confidence ?? {},
    confirmed: false,
  };
}

const FILL_IN_SYSTEM = `The user was asked: "Name a couple of things you're really into right now."
Parse their answer and return JSON only — no preamble, no fences — as an array of interests:
[{"name":"string","weight":0.0}]
Assign weight 0.7-0.9 (they mentioned these explicitly). Return at least 1 item.`;

export async function extractFillIn(answer: string): Promise<Scored[]> {
  const raw = await askClaude(FILL_IN_SYSTEM, answer);
  const cleaned = stripFences(raw);
  return JSON.parse(cleaned) as Scored[];
}
