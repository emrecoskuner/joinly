import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import {
  buildEmptyProfile,
  getCurrentProfile,
  type ProfileRecord,
  type ProfileUpdatePayload,
  updateProfile,
} from '@/services/profiles';

type SaveProfileResult = {
  error: Error | null;
  profile: ProfileRecord | null;
};

type ProfileStoreValue = {
  profile: ProfileRecord | null;
  loading: boolean;
  saving: boolean;
  error: Error | null;
  isProfileComplete: boolean;
  refreshProfile: () => Promise<void>;
  saveProfile: (payload: ProfileUpdatePayload) => Promise<SaveProfileResult>;
};

const ProfileStoreContext = createContext<ProfileStoreValue | null>(null);

export function ProfileStoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refreshProfile = async () => {
    if (!user?.id) {
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error: nextError } = await getCurrentProfile(user.id);

    if (nextError) {
      console.log('refreshProfile error', nextError);
      setProfile(buildEmptyProfile(user.id));
      setError(nextError);
      setLoading(false);
      return;
    }

    setProfile(data ?? buildEmptyProfile(user.id));
    setError(null);
    setLoading(false);
  };

  useEffect(() => {
    void refreshProfile();
  }, [user?.id]);

  const saveProfile = async (payload: ProfileUpdatePayload): Promise<SaveProfileResult> => {
    if (!user?.id) {
      return { error: new Error('You must be signed in to update your profile.'), profile: null };
    }

    setSaving(true);
    const { data, error: nextError } = await updateProfile(user.id, payload);
    setSaving(false);

    if (nextError) {
      console.log('saveProfile error', nextError);
      setError(nextError);
      return { error: nextError, profile: null };
    }

    setProfile(data ?? buildEmptyProfile(user.id));
    setError(null);
    return { error: null, profile: data ?? null };
  };

  const value = useMemo<ProfileStoreValue>(
    () => ({
      profile,
      loading,
      saving,
      error,
      isProfileComplete: profile?.isComplete ?? false,
      refreshProfile,
      saveProfile,
    }),
    [error, loading, profile, saving]
  );

  return <ProfileStoreContext.Provider value={value}>{children}</ProfileStoreContext.Provider>;
}

export function useProfileStore() {
  const contextValue = useContext(ProfileStoreContext);

  if (!contextValue) {
    throw new Error('useProfileStore must be used within a ProfileStoreProvider');
  }

  return contextValue;
}
