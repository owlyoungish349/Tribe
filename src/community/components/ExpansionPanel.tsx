import type { Ranked } from "../../shared/contract";
import { normalizeFitScore } from "../matching";

type Props = {
  communityName: string;
  suggestions: Ranked[];
  loading?: boolean;
  status?: string;
};

export function ExpansionPanel({ communityName, suggestions, loading, status }: Props) {
  if (loading) {
    return (
      <section className="card p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-tribe-300 border-t-tribe-600" />
          <p className="text-sm text-tribe-600">
            {status || `Finding people who'd fit ${communityName}…`}
          </p>
        </div>
      </section>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <section className="card p-6">
      <p className="label-caps mb-1">Growing your space</p>
      <h3 className="mb-4 font-display text-xl font-semibold text-tribe-800">
        {suggestions.length} more people who'd fit {communityName}
      </h3>
      <ul className="space-y-3">
        {suggestions.map((s) => {
          const person = s.target as { displayName: string; current_focus: string };
          return (
            <li
              key={s.target.id}
              className="flex items-start justify-between gap-3 rounded-xl bg-tribe-50 p-4"
            >
              <div>
                <p className="font-medium text-tribe-800">{person.displayName}</p>
                <p className="text-xs text-tribe-500">{person.current_focus}</p>
                <p className="mt-1 text-sm leading-relaxed text-tribe-600">{s.reason}</p>
              </div>
              <span className="shrink-0 rounded-full bg-ember-400/20 px-2.5 py-0.5 text-xs font-semibold text-ember-600">
                {normalizeFitScore(s.score)}%
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
