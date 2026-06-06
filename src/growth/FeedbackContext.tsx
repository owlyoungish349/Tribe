import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { FeedbackEvent } from "../shared/contract";

type FeedbackContextValue = {
  events: FeedbackEvent[];
  onFeedback: (event: FeedbackEvent) => void;
};

const FeedbackContext = createContext<FeedbackContextValue>({
  events: [],
  onFeedback: () => {},
});

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<FeedbackEvent[]>([]);

  const onFeedback = useCallback((event: FeedbackEvent) => {
    setEvents((prev) => [...prev, event]);
  }, []);

  return (
    <FeedbackContext.Provider value={{ events, onFeedback }}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  return useContext(FeedbackContext);
}
