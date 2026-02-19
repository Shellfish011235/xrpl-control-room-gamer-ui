/**
 * NFT Arena – XLS-20 gallery, mint, portfolio, trade.
 * Phase 1: Testnet-first; BETA badge.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutGrid,
  Sparkles,
  Wallet,
  ArrowLeftRight,
  Search,
  Loader2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useNFTStore, type NFTViewTab } from '../store/nftStore';
import { useWalletStore } from '../store/walletStore';
import { fetchAccountNFTs, filterNFTs } from '../services/nftService';
import { NFTCard, NFTMintForm } from '../components/nfts';
import { xamanService } from '../services/xaman';

const TABS: { id: NFTViewTab; label: string; icon: React.ReactNode }[] = [
  { id: 'gallery', label: 'Gallery', icon: <LayoutGrid size={16} /> },
  { id: 'mint', label: 'Mint', icon: <Sparkles size={16} /> },
  { id: 'portfolio', label: 'Portfolio', icon: <Wallet size={16} /> },
  { id: 'trade', label: 'Trade', icon: <ArrowLeftRight size={16} /> },
];

export default function NFTs() {
  const {
    viewTab,
    setViewTab,
    browseAddress,
    setBrowseAddress,
    filterTaxon,
    filterIssuer,
    setFilterTaxon,
    setFilterIssuer,
    selectedNFT,
    setSelectedNFT,
    error,
    setError,
  } = useNFTStore();

  const activeWallet = useWalletStore((s) => {
    const id = s.activeWalletId;
    return id ? s.wallets.find((w) => w.id === id) : null;
  });
  const portfolioAddress = activeWallet?.address ?? '';

  const [mintSubmitting, setMintSubmitting] = useState(false);
  const [burnModalNft, setBurnModalNft] = useState<typeof selectedNFT>(null);

  const addressToFetch = viewTab === 'gallery' ? browseAddress : viewTab === 'portfolio' ? portfolioAddress : '';
  const { data: nfts = [], isLoading, refetch } = useQuery({
    queryKey: ['nfts', addressToFetch],
    queryFn: () => fetchAccountNFTs(addressToFetch),
    enabled: !!addressToFetch && addressToFetch.length >= 25,
  });

  const filtered = filterNFTs(nfts, {
    taxon: filterTaxon ?? undefined,
    issuer: filterIssuer ?? undefined,
  });

  const handleBrowse = useCallback(() => {
    if (!browseAddress.trim()) {
      setError('Enter an XRPL address');
      return;
    }
    setError(null);
    refetch();
  }, [browseAddress, refetch, setError]);

  const handleMintSubmit = useCallback(
    async (payload: Record<string, unknown>) => {
      const account = payload.Account as string;
      if (!account) return;
      setMintSubmitting(true);
      try {
        await xamanService.requestCustomTransactionSignature(payload as any, account);
      } catch (e) {
        console.error('[NFT Arena] Mint sign failed:', e);
        setError(e instanceof Error ? e.message : 'Sign failed');
      } finally {
        setMintSubmitting(false);
      }
    },
    [setError]
  );

  return (
    <div className="min-h-screen pt-20 pb-8 px-4 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-cyber-darker border border-cyber-border shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyber-glow/30 flex items-center justify-center border border-cyber-glow/40">
            <LayoutGrid className="w-5 h-5 text-cyber-glow" />
          </div>
          <div>
            <h1 className="font-cyber text-xl text-cyber-text">NFT ARENA</h1>
            <p className="text-xs text-cyber-text/90">XLS-20 · Browse, mint, trade</p>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] bg-cyber-yellow/30 text-cyber-yellow border border-cyber-yellow/50 font-medium">
            BETA
          </span>
        </div>
      </motion.div>

      {/* Tabs – solid backgrounds for legibility */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setViewTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border font-cyber text-sm transition-colors ${
              viewTab === tab.id
                ? 'border-cyber-glow text-cyber-glow bg-cyber-darker border-2 shadow-md'
                : 'border-cyber-border bg-cyber-darker text-cyber-text hover:border-cyber-glow/50 hover:text-cyber-glow'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {viewTab === 'gallery' && (
          <motion.div
            key="gallery"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="cyber-panel p-4 flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-cyber-muted mb-1">XRPL address</label>
                <input
                  type="text"
                  value={browseAddress}
                  onChange={(e) => setBrowseAddress(e.target.value)}
                  placeholder="r..."
                  className="w-full bg-cyber-darker border border-cyber-border rounded px-3 py-2 text-cyber-text font-mono text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleBrowse}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan/10"
              >
                <Search size={16} /> Browse
              </button>
              <input
                type="number"
                placeholder="Taxon"
                value={filterTaxon ?? ''}
                onChange={(e) => setFilterTaxon(e.target.value === '' ? null : Number(e.target.value))}
                className="w-24 bg-cyber-darker border border-cyber-border rounded px-2 py-2 text-cyber-text text-sm"
              />
              <input
                type="text"
                placeholder="Issuer"
                value={filterIssuer ?? ''}
                onChange={(e) => setFilterIssuer(e.target.value || null)}
                className="w-32 bg-cyber-darker border border-cyber-border rounded px-2 py-2 text-cyber-text font-mono text-sm"
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-cyber-red/10 border border-cyber-red/30 text-cyber-red text-sm">
                <AlertTriangle size={18} />
                {error}
              </div>
            )}
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-cyber-glow animate-spin" />
              </div>
            )}
            {!isLoading && addressToFetch && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filtered.map((nft) => (
                  <NFTCard
                    key={nft.tokenId}
                    nft={nft}
                    onSelect={() => setSelectedNFT(nft)}
                    onBurn={() => setBurnModalNft(nft)}
                  />
                ))}
              </div>
            )}
            {!isLoading && addressToFetch && filtered.length === 0 && (
              <p className="text-center text-cyber-muted py-12">No NFTs found.</p>
            )}
          </motion.div>
        )}

        {viewTab === 'mint' && (
          <motion.div
            key="mint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {portfolioAddress ? (
              <div className="max-w-md">
                <NFTMintForm
                  account={portfolioAddress}
                  onSubmit={handleMintSubmit}
                  isSubmitting={mintSubmitting}
                />
                <p className="mt-3 text-xs text-cyber-muted">
                  Connect a wallet in the header to mint. You will sign the NFTokenMint in Xaman.
                </p>
              </div>
            ) : (
              <div className="cyber-panel p-8 text-center">
                <Wallet className="w-12 h-12 text-cyber-muted mx-auto mb-3" />
                <p className="text-cyber-muted">Connect a wallet to mint NFTs.</p>
              </div>
            )}
          </motion.div>
        )}

        {viewTab === 'portfolio' && (
          <motion.div
            key="portfolio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {portfolioAddress ? (
              <>
                {isLoading && (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-cyber-glow animate-spin" />
                  </div>
                )}
                {!isLoading && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filtered.map((nft) => (
                      <NFTCard
                        key={nft.tokenId}
                        nft={nft}
                        onSelect={() => setSelectedNFT(nft)}
                        onBurn={() => setBurnModalNft(nft)}
                      />
                    ))}
                  </div>
                )}
                {!isLoading && filtered.length === 0 && (
                  <p className="text-center text-cyber-muted py-12">Your wallet has no NFTs.</p>
                )}
              </>
            ) : (
              <div className="cyber-panel p-8 text-center">
                <Wallet className="w-12 h-12 text-cyber-muted mx-auto mb-3" />
                <p className="text-cyber-muted">Connect a wallet to view your portfolio.</p>
              </div>
            )}
          </motion.div>
        )}

        {viewTab === 'trade' && (
          <motion.div
            key="trade"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="cyber-panel p-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded text-[10px] bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/40">
                Coming soon
              </span>
            </div>
            <p className="text-cyber-muted text-sm">
              Sell/Buy offers (NFTokenCreateOffer, NFTokenAcceptOffer) – use <strong className="text-cyber-text">Portfolio</strong> to select an NFT, then create a sell offer. Full broker mode in a future update.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail modal */}
      <AnimatePresence>
        {selectedNFT && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            onClick={() => setSelectedNFT(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="cyber-panel p-6 max-w-md w-full rounded-xl border border-cyber-glow/30"
            >
              <div className="flex justify-end mb-2">
                <button type="button" onClick={() => setSelectedNFT(null)} className="p-1 text-cyber-muted hover:text-cyber-text">
                  <X size={20} />
                </button>
              </div>
              {selectedNFT.image && (
                <img
                  src={selectedNFT.image}
                  alt={selectedNFT.name || selectedNFT.tokenId}
                  className="w-full aspect-square object-cover rounded-lg mb-4"
                />
              )}
              <p className="font-cyber text-cyber-text">{selectedNFT.name || `Taxon ${selectedNFT.taxon}`}</p>
              <p className="text-xs text-cyber-muted font-mono break-all mt-1">ID: {selectedNFT.tokenId}</p>
              <p className="text-xs text-cyber-muted font-mono">Issuer: {selectedNFT.issuer}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Burn confirm modal placeholder */}
      <AnimatePresence>
        {burnModalNft && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            onClick={() => setBurnModalNft(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="cyber-panel p-6 max-w-sm w-full rounded-xl border border-cyber-red/30"
            >
              <p className="text-cyber-text font-cyber mb-2">Burn NFT?</p>
              <p className="text-xs text-cyber-muted mb-4">This cannot be undone. Sign in Xaman to confirm.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBurnModalNft(null)}
                  className="flex-1 py-2 rounded border border-cyber-border text-cyber-muted hover:bg-cyber-darker"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="flex-1 py-2 rounded border border-cyber-red/50 text-cyber-red hover:bg-cyber-red/10"
                  onClick={() => {
                    setBurnModalNft(null);
                    // TODO: buildNFTokenBurnPayload + xamanService.requestCustomTransactionSignature
                  }}
                >
                  Burn
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
