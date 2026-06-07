import { useState } from "react";
import type { UserProfile, FeedbackEvent } from "./shared/contract";
import { Onboarding } from "./onboarding/Onboarding";
import { OnboardingStub } from "./onboarding/OnboardingStub";
import { Suggestions } from "./community/Suggestions";
import { loadProfile, saveProfile, clearAccount } from "./community/persistence";

const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

type View = "onboarding" | "suggestions";

export default function App() {
  // Account persistence (product override of the in-memory-only handover rule):
  // resume a saved profile straight into suggestions on refresh.
  const [user, setUser] = useState<UserProfile | null>(() => loadProfile());
  const [view, setView] = useState<View>(() =>
    loadProfile() ? "suggestions" : "onboarding"
  );

  function handleOnComplete(profile: UserProfile) {
    if (!profile.confirmed) {
      console.warn("Onboarding handed over an unconfirmed profile; refusing.");
      return;
    }
    saveProfile(profile);
    setUser(profile);
    setView("suggestions");
  }

  function handleStartOver() {
    clearAccount(user?.id);
    setUser(null);
    setView("onboarding");
  }

  // Module C is not wired yet. Until it lands, log feedback events so the
  // plumbing exists end-to-end and B's cards can fire without errors.
  function handleFeedback(event: FeedbackEvent) {
    console.log("[feedback]", event);
  }

  return (
    <div className="min-h-screen bg-tribe-50 text-tribe-900">
      <Header
        userName={user?.displayName}
        onStartOver={view === "suggestions" ? handleStartOver : undefined}
      />
      <main className="mx-auto max-w-5xl px-4 py-6">
        {view === "onboarding" && (
          isDemoMode
            ? <OnboardingStub onComplete={handleOnComplete} />
            : <Onboarding onComplete={handleOnComplete} />
        )}
        {view === "suggestions" && user && (
          <Suggestions user={user} onFeedback={handleFeedback} />
        )}
      </main>
    </div>
  );
}

function Header({
  userName,
  onStartOver,
}: {
  userName?: string;
  onStartOver?: () => void;
}) {
  return (
    <header className="border-b border-tribe-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="font-display text-lg font-semibold tracking-tight text-tribe-800">
          Persona Match
        </div>
        <div className="flex items-center gap-3">
          {userName && (
            <div className="text-sm text-tribe-500">Hi, {userName}</div>
          )}
          {onStartOver && (
            <button
              type="button"
              onClick={onStartOver}
              className="rounded-lg border border-tribe-200 px-3 py-1.5 text-xs font-medium text-tribe-500 transition-colors hover:border-tribe-300 hover:text-tribe-700"
            >
              Start over
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
