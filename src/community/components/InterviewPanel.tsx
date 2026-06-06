import { useState } from "react";
import type { CommunityProfile, Ranked } from "../../shared/contract";

type Props = {
  community: CommunityProfile;
  questions: string[];
  onComplete: (answers: string[]) => void;
  refined?: Ranked | null;
  loading?: boolean;
};

const QUICK_ANSWERS = [
  "Love it — that's my vibe",
  "Maybe — depends on the crowd",
  "Not really my speed",
];

export function InterviewPanel({
  community,
  questions,
  onComplete,
  refined,
  loading,
}: Props) {
  const [answers, setAnswers] = useState<string[]>(
    Array(questions.length).fill("")
  );
  const [submitted, setSubmitted] = useState(false);

  function setAnswer(index: number, value: string) {
    const next = [...answers];
    next[index] = value;
    setAnswers(next);
  }

  function handleSubmit() {
    if (answers.some((a) => !a.trim())) return;
    setSubmitted(true);
    onComplete(answers);
  }

  if (refined) {
    return (
      <section className="rounded-2xl border-2 border-ember-400/40 bg-gradient-to-br from-ember-400/10 to-tribe-100 p-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ember-600">
          Refined match — {community.name}
        </p>
        <p className="mb-2 font-display text-2xl font-semibold text-tribe-800">
          {refined.score}% fit
        </p>
        <p className="text-sm leading-relaxed text-tribe-700">{refined.reason}</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-tribe-200 bg-white p-6 shadow-sm">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-tribe-400">
        Quick fit check
      </p>
      <h3 className="mb-4 font-display text-xl font-semibold text-tribe-800">
        Would {community.name} work for you?
      </h3>

      <div className="space-y-5">
        {questions.map((q, i) => (
          <div key={i}>
            <p className="mb-2 text-sm font-medium text-tribe-700">{q}</p>
            <div className="mb-2 flex flex-wrap gap-2">
              {QUICK_ANSWERS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setAnswer(i, chip)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    answers[i] === chip
                      ? "bg-tribe-600 text-white"
                      : "bg-tribe-100 text-tribe-600 hover:bg-tribe-200"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={answers[i]}
              onChange={(e) => setAnswer(i, e.target.value)}
              placeholder="Or type your own..."
              className="w-full rounded-lg border border-tribe-200 px-3 py-2 text-sm focus:border-tribe-400 focus:outline-none focus:ring-1 focus:ring-tribe-400"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitted || loading || answers.some((a) => !a.trim())}
        className="mt-5 w-full rounded-xl bg-ember-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-ember-600 disabled:opacity-50"
      >
        {loading ? "Refining match..." : "See my refined fit"}
      </button>
    </section>
  );
}
