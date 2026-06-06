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
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-xl w-full space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-violet-400 text-sm font-medium tracking-widest uppercase">Persona Match</p>
          <h1 className="text-3xl font-bold text-white leading-tight">
            Bring what your AI<br />already knows about you.
          </h1>
          <p className="text-slate-400 text-sm">
            Ask ChatGPT — or any AI that knows you — and paste the answer. Takes 60 seconds.
          </p>
        </div>

        <div className="space-y-3">
          <label className="block text-xs text-slate-400 font-medium uppercase tracking-wider">
            What should we call you?
          </label>
          <input
            type="text"
            placeholder={'Your name (or leave blank for “You”)'}
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
          />
        </div>

        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-5 space-y-3">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Step 1 — Copy this prompt</p>
          <blockquote className="text-slate-300 text-sm leading-relaxed italic border-l-2 border-violet-500 pl-4">
            "{CHATGPT_PROMPT}"
          </blockquote>
          <button
            onClick={handleCopy}
            className="w-full bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
          >
            {copied ? '✓ Copied!' : 'Copy prompt'}
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider text-center">
            Step 2 — paste ChatGPT's answer on the next screen
          </p>
          <button
            onClick={() => onContinue(displayName, 'chatgpt_memories')}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-semibold transition-colors"
          >
            Paste ChatGPT's answer →
          </button>
          <button
            onClick={() => onContinue(displayName, 'manual')}
            className="w-full text-slate-400 hover:text-slate-200 text-sm transition-colors py-1"
          >
            Write it myself instead
          </button>
        </div>
      </div>
    </div>
  );
}
