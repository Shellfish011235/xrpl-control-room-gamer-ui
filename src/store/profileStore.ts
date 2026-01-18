import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProfileState {
  profileImage: string | null;
  displayName: string;
  xHandle: string;
  username: string; // Legacy - keeping for compatibility
  memberSinceYear: number | null;
  reputation: number;
  socialScore: number;
  skillPoints: number;
  level: number;
  xp: number;
  setProfileImage: (image: string | null) => void;
  setDisplayName: (name: string) => void;
  setXHandle: (handle: string) => void;
  setUsername: (name: string) => void;
  setMemberSinceYear: (year: number | null) => void;
  updateStats: (stats: Partial<Pick<ProfileState, 'reputation' | 'socialScore' | 'skillPoints' | 'level' | 'xp'>>) => void;
}

// Default profile image - ethereal blue-haired character
// Users can upload their own via the ProfilePictureUpload component
const DEFAULT_PROFILE_IMAGE = '/profile-default.png';

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profileImage: DEFAULT_PROFILE_IMAGE,
      displayName: '',
      xHandle: '',
      username: 'XRPL_Explorer', // Legacy
      memberSinceYear: null,
      reputation: 820,
      socialScore: 1250,
      skillPoints: 42,
      level: 15,
      xp: 7850,
      
      setProfileImage: (image) => set({ profileImage: image }),
      setDisplayName: (name) => set({ displayName: name }),
      setXHandle: (handle) => set({ xHandle: handle.replace(/^@/, '') }), // Remove @ if included
      setUsername: (name) => set({ username: name }),
      setMemberSinceYear: (year) => set({ memberSinceYear: year }),
      updateStats: (stats) => set((state) => ({ ...state, ...stats })),
    }),
    {
      name: 'xrpl-profile-state',
    }
  )
);
