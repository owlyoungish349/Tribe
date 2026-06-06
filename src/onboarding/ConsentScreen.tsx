import { useState } from 'react';
import type { UserProfile, Scored } from '../shared/contract';

interface Props {
  profile: UserProfile;
  onConfirm: (profile: UserProfile) => void;
}

function WeightBadge({ weight }: { weight: number }) {
  const pct = Math.round(weight * 100);
  const color =
    weight >= 0.8 ? 'bg-violet-600' :
    weight >= 0.6 ? 'bg-indigo-600' :
    'bg-slate-600';
  return (
    <span className={`${color} text-white text-xs px-1.5 py-0.5 rounded-full ml-1.5 font-mono`}>
      {pct}
    </span>
  );
}

function ConfidencePill({ confidence }: { confidence: number }) {
  if (confidence >= 0.7) return null;
  return (
    <span className="text-amber-400 text-xs ml-1" title="Low confidence — B will probe this">
      ~
    </span>
  );
}

function ScoredChipList({
  items,
  onUpdate,
  onDelete,
}: {
  items: Scored[];
  onUpdate: (index: number, updated: Scored) => void;
  onDelete: (index: number) => void;
}) {
  const [editing, setEditing] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editWeight, setEditWeight] = useState('');

  function startEdit(i: number) {
    setEditing(i);
    setEditName(items[i].name);
    setEditWeight(String(items[i].weight));
  }

  function commitEdit(i: number) {
    const w = parseFloat(editWeight);
    if (editName.trim() && !isNaN(w)) {
      onUpdate(i, { name: editName.trim(), weight: Math.min(1, Math.max(0, w)) });
    }
    setEditing(null);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) =>
        editing === i ? (
          <div key={i} className="flex items-center gap-1 bg-slate-700 rounded-xl px-2 py-1">
            <input
              className="bg-transparent text-white text-sm outline-none w-28"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onBlur={() => commitEdit(i)}
              onKeyDown={e => { if (e.key === 'Enter') commitEdit(i); if (e.key === 'Escape') setEditing(null); }}
              autoFocus
            />
            <input
              className="bg-transparent text-violet-300 text-xs font-mono outline-none w-10"
              value={editWeight}
              onChange={e => setEditWeight(e.target.value)}
              onBlur={() => commitEdit(i)}
              onKeyDown={e => { if (e.key === 'Enter') commitEdit(i); if (e.key === 'Escape') setEditing(null); }}
            />
          </div>
        ) : (
          <button
            key={i}
            onClick={() => startEdit(i)}
            className="group flex items-center bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl px-3 py-1.5 text-sm text-slate-200 transition-colors"
          >
            {item.name}
            <WeightBadge weight={item.weight} />
            <span
              onClick={e => { e.stopPropagation(); onDelete(i); }}
              className="ml-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
            >
              ×
            </span>
          </button>
        )
      )}
    </div>
  );
}

export function ConsentScreen({ profile: initial, onConfirm }: Props) {
  const [profile, setProfile] = useState<UserProfile>(initial);

  function updateInterests(items: Scored[]) {
    setProfile(p => ({ ...p, interests: items }));
  }
  function updateValues(items: Scored[]) {
    setProfile(p => ({ ...p, values: items }));
  }

  function handleConfirm() {
    const confirmed = { ...profile, confirmed: true };
    console.log('[PersonaMatch] onComplete profile:', confirmed);
    onConfirm(confirmed);
  }

  const conf = profile.confidence;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-950 p-4 flex items-start justify-center pt-10 pb-20">
      <div className="max-w-xl w-full space-y-7">
        <div className="space-y-1">
          <p className="text-violet-400 text-xs font-medium uppercase tracking-widest">Your profile</p>
          <h2 className="text-2xl font-bold text-white">
            Does this look like you, {profile.displayName}?
          </h2>
          <p className="text-slate-400 text-sm">
            Tap any chip to edit, × to remove. Confirm when it feels right.
          </p>
        </div>

        <Section
          label="Interests"
          confidence={conf.interests}
          hint="chip size = weight (0–100)"
        >
          <ScoredChipList
            items={profile.interests}
            onUpdate={(i, v) => updateInterests(profile.interests.map((x, idx) => idx === i ? v : x))}
            onDelete={i => updateInterests(profile.interests.filter((_, idx) => idx !== i))}
          />
        </Section>

        <Section label="Values" confidence={conf.values}>
          <ScoredChipList
            items={profile.values}
            onUpdate={(i, v) => updateValues(profile.values.map((x, idx) => idx === i ? v : x))}
            onDelete={i => updateValues(profile.values.filter((_, idx) => idx !== i))}
          />
        </Section>

        <EditableField
          label="Communication style"
          value={profile.comm_style}
          confidence={conf.comm_style}
          onChange={v => setProfile(p => ({ ...p, comm_style: v }))}
        />

        <EditableField
          label="Current focus"
          value={profile.current_focus}
          confidence={conf.current_focus}
          onChange={v => setProfile(p => ({ ...p, current_focus: v }))}
        />

        <EditableField
          label="Vibe summary"
          value={profile.vibe_summary}
          confidence={conf.vibe_summary}
          onChange={v => setProfile(p => ({ ...p, vibe_summary: v }))}
          multiline
        />

        <button
          onClick={handleConfirm}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-3.5 font-semibold text-base transition-colors"
        >
          Confirm — this is me →
        </button>
        <p className="text-slate-500 text-xs text-center">
          Edits above are only used for matching — nothing is stored.
        </p>
      </div>
    </div>
  );
}

function Section({
  label,
  confidence,
  hint,
  children,
}: {
  label: string;
  confidence?: number;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</span>
        {confidence !== undefined && <ConfidencePill confidence={confidence} />}
        {hint && <span className="text-slate-600 text-xs ml-1">· {hint}</span>}
      </div>
      {children}
    </div>
  );
}

function EditableField({
  label,
  value,
  confidence,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  confidence?: number;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</span>
        {confidence !== undefined && <ConfidencePill confidence={confidence} />}
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={3}
          className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none leading-relaxed"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      )}
    </div>
  );
}
