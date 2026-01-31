import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, Star, Trophy, Zap, Github, Twitter, Globe, 
  ChevronRight, Code, GitBranch, Users,
  Calendar, MessageSquare, Heart, ExternalLink,
  Image as ImageIcon, Loader2, X as XIcon, RefreshCw, Coins, Copy, Check, Edit2,
  Palette, Sparkles, UserCircle
} from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { ProfilePictureUpload } from '../components/ProfilePictureUpload'
import { WalletConnect } from '../components/WalletConnect'
import { useProfileStore } from '../store/profileStore'
import { useWalletStore } from '../store/walletStore'
import { useAssetsStore } from '../store/assetsStore'
import { useThemeStore, useIsNftApplied, useIsNftPreviewing } from '../store/themeStore'
import type { NFTAsset, MemeToken } from '../store/assetsStore'

const contributors = [
  {
    name: 'David Schwartz',
    role: 'CTO, Ripple',
    avatar: 'DS',
    commits: 2847,
    repos: 12,
    followers: '125K',
    color: 'cyber-glow'
  },
  {
    name: 'Wietse Wind',
    role: 'Founder, XRPL Labs',
    avatar: 'WW',
    commits: 1923,
    repos: 45,
    followers: '89K',
    color: 'cyber-purple'
  },
  {
    name: 'Nik Bougalis',
    role: 'Senior Staff Engineer',
    avatar: 'NB',
    commits: 1654,
    repos: 8,
    followers: '45K',
    color: 'cyber-cyan'
  },
  {
    name: 'Scott Chamberlain',
    role: 'Developer Advocate',
    avatar: 'SC',
    commits: 892,
    repos: 23,
    followers: '32K',
    color: 'cyber-green'
  },
  {
    name: 'Denis Angell',
    role: 'Core Developer',
    avatar: 'DA',
    commits: 756,
    repos: 15,
    followers: '18K',
    color: 'cyber-yellow'
  },
  {
    name: 'Richard Holland',
    role: 'Hooks Developer',
    avatar: 'RH',
    commits: 634,
    repos: 11,
    followers: '28K',
    color: 'cyber-orange'
  },
]

const activityData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  commits: Math.floor(Math.random() * 15) + 2,
  prs: Math.floor(Math.random() * 5)
}))

