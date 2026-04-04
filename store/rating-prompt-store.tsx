import { AppState, type AppStateStatus } from 'react-native';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { ActivityRatingSheet } from '@/components/ratings/activity-rating-sheet';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  dismissActivityRatingPrompt,
  getEligibleRatingPrompts,
  submitActivityRatings,
  type RatingPromptActivity,
  type RatingSubmissionEntry,
} from '@/services/ratings';
import { useProfileStore } from '@/store/profile-store';

type RatingPromptStoreValue = {
  activePrompt: RatingPromptActivity | null;
  isSubmitting: boolean;
  refreshPrompts: () => Promise<void>;
  dismissPrompt: () => Promise<void>;
  submitPrompt: (entries: RatingSubmissionEntry[]) => Promise<void>;
};

const RatingPromptStoreContext = createContext<RatingPromptStoreValue | null>(null);

export function RatingPromptProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { refreshProfile } = useProfileStore();
  const [activePrompt, setActivePrompt] = useState<RatingPromptActivity | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitInFlightRef = useRef(false);

  const refreshPrompts = async () => {
    if (!user?.id) {
      setActivePrompt(null);
      return;
    }

    const { data, error } = await getEligibleRatingPrompts(user.id);

    if (error) {
      console.log('RatingPromptProvider.refreshPrompts error', error);
      setActivePrompt(null);
      return;
    }

    setActivePrompt((data ?? [])[0] ?? null);
  };

  useEffect(() => {
    void refreshPrompts();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const intervalId = setInterval(() => {
      void refreshPrompts();
    }, 30_000);

    const channel = supabase
      .channel(`rating-prompts:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_participants',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void refreshPrompts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
        },
        () => {
          void refreshPrompts();
        }
      )
      .subscribe();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void refreshPrompts();
      }
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !activePrompt || activePrompt.targets.length > 0) {
      return;
    }

    setIsSubmitting(true);
    void submitActivityRatings(activePrompt.activityId, user.id, []).then(({ error }) => {
      if (error) {
        console.log('RatingPromptProvider.autoSubmit error', error);
      }

      setIsSubmitting(false);
      void refreshPrompts();
    });
  }, [activePrompt, user?.id]);

  const dismissPrompt = async () => {
    if (!user?.id || !activePrompt || isSubmitting || submitInFlightRef.current) {
      return;
    }

    setIsSubmitting(true);
    const { error } = await dismissActivityRatingPrompt(activePrompt.activityId, user.id);
    setIsSubmitting(false);

    if (error) {
      console.log('RatingPromptProvider.dismissPrompt error', error);
      return;
    }

    await refreshPrompts();
  };

  const submitPrompt = async (entries: RatingSubmissionEntry[]) => {
    if (!user?.id || !activePrompt || isSubmitting || submitInFlightRef.current) {
      return;
    }

    const submittedPromptId = activePrompt.activityId;
    submitInFlightRef.current = true;
    setIsSubmitting(true);
    const { error } = await submitActivityRatings(submittedPromptId, user.id, entries);

    if (error) {
      console.log('RatingPromptProvider.submitPrompt error', error);
      submitInFlightRef.current = false;
      setIsSubmitting(false);
      return;
    }

    setActivePrompt((currentValue) =>
      currentValue?.activityId === submittedPromptId ? null : currentValue
    );
    submitInFlightRef.current = false;
    setIsSubmitting(false);
    await refreshProfile();
    await refreshPrompts();
  };

  const value = useMemo<RatingPromptStoreValue>(
    () => ({
      activePrompt,
      isSubmitting,
      refreshPrompts,
      dismissPrompt,
      submitPrompt,
    }),
    [activePrompt, isSubmitting]
  );

  return (
    <RatingPromptStoreContext.Provider value={value}>
      {children}
      <ActivityRatingSheet
        isSubmitting={isSubmitting}
        onClose={() => {
          void dismissPrompt();
        }}
        onSubmit={(entries) => {
          void submitPrompt(entries);
        }}
        prompt={activePrompt}
        visible={Boolean(activePrompt)}
      />
    </RatingPromptStoreContext.Provider>
  );
}

export function useRatingPromptStore() {
  const contextValue = useContext(RatingPromptStoreContext);

  if (!contextValue) {
    throw new Error('useRatingPromptStore must be used within a RatingPromptProvider');
  }

  return contextValue;
}
