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
import { fetchIndexedNFTMetadata } from '../services/nftIndexerRecovery';
import type { NFTMediaStatus } from '../services/nftMediaStatus';

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
  mediaStatus?: NFTMediaStatus;
  mediaSource?: 'ledger-uri' | 'xmagnetic-indexer';
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
      const walletErrors: string[] = [];

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
              isLoading: true,
              mediaStatus: 'loading',
              mediaSource: nft.uri ? 'ledger-uri' : undefined,
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
          walletErrors.push(wallet.label || wallet.address);
        }
      }));

      set({
        nfts: allNFTs,
        memeTokens: allMemeTokens,
        otherTokens: allOtherTokens,
        isLoading: false,
        lastUpdated: Date.now(),
        error: walletErrors.length > 0
          ? `Could not load assets for ${walletErrors.join(', ')}. Retry to avoid an incomplete portfolio.`
          : null,
      });

      // Fetch NFT metadata in the background with batching to avoid rate limits
      const nftsWithUri = allNFTs;
      const batchSize = 3; // Keep mobile browsers and serverless gateway work bounded
      const delayBetweenBatches = 350;

      const fetchBatch = async (startIndex: number) => {
        const batch = nftsWithUri.slice(startIndex, startIndex + batchSize);
        await Promise.all(batch.map(nft => get().fetchNFTMetadata(nft.tokenId)));
        
        // If there are more, schedule next batch
        if (startIndex + batchSize < nftsWithUri.length) {
          setTimeout(() => fetchBatch(startIndex + batchSize), delayBetweenBatches);
        }
      };

      if (nftsWithUri.length > 0) {
        console.info(`[Assets] Starting metadata and artwork recovery for ${nftsWithUri.length} NFTs in batches of ${batchSize}`);
        fetchBatch(0);
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
    if (!nft) return;

    try {
      const metadata = nft.uri ? await parseNFTUri(nft.uri) : {};
      const recovered = metadata.image ? null : await fetchIndexedNFTMetadata(tokenId);
      const resolved = recovered ?? metadata;
      
      set((state) => ({
        nfts: state.nfts.map(n =>
          n.tokenId === tokenId
            ? {
                ...n,
                image: resolved.image,
                name: resolved.name || `NFT #${n.serial}`,
                description: resolved.description,
                isLoading: false,
                mediaStatus: resolved.image ? 'loaded' : n.uri ? 'unavailable' : 'no-uri',
                mediaSource: recovered ? 'xmagnetic-indexer' : n.uri ? 'ledger-uri' : undefined,
              }
            : n
        ),
      }));
    } catch {
      const recovered = await fetchIndexedNFTMetadata(tokenId);
      if (recovered?.image) {
        set((state) => ({
          nfts: state.nfts.map(n => n.tokenId === tokenId
            ? {
                ...n,
                image: recovered.image,
                name: recovered.name || `NFT #${n.serial}`,
                description: recovered.description,
                isLoading: false,
                mediaStatus: 'loaded',
                mediaSource: 'xmagnetic-indexer',
              }
            : n),
        }));
        return;
      }
      set((state) => ({
          nfts: state.nfts.map(n =>
          n.tokenId === tokenId
            ? { ...n, isLoading: false, mediaStatus: n.uri ? 'unavailable' : 'no-uri' }
            : n
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
