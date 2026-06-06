import { useCallback, useEffect, useState } from "react";
import type { CommunityProfile, Ranked, UserProfile } from "../../shared/contract";
import {
  communityQuestionsAsync,
  refineMatch,
  normalizeFitScore,
} from "../matching";
import { InterviewPanel } from "./InterviewPanel";
import { StatusLog } from "./StatusLog";

const PASS_THRESHOLD = 40;

type Step = "loading-questions" | "interview" | "refining" | "result" | "failed";

type Props = {
  community: CommunityProfile;
  user: UserProfile;
  questionsCache: Record<string, string[]>;
  onCacheQuestions: (communityId: string, questions: string[]) => void;
  onJoined: (community: CommunityProfile) => void;
  onClose: () => void;
};

export function JoinFlowModal({
  community,
  user,
  questionsCache,
  onCacheQuestions,
  onJoined,
  onClose,
}: Props) {
  const [step, setStep] = useState<Step>("loading-questions");
  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [refined, setRefined] = useState<Ranked | null>(null);
  const [refining, setRefining] = useState(false);

  const pushLog = useCallback((line: string) => {
    setStatusLog((prev) =>
      prev[prev.length - 1] === line ? prev : [...prev, line]
    );
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && step !== "refining") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, step]);

  useEffect(() => {
    setStep("loading-questions");
    setStatusLog([]);
    setQuestions([]);
    setRefined(null);
    setRefining(false);

    async function load() {
      pushLog(`Opening fit check for ${community.name}…`);
      pushLog(`Reading ${user.displayName}'s profile…`);
      pushLog(`Studying ${community.name}'s vibe and members…`);

      const cached = questionsCache[community.id];
      if (cached?.length) {
        pushLog("Using cached fit questions");
        setQuestions(cached);
        pushLog("Ready — answer a few quick questions");
        setStep("interview");
        return;
      }

      pushLog("Agent writing personalized fit questions…");
      try {
        const generated = await communityQuestionsAsync(user, community);
        onCacheQuestions(community.id, generated);
        pushLog(`Generated ${generated.length} questions`);
        pushLog("Ready — answer a few quick questions");
        setQuestions(generated);
        setStep("interview");
      } catch {
        pushLog("Could not load fit check — try again");
        setStep("failed");
      }
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload per community
  }, [community.id]);

  async function handleInterviewComplete(answers: string[]) {
    setStep("refining");
    setRefining(true);
    setStatusLog([]);
    pushLog("Sending your answers to the agent…");
    pushLog(`Re-scoring fit with ${community.name}…`);

    try {
      const result = await refineMatch(user, community, answers);
      pushLog("Fit score calculated");
      setRefined(result);
      const score = normalizeFitScore(result.score);

      if (score >= PASS_THRESHOLD) {
        pushLog(`You passed — ${score}% fit`);
        setStep("result");
        setTimeout(() => onJoined(community), 1200);
      } else {
        pushLog(`Fit came back at ${score}% — below the bar`);
        setStep("failed");
      }
    } catch {
      pushLog("Scoring failed — try again");
      setStep("failed");
    } finally {
      setRefining(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-tribe-900/50 p-4 backdrop-blur-sm"
      onClick={step !== "refining" ? onClose : undefined}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-tribe-200"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-tribe-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-tribe-400">
              Join {community.name}
            </p>
            <h3 className="font-display text-lg font-semibold text-tribe-800">
              {step === "loading-questions" || step === "refining"
                ? "Preparing fit check…"
                : step === "interview"
                  ? "Quick fit check"
                  : step === "result"
                    ? "You're in!"
                    : "Fit check"}
            </h3>
          </div>
          {step !== "refining" && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-tribe-400 hover:bg-tribe-50 hover:text-tribe-700"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </header>

        <div className="overflow-y-auto px-5 py-5">
          {(step === "loading-questions" || step === "refining") && (
            <StatusLog
              lines={statusLog}
              hint={
                step === "loading-questions"
                  ? "Live agent call — usually 15–30s"
                  : "Calculating your refined fit…"
              }
            />
          )}

          {step === "interview" && questions.length > 0 && (
            <InterviewPanel
              community={community}
              questions={questions}
              onComplete={handleInterviewComplete}
              loading={refining}
              embedded
            />
          )}

          {step === "result" && refined && (
            <div className="text-center">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ember-600">
                Refined match
              </p>
              <p className="mb-2 font-display text-4xl font-semibold text-tribe-800">
                {normalizeFitScore(refined.score)}%
              </p>
              <p className="mb-4 text-sm leading-relaxed text-tribe-600">
                {refined.reason}
              </p>
              <p className="text-sm font-medium text-tribe-700">
                Opening chat…
              </p>
              <div className="mx-auto mt-4 h-6 w-6 animate-spin rounded-full border-2 border-tribe-300 border-t-tribe-600" />
            </div>
          )}

          {step === "failed" && (
            <div className="text-center">
              <StatusLog lines={statusLog} title="Status" />
              {refined && (
                <p className="mt-4 text-sm text-tribe-600">
                  {normalizeFitScore(refined.score)}% fit —{" "}
                  {refined.reason}
                </p>
              )}
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-tribe-200 px-4 py-2.5 text-sm font-medium text-tribe-600 hover:bg-tribe-50"
                >
                  Close
                </button>
                {refined && (
                  <button
                    type="button"
                    onClick={() => onJoined(community)}
                    className="flex-1 rounded-xl bg-tribe-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-tribe-700"
                  >
                    Join anyway
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
