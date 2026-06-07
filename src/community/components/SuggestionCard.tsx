import { useState } from "react";
import type { Ranked, FeedbackEvent } from "../../shared/contract";
import { isCommunity, isUserProfile, normalizeFitScore } from "../matching";

type Props = {
  ranked: Ranked;
  userId: string;
  onFeedback: (event: FeedbackEvent) => void;
  onJoin?: () => void;
  onConnect?: () => void;
  onOpenChat?: () => void;
  joined?: boolean;
  connected?: boolean;
};

export function SuggestionCard({
  ranked,
  userId,
  onFeedback,
  onJoin,
  onConnect,
  onOpenChat,
  joined = false,
  connected = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const { target, reason } = ranked;
  const score = normalizeFitScore(ranked.score);

  const isComm = isCommunity(target);
  const title = isComm ? target.name : isUserProfile(target) ? target.displayName : "Unknown";
  const subtitle = isComm
    ? target.description
    : isUserProfile(target)
      ? target.current_focus
      : "";

  const targetId = target.id;
  const targetKind = isComm ? "community" : "person";

  function emit(action: FeedbackEvent["action"]) {
    onFeedback({
      user_id: userId,
      target_id: targetId,
      target_kind: targetKind,
      action,
      ts: new Date().toISOString(),
    });
  }

  return (
    <article className="rounded-2xl border border-tribe-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <span className="mb-1 inline-block rounded-full bg-ember-400/20 px-2.5 py-0.5 text-xs font-semibold text-ember-600">
            {score}% fit
          </span>
          <h3 className="font-display text-xl font-semibold text-tribe-800">{title}</h3>
          <p className="mt-0.5 text-sm text-tribe-500">{subtitle}</p>
        </div>
        {isComm && (
          <span className="shrink-0 rounded-lg bg-tribe-100 px-2 py-1 text-xs font-medium text-tribe-600">
            {target.member_ids.length} members
          </span>
        )}
      </div>

      <p className="mb-4 text-sm leading-relaxed text-tribe-700">
        <span className="font-medium text-tribe-800">Why you'd fit: </span>
        {reason}
      </p>

      {expanded && isComm && (
        <div className="mb-4 rounded-xl bg-tribe-50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-tribe-400">
            Inside the community
          </p>
          <p className="text-sm text-tribe-600">{target.summary}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {target.member_ids.slice(0, 6).map((id) => (
              <span
                key={id}
                className="rounded-full bg-tribe-200 px-2.5 py-0.5 text-xs text-tribe-700"
              >
                {id.replace("person-", "P")}
              </span>
            ))}
          </div>
        </div>
      )}

      {isComm && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mb-3 text-xs font-medium text-tribe-500 underline-offset-2 hover:text-tribe-700 hover:underline"
        >
          {expanded ? "Hide peek" : "Peek inside →"}
        </button>
      )}

      <div className="flex gap-2">
        {isComm ? (
          joined ? (
            <>
              <span className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-tribe-100 px-4 py-2.5 text-sm font-semibold text-tribe-700">
                ✓ Joined
              </span>
              <button
                type="button"
                onClick={() => onOpenChat?.()}
                className="rounded-xl bg-ember-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ember-600"
              >
                Open chat
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onJoin?.()}
              className="flex-1 rounded-xl bg-tribe-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-tribe-700"
            >
              Join
            </button>
          )
        ) : connected ? (
          <span className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-tribe-100 px-4 py-2.5 text-sm font-semibold text-tribe-700">
            ✓ Request sent
          </span>
        ) : (
          <button
            type="button"
            onClick={() => {
              emit("accepted");
              onConnect?.();
            }}
            className="flex-1 rounded-xl bg-tribe-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-tribe-700"
          >
            Connect
          </button>
        )}
        {!joined && !connected && (
          <button
            type="button"
            onClick={() => emit("skipped")}
            className="rounded-xl border border-tribe-200 px-4 py-2.5 text-sm font-medium text-tribe-500 transition-colors hover:border-tribe-300 hover:text-tribe-700"
          >
            Skip
          </button>
        )}
      </div>
    </article>
  );
}
