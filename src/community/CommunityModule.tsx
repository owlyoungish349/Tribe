import { useState, useEffect, useCallback, useRef } from "react";
import type {
  UserProfile,
  CommunityProfile,
  Ranked,
} from "../shared/contract";
import { useFeedback } from "../growth/FeedbackContext";
import poolData from "./pool.json";
import communitiesData from "./communities.json";
import {
  suggestPeople,
  suggestCommunities,
  communityQuestionsAsync,
  refineMatch,
  formCommunity,
  expandCommunity,
  detectFormationCluster,
  isCommunity,
  type MatchProgress,
} from "./matching";
import { isDemoMode } from "./demoMode";
import { SuggestionCard } from "./components/SuggestionCard";
import { InterviewPanel } from "./components/InterviewPanel";
import { FormationBanner } from "./components/FormationBanner";
import { ExpansionPanel } from "./components/ExpansionPanel";

type Props = {
  user: UserProfile;
};

type Phase = "loading" | "suggestions" | "interview" | "formation" | "expansion" | "done";

export function CommunityModule({ user }: Props) {
  const { onFeedback } = useFeedback();
  const pool = poolData as UserProfile[];
  const [communities, setCommunities] = useState(
    () => communitiesData as CommunityProfile[]
  );

  const [phase, setPhase] = useState<Phase>("loading");
  const [loadingStatus, setLoadingStatus] = useState("Starting...");
  const [peopleSuggestions, setPeopleSuggestions] = useState<Ranked[]>([]);
  const [communitySuggestions, setCommunitySuggestions] = useState<Ranked[]>([]);
  const [interviewCommunity, setInterviewCommunity] = useState<CommunityProfile | null>(null);
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);
  const [refinedMatch, setRefinedMatch] = useState<Ranked | null>(null);
  const [interviewLoading, setInterviewLoading] = useState(false);

  const [formationNiche, setFormationNiche] = useState<string | null>(null);
  const [formationCount, setFormationCount] = useState(0);
  const [foundedCommunity, setFoundedCommunity] = useState<CommunityProfile | null>(null);
  const [formationLoading, setFormationLoading] = useState(false);

  const [expansionSuggestions, setExpansionSuggestions] = useState<Ranked[]>([]);
  const [expansionLoading, setExpansionLoading] = useState(false);
  const [expansionStatus, setExpansionStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadSuggestions = useCallback(async () => {
    setPhase("loading");
    setError(null);

    const onProgress = (p: MatchProgress) => setLoadingStatus(p.label);

    try {
      setLoadingStatus("Agent scoring people & communities...");
      // Run people + community judging concurrently — independent agent calls.
      const [people, comms] = await Promise.all([
        suggestPeople(user, pool, onProgress),
        suggestCommunities(user, communities, onProgress),
      ]);

      setPeopleSuggestions(people);
      setCommunitySuggestions(comms);

      const cluster = detectFormationCluster(user, pool, communities);
      if (cluster) {
        setFormationNiche(cluster.niche);
        setFormationCount(cluster.memberIds.length);
      }

      const topCommunity = comms[0]?.target;
      if (topCommunity && isCommunity(topCommunity)) {
        setLoadingStatus("Agent generating interview questions...");
        const questions = await communityQuestionsAsync(user, topCommunity);
        setInterviewCommunity(topCommunity);
        setInterviewQuestions(questions);
      }

      setPhase("suggestions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load suggestions");
      setPhase("suggestions");
    }
  }, [user, communities, pool]);

  // Guard against React StrictMode double-invoking the effect in dev, which
  // would otherwise fire every agent call twice.
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    loadSuggestions();
  }, [loadSuggestions]);

  async function handleInterviewComplete(answers: string[]) {
    if (!interviewCommunity) return;
    setInterviewLoading(true);
    try {
      const refined = await refineMatch(user, interviewCommunity, answers);
      setRefinedMatch(refined);
      setPhase("interview");
    } finally {
      setInterviewLoading(false);
    }
  }

  async function handleFoundCommunity() {
    setFormationLoading(true);
    try {
      const founded = await formCommunity(user, pool, communities);
      if (founded) {
        setFoundedCommunity(founded);
        setCommunities((prev) => [...prev, founded]);
        setPhase("formation");

        setExpansionLoading(true);
        const expanded = await expandCommunity(founded, pool, (p) =>
          setExpansionStatus(p.label)
        );
        setExpansionSuggestions(expanded);
        setExpansionLoading(false);
        setPhase("expansion");
      }
    } finally {
      setFormationLoading(false);
    }
  }

  function handleCommunityJoin(community: CommunityProfile) {
    setInterviewCommunity(community);
    setPhase("interview");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <header className="text-center">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-tribe-400">
          Module B — Community & Connection
          {isDemoMode ? (
            <span className="ml-2 rounded-full bg-ember-400/25 px-2 py-0.5 text-ember-600">
              demo mode
            </span>
          ) : (
            <span className="ml-2 rounded-full bg-tribe-600/15 px-2 py-0.5 text-tribe-700">
              live agent
            </span>
          )}
        </p>
        <h1 className="font-display text-3xl font-bold text-tribe-800">
          Hey {user.displayName}, here's your tribe
        </h1>
        <p className="mt-2 text-sm text-tribe-500">{user.vibe_summary}</p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {phase === "loading" && (
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-tribe-300 border-t-tribe-600" />
          <p className="text-sm font-medium text-tribe-700">{loadingStatus}</p>
          <p className="max-w-sm text-center text-xs text-tribe-500">
            Every score and reason is generated by the Cursor agent — expect ~30–60s on first load.
          </p>
        </div>
      )}

      {phase !== "loading" && (
        <>
          <section>
            <h2 className="mb-4 font-display text-xl font-semibold text-tribe-800">
              Suggested communities
            </h2>
            {communitySuggestions.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {communitySuggestions.map((r) => (
                  <SuggestionCard
                    key={r.target.id}
                    ranked={r}
                    userId={user.id}
                    onFeedback={onFeedback}
                    onJoin={() =>
                      isCommunity(r.target) && handleCommunityJoin(r.target)
                    }
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-tribe-500">No community matches yet.</p>
            )}
          </section>

          <section>
            <h2 className="mb-4 font-display text-xl font-semibold text-tribe-800">
              Suggested people
            </h2>
            {peopleSuggestions.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {peopleSuggestions.map((r) => (
                  <SuggestionCard
                    key={r.target.id}
                    ranked={r}
                    userId={user.id}
                    onFeedback={onFeedback}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-tribe-500">No people matches yet.</p>
            )}
          </section>

          {formationNiche && !foundedCommunity && (
            <FormationBanner
              niche={formationNiche}
              memberCount={formationCount}
              onFound={handleFoundCommunity}
              loading={formationLoading}
            />
          )}

          {interviewCommunity && interviewQuestions.length > 0 && (
            <InterviewPanel
              community={interviewCommunity}
              questions={interviewQuestions}
              onComplete={handleInterviewComplete}
              refined={refinedMatch}
              loading={interviewLoading}
            />
          )}

          {foundedCommunity && (
            <FormationBanner
              niche={formationNiche ?? ""}
              memberCount={formationCount}
              onFound={() => {}}
              founded={foundedCommunity}
            />
          )}

          {(foundedCommunity || phase === "expansion") && (
            <ExpansionPanel
              communityName={foundedCommunity?.name ?? ""}
              suggestions={expansionSuggestions}
              loading={expansionLoading}
              status={expansionStatus}
            />
          )}
        </>
      )}
    </div>
  );
}
