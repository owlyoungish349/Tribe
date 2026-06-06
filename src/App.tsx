import { useState } from 'react';
import type { UserProfile } from './shared/contract';
import { Onboarding } from './onboarding/Onboarding';

// Module B and C will be imported and composed here once they're built.
// For now, the shell renders a confirmation view post-onboarding.

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  if (!profile) {
    return <Onboarding onComplete={p => setProfile(p)} />;
  }

  // Placeholder — replace with Module B once it hands off a component
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="text-4xl">✓</div>
        <h2 className="text-2xl font-bold text-white">Profile confirmed, {profile.displayName}!</h2>
        <p className="text-slate-400 text-sm">
          Handing off to community matching…
        </p>
        <pre className="text-left text-xs text-slate-400 bg-slate-800/60 rounded-xl p-4 overflow-auto max-h-80">
          {JSON.stringify(profile, null, 2)}
        </pre>
      </div>
    </div>
  );
}
