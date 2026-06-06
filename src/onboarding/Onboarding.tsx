import { useState } from 'react';
import type { UserProfile } from '../shared/contract';
import { extractProfile, extractFillIn } from './extract';
import { IntroScreen } from './IntroScreen';
import { PasteScreen } from './PasteScreen';
import { FillInScreen } from './FillInScreen';
import { ConsentScreen } from './ConsentScreen';

type Stage =
  | { step: 'intro' }
  | { step: 'paste'; displayName: string; source: 'chatgpt_memories' | 'manual' }
  | { step: 'fill-in'; profile: UserProfile }
  | { step: 'consent'; profile: UserProfile };

interface Props {
  onComplete: (profile: UserProfile) => void;
}

export function Onboarding({ onComplete }: Props) {
  const [stage, setStage] = useState<Stage>({ step: 'intro' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePasteSubmit(text: string) {
    if (stage.step !== 'paste') return;
    setLoading(true);
    setError(null);
    try {
      const profile = await extractProfile(text, stage.displayName, stage.source);
      // Rule #7: if interests < 2, show fill-in question
      if (profile.interests.length < 2) {
        setStage({ step: 'fill-in', profile });
      } else {
        setStage({ step: 'consent', profile });
      }
    } catch (e) {
      setError("Couldn't read that — paste again or write it yourself.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleFillIn(answer: string) {
    if (stage.step !== 'fill-in') return;
    setLoading(true);
    try {
      const extra = await extractFillIn(answer);
      const merged = {
        ...stage.profile,
        interests: [...stage.profile.interests, ...extra],
      };
      setStage({ step: 'consent', profile: merged });
    } catch (e) {
      // On failure, just proceed with what we have
      setStage({ step: 'consent', profile: stage.profile });
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (stage.step === 'intro') {
    return (
      <IntroScreen
        onContinue={(displayName, source) =>
          setStage({ step: 'paste', displayName, source })
        }
      />
    );
  }

  if (stage.step === 'paste') {
    return (
      <PasteScreen
        source={stage.source}
        onSubmit={handlePasteSubmit}
        onBack={() => setStage({ step: 'intro' })}
        loading={loading}
        error={error}
      />
    );
  }

  if (stage.step === 'fill-in') {
    return <FillInScreen onSubmit={handleFillIn} loading={loading} />;
  }

  // consent
  return <ConsentScreen profile={stage.profile} onConfirm={onComplete} />;
}