const communityEvents = [
  { date: 'Jan 25', title: 'XRPL Developer Summit', type: 'conference' },
  { date: 'Feb 10', title: 'Hooks Hackathon', type: 'hackathon' },
  { date: 'Feb 20', title: 'Community AMA', type: 'ama' },
  { date: 'Mar 5', title: 'Validator Workshop', type: 'workshop' },
]

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
  const { displayName, xHandle, memberSinceYear, reputation, socialScore, skillPoints, level, xp, setDisplayName, setXHandle } = useProfileStore()
  const { wallets } = useWalletStore()
  const { nfts, memeTokens, isLoading, fetchAllAssets, lastUpdated } = useAssetsStore()
  const nextLevel = 10000

  const [selectedNFT, setSelectedNFT] = useState<NFTAsset | null>(null)
  const [selectedMeme, setSelectedMeme] = useState<MemeToken | null>(null)
  const [activeTab, setActiveTab] = useState<'nfts' | 'memes'>('nfts')
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  
  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editName, setEditName] = useState(displayName)
  const [editXHandle, setEditXHandle] = useState(xHandle)

  // Sync edit fields when store changes
  useEffect(() => {
    setEditName(displayName)
    setEditXHandle(xHandle)
  }, [displayName, xHandle])

  const handleSaveProfile = () => {
    setDisplayName(editName)
    setXHandle(editXHandle)
    setIsEditingProfile(false)
  }

  const handleCancelEdit = () => {
    setEditName(displayName)
    setEditXHandle(xHandle)
    setIsEditingProfile(false)
  }

  // Fetch assets on mount and when wallets change
  useEffect(() => {
    if (wallets.length > 0) {
      fetchAllAssets()
    }
  }, [wallets.length, fetchAllAssets])

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
            <h1 className="font-cyber text-2xl text-cyber-text tracking-wider">CHARACTER</h1>
          </div>
          <p className="text-cyber-muted">Digital Profile & Community Hub</p>
        </motion.div>
        
        {/* Main Grid */}
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
                  {/* Level Badge */}
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-cyber-purple flex items-center justify-center border-2 border-cyber-darker">
                    <span className="font-cyber text-xs text-white">{level}</span>
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
              
              {/* XP Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-cyber-muted">Level {level}</span>
                  <span className="text-cyber-glow">{xp.toLocaleString()} / {nextLevel.toLocaleString()} XP</span>
                </div>
                <div className="cyber-progress h-2">
                  <motion.div 
                    className="cyber-progress-bar"
                    initial={{ width: 0 }}
                    animate={{ width: `${(xp / nextLevel) * 100}%` }}
                    transition={{ delay: 0.3, duration: 1 }}
                  />
                </div>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { label: 'Reputation', value: reputation, icon: Star, color: 'cyber-yellow' },
                  { label: 'Social Score', value: socialScore, icon: Heart, color: 'cyber-red' },
                  { label: 'Skill Points', value: skillPoints, icon: Zap, color: 'cyber-glow' },
                  { label: 'Rank', value: '#247', icon: Trophy, color: 'cyber-purple' },
                ].map((stat) => (
                  <div key={stat.label} className="p-3 rounded bg-cyber-darker/50 border border-cyber-border/50 text-center">
                    <stat.icon size={16} className={`text-${stat.color} mx-auto mb-1`} />
                    <p className="font-cyber text-lg text-cyber-text">{stat.value}</p>
                    <p className="text-xs text-cyber-muted">{stat.label}</p>
                  </div>
                ))}
              </div>
              
              {/* Social Links */}
              <div className="flex items-center justify-center gap-3">
                {[
                  { icon: Github, color: 'text-cyber-text hover:text-cyber-glow' },
                  { icon: Twitter, color: 'text-cyber-text hover:text-cyber-blue' },
                  { icon: Globe, color: 'text-cyber-text hover:text-cyber-purple' },
                ].map((link, idx) => (
                  <button key={idx} className={`p-2 rounded bg-cyber-darker border border-cyber-border hover:border-cyber-glow/50 transition-colors ${link.color}`}>
                    <link.icon size={18} />
                  </button>
                ))}
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
          
          {/* Center Column - NFTs/Memes (LARGE) + Contributors Grid (BELOW) */}
          <motion.div 
            className="lg:col-span-6 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* NFTs & Memes Collection - LARGE CENTER DISPLAY */}
            <div className="cyber-panel p-4 cyber-glow">
              {/* Header with Tabs */}
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
                  onClick={() => fetchAllAssets()}
                  disabled={isLoading}
                  className="p-2 hover:bg-cyber-glow/10 rounded-lg transition-colors border border-cyber-border hover:border-cyber-glow/50"
                  title="Refresh"
                >
                  <RefreshCw size={16} className={`text-cyber-muted ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              {/* Content */}
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={32} className="animate-spin text-cyber-glow" />
                </div>
              ) : wallets.filter(w => w.provider !== 'demo').length === 0 ? (
                <div className="text-center py-16">
                  <ImageIcon size={48} className="mx-auto text-cyber-muted/50 mb-3" />
                  <p className="text-cyber-muted">Connect a wallet to see your collection</p>
                </div>
              ) : activeTab === 'nfts' ? (
                <>
                  {/* NFT Grid - Scrollable to show ALL NFTs */}
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                      {nfts.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                          <ImageIcon size={40} className="mx-auto text-cyber-muted/30 mb-2" />
                          <p className="text-sm text-cyber-muted">No NFTs found</p>
                        </div>
                      ) : (
                        nfts.map((nft, idx) => (
                          <motion.div
                            key={nft.tokenId}
                            onClick={() => setSelectedNFT(nft)}
                            className="aspect-square rounded-lg border-2 border-cyber-purple/30 bg-cyber-darker/50 cursor-pointer overflow-hidden hover:border-cyber-purple hover:shadow-lg hover:shadow-cyber-purple/20 transition-all group"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: Math.min(idx * 0.02, 0.5) }}
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
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none'
                                  }}
                                />
                                {/* Hover overlay with name */}
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
                    <p className="text-[10px] text-cyber-muted/50 mt-4 text-center">
                      Updated {new Date(lastUpdated).toLocaleTimeString()}
                    </p>
                  )}
                </>
              ) : (
                <>
                  {/* Meme Tokens Grid - LARGER */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {memeTokens.length === 0 ? (
                      <div className="col-span-full text-center py-12">
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
                          <div className="flex items-center gap-3 mb-3">
                            <div 
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                              style={{ backgroundColor: `${token.color}20` }}
                            >
                              {token.icon || '🪙'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-cyber-text font-cyber truncate">{token.displayName}</p>
                              <p className="text-[10px] text-cyber-muted truncate">{token.symbol}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-cyber" style={{ color: token.color }}>
                              {token.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-[10px] text-cyber-muted">from {token.walletLabel}</p>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                  
                  {lastUpdated && (
                    <p className="text-[10px] text-cyber-muted/50 mt-4 text-center">
                      Updated {new Date(lastUpdated).toLocaleTimeString()}
                    </p>
                  )}
                </>
              )}
            </div>
            
            {/* Top Contributors - NOW BELOW NFTs/Memes */}
            <div className="cyber-panel p-4">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-cyber-border">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-cyber-purple" />
                  <span className="font-cyber text-sm text-cyber-purple">TOP CONTRIBUTORS</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 text-xs rounded bg-cyber-glow/20 text-cyber-glow border border-cyber-glow/30">All Time</button>
                  <button className="px-3 py-1 text-xs rounded bg-cyber-darker text-cyber-muted border border-cyber-border hover:border-cyber-glow/30">This Month</button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {contributors.map((contributor, idx) => (
                  <motion.div
                    key={contributor.name}
                    className={`p-4 rounded-lg bg-cyber-darker/50 border border-cyber-border/50 hover:border-${contributor.color}/50 transition-all cursor-pointer group`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-${contributor.color}/30 to-${contributor.color}/10 border border-${contributor.color}/50 flex items-center justify-center shrink-0`}>
                        <span className={`font-cyber text-sm text-${contributor.color}`}>{contributor.avatar}</span>
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-cyber text-sm text-cyber-text truncate">{contributor.name}</h3>
                          <ExternalLink size={12} className="text-cyber-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                        <p className="text-xs text-cyber-muted mb-2">{contributor.role}</p>
                        
                        {/* Stats */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <GitBranch size={12} className="text-cyber-green" />
                            <span className="text-xs text-cyber-text">{contributor.commits}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Code size={12} className="text-cyber-purple" />
                            <span className="text-xs text-cyber-text">{contributor.repos}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users size={12} className="text-cyber-glow" />
                            <span className="text-xs text-cyber-text">{contributor.followers}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Activity Chart */}
              <div className="mt-6 pt-4 border-t border-cyber-border">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-cyber text-sm text-cyber-glow">COMMUNITY ACTIVITY</span>
                  <span className="text-xs text-cyber-muted">Last 30 days</span>
                </div>
                <div className="h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityData}>
                      <defs>
                        <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="commits" 
                        stroke="#a855f7" 
                        fill="url(#activityGradient)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
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
                {communityEvents.map((event, idx) => {
                  const typeColors = {
                    conference: 'border-cyber-glow/50 text-cyber-glow',
                    hackathon: 'border-cyber-purple/50 text-cyber-purple',
                    ama: 'border-cyber-yellow/50 text-cyber-yellow',
                    workshop: 'border-cyber-green/50 text-cyber-green'
                  }
                  
                  return (
                    <motion.div
                      key={event.title}
                      className="p-3 rounded bg-cyber-darker/50 border border-cyber-border/50 hover:border-cyber-glow/30 transition-colors cursor-pointer"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + idx * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-cyber-muted">{event.date}</span>
                        <span className={`text-xs px-2 py-0.5 rounded border ${typeColors[event.type as keyof typeof typeColors]}`}>
                          {event.type}
                        </span>
                      </div>
                      <p className="text-sm text-cyber-text">{event.title}</p>
                    </motion.div>
                  )
                })}
              </div>
            </div>
            
            {/* Community Links */}
            <div className="cyber-panel p-4">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                <MessageSquare size={16} className="text-cyber-cyan" />
                <span className="font-cyber text-sm text-cyber-cyan">COMMUNITY</span>
              </div>
              
              <div className="space-y-2">
                {[
                  { name: 'r/XRP', icon: MessageSquare, members: '1.2M', color: 'cyber-orange' },
                  { name: 'Discord', icon: Users, members: '85K', color: 'cyber-purple' },
                  { name: 'XRPL Commons', icon: Globe, members: '12K', color: 'cyber-green' },
                  { name: 'Dev Forum', icon: Code, members: '8K', color: 'cyber-glow' },
                ].map((community) => (
                  <button
                    key={community.name}
                    className="w-full flex items-center gap-3 p-3 rounded bg-cyber-darker/50 border border-cyber-border hover:border-cyber-glow/30 transition-all group"
                  >
                    <community.icon size={16} className={`text-${community.color}`} />
                    <span className="text-sm text-cyber-text flex-1 text-left">{community.name}</span>
                    <span className="text-xs text-cyber-muted">{community.members}</span>
                    <ChevronRight size={14} className="text-cyber-muted group-hover:text-cyber-glow transition-colors" />
                  </button>
                ))}
              </div>
            </div>
            
            {/* Milestones */}
            <div className="cyber-panel p-4">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                <Trophy size={16} className="text-cyber-yellow" />
                <span className="font-cyber text-sm text-cyber-yellow">MILESTONES</span>
              </div>
              
              <div className="space-y-3">
                {[
                  { label: '10 Years of XRPL', progress: 100 },
                  { label: '100M Accounts', progress: 87 },
                  { label: '1B Transactions', progress: 92 },
                ].map((milestone) => (
                  <div key={milestone.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-cyber-text">{milestone.label}</span>
                      <span className="text-cyber-yellow">{milestone.progress}%</span>
                    </div>
                    <div className="cyber-progress h-1.5">
                      <div 
                        className="cyber-progress-bar bg-cyber-yellow"
                        style={{ width: `${milestone.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
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
