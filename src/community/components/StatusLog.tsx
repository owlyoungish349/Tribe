type Props = {
  lines: string[];
  title?: string;
  hint?: string;
};

export function StatusLog({
  lines,
  title = "What the agent is doing",
  hint,
}: Props) {
  return (
    <div className="w-full">
      <div className="mb-4 flex justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-tribe-300 border-t-tribe-600" />
      </div>
      <div className="rounded-xl border border-tribe-200 bg-tribe-50 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-tribe-400">
          {title}
        </p>
        <ul className="space-y-1.5">
          {lines.map((line, i) => {
            const isLast = i === lines.length - 1;
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
      {hint && (
        <p className="mt-3 text-center text-xs text-tribe-500">{hint}</p>
      )}
    </div>
  );
}
