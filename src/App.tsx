import { useState } from "react";
import type { UserProfile } from "./shared/contract";
import { FeedbackProvider, useFeedback } from "./growth/FeedbackContext";
import { OnboardingStub } from "./onboarding/OnboardingStub";
import { CommunityModule } from "./community/CommunityModule";

function AppContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { events } = useFeedback();

  if (!profile) {
    return <OnboardingStub onComplete={setProfile} />;
  }

  return (
    <>
      <CommunityModule user={profile} />
      {events.length > 0 && (
        <footer className="border-t border-tribe-200 bg-tribe-100/50 px-4 py-3 text-center text-xs text-tribe-500">
          {events.length} feedback event{events.length !== 1 ? "s" : ""} emitted (Module C consumes these)
        </footer>
      )}
    </>
  );
}

export default function App() {
  return (
    <FeedbackProvider>
      <AppContent />
    </FeedbackProvider>
  );
}
