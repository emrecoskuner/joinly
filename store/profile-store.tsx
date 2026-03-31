import { createContext, type ReactNode, useContext, useState } from 'react';

import { profileData } from '@/components/profile/mock-profile';

type ProfileStoreValue = {
  aboutMe: string;
  saveAboutMe: (aboutMe: string) => void;
  selectedInterestIds: string[];
  saveInterestIds: (interestIds: string[]) => void;
};

const ProfileStoreContext = createContext<ProfileStoreValue | null>(null);

export function ProfileStoreProvider({ children }: { children: ReactNode }) {
  const [aboutMe, setAboutMe] = useState(profileData.bio);
  const [selectedInterestIds, setSelectedInterestIds] = useState(profileData.initialInterestCategoryIds);

  const saveAboutMe = (nextAboutMe: string) => {
    setAboutMe(nextAboutMe);
  };

  const saveInterestIds = (interestIds: string[]) => {
    setSelectedInterestIds(interestIds);
  };

  return (
    <ProfileStoreContext.Provider value={{ aboutMe, saveAboutMe, selectedInterestIds, saveInterestIds }}>
      {children}
    </ProfileStoreContext.Provider>
  );
}

export function useProfileStore() {
  const contextValue = useContext(ProfileStoreContext);

  if (!contextValue) {
    throw new Error('useProfileStore must be used within a ProfileStoreProvider');
  }

  return contextValue;
}
