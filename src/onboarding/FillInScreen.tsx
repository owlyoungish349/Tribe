import { useState } from 'react';

interface Props {
  onSubmit: (answer: string) => void;
  loading: boolean;
}

export function FillInScreen({ onSubmit, loading }: Props) {
  const [answer, setAnswer] = useState('');

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-tribe-400">One quick thing</p>
        <h2 className="font-display text-3xl font-semibold text-tribe-800">
          Name a couple of things<br />you're really into right now.
        </h2>
        <p className="text-sm text-tribe-500">
          Didn't catch enough from your text — help us fill in the gap.
        </p>
      </div>

      <textarea
        value={answer}
        onChange={e => setAnswer(e.target.value)}
        placeholder="e.g. making music, competitive climbing, learning Japanese…"
        rows={4}
        className="w-full resize-none rounded-2xl border border-tribe-200 bg-white px-4 py-3 text-sm text-tribe-800 placeholder-tribe-400 focus:border-tribe-400 focus:outline-none focus:ring-1 focus:ring-tribe-400"
      />

      <button
        onClick={() => answer.trim() && onSubmit(answer.trim())}
        disabled={!answer.trim() || loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-tribe-600 py-3 font-semibold text-white transition-colors hover:bg-tribe-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Merging…
          </>
        ) : (
          'Continue →'
        )}
      </button>
    </div>
  );
}
