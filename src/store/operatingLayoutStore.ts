import { create } from 'zustand';

/** Mobile / narrow: slide-over for operating nav */
interface OperatingLayoutState {
  mobileNavOpen: boolean;
  setMobileNavOpen: (v: boolean) => void;
  toggleMobileNav: () => void;
}

export const useOperatingLayoutStore = create<OperatingLayoutState>((set) => ({
  mobileNavOpen: false,
  setMobileNavOpen: (v) => set({ mobileNavOpen: v }),
  toggleMobileNav: () => set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),
}));
