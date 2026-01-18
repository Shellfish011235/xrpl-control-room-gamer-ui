import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProfileState {
  profileImage: string | null;
  username: string;
  reputation: number;
  socialScore: number;
  skillPoints: number;
  level: number;
  xp: number;
  setProfileImage: (image: string | null) => void;
  setUsername: (name: string) => void;
  updateStats: (stats: Partial<Pick<ProfileState, 'reputation' | 'socialScore' | 'skillPoints' | 'level' | 'xp'>>) => void;
}

// Default profile image - ethereal blue-haired character
const DEFAULT_PROFILE_IMAGE = 'https://i.imgur.com/YqQHhPx.png';

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profileImage: DEFAULT_PROFILE_IMAGE,
      username: 'XRPL_Explorer',
      reputation: 820,
      socialScore: 1250,
      skillPoints: 42,
      level: 15,
      xp: 7850,
      
      setProfileImage: (image) => set({ profileImage: image }),
      setUsername: (name) => set({ username: name }),
      updateStats: (stats) => set((state) => ({ ...state, ...stats })),
    }),
    {
      name: 'xrpl-profile-state',
    }
  )
);
