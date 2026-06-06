import type { UserProfile } from "../shared/contract";
import sampleUser from "../fixtures/sample-user.json";

type Props = {
  onComplete: (profile: UserProfile) => void;
};

export function OnboardingStub({ onComplete }: Props) {
  const user = sampleUser as UserProfile;

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4">
      <p className="text-sm text-tribe-500">
        Module A (Onboarding) — using sample profile for demo
      </p>
      <button
        type="button"
        onClick={() => onComplete(user)}
        className="rounded-xl bg-tribe-600 px-6 py-3 text-sm font-semibold text-white hover:bg-tribe-700"
      >
        Continue as {user.displayName}
      </button>
    </div>
  );
}
