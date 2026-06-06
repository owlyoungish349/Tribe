import type { Ranked } from "../../shared/contract";

type Props = {
  communityName: string;
  suggestions: Ranked[];
  loading?: boolean;
  status?: string;
};

export function ExpansionPanel({ communityName, suggestions, loading, status }: Props) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-tribe-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-tribe-300 border-t-tribe-600" />
          <p className="text-sm text-tribe-600">
            {status || `Agent finding people who'd fit ${communityName}...`}
          </p>
        </div>
      </section>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <section className="rounded-2xl border border-tribe-200 bg-white p-6 shadow-sm">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-tribe-400">
        Community expansion
      </p>
      <h3 className="mb-4 font-display text-xl font-semibold text-tribe-800">
        3 more people who'd fit {communityName}
      </h3>
      <p className="mb-4 text-xs text-tribe-500">
        And it keeps doing this as the network grows — Module C simulates ongoing growth.
      </p>
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
                <p className="mt-1 text-sm text-tribe-600">{s.reason}</p>
              </div>
              <span className="shrink-0 rounded-full bg-ember-400/20 px-2.5 py-0.5 text-xs font-semibold text-ember-600">
                {s.score}%
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
