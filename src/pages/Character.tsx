import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, Trophy, Zap, Github, Twitter, Linkedin, Globe, 
  ChevronRight, Code, Users,
  Calendar, MessageSquare, ExternalLink,
  Image as ImageIcon, Loader2, X as XIcon, RefreshCw, Coins, Copy, Check, Edit2,
  Palette, Sparkles, UserCircle, PieChart as PieChartIcon,
  Skull, BookOpen, Activity, Brain, Database, TrendingUp,
  Layers, ArrowLeftRight
} from 'lucide-react'
import { PortfolioContent } from './Clinic'
import { ProfilePictureUpload } from '../components/ProfilePictureUpload'
import { WalletConnect } from '../components/WalletConnect'
import { useProfileStore, type BackgroundStyle } from '../store/profileStore'
import { useWalletStore } from '../store/walletStore'
import { useStrategyStore } from '../store/strategyStore'
import { useAssetsStore } from '../store/assetsStore'
import { useThemeStore, useIsNftApplied, useIsNftPreviewing } from '../store/themeStore'
import type { NFTAsset, MemeToken } from '../store/assetsStore'
import { BackgroundPreview } from '../modules/theme/BackgroundPreview'
import { LedgerImpactTool } from '../components/LedgerImpactTool'
import { SettlementQueueWidget, CorridorExposurePanel } from '../components/ilp'

