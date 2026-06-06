import { useState } from 'react';
import type { UserProfile, Scored } from '../shared/contract';

interface Props {
  profile: UserProfile;
  onConfirm: (profile: UserProfile) => void;
}

function WeightBadge({ weight }: { weight: number }) {
  const pct = Math.round(weight * 100);
  const color =
    weight >= 0.8 ? 'bg-tribe-600' :
    weight >= 0.6 ? 'bg-tribe-500' :
    'bg-tribe-400';
  return (
    <span className={`${color} text-white text-xs px-1.5 py-0.5 rounded-full ml-1.5 font-mono`}>
      {pct}
    </span>
  );
}

function ConfidencePill({ confidence }: { confidence: number }) {
  if (confidence >= 0.7) return null;
  return (
    <span className="text-ember-500 text-xs ml-1" title="Low confidence — B will probe this">
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
          <div key={i} className="flex items-center gap-1 rounded-xl border border-tribe-300 bg-tribe-100 px-2 py-1">
            <input
              className="w-28 bg-transparent text-sm text-tribe-800 outline-none"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onBlur={() => commitEdit(i)}
              onKeyDown={e => { if (e.key === 'Enter') commitEdit(i); if (e.key === 'Escape') setEditing(null); }}
              autoFocus
            />
            <input
              className="w-10 bg-transparent text-xs font-mono text-tribe-500 outline-none"
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
            className="group flex items-center rounded-xl border border-tribe-200 bg-white px-3 py-1.5 text-sm text-tribe-700 transition-colors hover:bg-tribe-50"
          >
            {item.name}
            <WeightBadge weight={item.weight} />
            <span
              onClick={e => { e.stopPropagation(); onDelete(i); }}
              className="ml-2 text-xs text-tribe-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
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
    <div className="mx-auto max-w-xl space-y-7 px-4 py-10">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-tribe-400">Your profile</p>
        <h2 className="font-display text-3xl font-semibold text-tribe-800">
          Does this look like you, {profile.displayName}?
        </h2>
        <p className="text-sm text-tribe-500">
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
        className="w-full rounded-xl bg-tribe-600 py-3.5 text-base font-semibold text-white transition-colors hover:bg-tribe-700"
      >
        Confirm — this is me →
      </button>
      <p className="text-center text-xs text-tribe-400">
        Edits above are only used for matching — nothing is stored.
      </p>
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
        <span className="text-xs font-semibold uppercase tracking-wider text-tribe-400">{label}</span>
        {confidence !== undefined && <ConfidencePill confidence={confidence} />}
        {hint && <span className="ml-1 text-xs text-tribe-400">· {hint}</span>}
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
        <span className="text-xs font-semibold uppercase tracking-wider text-tribe-400">{label}</span>
        {confidence !== undefined && <ConfidencePill confidence={confidence} />}
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-xl border border-tribe-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-tribe-800 focus:border-tribe-400 focus:outline-none focus:ring-1 focus:ring-tribe-400"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full rounded-xl border border-tribe-200 bg-white px-3 py-2.5 text-sm text-tribe-800 focus:border-tribe-400 focus:outline-none focus:ring-1 focus:ring-tribe-400"
        />
      )}
    </div>
  );
}
