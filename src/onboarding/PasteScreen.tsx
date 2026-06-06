import { useState } from 'react';

interface Props {
  source: 'chatgpt_memories' | 'manual';
  onSubmit: (text: string) => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
}

export function PasteScreen({ source, onSubmit, onBack, loading, error }: Props) {
  const [text, setText] = useState('');

  const placeholder = source === 'chatgpt_memories'
    ? "Paste ChatGPT's answer here — raw dump, bullet points, whatever format it gave you…"
    : "Tell us about yourself: what you're into, what you value, how you work best, what you're focused on…";

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-xl w-full space-y-6">
        <div className="space-y-1">
          <button onClick={onBack} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
            ← back
          </button>
          <h2 className="text-2xl font-bold text-white">
            {source === 'chatgpt_memories' ? 'Paste the answer' : 'Describe yourself'}
          </h2>
          <p className="text-slate-400 text-sm">
            {source === 'chatgpt_memories'
              ? 'Any format works — bullets, paragraphs, raw text. We\'ll extract the signal.'
              : 'No format rules. Write however feels natural.'}
          </p>
        </div>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={placeholder}
          rows={10}
          className="w-full bg-slate-800/60 border border-slate-700 rounded-2xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-none leading-relaxed"
        />

        {error && (
          <div className="bg-red-900/40 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={() => text.trim() && onSubmit(text.trim())}
          disabled={!text.trim() || loading}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-3 font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Extracting your profile…
            </>
          ) : (
            'Extract my profile →'
          )}
        </button>
      </div>
    </div>
  );
}
