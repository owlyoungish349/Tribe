import { useEffect, useRef } from "react";
import type { UserProfile, FeedbackEvent } from "../shared/contract";
import { FeedbackProvider, useFeedback } from "../growth/FeedbackContext";
import { CommunityModule } from "./CommunityModule";

interface Props {
  user: UserProfile;
  onFeedback: (event: FeedbackEvent) => void;
}

// Bridges events from FeedbackContext out to the App-level onFeedback prop.
// CommunityModule emits into the context; this component forwards new events
// to whoever owns the callback (App, or eventually Module C).
function FeedbackBridge({ onFeedback }: { onFeedback: (e: FeedbackEvent) => void }) {
  const { events } = useFeedback();
  const seenRef = useRef(0);

  useEffect(() => {
    if (events.length > seenRef.current) {
      events.slice(seenRef.current).forEach((e) => onFeedback(e));
      seenRef.current = events.length;
    }
  }, [events, onFeedback]);

  return null;
}

export function Suggestions({ user, onFeedback }: Props) {
  return (
    <FeedbackProvider>
      <FeedbackBridge onFeedback={onFeedback} />
      <CommunityModule user={user} />
    </FeedbackProvider>
  );
}
