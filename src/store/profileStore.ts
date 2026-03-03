import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BackgroundStyle = 'auto' | 'gradient' | 'mesh' | 'bubbles' | 'cyber' | 'generated';

interface ProfileState {
  profileImage: string | null;
  displayName: string;
  xHandle: string;
  username: string; // Legacy - keeping for compatibility
  memberSinceYear: number | null;
  /** Social / profile links (optional) */
  githubUrl: string;
  linkedinUrl: string;
  websiteUrl: string;
  reputation: number;
  socialScore: number;
  skillPoints: number;
  /** Background style: auto = profile colors when custom pic, else cyber; gradient/mesh/bubbles = use profile colors; cyber = always default */
  backgroundStyle: BackgroundStyle;
  /** 0.2–1: how strong the profile-colored orbs/gradient are */
  backgroundIntensity: number;
  setProfileImage: (image: string | null) => void;
  setDisplayName: (name: string) => void;
  setXHandle: (handle: string) => void;
  setUsername: (name: string) => void;
  setMemberSinceYear: (year: number | null) => void;
  setGithubUrl: (url: string) => void;
  setLinkedinUrl: (url: string) => void;
  setWebsiteUrl: (url: string) => void;
  updateStats: (stats: Partial<Pick<ProfileState, 'reputation' | 'socialScore' | 'skillPoints'>>) => void;
  setBackgroundStyle: (style: BackgroundStyle) => void;
  setBackgroundIntensity: (intensity: number) => void;
}

// Default profile image - XRPL Control Room logo (display uses bundled src/assets/profile-default.png)
const DEFAULT_PROFILE_IMAGE = '/profile-default.png';

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profileImage: DEFAULT_PROFILE_IMAGE,
      displayName: '',
      xHandle: '',
      username: 'XRPL_Explorer', // Legacy
      memberSinceYear: null,
      githubUrl: '',
      linkedinUrl: '',
      websiteUrl: '',
      reputation: 820,
      socialScore: 1250,
      skillPoints: 42,
      backgroundStyle: 'auto',
      backgroundIntensity: 0.5,

      setProfileImage: (image) => set({ profileImage: image }),
      setDisplayName: (name) => set({ displayName: name }),
      setXHandle: (handle) => set({ xHandle: handle.replace(/^@/, '') }), // Remove @ if included
      setUsername: (name) => set({ username: name }),
      setMemberSinceYear: (year) => set({ memberSinceYear: year }),
      setGithubUrl: (url) => set({ githubUrl: url.trim() }),
      setLinkedinUrl: (url) => set({ linkedinUrl: url.trim() }),
      setWebsiteUrl: (url) => set({ websiteUrl: url.trim() }),
      updateStats: (stats) => set((state) => ({ ...state, ...stats })),
      setBackgroundStyle: (style) => set({ backgroundStyle: style }),
      setBackgroundIntensity: (intensity) => set({ backgroundIntensity: Math.max(0.2, Math.min(1, intensity)) }),
    }),
    {
      name: 'xrpl-profile-state',
      partialize: (state) => state,
      onRehydrateStorage: () => (state) => {
        if (!state?.profileImage) return;
        if (state?.profileImage && state.profileImage.startsWith('/profile-default.png') && state.profileImage !== DEFAULT_PROFILE_IMAGE) {
          useProfileStore.getState().setProfileImage(DEFAULT_PROFILE_IMAGE);
        }
      },
    }
  )
);
