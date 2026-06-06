import { useState } from 'react';

const CHATGPT_PROMPT =
  'Based on everything you remember about me, summarize who I am for meeting like-minded people: my genuine interests (and how into each I am 0–10), what I value in people and projects, how I communicate, and what I\'m focused on right now. Be specific and honest, not flattering.';

interface Props {
  onContinue: (displayName: string, source: 'chatgpt_memories' | 'manual') => void;
}

export function IntroScreen({ onContinue }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(CHATGPT_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-xl space-y-8 px-4 py-10">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-tribe-400">
          Persona Match
        </p>
        <h1 className="font-display text-4xl font-semibold leading-tight text-tribe-800">
          Bring what your AI<br />already knows about you.
        </h1>
        <p className="text-sm text-tribe-500">
          Ask ChatGPT — or any AI that knows you — and paste the answer. Takes 60 seconds.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-tribe-400">
          What should we call you?
        </label>
        <input
          type="text"
          placeholder={'Your name (or leave blank for "You")'}
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          className="w-full rounded-xl border border-tribe-200 bg-white px-4 py-3 text-sm text-tribe-800 placeholder-tribe-400 focus:border-tribe-400 focus:outline-none focus:ring-1 focus:ring-tribe-400"
        />
      </div>

      <div className="space-y-3 rounded-2xl border border-tribe-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-tribe-400">
          Step 1 — Copy this prompt
        </p>
        <blockquote className="border-l-2 border-ember-400 pl-4 text-sm italic leading-relaxed text-tribe-600">
          "{CHATGPT_PROMPT}"
        </blockquote>
        <button
          onClick={handleCopy}
          className="w-full rounded-xl border border-tribe-200 bg-tribe-50 py-2.5 text-sm font-medium text-tribe-700 transition-colors hover:bg-tribe-100"
        >
          {copied ? '✓ Copied!' : 'Copy prompt'}
        </button>
      </div>

      <div className="space-y-3">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-tribe-400">
          Step 2 — paste ChatGPT's answer on the next screen
        </p>
        <button
          onClick={() => onContinue(displayName, 'chatgpt_memories')}
          className="w-full rounded-xl bg-tribe-600 py-3 font-semibold text-white transition-colors hover:bg-tribe-700"
        >
          Paste ChatGPT's answer →
        </button>
        <button
          onClick={() => onContinue(displayName, 'manual')}
          className="w-full py-1 text-sm text-tribe-500 transition-colors hover:text-tribe-700"
        >
          Write it myself instead
        </button>
      </div>
    </div>
  );
}
