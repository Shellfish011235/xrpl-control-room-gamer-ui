/**
 * Premium Theme Store - Luxury NFT-based UI Customization
 * 
 * Features:
 * - Preview mode (temporary, doesn't persist)
 * - Applied mode (persists to localStorage per wallet)
 * - Profile picture management from NFTs
 * - Cyberpunk default theme always available
 * - Premium effects (watermark, particles, animated glows)
 * - "Themed by [NFT]" badge support
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeProfile } from '../services/themeService';
import { 
  extractPaletteFromImage, 
  buildThemeProfileFromPalette, 
  applyThemeToCssVars,
  CYBERPUNK_THEME,
} from '../services/themeService';
import type { NFTAsset } from './assetsStore';

export interface ProfilePicture {
  nftId: string;
  imageUrl: string;
  name: string;
}

interface ThemeState {
  // Preview state (not persisted, temporary)
  previewTheme: ThemeProfile | null;
  previewNftId: string | null;
  isExtracting: boolean;
  extractionError: string | null;

  // Applied/persisted state
  appliedTheme: ThemeProfile | null;
  appliedNftId: string | null;
  profilePicture: ProfilePicture | null;
  
  // Whether using custom theme or cyberpunk default
  isCustomThemed: boolean;
  
  // Actions
  previewNft: (nft: NFTAsset) => Promise<void>;
  clearPreview: () => void;
  applyCurrentPreview: () => void;
  applyThemeFromNft: (nft: NFTAsset) => Promise<void>;
  setProfilePicture: (nft: NFTAsset) => void;
  clearProfilePicture: () => void;
  resetToCyberpunk: () => void;
  resetTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Initial state
      previewTheme: null,
      previewNftId: null,
      isExtracting: false,
      extractionError: null,
      appliedTheme: null,
      appliedNftId: null,
      profilePicture: null,
      isCustomThemed: false,

      /**
       * Preview an NFT's theme (temporary, not saved)
       */
      previewNft: async (nft: NFTAsset) => {
        if (!nft.image) {
          set({ extractionError: 'NFT has no image to extract colors from' });
          return;
        }

        set({ 
          isExtracting: true, 
          extractionError: null,
          previewNftId: nft.tokenId,
        });

        try {
          console.log('[ThemeStore] Extracting palette from:', nft.name || nft.tokenId);
          
          const palette = await extractPaletteFromImage(nft.image);
          const theme = buildThemeProfileFromPalette(
            palette,
            nft.tokenId,
            nft.name || `NFT #${nft.serial}`,
            nft.image
          );

          // Apply to CSS vars immediately (preview mode)
          applyThemeToCssVars(theme);

          set({
            previewTheme: theme,
            previewNftId: nft.tokenId,
            isExtracting: false,
          });

          console.log('[ThemeStore] Preview applied:', theme.nftName);
        } catch (error) {
          console.error('[ThemeStore] Extraction failed:', error);
          set({
            isExtracting: false,
            extractionError: error instanceof Error ? error.message : 'Failed to extract colors',
            previewNftId: null,
          });
        }
      },

      /**
       * Clear the preview and revert to applied theme (or default)
       */
      clearPreview: () => {
        const { appliedTheme } = get();
        
        // Revert to applied theme or default
        applyThemeToCssVars(appliedTheme);
        
        set({
          previewTheme: null,
          previewNftId: null,
          extractionError: null,
        });

        console.log('[ThemeStore] Preview cleared, reverted to:', appliedTheme?.nftName || 'default');
      },

      /**
       * Apply the current preview as the permanent theme
       */
      applyCurrentPreview: () => {
        const { previewTheme, previewNftId } = get();
        
        if (!previewTheme || !previewNftId) {
          console.warn('[ThemeStore] No preview to apply');
          return;
        }

        // Save as applied theme
        set({
          appliedTheme: previewTheme,
          appliedNftId: previewNftId,
          previewTheme: null,
          previewNftId: null,
          isCustomThemed: true,
        });

        console.log('[ThemeStore] Premium theme applied:', previewTheme.nftName);
      },

      /**
       * Apply theme directly from an NFT (extract and apply in one step)
       */
      applyThemeFromNft: async (nft: NFTAsset) => {
        if (!nft.image) {
          set({ extractionError: 'NFT has no image to extract colors from' });
          return;
        }

        set({ isExtracting: true, extractionError: null });

        try {
          const palette = await extractPaletteFromImage(nft.image);
          const theme = buildThemeProfileFromPalette(
            palette,
            nft.tokenId,
            nft.name || `NFT #${nft.serial}`,
            nft.image
          );

          // Apply to CSS vars
          applyThemeToCssVars(theme);

          // Save as applied
          set({
            appliedTheme: theme,
            appliedNftId: nft.tokenId,
            previewTheme: null,
            previewNftId: null,
            isExtracting: false,
            isCustomThemed: true,
          });

          console.log('[ThemeStore] Premium theme applied directly:', theme.nftName);
        } catch (error) {
          console.error('[ThemeStore] Direct apply failed:', error);
          set({
            isExtracting: false,
            extractionError: error instanceof Error ? error.message : 'Failed to apply theme',
          });
        }
      },

      /**
       * Set an NFT as the profile picture
       */
      setProfilePicture: (nft: NFTAsset) => {
        if (!nft.image) {
          console.warn('[ThemeStore] NFT has no image for profile picture');
          return;
        }

        set({
          profilePicture: {
            nftId: nft.tokenId,
            imageUrl: nft.image,
            name: nft.name || `NFT #${nft.serial}`,
          },
        });

        console.log('[ThemeStore] Profile picture set:', nft.name || nft.tokenId);
      },

      /**
       * Clear the profile picture
       */
      clearProfilePicture: () => {
        set({ profilePicture: null });
        console.log('[ThemeStore] Profile picture cleared');
      },

      /**
       * Reset to Cyberpunk default theme (keeps profile picture)
       */
      resetToCyberpunk: () => {
        applyThemeToCssVars(CYBERPUNK_THEME);
        
        set({
          previewTheme: null,
          previewNftId: null,
          appliedTheme: null,
          appliedNftId: null,
          extractionError: null,
          isCustomThemed: false,
        });

        console.log('[ThemeStore] Reset to Cyberpunk default theme');
      },

      /**
       * Reset everything to default (including profile picture)
       */
      resetTheme: () => {
        applyThemeToCssVars(CYBERPUNK_THEME);
        
        set({
          previewTheme: null,
          previewNftId: null,
          appliedTheme: null,
          appliedNftId: null,
          extractionError: null,
          isCustomThemed: false,
          profilePicture: null,
        });

        console.log('[ThemeStore] Reset everything to default');
      },
    }),
    {
      name: 'xrpl-theme-state',
      // Only persist applied state, not preview
      partialize: (state) => ({
        appliedTheme: state.appliedTheme,
        appliedNftId: state.appliedNftId,
        profilePicture: state.profilePicture,
        isCustomThemed: state.isCustomThemed,
      }),
      // Rehydrate applied theme on load
      onRehydrateStorage: () => (state) => {
        if (state?.appliedTheme && state?.isCustomThemed) {
          console.log('[ThemeStore] Rehydrating premium theme:', state.appliedTheme.nftName);
          applyThemeToCssVars(state.appliedTheme);
        } else {
          // Apply cyberpunk default
          applyThemeToCssVars(CYBERPUNK_THEME);
        }
      },
    }
  )
);

// Helper to check if an NFT is currently being used
export function useIsNftApplied(nftId: string | undefined): boolean {
  const appliedNftId = useThemeStore((state) => state.appliedNftId);
  return nftId ? nftId === appliedNftId : false;
}

export function useIsNftPreviewing(nftId: string | undefined): boolean {
  const previewNftId = useThemeStore((state) => state.previewNftId);
  return nftId ? nftId === previewNftId : false;
}
