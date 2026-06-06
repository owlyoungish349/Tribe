import { useState } from 'react';

interface Props {
  onSubmit: (answer: string) => void;
  loading: boolean;
}

export function FillInScreen({ onSubmit, loading }: Props) {
  const [answer, setAnswer] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-xl w-full space-y-6">
        <div className="space-y-2">
          <p className="text-violet-400 text-xs font-medium uppercase tracking-widest">One quick thing</p>
          <h2 className="text-2xl font-bold text-white">
            Name a couple of things<br />you're really into right now.
          </h2>
          <p className="text-slate-400 text-sm">
            Didn't catch enough from your text — help us fill in the gap.
          </p>
        </div>

        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="e.g. making music, competitive climbing, learning Japanese…"
          rows={4}
          className="w-full bg-slate-800/60 border border-slate-700 rounded-2xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-none"
        />

        <button
          onClick={() => answer.trim() && onSubmit(answer.trim())}
          disabled={!answer.trim() || loading}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-3 font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Merging…
            </>
          ) : (
            'Continue →'
          )}
        </button>
      </div>
    </div>
  );
}
