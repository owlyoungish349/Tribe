/**
 * Build-time fixture builder — run with `npm run precompute`
 * Requires CURSOR_API_KEY in environment
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { askClaude } from "../../server/askClaude.js";
import type { CommunityProfile } from "../shared/contract.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const communitiesPath = join(__dirname, "communities.json");

const SUMMARY_SYSTEM = `You summarize community chat logs for a matching app.
Return exactly 2-3 sentences describing: (1) what topics dominate, (2) the tone/vibe, (3) who would enjoy this space.
Be specific — name actual topics from the messages. No vague filler.`;

async function summarizeCommunity(community: CommunityProfile): Promise<string> {
  const log = community.messages
    .map((m) => `${m.author_id}: ${m.text}`)
    .join("\n");

  const userContent = `Community: ${community.name}
Description: ${community.description}
Vibe: ${community.vibe}

Message log:
${log}`;

  return askClaude(SUMMARY_SYSTEM, userContent);
}

async function main() {
  const raw = readFileSync(communitiesPath, "utf-8");
  const communities = JSON.parse(raw) as CommunityProfile[];

  console.log(`Summarizing ${communities.length} communities...`);

  for (const community of communities) {
    console.log(`  → ${community.name}`);
    try {
      community.summary = await summarizeCommunity(community);
    } catch (err) {
      console.error(`  ✗ Failed for ${community.name}:`, err);
    }
  }

  writeFileSync(communitiesPath, JSON.stringify(communities, null, 2) + "\n");
  console.log("Done — communities.json updated.");
}

main();
