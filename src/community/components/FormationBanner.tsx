import type { CommunityProfile } from "../../shared/contract";

type Props = {
  niche: string;
  memberCount: number;
  onFound: () => void;
  loading?: boolean;
  founded?: CommunityProfile | null;
};

export function FormationBanner({
  niche,
  memberCount,
  onFound,
  loading,
  founded,
}: Props) {
  if (founded) {
    return (
      <section className="rounded-2xl border-2 border-tribe-500 bg-tribe-600 p-6 text-white">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-tribe-200">
          Community founded
        </p>
        <h3 className="mb-2 font-display text-2xl font-bold">{founded.name}</h3>
        <p className="mb-3 text-sm text-tribe-100">{founded.description}</p>
        <p className="text-sm text-tribe-200">{founded.summary}</p>
      </section>
    );
  }

  const label = niche
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <section className="rounded-2xl border-2 border-dashed border-tribe-400 bg-tribe-100/50 p-6">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-tribe-500">
        No space exists yet
      </p>
      <h3 className="mb-2 font-display text-xl font-semibold text-tribe-800">
        {memberCount} people share your thing for {label}
      </h3>
      <p className="mb-4 text-sm text-tribe-600">
        There's no community for this yet — but the cluster is real. Start one?
      </p>
      <button
        type="button"
        onClick={onFound}
        disabled={loading}
        className="rounded-xl bg-tribe-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-tribe-700 disabled:opacity-50"
      >
        {loading ? "Founding..." : `Start ${label} Lab`}
      </button>
    </section>
  );
}
