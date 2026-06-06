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
    <div className="mx-auto max-w-xl space-y-6 px-4 py-10">
      <div className="space-y-1">
        <button onClick={onBack} className="text-sm text-tribe-500 transition-colors hover:text-tribe-700">
          ← back
        </button>
        <h2 className="font-display text-3xl font-semibold text-tribe-800">
          {source === 'chatgpt_memories' ? 'Paste the answer' : 'Describe yourself'}
        </h2>
        <p className="text-sm text-tribe-500">
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
        className="w-full resize-none rounded-2xl border border-tribe-200 bg-white px-4 py-3 text-sm leading-relaxed text-tribe-800 placeholder-tribe-400 focus:border-tribe-400 focus:outline-none focus:ring-1 focus:ring-tribe-400"
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={() => text.trim() && onSubmit(text.trim())}
        disabled={!text.trim() || loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-tribe-600 py-3 font-semibold text-white transition-colors hover:bg-tribe-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Extracting your profile…
          </>
        ) : (
          'Extract my profile →'
        )}
      </button>
    </div>
  );
}
