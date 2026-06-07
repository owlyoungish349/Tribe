import type { UserProfile } from "../shared/contract";
import sampleUser from "../fixtures/sample-user.json";

type Props = {
  onComplete: (profile: UserProfile) => void;
};

export function OnboardingStub({ onComplete }: Props) {
  const user = sampleUser as UserProfile;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16">
      <div className="card w-full p-8 text-center">
        <p className="label-caps mb-2">Quick demo</p>
        <h2 className="mb-2 font-display text-2xl font-semibold text-tribe-800">
          Skip onboarding
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-tribe-500">
          Jump straight to community matching with a pre-built sample profile.
        </p>
        <button
          type="button"
          onClick={() => onComplete(user)}
          className="btn-primary w-full py-3"
        >
          Continue as {user.displayName}
        </button>
      </div>
    </div>
  );
}
