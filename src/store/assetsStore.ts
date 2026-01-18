import { create } from 'zustand';
import { useWalletStore } from './walletStore';
import { 
  getAccountNFTs, 
  getAccountLines, 
  parseNFTUri, 
  getMemeTokenInfo,
  isMemeToken,
  formatCurrency 
} from '../services/xrplService';

export interface NFTAsset {
  tokenId: string;
  issuer: string;
  taxon: number;
  serial: number;
  uri?: string;
  image?: string;
  name?: string;
  description?: string;
  walletAddress: string;
  walletLabel: string;
  isLoading?: boolean;
}

export interface MemeToken {
  currency: string;
  displayName: string;
  symbol: string;
  balance: number;
  issuer: string;
  icon?: string;
  color: string;
  walletAddress: string;
  walletLabel: string;
}

interface AssetsState {
  nfts: NFTAsset[];
  memeTokens: MemeToken[];
  otherTokens: Array<{
    currency: string;
    balance: number;
    issuer: string;
    walletAddress: string;
    walletLabel: string;
  }>;
  isLoading: boolean;
  lastUpdated: number | null;
  error: string | null;

  // Actions
  fetchAllAssets: () => Promise<void>;
  fetchNFTMetadata: (tokenId: string) => Promise<void>;
  clearAssets: () => void;
}

export const useAssetsStore = create<AssetsState>((set, get) => ({
  nfts: [],
  memeTokens: [],
  otherTokens: [],
  isLoading: false,
  lastUpdated: null,
  error: null,

  fetchAllAssets: async () => {
    const wallets = useWalletStore.getState().wallets.filter(w => w.provider !== 'demo');
    
    if (wallets.length === 0) {
      set({ nfts: [], memeTokens: [], otherTokens: [], isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const allNFTs: NFTAsset[] = [];
      const allMemeTokens: MemeToken[] = [];
      const allOtherTokens: AssetsState['otherTokens'] = [];

      // Fetch assets from all wallets in parallel
      await Promise.all(wallets.map(async (wallet) => {
        try {
          // Fetch NFTs
          const nfts = await getAccountNFTs(wallet.address);
          for (const nft of nfts) {
            allNFTs.push({
              tokenId: nft.tokenId,
              issuer: nft.issuer,
              taxon: nft.taxon,
              serial: nft.serial,
              uri: nft.uri,
              walletAddress: wallet.address,
              walletLabel: wallet.label,
              isLoading: true, // Will load metadata
            });
          }

          // Fetch tokens/trust lines
          const lines = await getAccountLines(wallet.address);
          for (const line of lines) {
            if (line.balance <= 0) continue; // Skip zero/negative balances

            const memeInfo = getMemeTokenInfo(line.currency);
            
            if (memeInfo || isMemeToken(line.currency)) {
              allMemeTokens.push({
                currency: line.currency,
                displayName: memeInfo?.name || formatCurrency(line.currency),
                symbol: memeInfo?.symbol || formatCurrency(line.currency),
                balance: line.balance,
                issuer: line.issuer,
                icon: memeInfo?.icon,
                color: memeInfo?.color || '#9E9E9E',
                walletAddress: wallet.address,
                walletLabel: wallet.label,
              });
            } else {
              allOtherTokens.push({
                currency: line.currency,
                balance: line.balance,
                issuer: line.issuer,
                walletAddress: wallet.address,
                walletLabel: wallet.label,
              });
            }
          }
        } catch (err) {
          console.error(`Error fetching assets for ${wallet.address}:`, err);
        }
      }));

      set({
        nfts: allNFTs,
        memeTokens: allMemeTokens,
        otherTokens: allOtherTokens,
        isLoading: false,
        lastUpdated: Date.now(),
      });

      // Fetch NFT metadata in the background
      for (const nft of allNFTs) {
        if (nft.uri) {
          get().fetchNFTMetadata(nft.tokenId);
        }
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch assets',
      });
    }
  },

  fetchNFTMetadata: async (tokenId: string) => {
    const nft = get().nfts.find(n => n.tokenId === tokenId);
    if (!nft || !nft.uri) return;

    try {
      const metadata = await parseNFTUri(nft.uri);
      
      set((state) => ({
        nfts: state.nfts.map(n =>
          n.tokenId === tokenId
            ? {
                ...n,
                image: metadata.image,
                name: metadata.name || `NFT #${n.serial}`,
                description: metadata.description,
                isLoading: false,
              }
            : n
        ),
      }));
    } catch {
      set((state) => ({
        nfts: state.nfts.map(n =>
          n.tokenId === tokenId ? { ...n, isLoading: false } : n
        ),
      }));
    }
  },

  clearAssets: () => {
    set({
      nfts: [],
      memeTokens: [],
      otherTokens: [],
      lastUpdated: null,
      error: null,
    });
  },
}));

// Helper hook to get total counts
export function useAssetCounts() {
  const { nfts, memeTokens, otherTokens } = useAssetsStore();
  return {
    nftCount: nfts.length,
    memeCount: memeTokens.length,
    tokenCount: otherTokens.length,
    totalAssets: nfts.length + memeTokens.length + otherTokens.length,
  };
}
