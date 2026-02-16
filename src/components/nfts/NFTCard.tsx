/**
 * NFT card for Arena grid – image, taxon, issuer, actions.
 */

import { motion } from 'framer-motion';
import { ImageIcon, Flame, ExternalLink } from 'lucide-react';
import type { NFTRecord } from '../../services/nftService';

function truncate(str: string, len: number) {
  return str.length <= len ? str : `${str.slice(0, len)}...`;
}

interface NFTCardProps {
  nft: NFTRecord;
  onSelect?: () => void;
  onBurn?: () => void;
  showActions?: boolean;
}

export function NFTCard({ nft, onSelect, onBurn, showActions = true }: NFTCardProps) {
  const imgUrl = nft.image || (nft.uri?.startsWith('http') ? nft.uri : undefined);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="cyber-panel rounded-lg border border-cyber-border overflow-hidden hover:border-cyber-glow/50 transition-colors"
    >
      <button
        type="button"
        onClick={onSelect}
        className="w-full text-left block"
      >
        <div className="aspect-square bg-cyber-darker/80 relative">
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={nft.name || `NFT ${nft.tokenId.slice(0, 8)}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-cyber-muted">
              <ImageIcon size={48} />
            </div>
          )}
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-cyber-darker/90 text-[10px] text-cyber-cyan font-mono">
            #{nft.serial}
          </div>
        </div>
        <div className="p-3">
          <p className="font-cyber text-sm text-cyber-text truncate">
            {nft.name || `Taxon ${nft.taxon}`}
          </p>
          <p className="text-[10px] text-cyber-muted font-mono mt-0.5" title={nft.issuer}>
            {truncate(nft.issuer, 12)}
          </p>
        </div>
      </button>
      {showActions && (
        <div className="flex gap-1 p-2 border-t border-cyber-border">
          {onSelect && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[10px] border border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan/10"
            >
              <ExternalLink size={12} /> View
            </button>
          )}
          {onBurn && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onBurn(); }}
              className="flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] border border-cyber-red/50 text-cyber-red hover:bg-cyber-red/10"
              title="Burn NFT"
            >
              <Flame size={12} />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
