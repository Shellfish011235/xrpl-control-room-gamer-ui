/**
 * NFT Arena state – selected address, filters, selected NFT, view tab.
 */

import { create } from 'zustand';
import type { NFTRecord } from '../services/nftService';

export type NFTViewTab = 'gallery' | 'mint' | 'portfolio' | 'trade';

interface NFTState {
  /** Address used for Gallery browse (manual input). */
  browseAddress: string;
  setBrowseAddress: (addr: string) => void;

  /** Filters for gallery. */
  filterTaxon: number | null;
  filterIssuer: string | null;
  setFilterTaxon: (v: number | null) => void;
  setFilterIssuer: (v: string | null) => void;

  /** Currently selected NFT (for detail / sell / burn). */
  selectedNFT: NFTRecord | null;
  setSelectedNFT: (nft: NFTRecord | null) => void;

  /** Active tab in NFT Arena. */
  viewTab: NFTViewTab;
  setViewTab: (tab: NFTViewTab) => void;

  /** Last fetch error (e.g. invalid address). */
  error: string | null;
  setError: (err: string | null) => void;
}

export const useNFTStore = create<NFTState>((set) => ({
  browseAddress: '',
  setBrowseAddress: (addr) => set({ browseAddress: addr, error: null }),

  filterTaxon: null,
  filterIssuer: null,
  setFilterTaxon: (v) => set({ filterTaxon: v }),
  setFilterIssuer: (v) => set({ filterIssuer: v }),

  selectedNFT: null,
  setSelectedNFT: (nft) => set({ selectedNFT: nft }),

  viewTab: 'gallery',
  setViewTab: (tab) => set({ viewTab: tab }),

  error: null,
  setError: (err) => set({ error: err }),
}));
