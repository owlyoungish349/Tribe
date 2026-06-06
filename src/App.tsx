import { useState } from "react";
import type { UserProfile, FeedbackEvent } from "./shared/contract";
import { Onboarding } from "./onboarding/Onboarding";
import { OnboardingStub } from "./onboarding/OnboardingStub";
import { Suggestions } from "./community/Suggestions";

const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

type View = "onboarding" | "suggestions";

export default function App() {
  const [view, setView] = useState<View>("onboarding");
  const [user, setUser] = useState<UserProfile | null>(null);

  function handleOnComplete(profile: UserProfile) {
    if (!profile.confirmed) {
      console.warn("Onboarding handed over an unconfirmed profile; refusing.");
      return;
    }
    setUser(profile);
    setView("suggestions");
  }

  // Module C is not wired yet. Until it lands, log feedback events so the
  // plumbing exists end-to-end and B's cards can fire without errors.
  function handleFeedback(event: FeedbackEvent) {
    console.log("[feedback]", event);
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <Header userName={user?.displayName} />
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

function Header({ userName }: { userName?: string }) {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="text-base font-semibold tracking-tight">Persona Match</div>
        {userName && (
          <div className="text-sm text-neutral-600">Hi, {userName}</div>
        )}
      </div>
    </header>
  );
}