// Strategy status card for Home: which strategies are on, exposure, PnL (sim), link to Terminal
function StrategyStatusCard() {
  const enabled = useStrategyStore((s) => s.enabled)
  const exposureXRP = useStrategyStore((s) => s.exposureXRP)
  const maxExposureXRP = useStrategyStore((s) => s.maxExposureXRP)
  const pnlByStrategy = useStrategyStore((s) => s.pnlByStrategy)
  const totalRealized = Object.values(pnlByStrategy).reduce((sum, p) => sum + p.realizedPnL, 0)
  const totalTrades = Object.values(pnlByStrategy).reduce((sum, p) => sum + p.tradesCount, 0)
  const activeCount = Object.values(enabled).filter(Boolean).length
  return (
    <Link
      to="/terminal"
      className="cyber-panel p-4 block rounded-lg border border-cyber-border hover:border-cyber-cyan/50 transition-colors text-left"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-cyber text-xs text-cyber-muted uppercase tracking-wider">Strategy status</span>
        <ChevronRight size={14} className="text-cyber-muted" />
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        {[
          { id: 'grid' as const, label: 'Grid', icon: Layers },
          { id: 'dca' as const, label: 'DCA', icon: TrendingUp },
          { id: 'mm' as const, label: 'MM', icon: Zap },
          { id: 'arbitrage' as const, label: 'Arb', icon: ArrowLeftRight },
        ].map(({ id, label, icon: Icon }) => (
          <span
            key={id}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border ${
              enabled[id] ? 'border-cyber-cyan/50 text-cyber-cyan bg-cyber-cyan/10' : 'border-cyber-muted/50 text-cyber-muted'
            }`}
          >
            <Icon size={10} />
            {label}
          </span>
        ))}
      </div>
      {activeCount === 0 && totalTrades === 0 ? (
        <p className="text-[10px] text-cyber-muted">No strategies enabled — open Terminal to unlock</p>
      ) : (
        <>
          <div className="flex items-center gap-4 text-[10px] text-cyber-muted">
            <span>Exposure: {exposureXRP.toFixed(0)} / {maxExposureXRP} XRP</span>
            {(totalRealized !== 0 || totalTrades > 0) && (
              <span>PnL (sim): {totalRealized >= 0 ? '+' : ''}{totalRealized.toFixed(2)} · {totalTrades} trades</span>
            )}
          </div>
          <p className="text-[10px] text-cyber-cyan mt-1">Terminal → Strategies</p>
        </>
      )}
    </Link>
  )
}

// Upcoming events: XRPL / XRP / Ripple / ILP + major crypto. endDate = last day (YYYY-MM-DD).
// Sources: xrpl.org/community/events, xrpl-commons.org, interledger.org, ripple.com/events/all/, etc. (verify before travel).
const communityEventsAll: { date: string; title: string; type: string; url: string; endDate: string }[] = [
  { date: 'Jan 26–27, 2026', title: 'Building on the XRP Ledger — dev training (XRPL Commons, Paris)', type: 'training', url: 'https://lu.ma/lxb5ttsc', endDate: '2026-01-27' },
  { date: 'Feb 10–12, 2026', title: 'Consensus Hong Kong — policy, DeFi, institutions (XRP/crypto)', type: 'conference', url: 'https://www.coindesk.com/events/consensus-hong-kong-2026/', endDate: '2026-02-12' },
  { date: 'Feb 10–12, 2026', title: 'EasyA Consensus Hong Kong Hackathon — partner stacks incl. XRPL (Ripple)', type: 'hackathon', url: 'https://www.easya.io/events/easya-consensus-hong-kong-hackathon', endDate: '2026-02-12' },
  { date: 'Feb 11–12, 2026', title: 'XRP Community Day 2026 — virtual, EMEA/Americas/APAC (Ripple)', type: 'summit', url: 'https://ripple.com/insights/xrp-community-day-2026-what-to-expect/', endDate: '2026-02-12' },
  { date: 'Feb 18, 2026', title: 'XRPL Meetup London — hubs & builders (XRPL Commons)', type: 'meetup', url: 'https://lu.ma/xshnm19t', endDate: '2026-02-18' },
  { date: 'Feb 17–21, 2026', title: 'ETHDenver — builder fest; XRPL/ecosystem often represented', type: 'conference', url: 'https://www.ethdenver.com/', endDate: '2026-02-21' },
  { date: 'Mar 12–15, 2026', title: 'ETHMumbai — India Web3; cross-chain & XRPL topics', type: 'conference', url: 'https://ethmumbai.net/', endDate: '2026-03-15' },
  { date: 'Mar 24, 2026', title: 'XRPL Meetup Warsaw — Polish Blockchain Week (XRPL Commons)', type: 'meetup', url: 'https://lu.ma/boucntsh', endDate: '2026-03-24' },
  { date: 'Mar 25, 2026', title: 'XRPL Aquarium Demo Day #8 — social impact (Paris)', type: 'community', url: 'https://lu.ma/2feub5uj', endDate: '2026-03-25' },
  { date: 'Mar 30 – Apr 2, 2026', title: 'ETHCC Cannes — core dev & infra; blockchain-wide', type: 'conference', url: 'https://ethcc.io/', endDate: '2026-04-02' },
  { date: 'Apr 7, 2026', title: 'XRPL & GDF stablecoins roundtable — invite-only (Paris)', type: 'summit', url: 'https://lu.ma/tgg0id1d', endDate: '2026-04-07' },
  { date: 'Apr 11–12, 2026', title: 'Hack The Block 2026 — PBW XRPL hackathon (XRPL Commons / PBW)', type: 'hackathon', url: 'https://lu.ma/Hacktheblock2026-PBW-XRPL', endDate: '2026-04-12' },
  { date: 'Apr 14, 2026', title: 'XRPL Zone Paris — builders & projects (XRPL Commons)', type: 'community', url: 'https://lu.ma/780xhfr7', endDate: '2026-04-14' },
  { date: 'Apr 15, 2026', title: 'XRP Community Night Paris — PBW week', type: 'community', url: 'https://xrpl.org/community/events', endDate: '2026-04-15' },
  { date: 'Apr 29–30, 2026', title: 'TOKEN2049 Dubai — liquidity, Web3 leaders, Ripple/XRP', type: 'conference', url: 'https://www.token2049.com/dubai', endDate: '2026-04-30' },
  { date: 'May 1–2, 2026', title: 'XRPLasVegas — community & builders (XRP Ledger)', type: 'conference', url: 'https://xrplasvegas.com/', endDate: '2026-05-02' },
  { date: 'May 5–7, 2026', title: 'Consensus Miami — Ripple calendar; Americas crypto (XRP/XRPL)', type: 'conference', url: 'https://consensus.coindesk.com/', endDate: '2026-05-07' },
  { date: 'May 5–7, 2026', title: 'EasyA Consensus Miami Hackathon — partner stacks incl. XRPL (Ripple)', type: 'hackathon', url: 'https://www.easya.io/events/easya-consensus-miami-hackathon', endDate: '2026-05-07' },
  { date: 'May 8–10, 2026', title: 'ETHPrague — European builders; multi-chain', type: 'conference', url: 'https://ethprague.com/', endDate: '2026-05-10' },
  { date: 'May 19–20, 2026', title: 'Stablecon Europe — Ripple calendar (stablecoins, Amsterdam)', type: 'summit', url: 'https://ripple.com/events/all/', endDate: '2026-05-20' },
  { date: 'May 20–22, 2026', title: 'Chain of Blocks Summit EU26 — Malta (XRPL Commons partner program)', type: 'conference', url: 'https://lu.ma/8xdc6wgg', endDate: '2026-05-22' },
  { date: 'Jun 2–4, 2026', title: 'Money20/20 Europe — Ripple calendar (payments, Amsterdam)', type: 'conference', url: 'https://europe.money2020.com/', endDate: '2026-06-04' },
  { date: 'Jun 16–17, 2026', title: 'XRPL Blockchain Research Summit — invitation only (Paris)', type: 'summit', url: 'https://www.xrpl-commons.org/engage/events', endDate: '2026-06-17' },
  { date: 'Jun 23–25, 2026', title: 'Point Zero Forum — Ripple calendar (Zurich)', type: 'summit', url: 'https://www.pointzeroforum.ch/', endDate: '2026-06-25' },
  { date: 'Aug 24–26, 2026', title: 'Febraban Tech — Ripple calendar (São Paulo)', type: 'conference', url: 'https://ripple.com/events/all/', endDate: '2026-08-26' },
  { date: 'Sep 9–11, 2026', title: 'Stablecon USA — Ripple calendar (Washington, D.C.)', type: 'summit', url: 'https://ripple.com/events/all/', endDate: '2026-09-11' },
  { date: 'Sep 28 – Oct 1, 2026', title: 'SIBOS — Ripple calendar (Miami, FL)', type: 'conference', url: 'https://www.sibos.com/', endDate: '2026-10-01' },
  { date: 'Sep 30 – Oct 1, 2026', title: 'Korea Blockchain Week — Ripple calendar (Seoul)', type: 'conference', url: 'https://koreablockchainweek.com/', endDate: '2026-10-01' },
  { date: 'Oct 7–8, 2026', title: 'TOKEN2049 Singapore — global Web3; XRP/XRPL ecosystem', type: 'conference', url: 'https://www.token2049.com/singapore', endDate: '2026-10-08' },
  { date: 'Oct 27–29, 2026', title: 'Ripple Swell 2026 — NYC (unified Swell + Apex, XRPL flagship)', type: 'summit', url: 'https://ripple.com/events/swell/', endDate: '2026-10-29' },
  { date: 'Annual · check site', title: 'Interledger Summit & hackathon — Open Payments / ILP (Interledger Foundation)', type: 'summit', url: 'https://interledger.org/summit', endDate: '2026-12-31' },
  { date: 'Ongoing', title: 'EasyA — XRPL challenges & hackathon calendar', type: 'community', url: 'https://www.easya.io/challenges/xrpledger', endDate: '2026-12-31' },
  { date: 'Ongoing', title: 'XRPL community calendar — meetups, hackathons, zones (xrpl.org)', type: 'community', url: 'https://xrpl.org/community/events', endDate: '2026-12-31' },
  { date: 'TBD 2026', title: 'Apex: Innovating with XRP — Miami (investors, enterprise, devs)', type: 'summit', url: 'https://www.apexrippleevent.com/', endDate: '2026-12-31' },
]

function getUpcomingEvents() {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  return communityEventsAll.filter((e) => e.endDate >= today)
}

// Truncate address for display
const truncateAddress = (address: string) => {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
};

// Premium "Themed By" Badge - Shows off your NFT theme
function ThemeBadge() {
  const { appliedTheme, isCustomThemed, resetToCyberpunk } = useThemeStore();
  
  if (!isCustomThemed || !appliedTheme) return null;
  
  return (
    <motion.div
      className="cyber-panel p-3 cyber-glow"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="flex items-center gap-3">
        {/* Mini NFT Preview */}
        {appliedTheme.nftImageUrl && (
          <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-cyber-glow/50 shrink-0">
            <img 
              src={appliedTheme.nftImageUrl} 
              alt={appliedTheme.nftName}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={12} className="text-cyber-glow" />
            <span className="text-[10px] text-cyber-glow font-cyber uppercase tracking-wider">Premium Theme Active</span>
          </div>
          <p className="text-sm text-cyber-text font-cyber truncate">{appliedTheme.nftName}</p>
        </div>
        
        {/* Color Dots */}
        <div className="flex gap-1">
          {[appliedTheme.colors.primary, appliedTheme.colors.accent, appliedTheme.colors.highlight].map((color, i) => (
            <div 
              key={i}
              className="w-3 h-3 rounded-full border border-white/20"
              style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
            />
          ))}
        </div>
      </div>
      
      {/* Reset Button */}
      <button
        onClick={resetToCyberpunk}
        className="w-full mt-3 py-2 text-xs text-cyber-muted hover:text-cyber-cyan border border-cyber-border hover:border-cyber-cyan/50 rounded transition-colors flex items-center justify-center gap-2"
      >
        <RefreshCw size={12} />
        Reset to Cyberpunk Default
      </button>
    </motion.div>
  );
}

// NFT Detail Modal with Theme/PFP Actions
function NftDetailModal({ 
  nft, 
  onClose, 
  copyAddress, 
  copiedAddress 
}: { 
  nft: NFTAsset; 
  onClose: () => void;
  copyAddress: (addr: string) => void;
  copiedAddress: string | null;
}) {
  const { setProfileImage } = useProfileStore();
  const { 
    previewNft, 
    clearPreview, 
    applyCurrentPreview,
    applyThemeFromNft,
    setProfilePicture,
    previewTheme,
    appliedTheme,
    isExtracting,
    extractionError,
  } = useThemeStore();
  
  const isApplied = useIsNftApplied(nft.tokenId);
  const isPreviewing = useIsNftPreviewing(nft.tokenId);

  const handlePreviewTheme = async () => {
    await previewNft(nft);
  };

  const handleApplyTheme = async () => {
    if (isPreviewing && previewTheme) {
      applyCurrentPreview();
    } else {
      await applyThemeFromNft(nft);
    }
  };

  const handleSetAsPfp = () => {
    if (nft.image) {
      setProfilePicture(nft);
      setProfileImage(nft.image);
    }
  };

  const handleClearPreview = () => {
    clearPreview();
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="cyber-panel cyber-glow w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-cyber text-lg text-cyber-purple">NFT DETAILS</h3>
            {isApplied && (
              <span className="px-2 py-0.5 rounded text-[10px] bg-cyber-green/20 text-cyber-green border border-cyber-green/50">
                APPLIED
              </span>
            )}
            {isPreviewing && !isApplied && (
              <span className="px-2 py-0.5 rounded text-[10px] bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/50 animate-pulse">
                PREVIEWING
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-cyber-purple/10 rounded transition-colors"
          >
            <XIcon size={20} className="text-cyber-muted" />
          </button>
        </div>

        {/* NFT Image */}
        <div className="w-full aspect-square rounded-lg overflow-hidden border border-cyber-purple/30 bg-cyber-darker mb-4 relative">
          {nft.image ? (
            <img 
              src={nft.image} 
              alt={nft.name || 'NFT'} 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon size={48} className="text-cyber-purple/30" />
            </div>
          )}
          {isExtracting && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 size={32} className="animate-spin text-cyber-glow" />
                <span className="text-xs text-cyber-text">Extracting colors...</span>
              </div>
            </div>
          )}
        </div>

        {/* Theme Preview Colors */}
        {isPreviewing && previewTheme && (
          <div className="mb-4 p-3 rounded-lg bg-cyber-darker/50 border border-cyber-glow/30">
            <p className="text-xs text-cyber-muted mb-2 flex items-center gap-1">
              <Palette size={12} />
              Extracted Theme Colors
            </p>
            <div className="flex gap-2">
              {[
                { label: 'Primary', color: previewTheme.colors.primary },
                { label: 'Accent', color: previewTheme.colors.accent },
                { label: 'Surface', color: previewTheme.colors.surface },
                { label: 'Background', color: previewTheme.colors.background },
              ].map(({ label, color }) => (
                <div key={label} className="flex-1 text-center">
                  <div 
                    className="w-full h-8 rounded border border-cyber-border mb-1"
                    style={{ backgroundColor: color }}
                  />
                  <p className="text-[10px] text-cyber-muted">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {extractionError && (
          <div className="mb-4 p-3 rounded-lg bg-cyber-red/10 border border-cyber-red/30">
            <p className="text-xs text-cyber-red">{extractionError}</p>
          </div>
        )}

        {/* Premium Theme Features */}
        {(isPreviewing || !isApplied) && nft.image && (
          <div className="mb-4 p-3 rounded-lg bg-gradient-to-br from-cyber-purple/10 to-cyber-glow/10 border border-cyber-purple/30">
            <p className="text-xs text-cyber-glow font-cyber mb-2 flex items-center gap-2">
              <Sparkles size={14} />
              PREMIUM THEME INCLUDES
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-cyber-muted">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-cyber-glow" />
                Animated glow effects
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-cyber-purple" />
                NFT watermark background
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-cyber-cyan" />
                Floating particles
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-cyber-yellow" />
                Custom color palette
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Preview Theme Button */}
          {isPreviewing ? (
            <button
              onClick={handleClearPreview}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-cyber-yellow/50 text-cyber-yellow hover:bg-cyber-yellow/10 transition-colors text-sm font-cyber"
            >
              <XIcon size={16} />
              Clear Preview
            </button>
          ) : (
            <button
              onClick={handlePreviewTheme}
              disabled={!nft.image || isExtracting}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-cyber-glow/50 text-cyber-glow hover:bg-cyber-glow/10 transition-colors text-sm font-cyber disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Palette size={16} />
              Preview Theme
            </button>
          )}

          {/* Apply Theme Button */}
          <button
            onClick={handleApplyTheme}
            disabled={!nft.image || isExtracting || isApplied}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-cyber transition-colors ${
              isApplied 
                ? 'bg-cyber-green/20 border border-cyber-green/50 text-cyber-green cursor-default'
                : 'bg-gradient-to-r from-cyber-purple/30 to-cyber-glow/30 border border-cyber-purple/50 text-cyber-text hover:border-cyber-glow/70 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {isApplied ? (
              <>
                <Check size={16} />
                Theme Applied
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Apply Premium Theme
              </>
            )}
          </button>
        </div>

        {/* Set as Profile Picture */}
        <button
          onClick={handleSetAsPfp}
          disabled={!nft.image}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-gradient-to-r from-cyber-purple/20 to-cyber-glow/20 border border-cyber-purple/30 text-cyber-text hover:border-cyber-glow/50 transition-colors text-sm font-cyber mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UserCircle size={16} />
          Set as Profile Picture
        </button>

        {/* NFT Info */}
        <div className="space-y-3 pt-3 border-t border-cyber-border">
          <div>
            <p className="text-xs text-cyber-muted">Name</p>
            <p className="text-cyber-text font-cyber">{nft.name || `NFT #${nft.serial}`}</p>
          </div>
          
          {nft.description && (
            <div>
              <p className="text-xs text-cyber-muted">Description</p>
              <p className="text-sm text-cyber-text">{nft.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-cyber-muted">Serial</p>
              <p className="text-sm text-cyber-purple font-cyber">#{nft.serial}</p>
            </div>
            <div>
              <p className="text-xs text-cyber-muted">Taxon</p>
              <p className="text-sm text-cyber-text">{nft.taxon}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-cyber-muted">Issuer</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-cyber-text font-mono">{truncateAddress(nft.issuer)}</p>
              <button 
                onClick={() => copyAddress(nft.issuer)}
                className="p-1 hover:bg-cyber-glow/10 rounded"
              >
                {copiedAddress === nft.issuer ? (
                  <Check size={12} className="text-cyber-green" />
                ) : (
                  <Copy size={12} className="text-cyber-muted" />
                )}
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs text-cyber-muted">Token ID</p>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-cyber-text font-mono break-all">{nft.tokenId}</p>
              <button 
                onClick={() => copyAddress(nft.tokenId)}
                className="p-1 hover:bg-cyber-glow/10 rounded shrink-0"
              >
                {copiedAddress === nft.tokenId ? (
                  <Check size={12} className="text-cyber-green" />
                ) : (
                  <Copy size={12} className="text-cyber-muted" />
                )}
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs text-cyber-muted">Wallet</p>
            <p className="text-sm text-cyber-glow">{nft.walletLabel}</p>
          </div>
        </div>

        {/* View on Explorer */}
        <a
          href={`https://xrpscan.com/nft/${nft.tokenId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full mt-4 py-2 flex items-center justify-center gap-2 rounded border border-cyber-purple/50 text-cyber-purple hover:bg-cyber-purple/10 transition-colors text-sm"
        >
          <ExternalLink size={14} />
          View on XRPScan
        </a>
      </motion.div>
    </motion.div>
  );
}

export default function Character() {
  const { displayName, xHandle, memberSinceYear, githubUrl, linkedinUrl, websiteUrl, setDisplayName, setXHandle, setMemberSinceYear, setGithubUrl, setLinkedinUrl, setWebsiteUrl, profileImage, backgroundStyle, backgroundIntensity, setBackgroundStyle, setBackgroundIntensity } = useProfileStore()
  const { wallets, refreshAllWallets } = useWalletStore()
  const { nfts, memeTokens, isLoading, lastUpdated } = useAssetsStore()

  const [selectedNFT, setSelectedNFT] = useState<NFTAsset | null>(null)
  const [selectedMeme, setSelectedMeme] = useState<MemeToken | null>(null)
  const [activeTab, setActiveTab] = useState<'nfts' | 'memes'>('nfts')
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const location = useLocation()
  const stateSection = (location.state as { section?: 'profile' | 'portfolio' } | null)?.section
  const [section, setSection] = useState<'profile' | 'portfolio'>(stateSection === 'portfolio' ? 'portfolio' : 'profile')

  // Open Portfolio when navigated via /portfolio (redirect sets state.section)
  useEffect(() => {
    if (stateSection === 'portfolio') setSection('portfolio')
  }, [stateSection])

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editName, setEditName] = useState(displayName)
  const [editXHandle, setEditXHandle] = useState(xHandle)
  const [editGithubUrl, setEditGithubUrl] = useState(githubUrl)
  const [editLinkedinUrl, setEditLinkedinUrl] = useState(linkedinUrl)
  const [editWebsiteUrl, setEditWebsiteUrl] = useState(websiteUrl)

  // Sync edit fields when store changes
  useEffect(() => {
    setEditName(displayName)
    setEditXHandle(xHandle)
    setEditGithubUrl(githubUrl)
    setEditLinkedinUrl(linkedinUrl)
    setEditWebsiteUrl(websiteUrl)
  }, [displayName, xHandle, githubUrl, linkedinUrl, websiteUrl])

  const handleSaveProfile = () => {
    setDisplayName(editName)
    setXHandle(editXHandle)
    setGithubUrl(editGithubUrl)
    setLinkedinUrl(editLinkedinUrl)
    setWebsiteUrl(editWebsiteUrl)
    setIsEditingProfile(false)
  }

  const handleCancelEdit = () => {
    setEditName(displayName)
    setEditXHandle(xHandle)
    setEditGithubUrl(githubUrl)
    setEditLinkedinUrl(linkedinUrl)
    setEditWebsiteUrl(websiteUrl)
    setIsEditingProfile(false)
  }

  // Fetch assets on mount and when wallets change (use getState to avoid effect re-running on store updates)
  useEffect(() => {
    if (wallets.length > 0) {
      useAssetsStore.getState().fetchAllAssets()
    }
  }, [wallets.length])

  // Sync wallet data: refresh balances when Character loads so "last updated" and USD stay in sync
  useEffect(() => {
    const realWallets = wallets.filter(w => w.provider !== 'demo')
    if (realWallets.length > 0) {
      refreshAllWallets()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- run once on mount

  // Sync "Member since" from connected wallet when profile has none (fixes "Connect wallet to see history")
  useEffect(() => {
    if (memberSinceYear != null) return
    const withYear = wallets
      .filter((w): w is typeof w & { creationYear: number } => w.provider !== 'demo' && typeof w.creationYear === 'number')
      .sort((a, b) => a.creationYear - b.creationYear)
    if (withYear.length > 0) {
      setMemberSinceYear(withYear[0].creationYear)
    }
  }, [wallets, memberSinceYear, setMemberSinceYear])

  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  return (
    <div className="min-h-screen pt-20 pb-8 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <User className="text-cyber-cyan" size={28} />
            <h1 className="font-cyber text-2xl text-cyber-text tracking-wider">PROFILE</h1>
          </div>
          <p className="text-cyber-muted">Account, portfolio, achievements & community</p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => setSection('profile')}
              className={`px-4 py-2 rounded-lg text-sm font-cyber transition-colors ${
                section === 'profile'
                  ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/50'
                  : 'bg-cyber-darker border border-cyber-border text-cyber-muted hover:text-cyber-text'
              }`}
            >
              <User size={14} className="inline mr-2" />
              Profile
            </button>
            <button
              type="button"
              onClick={() => setSection('portfolio')}
              className={`px-4 py-2 rounded-lg text-sm font-cyber transition-colors ${
                section === 'portfolio'
                  ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/50'
                  : 'bg-cyber-darker border border-cyber-border text-cyber-muted hover:text-cyber-text'
              }`}
            >
              <PieChartIcon size={14} className="inline mr-2" />
              Portfolio
            </button>
          </div>
        </motion.div>

        {section === 'portfolio' ? (
          <PortfolioContent />
        ) : (
        /* Main Grid - Profile */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Profile Card */}
          <motion.div 
            className="lg:col-span-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="cyber-panel p-4 cyber-glow">
              {/* Profile Header */}
              <div className="flex items-center justify-end mb-2">
                {!isEditingProfile ? (
                  <button 
                    onClick={() => setIsEditingProfile(true)}
                    className="p-1 hover:bg-cyber-glow/10 rounded transition-colors"
                    title="Edit profile"
                  >
                    <Edit2 size={14} className="text-cyber-muted hover:text-cyber-glow" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={handleSaveProfile}
                      className="p-1 hover:bg-cyber-green/10 rounded transition-colors"
                      title="Save"
                    >
                      <Check size={14} className="text-cyber-green" />
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      className="p-1 hover:bg-cyber-red/10 rounded transition-colors"
                      title="Cancel"
                    >
                      <XIcon size={14} className="text-cyber-red" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="text-center mb-4">
                <div className="relative w-24 h-24 mx-auto mb-3">
                  {/* Profile Picture with Upload */}
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-cyber-glow via-cyber-purple to-cyber-cyan p-1">
                    <ProfilePictureUpload size="md" className="!w-full !h-full !max-w-none !rounded-full" />
                  </div>
                </div>
                
                {isEditingProfile ? (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-cyber-muted block mb-1">Display Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Your name"
                        className="w-full bg-cyber-darker border border-cyber-border rounded px-3 py-1.5 text-sm text-cyber-text text-center placeholder:text-cyber-muted/50 focus:border-cyber-glow focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-cyber-muted block mb-1">X Handle</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted text-sm">@</span>
                        <input
                          type="text"
                          value={editXHandle}
                          onChange={(e) => setEditXHandle(e.target.value.replace(/^@/, ''))}
                          placeholder="username"
                          className="w-full bg-cyber-darker border border-cyber-border rounded pl-7 pr-3 py-1.5 text-sm text-cyber-text text-center placeholder:text-cyber-muted/50 focus:border-cyber-glow focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-cyber-muted block mb-1">GitHub URL</label>
                      <input
                        type="url"
                        value={editGithubUrl}
                        onChange={(e) => setEditGithubUrl(e.target.value)}
                        placeholder="https://github.com/username"
                        className="w-full bg-cyber-darker border border-cyber-border rounded px-3 py-1.5 text-sm text-cyber-text text-center placeholder:text-cyber-muted/50 focus:border-cyber-glow focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-cyber-muted block mb-1">LinkedIn URL</label>
                      <input
                        type="url"
                        value={editLinkedinUrl}
                        onChange={(e) => setEditLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/username"
                        className="w-full bg-cyber-darker border border-cyber-border rounded px-3 py-1.5 text-sm text-cyber-text text-center placeholder:text-cyber-muted/50 focus:border-cyber-glow focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-cyber-muted block mb-1">Website URL</label>
                      <input
                        type="url"
                        value={editWebsiteUrl}
                        onChange={(e) => setEditWebsiteUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-cyber-darker border border-cyber-border rounded px-3 py-1.5 text-sm text-cyber-text text-center placeholder:text-cyber-muted/50 focus:border-cyber-glow focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="font-cyber text-lg text-cyber-text">
                      {displayName || 'Set Your Name'}
                    </h2>
                    {xHandle && (
                      <a 
                        href={`https://x.com/${xHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-cyber-blue hover:text-cyber-glow transition-colors"
                      >
                        @{xHandle}
                      </a>
                    )}
                    <p className="text-xs text-cyber-muted mt-1">
                      {memberSinceYear ? `Member since ${memberSinceYear}` : 'Connect wallet to see history'}
                    </p>
                  </>
                )}
              </div>

              {/* Background — only visible inside Edit (pencil) */}
              {isEditingProfile && (
                <div className="mb-4 p-3 rounded bg-cyber-darker/50 border border-cyber-border/50 space-y-2">
                  <p className="text-[10px] text-cyber-muted uppercase tracking-wider font-cyber">Background</p>
                  <select
                    value={backgroundStyle}
                    onChange={(e) => setBackgroundStyle(e.target.value as BackgroundStyle)}
                    className="w-full bg-cyber-darker border border-cyber-border rounded px-3 py-1.5 text-xs text-cyber-text focus:border-cyber-glow focus:outline-none"
                  >
                    <option value="auto">Auto (profile colors when custom pic)</option>
                    <option value="gradient">Gradient orbs</option>
                    <option value="mesh">Mesh gradient</option>
                    <option value="bubbles">Bubbles</option>
                    <option value="generated">Generated (image + palette)</option>
                    <option value="cyber">Cyber default</option>
                  </select>
                  <div>
                    <div className="flex justify-between text-[10px] text-cyber-muted mb-0.5">
                      <span>Intensity</span>
                      <span>{Math.round(backgroundIntensity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="1"
                      step="0.1"
                      value={backgroundIntensity}
                      onChange={(e) => setBackgroundIntensity(parseFloat(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none bg-cyber-border accent-cyber-glow"
                    />
                  </div>
                  {profileImage && profileImage !== '/profile-default.png' && !profileImage.startsWith('/profile-default.png') && (
                    <div className="pt-2 border-t border-cyber-border/50">
                      <p className="text-[10px] text-cyber-muted uppercase tracking-wider font-cyber mb-2">Generated preview</p>
                      <BackgroundPreview
                        imageUrl={profileImage}
                        onUseAsBackground={() => setBackgroundStyle('generated')}
                        isActive={backgroundStyle === 'generated'}
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* Social Links — GitHub, Twitter (X), LinkedIn, Website */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {githubUrl && (
                  <a href={githubUrl.startsWith('http') ? githubUrl : `https://github.com/${githubUrl}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded bg-cyber-darker border border-cyber-border hover:border-cyber-glow/50 text-cyber-text hover:text-cyber-glow transition-colors" title="GitHub">
                    <Github size={18} />
                  </a>
                )}
                {xHandle && (
                  <a href={`https://x.com/${xHandle}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded bg-cyber-darker border border-cyber-border hover:border-cyber-glow/50 text-cyber-text hover:text-cyber-blue transition-colors" title="X (Twitter)">
                    <Twitter size={18} />
                  </a>
                )}
                {linkedinUrl && (
                  <a href={linkedinUrl.startsWith('http') ? linkedinUrl : `https://linkedin.com/in/${linkedinUrl}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded bg-cyber-darker border border-cyber-border hover:border-cyber-glow/50 text-cyber-text hover:text-cyber-cyan transition-colors" title="LinkedIn">
                    <Linkedin size={18} />
                  </a>
                )}
                {websiteUrl && (
                  <a href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded bg-cyber-darker border border-cyber-border hover:border-cyber-glow/50 text-cyber-text hover:text-cyber-purple transition-colors" title="Website">
                    <Globe size={18} />
                  </a>
                )}
              </div>
            </div>
            
            {/* Wallet Connect Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4"
            >
              <WalletConnect />
            </motion.div>
            
            {/* Premium Theme Badge - Shows when custom theme is active */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4"
            >
              <ThemeBadge />
            </motion.div>
            
          </motion.div>
          
          {/* Center Column - Ledger Impact (top) + Nav boxes + Profile/Portfolio section boxes */}
          <motion.div 
            className="lg:col-span-6 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* 1) Ledger Impact - main top box */}
            <div className="cyber-panel p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-cyber text-xl tracking-wider">
                  <span className="text-cyber-text">LEDGER</span>
                  <span className="text-cyber-glow ml-2">IMPACT</span>
                  <span className="text-cyber-muted ml-2">ANALYZER</span>
                </h2>
                <Zap size={16} className="text-cyber-glow" />
              </div>
              <LedgerImpactTool />
            </div>

            {/* 2) Nav boxes: Network, Terminal, Learn, Regulation, Trending */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { path: '/network', title: 'Network', subtitle: 'Topology', icon: Globe, gradient: 'from-cyber-glow/20 to-cyber-blue/10' },
                { path: '/terminal', title: 'Terminal', subtitle: 'Activity', icon: Activity, gradient: 'from-cyber-cyan/20 to-cyber-glow/10' },
                { path: '/learn', title: 'Learn', subtitle: 'Micropayments', icon: BookOpen, gradient: 'from-cyan-500/20 to-teal-500/10' },
                { path: '/underworld', title: 'Regulation', subtitle: 'Intel', icon: Skull, gradient: 'from-cyber-purple/20 to-cyber-magenta/10' },
                { path: '/memetic-lab', title: 'Trending', subtitle: 'Memetic Lab', icon: Brain, gradient: 'from-cyber-yellow/20 to-cyber-orange/10' },
              ].map((card) => {
                const Icon = card.icon
                return (
                  <Link
                    key={card.path}
                    to={card.path}
                    className={`rounded-lg border border-cyber-border bg-gradient-to-br ${card.gradient} p-4 hover:border-cyber-cyan/50 transition-colors block`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={18} className="text-cyber-cyan" />
                      <span className="font-cyber text-sm text-cyber-text">{card.title}</span>
                    </div>
                    <p className="text-[10px] text-cyber-muted">{card.subtitle}</p>
                    <ChevronRight size={14} className="text-cyber-muted mt-2" />
                  </Link>
                )
              })}
            </div>

            {/* Strategy status: which strategies on, exposure, PnL (sim) — link to Terminal */}
            <StrategyStatusCard />

            {/* ILP / operator settlement layer (demo; see Network page ILP lens for full view) */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-cyber text-xs text-cyber-muted uppercase tracking-wider">ILP control room (demo)</h3>
                <Link
                  to="/network"
                  className="text-[10px] text-cyber-cyan hover:underline"
                >
                  Open Network → ILP lens
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SettlementQueueWidget useDemoData />
                <CorridorExposurePanel viewMode="flow" compact />
              </div>
            </div>

            {/* 3) Profile & Portfolio section boxes (switch to that tab) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSection('profile')}
                className={`cyber-panel p-6 text-left rounded-lg border-2 transition-all hover:border-cyber-cyan/60 group ${
                  section === 'profile'
                    ? 'border-cyber-cyan/50 bg-cyber-cyan/10'
                    : 'border-cyber-border hover:bg-cyber-darker/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${section === 'profile' ? 'bg-cyber-cyan/20' : 'bg-cyber-darker border border-cyber-border'} group-hover:border-cyber-cyan/50`}>
                    <User size={24} className={section === 'profile' ? 'text-cyber-cyan' : 'text-cyber-muted group-hover:text-cyber-cyan'} />
                  </div>
                  <div>
                    <h3 className="font-cyber text-lg text-cyber-text">Profile</h3>
                    <p className="text-xs text-cyber-muted">Account, stats, wallet & theme</p>
                  </div>
                  <ChevronRight size={20} className={`ml-auto ${section === 'profile' ? 'text-cyber-cyan' : 'text-cyber-muted group-hover:text-cyber-cyan'}`} />
                </div>
                <p className="text-sm text-cyber-muted">View your digital profile, reputation, and connected wallet.</p>
              </button>

              <button
                type="button"
                onClick={() => setSection('portfolio')}
                className={`cyber-panel p-6 text-left rounded-lg border-2 transition-all hover:border-cyber-glow/60 group ${
                  (section as 'profile' | 'portfolio') === 'portfolio'
                    ? 'border-cyber-glow/50 bg-cyber-glow/10'
                    : 'border-cyber-border hover:bg-cyber-darker/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${(section as 'profile' | 'portfolio') === 'portfolio' ? 'bg-cyber-glow/20' : 'bg-cyber-darker border border-cyber-border'} group-hover:border-cyber-glow/50`}>
                    <PieChartIcon size={24} className={(section as 'profile' | 'portfolio') === 'portfolio' ? 'text-cyber-glow' : 'text-cyber-muted group-hover:text-cyber-glow'} />
                  </div>
                  <div>
                    <h3 className="font-cyber text-lg text-cyber-text">Portfolio</h3>
                    <p className="text-xs text-cyber-muted">RLUSD, ETF, health & holdings</p>
                  </div>
                  <ChevronRight size={20} className={`ml-auto ${(section as 'profile' | 'portfolio') === 'portfolio' ? 'text-cyber-glow' : 'text-cyber-muted group-hover:text-cyber-glow'}`} />
                </div>
                <p className="text-sm text-cyber-muted">Track positions, RLUSD, ETF exposure, and portfolio health.</p>
              </button>
            </div>

            {/* NFTs & Memes – choose for profile / theme, viewer gallery */}
            <div className="cyber-panel p-4 cyber-glow">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-cyber-border">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('nfts')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-cyber transition-all ${
                      activeTab === 'nfts'
                        ? 'bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/50'
                        : 'text-cyber-muted hover:text-cyber-text border border-transparent'
                    }`}
                  >
                    <ImageIcon size={16} />
                    <span>NFTs</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      activeTab === 'nfts' ? 'bg-cyber-purple/30 text-cyber-purple' : 'bg-cyber-darker text-cyber-muted'
                    }`}>
                      {nfts.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('memes')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-cyber transition-all ${
                      activeTab === 'memes'
                        ? 'bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/50'
                        : 'text-cyber-muted hover:text-cyber-text border border-transparent'
                    }`}
                  >
                    <Coins size={16} />
                    <span>Memes</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      activeTab === 'memes' ? 'bg-cyber-yellow/30 text-cyber-yellow' : 'bg-cyber-darker text-cyber-muted'
                    }`}>
                      {memeTokens.length}
                    </span>
                  </button>
                </div>
                <button
                  onClick={() => useAssetsStore.getState().fetchAllAssets()}
                  disabled={isLoading}
                  className="p-2 hover:bg-cyber-glow/10 rounded-lg transition-colors border border-cyber-border hover:border-cyber-glow/50"
                  title="Refresh"
                >
                  <RefreshCw size={16} className={`text-cyber-muted ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <p className="text-[10px] text-cyber-muted mb-3">Tap an NFT to view and set as profile picture or theme.</p>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={32} className="animate-spin text-cyber-glow" />
                </div>
              ) : wallets.filter(w => w.provider !== 'demo').length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon size={48} className="mx-auto text-cyber-muted/50 mb-3" />
                  <p className="text-cyber-muted">Connect a wallet to see your collection</p>
                </div>
              ) : activeTab === 'nfts' ? (
                <>
                  <div className="max-h-[320px] overflow-y-auto custom-scrollbar pr-2">
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                      {nfts.length === 0 ? (
                        <div className="col-span-full text-center py-8">
                          <ImageIcon size={40} className="mx-auto text-cyber-muted/30 mb-2" />
                          <p className="text-sm text-cyber-muted">No NFTs in this wallet</p>
                        </div>
                      ) : (
                        nfts.map((nft, idx) => (
                          <motion.div
                            key={nft.tokenId}
                            onClick={() => setSelectedNFT(nft)}
                            className="aspect-square rounded-lg border-2 border-cyber-purple/30 bg-cyber-darker/50 cursor-pointer overflow-hidden hover:border-cyber-purple hover:shadow-lg hover:shadow-cyber-purple/20 transition-all group"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: Math.min(idx * 0.02, 0.4) }}
                            whileHover={{ scale: 1.05, y: -2 }}
                          >
                            {nft.isLoading ? (
                              <div className="w-full h-full flex items-center justify-center">
                                <Loader2 size={20} className="animate-spin text-cyber-purple/50" />
                              </div>
                            ) : nft.image ? (
                              <div className="relative w-full h-full">
                                <img
                                  src={nft.image}
                                  alt={nft.name || 'NFT'}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-cyber-darker/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                  <p className="text-[10px] text-cyber-text truncate w-full">{nft.name || `#${nft.serial}`}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-2">
                                <ImageIcon size={20} className="text-cyber-purple/50 mb-1" />
                                <span className="text-[9px] text-cyber-muted text-center">#{nft.serial}</span>
                              </div>
                            )}
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                  {lastUpdated && (
                    <p className="text-[10px] text-cyber-muted/50 mt-3 text-center">Updated {new Date(lastUpdated).toLocaleTimeString()}</p>
                  )}
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[320px] overflow-y-auto custom-scrollbar pr-2">
                    {memeTokens.length === 0 ? (
                      <div className="col-span-full text-center py-8">
                        <Coins size={40} className="mx-auto text-cyber-muted/30 mb-2" />
                        <p className="text-sm text-cyber-muted">No meme tokens found</p>
                      </div>
                    ) : (
                      memeTokens.map((token, idx) => (
                        <motion.div
                          key={`${token.currency}-${token.issuer}-${idx}`}
                          onClick={() => setSelectedMeme(token)}
                          className="p-4 rounded-lg border border-cyber-border/50 bg-cyber-darker/50 cursor-pointer hover:border-cyber-yellow/50 hover:shadow-lg hover:shadow-cyber-yellow/10 transition-all"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          whileHover={{ y: -2 }}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                              style={{ backgroundColor: `${token.color}20` }}
                            >
                              {token.icon || '🪙'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-cyber-text font-cyber truncate">{token.displayName}</p>
                              <p className="text-[10px] text-cyber-muted truncate">{token.symbol}</p>
                            </div>
                          </div>
                          <p className="text-lg font-cyber" style={{ color: token.color }}>
                            {token.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </p>
                        </motion.div>
                      ))
                    )}
                  </div>
                  {lastUpdated && (
                    <p className="text-[10px] text-cyber-muted/50 mt-3 text-center">Updated {new Date(lastUpdated).toLocaleTimeString()}</p>
                  )}
                </>
              )}
            </div>
          </motion.div>
          
          {/* Right Column - Events & Resources */}
          <motion.div 
            className="lg:col-span-3 space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Upcoming Events */}
            <div className="cyber-panel p-4">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                <Calendar size={16} className="text-cyber-green" />
                <span className="font-cyber text-sm text-cyber-green">UPCOMING EVENTS</span>
              </div>
              
              <div className="space-y-3">
                {(() => {
                  const upcoming = getUpcomingEvents()
                  if (upcoming.length === 0) {
                    return (
                      <p className="text-sm text-cyber-muted p-3 rounded bg-cyber-darker/50 border border-cyber-border/50">
                        No upcoming events right now. Check <a href="https://ripple.com/events/all/" target="_blank" rel="noopener noreferrer" className="text-cyber-glow hover:underline">ripple.com/events/all/</a> for the latest.
                      </p>
                    )
                  }
                  return upcoming.map((event, idx) => {
                    const typeColors: Record<string, string> = {
                      conference: 'border-cyber-glow/50 text-cyber-glow',
                      summit: 'border-cyber-cyan/50 text-cyber-cyan',
                      hackathon: 'border-cyber-purple/50 text-cyber-purple',
                      ama: 'border-cyber-yellow/50 text-cyber-yellow',
                      workshop: 'border-cyber-green/50 text-cyber-green'
                    }
                    
                    return (
                      <motion.a
                        key={event.title}
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 rounded bg-cyber-darker/50 border border-cyber-border/50 hover:border-cyber-glow/30 transition-colors cursor-pointer"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + idx * 0.1 }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-cyber-muted">{event.date}</span>
                          <span className={`text-xs px-2 py-0.5 rounded border ${typeColors[event.type] ?? 'border-cyber-border text-cyber-muted'}`}>
                            {event.type}
                          </span>
                        </div>
                        <p className="text-sm text-cyber-text">{event.title}</p>
                      </motion.a>
                    )
                  })
                })()}
              </div>
            </div>
          </motion.div>
        </div>
        )}
      </div>

      {/* NFT Detail Modal - Enhanced with Theme/PFP Actions */}
      <AnimatePresence>
        {selectedNFT && (
          <NftDetailModal 
            nft={selectedNFT} 
            onClose={() => setSelectedNFT(null)}
            copyAddress={copyAddress}
            copiedAddress={copiedAddress}
          />
        )}
      </AnimatePresence>

      {/* Meme Token Detail Modal */}
      <AnimatePresence>
        {selectedMeme && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMeme(null)}
          >
            <motion.div
              className="cyber-panel cyber-glow w-full max-w-md p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-cyber text-lg text-cyber-yellow">MEME TOKEN</h3>
                <button 
                  onClick={() => setSelectedMeme(null)}
                  className="p-2 hover:bg-cyber-yellow/10 rounded transition-colors"
                >
                  <XIcon size={20} className="text-cyber-muted" />
                </button>
              </div>

              {/* Token Icon & Balance */}
              <div className="text-center mb-6">
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto mb-4"
                  style={{ backgroundColor: `${selectedMeme.color}20` }}
                >
                  {selectedMeme.icon || '🪙'}
                </div>
                <h2 className="font-cyber text-2xl text-cyber-text">{selectedMeme.displayName}</h2>
                <p className="text-cyber-muted text-sm">{selectedMeme.symbol}</p>
              </div>

              {/* Balance */}
              <div className="p-4 rounded-lg bg-cyber-darker/50 border border-cyber-border mb-4">
                <p className="text-xs text-cyber-muted mb-1">Your Balance</p>
                <p className="font-cyber text-3xl" style={{ color: selectedMeme.color }}>
                  {selectedMeme.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                </p>
                <p className="text-sm text-cyber-muted">{selectedMeme.symbol}</p>
              </div>

              {/* Token Info */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-cyber-muted">Currency Code</p>
                  <p className="text-sm text-cyber-text font-mono">{selectedMeme.currency}</p>
                </div>

                <div>
                  <p className="text-xs text-cyber-muted">Issuer</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-cyber-text font-mono">{truncateAddress(selectedMeme.issuer)}</p>
                    <button 
                      onClick={() => copyAddress(selectedMeme.issuer)}
                      className="p-1 hover:bg-cyber-glow/10 rounded"
                    >
                      {copiedAddress === selectedMeme.issuer ? (
                        <Check size={12} className="text-cyber-green" />
                      ) : (
                        <Copy size={12} className="text-cyber-muted" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-cyber-muted">Wallet</p>
                  <p className="text-sm text-cyber-glow">{selectedMeme.walletLabel}</p>
                </div>
              </div>

              {/* View on Explorer */}
              <a
                href={`https://xrpscan.com/account/${selectedMeme.walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-4 py-2 flex items-center justify-center gap-2 rounded border border-cyber-yellow/50 text-cyber-yellow hover:bg-cyber-yellow/10 transition-colors text-sm"
              >
                <ExternalLink size={14} />
                View Wallet on XRPScan
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
