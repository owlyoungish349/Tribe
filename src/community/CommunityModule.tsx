import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type {
  UserProfile,
  CommunityProfile,
  CommunityMessage,
  Ranked,
} from "../shared/contract";
import { useFeedback } from "../growth/FeedbackContext";
import poolData from "./pool.json";
import communitiesData from "./communities.json";
import {
  suggestPeople,
  suggestCommunities,
  formCommunity,
  expandCommunity,
  detectFormationCluster,
  isCommunity,
  type MatchProgress,
} from "./matching";
import { isDemoMode } from "./demoMode";
import { SuggestionCard } from "./components/SuggestionCard";
import { FormationBanner } from "./components/FormationBanner";
import { ExpansionPanel } from "./components/ExpansionPanel";
import { ChatPanel } from "./components/ChatPanel";
import { JoinFlowModal } from "./components/JoinFlowModal";
import { loadCommunityState, saveCommunityState } from "./persistence";

type Props = {
  user: UserProfile;
};

type Phase = "loading" | "suggestions" | "interview" | "formation" | "expansion" | "done";

export function CommunityModule({ user }: Props) {
  const { onFeedback } = useFeedback();
  const pool = poolData as UserProfile[];

  // Restore persisted Module B state for this account (joins, connections,
  // posted chat messages, runtime-founded communities).
  const persisted = useRef(loadCommunityState(user.id)).current;

  const [communities, setCommunities] = useState<CommunityProfile[]>(() => [
    ...(communitiesData as CommunityProfile[]),
    ...persisted.foundedCommunities,
  ]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(
    () => new Set(persisted.joinedCommunityIds)
  );
  const [connectedIds, setConnectedIds] = useState<Set<string>>(
    () => new Set(persisted.connectedPersonIds)
  );
  const [postedMessages, setPostedMessages] = useState<
    Record<string, CommunityMessage[]>
  >(() => persisted.postedMessages);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [joinFlowCommunity, setJoinFlowCommunity] =
    useState<CommunityProfile | null>(null);
  const questionsCacheRef = useRef<Record<string, string[]>>({});

  // Persist Module B state whenever any slice changes.
  useEffect(() => {
    saveCommunityState(user.id, {
      joinedCommunityIds: [...joinedIds],
      connectedPersonIds: [...connectedIds],
      postedMessages,
      foundedCommunities: communities.filter(
        (c) => !(communitiesData as CommunityProfile[]).some((s) => s.id === c.id)
      ),
    });
  }, [user.id, joinedIds, connectedIds, postedMessages, communities]);

  // Resolve a member id to a display name for the chat view.
  const nameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of pool) map[p.id] = p.displayName;
    map[user.id] = user.displayName;
    return map;
  }, [pool, user.id, user.displayName]);
  const authorName = useCallback(
    (id: string) => nameById[id] ?? id.replace("person-", "Member "),
    [nameById]
  );

  const [phase, setPhase] = useState<Phase>("loading");
  const [progressLog, setProgressLog] = useState<string[]>([]);
  const [peopleSuggestions, setPeopleSuggestions] = useState<Ranked[]>([]);
  const [communitySuggestions, setCommunitySuggestions] = useState<Ranked[]>([]);

  // Append a line to the live "what's happening" log (dedupe consecutive repeats).
  const pushLog = useCallback((line: string) => {
    setProgressLog((prev) =>
      prev[prev.length - 1] === line ? prev : [...prev, line]
    );
  }, []);

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
    setProgressLog([]);

    const onProgress = (p: MatchProgress) => pushLog(p.label);

    try {
      pushLog(`Reading ${user.displayName}'s profile…`);
      pushLog(`Asking the agent to score ${pool.length - 1} people and ${communities.length} communities…`);

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

      pushLog("Ranking your top matches…");
      setPhase("suggestions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load suggestions");
      setPhase("suggestions");
    }
  }, [user, communities, pool, pushLog]);

  // Guard against React StrictMode double-invoking the effect in dev, which
  // would otherwise fire every agent call twice.
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    loadSuggestions();
  }, [loadSuggestions]);

  async function handleFoundCommunity() {
    setFormationLoading(true);
    try {
      const founded = await formCommunity(user, pool, communities);
      if (founded) {
        setFoundedCommunity(founded);
        setCommunities((prev) => [...prev, founded]);
        // You founded it — you're a member and can chat right away.
        setJoinedIds((prev) => new Set(prev).add(founded.id));
        openChat(founded);
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

  // Join opens a popup: load fit-check (with live status) → pass → chat.
  function handleCommunityJoin(community: CommunityProfile) {
    if (joinedIds.has(community.id)) {
      openChat(community);
      return;
    }
    setJoinFlowCommunity(community);
  }

  function handleJoinFlowComplete(community: CommunityProfile) {
    setJoinFlowCommunity(null);
    handleConfirmJoin(community);
  }

  function handleConnect(personId: string) {
    setConnectedIds((prev) => new Set(prev).add(personId));
  }

  // Committing to a community after the fit check: become a member + open chat.
  function handleConfirmJoin(community: CommunityProfile) {
    setJoinedIds((prev) => new Set(prev).add(community.id));
    onFeedback({
      user_id: user.id,
      target_id: community.id,
      target_kind: "community",
      action: "joined",
      ts: new Date().toISOString(),
    });
    openChat(community);
  }

  function openChat(community: CommunityProfile) {
    setActiveChatId(community.id);
    setChatOpen(true);
  }

  // Combine seed messages (fixtures) with the user's persisted posts.
  function messagesFor(community: CommunityProfile): CommunityMessage[] {
    return [...community.messages, ...(postedMessages[community.id] ?? [])];
  }

  function handleSendMessage(communityId: string, text: string) {
    const msg: CommunityMessage = {
      author_id: user.id,
      text,
      ts: new Date().toISOString(),
    };
    setPostedMessages((prev) => ({
      ...prev,
      [communityId]: [...(prev[communityId] ?? []), msg],
    }));
  }

  const joinedCommunities = communities.filter((c) => joinedIds.has(c.id));

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
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-tribe-300 border-t-tribe-600" />
          <div className="w-full rounded-2xl border border-tribe-200 bg-white p-4 shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-tribe-400">
              What the agent is doing
            </p>
            <ul className="space-y-1.5">
              {progressLog.map((line, i) => {
                const isLast = i === progressLog.length - 1;
                return (
                  <li
                    key={i}
                    className={`flex items-center gap-2 text-sm ${
                      isLast ? "text-tribe-800" : "text-tribe-400"
                    }`}
                  >
                    <span className={isLast ? "text-ember-500" : "text-tribe-300"}>
                      {isLast ? "▸" : "✓"}
                    </span>
                    {line}
                  </li>
                );
              })}
            </ul>
          </div>
          <p className="max-w-sm text-center text-xs text-tribe-500">
            Every score and reason is generated live by the Cursor agent — expect ~30–60s on first load.
          </p>
        </div>
      )}

      {phase !== "loading" && (
        <>
          {joinedCommunities.length > 0 && (
            <section className="rounded-2xl border border-tribe-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-tribe-100 px-5 py-3">
                <h2 className="font-display text-lg font-semibold text-tribe-800">
                  My chats
                </h2>
                <button
                  type="button"
                  onClick={() => openChat(joinedCommunities[0])}
                  className="text-xs font-medium text-ember-600 hover:text-ember-700"
                >
                  Open all →
                </button>
              </div>
              <ul className="divide-y divide-tribe-50">
                {joinedCommunities.map((c) => {
                  const msgs = messagesFor(c);
                  const last = msgs[msgs.length - 1];
                  const preview = last
                    ? (last.author_id === user.id ? "You: " : "") + last.text
                    : "No messages yet — say hello";
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => openChat(c)}
                        className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-tribe-50"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tribe-600 text-xs font-semibold text-white">
                          {c.name
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((w) => w[0])
                            .join("")}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-tribe-800">
                            {c.name}
                          </span>
                          <span className="block truncate text-xs text-tribe-400">
                            {preview}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {connectedIds.size > 0 && joinedCommunities.length === 0 && (
            <p className="text-center text-sm text-tribe-500">
              {connectedIds.size} connection request
              {connectedIds.size === 1 ? "" : "s"} sent.
            </p>
          )}

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
                    joined={joinedIds.has(r.target.id)}
                    onJoin={() =>
                      isCommunity(r.target) && handleCommunityJoin(r.target)
                    }
                    onOpenChat={() =>
                      isCommunity(r.target) && openChat(r.target)
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
                    connected={connectedIds.has(r.target.id)}
                    onConnect={() => handleConnect(r.target.id)}
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

      {joinFlowCommunity && (
        <JoinFlowModal
          community={joinFlowCommunity}
          user={user}
          questionsCache={questionsCacheRef.current}
          onCacheQuestions={(id, qs) => {
            questionsCacheRef.current[id] = qs;
          }}
          onJoined={handleJoinFlowComplete}
          onClose={() => setJoinFlowCommunity(null)}
        />
      )}

      {chatOpen && activeChatId && (
        <ChatPanel
          communities={
            joinedCommunities.length > 0
              ? joinedCommunities
              : communities.filter((c) => c.id === activeChatId)
          }
          activeId={activeChatId}
          messagesFor={messagesFor}
          userId={user.id}
          authorName={authorName}
          onSelect={(c) => setActiveChatId(c.id)}
          onSend={handleSendMessage}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
