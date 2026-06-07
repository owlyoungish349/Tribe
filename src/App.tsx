import { useState } from "react";
import type { UserProfile, FeedbackEvent } from "./shared/contract";
import { Onboarding } from "./onboarding/Onboarding";
import { OnboardingStub } from "./onboarding/OnboardingStub";
import { Suggestions } from "./community/Suggestions";
import { loadProfile, saveProfile, clearAccount } from "./community/persistence";

const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

type View = "onboarding" | "suggestions";

export default function App() {
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

  function handleFeedback(event: FeedbackEvent) {
    console.log("[feedback]", event);
  }

  return (
    <div className="min-h-screen bg-tribe-50 text-tribe-900">
      <Header
        userName={user?.displayName}
        onStartOver={view === "suggestions" ? handleStartOver : undefined}
      />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {view === "onboarding" &&
          (isDemoMode ? (
            <OnboardingStub onComplete={handleOnComplete} />
          ) : (
            <Onboarding onComplete={handleOnComplete} />
          ))}
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
    <header className="sticky top-0 z-40 border-b border-tribe-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-tribe-600 text-sm font-bold text-white">
            P
          </span>
          <div>
            <div className="font-display text-base font-semibold leading-tight text-tribe-800 sm:text-lg">
              Persona Match
            </div>
            {isDemoMode ? (
              <span className="badge-demo">Demo</span>
            ) : (
              <span className="badge-live">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-tribe-500" />
                Live
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {userName && (
            <span className="hidden text-sm text-tribe-500 sm:inline">
              Hi, {userName}
            </span>
          )}
          {onStartOver && (
            <button type="button" onClick={onStartOver} className="btn-ghost px-3 py-1.5 text-xs">
              Start over
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
