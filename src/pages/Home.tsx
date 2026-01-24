import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  Globe, Skull, User, HeartPulse, Zap, TrendingUp, TrendingDown, 
  Activity, Wallet, Database, ArrowRight, Star, Trophy, Coins,
  Image as ImageIcon, ChevronRight, Github, Twitter, Edit2, Check, X,
  Users, FileText
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { ProfilePictureUpload } from '../components/ProfilePictureUpload'
import { WalletConnect } from '../components/WalletConnect'
import { LedgerImpactTool } from '../components/LedgerImpactTool'
import { PathfindingTool } from '../components/PathfindingTool'
import { PaperTradingPanel } from '../components/PaperTradingPanel'
import { useProfileStore } from '../store/profileStore'
import { useWalletStore } from '../store/walletStore'
import { useAssetsStore } from '../store/assetsStore'

const pageCards = [
  {
    path: '/world',
    title: 'World Map',
    subtitle: 'Global Network',
    icon: Globe,
    color: 'cyber-glow',
    gradient: 'from-cyber-glow/20 to-cyber-blue/10',
    description: 'Explore XRPL nodes, validators, and global adoption metrics',
    stats: [
      { label: 'Nodes', value: '1,247' },
      { label: 'Regions', value: '45' },
    ]
  },
  {
    path: '/underworld',
    title: 'Underworld',
    subtitle: 'Regulatory Intel',
    icon: Skull,
    color: 'cyber-purple',
    gradient: 'from-cyber-purple/20 to-cyber-magenta/10',
    description: 'Track regulations, compliance updates, and risk analysis',
    stats: [
      { label: 'Alerts', value: '12' },
      { label: 'Updates', value: '48h' },
    ]
  },
  {
    path: '/character',
    title: 'Character',
    subtitle: 'Digital Profile',
    icon: User,
    color: 'cyber-cyan',
    gradient: 'from-cyan-500/20 to-teal-500/10',
    description: 'Manage your profile, achievements, and community standing',
    stats: [
      { label: 'Level', value: '42' },
      { label: 'Rep', value: '820' },
    ]
  },
  {
    path: '/clinic',
    title: 'Clinic',
    subtitle: 'Health Metrics',
    icon: HeartPulse,
    color: 'cyber-green',
    gradient: 'from-cyber-green/20 to-emerald-500/10',
    description: 'Monitor stablecoins, ETFs, and portfolio diagnostics',
    stats: [
      { label: 'RLUSD', value: '$1.00' },
      { label: 'ETF', value: '+8.4%' },
    ]
  },
]

export default function Home() {
  const { displayName, xHandle, memberSinceYear, reputation, socialScore, skillPoints, setDisplayName, setXHandle } = useProfileStore()
  const { wallets } = useWalletStore()
  const { nfts, memeTokens, isLoading: assetsLoading, fetchAllAssets } = useAssetsStore()

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editName, setEditName] = useState(displayName)
  const [editXHandle, setEditXHandle] = useState(xHandle)
  
  // Center panel tab state
  const [activeTab, setActiveTab] = useState<'regulations' | 'governance' | 'impact'>('impact')
  
  // Regulatory filter state
  const [regFilter, setRegFilter] = useState<string>('all')

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

  // Fetch assets when wallets change
  useEffect(() => {
    if (wallets.length > 0) {
      fetchAllAssets()
    }
  }, [wallets.length, fetchAllAssets])

  return (
    <div className="min-h-screen pt-20 pb-8 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Main Grid Layout - Matching the image */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          
          {/* Left Panel - Digital Profile */}
          <motion.div 
            className="lg:col-span-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="cyber-panel cyber-glow p-4 h-full">
              {/* Panel Header */}
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                <div className="w-2 h-2 rounded-full bg-cyber-glow animate-pulse" />
                <span className="font-cyber text-sm text-cyber-glow tracking-wider">DIGITAL PROFILE</span>
                {!isEditingProfile ? (
                  <button 
                    onClick={() => setIsEditingProfile(true)}
                    className="ml-auto p-1 hover:bg-cyber-glow/10 rounded transition-colors"
                    title="Edit profile"
                  >
                    <Edit2 size={14} className="text-cyber-muted hover:text-cyber-glow" />
                  </button>
                ) : (
                  <div className="ml-auto flex items-center gap-1">
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
                      <X size={14} className="text-cyber-red" />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Avatar Section - Now with upload capability */}
              <div className="relative mb-4">
                <ProfilePictureUpload size="lg" />
              </div>
              
              {/* Name & Handle */}
              <div className="text-center mb-4">
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
              
              {/* Stats Grid */}
              <div className="space-y-3 mb-4">
                {[
                  { label: 'Reputation', value: reputation.toString(), icon: Star },
                  { label: 'Social Score', value: socialScore.toLocaleString(), icon: Trophy },
                  { label: 'Skill Points', value: skillPoints.toString(), icon: Zap },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between p-2 rounded bg-cyber-darker/50 border border-cyber-border/50">
                    <div className="flex items-center gap-2">
                      <stat.icon size={14} className="text-cyber-muted" />
                      <span className="text-sm text-cyber-muted">{stat.label}</span>
                    </div>
                    <span className="font-cyber text-cyber-text font-bold">{stat.value}</span>
                  </div>
                ))}
              </div>
              
              {/* Holdings - Real Data */}
              <div className="space-y-2 mb-4">
                {/* Meme Coins */}
                <Link 
                  to="/character"
                  className="flex items-center gap-2 p-2 rounded bg-cyber-darker/50 border border-cyber-border/50 hover:border-cyber-yellow/50 transition-colors"
                >
                  <ImageIcon size={14} className="text-cyber-yellow" />
                  <span className="text-sm text-cyber-muted">Memes</span>
                  {assetsLoading ? (
                    <span className="text-xs text-cyber-muted ml-auto">...</span>
                  ) : (
                    <span className="font-cyber text-cyber-yellow ml-auto">{memeTokens.length}</span>
                  )}
                  <ChevronRight size={14} className="text-cyber-muted" />
                </Link>
                
                {/* Show meme token previews */}
                {memeTokens.length > 0 && (
                  <div className="flex flex-wrap gap-1 px-2">
                    {memeTokens.slice(0, 4).map((token, idx) => (
                      <div 
                        key={`${token.currency}-${token.issuer}-${idx}`}
                        className="px-2 py-1 rounded text-[10px] flex items-center gap-1"
                        style={{ backgroundColor: `${token.color}20`, color: token.color }}
                      >
                        {token.icon && <span>{token.icon}</span>}
                        <span>{token.symbol}</span>
                      </div>
                    ))}
                    {memeTokens.length > 4 && (
                      <span className="text-[10px] text-cyber-muted">+{memeTokens.length - 4}</span>
                    )}
                  </div>
                )}

                {/* NFTs */}
                <Link 
                  to="/character"
                  className="flex items-center gap-2 p-2 rounded bg-cyber-darker/50 border border-cyber-border/50 hover:border-cyber-purple/50 transition-colors"
                >
                  <Database size={14} className="text-cyber-purple" />
                  <span className="text-sm text-cyber-muted">NFTs</span>
                  {assetsLoading ? (
                    <span className="text-xs text-cyber-muted ml-auto">...</span>
                  ) : (
                    <span className="font-cyber text-cyber-purple ml-auto">{nfts.length}</span>
                  )}
                  <ChevronRight size={14} className="text-cyber-muted" />
                </Link>
                
                {/* Show NFT image previews */}
                {nfts.length > 0 && (
                  <div className="flex gap-1 px-2 overflow-x-auto">
                    {nfts.slice(0, 4).map((nft) => (
                      <div 
                        key={nft.tokenId}
                        className="w-10 h-10 rounded bg-cyber-darker border border-cyber-purple/30 flex-shrink-0 overflow-hidden"
                      >
                        {nft.image ? (
                          <img 
                            src={nft.image} 
                            alt={nft.name || 'NFT'} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-cyber-purple/50 text-xs">
                            NFT
                          </div>
                        )}
                      </div>
                    ))}
                    {nfts.length > 4 && (
                      <div className="w-10 h-10 rounded bg-cyber-darker border border-cyber-purple/30 flex-shrink-0 flex items-center justify-center">
                        <span className="text-[10px] text-cyber-purple">+{nfts.length - 4}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* View All link */}
                <Link 
                  to="/character"
                  className="flex items-center gap-2 p-2 rounded bg-cyber-darker/50 border border-cyber-border/50 hover:border-cyber-orange/50 transition-colors"
                >
                  <Trophy size={14} className="text-cyber-orange" />
                  <span className="text-sm text-cyber-muted">View Collection</span>
                  <ChevronRight size={14} className="text-cyber-muted ml-auto" />
                </Link>
              </div>
              
              {/* Drag Items Section */}
              <div className="border-t border-cyber-border pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-cyber-muted">Drag Items</span>
                  <ChevronRight size={12} className="text-cyber-muted" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 rounded bg-cyber-darker border border-cyber-yellow/30">
                    <Coins size={16} className="text-cyber-yellow" />
                    <span className="font-cyber text-sm text-cyber-yellow">$15,700</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded bg-cyber-darker border border-cyber-blue/30">
                    <Database size={16} className="text-cyber-blue" />
                    <span className="font-cyber text-sm text-cyber-blue">120 XRP</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded bg-cyber-darker border border-cyber-purple/30">
                    <div className="w-4 h-4 rounded bg-cyber-purple/50" />
                    <span className="font-cyber text-sm text-cyber-purple">5.3 AMM</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Center Panel - Main Content */}
          <motion.div 
            className="lg:col-span-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'regulations' && (
                <motion.div
                  key="regulations"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Regulations Header */}
                  <div className="cyber-panel p-4 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-cyber text-xl tracking-wider">
                        <span className="text-cyber-text">REGULATORY</span>
                        <span className="text-cyber-orange ml-2">INTEL</span>
                      </h2>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyber-orange animate-pulse" />
                        <span className="text-xs text-cyber-orange font-cyber">MONITORING</span>
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="grid grid-cols-4 gap-2">
                      <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-red/30 text-center">
                        <p className="text-lg font-cyber text-cyber-red">12</p>
                        <p className="text-[9px] text-cyber-muted">CRITICAL</p>
                      </div>
                      <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-orange/30 text-center">
                        <p className="text-lg font-cyber text-cyber-orange">34</p>
                        <p className="text-[9px] text-cyber-muted">PENDING</p>
                      </div>
                      <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-yellow/30 text-center">
                        <p className="text-lg font-cyber text-cyber-yellow">89</p>
                        <p className="text-[9px] text-cyber-muted">TRACKING</p>
                      </div>
                      <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-green/30 text-center">
                        <p className="text-lg font-cyber text-cyber-green">156</p>
                        <p className="text-[9px] text-cyber-muted">RESOLVED</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Category Filters */}
                  <div className="cyber-panel p-3 mb-4">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'all', label: 'All', icon: '' },
                        { id: 'crypto', label: 'Crypto', icon: '₿' },
                        { id: 'dlt', label: 'DLT', icon: '⛓️' },
                        { id: 'ai', label: 'AI/AGI', icon: '🤖' },
                        { id: 'banking', label: 'Banking', icon: '🏦' },
                        { id: 'sec', label: 'SEC/ETF', icon: '📊' },
                        { id: 'irs', label: 'IRS', icon: '📋' },
                        { id: 'global', label: 'Global', icon: '🌍' },
                      ].map((cat) => (
                        <button 
                          key={cat.id}
                          onClick={() => setRegFilter(cat.id)}
                          className={`px-3 py-1.5 rounded text-xs font-cyber transition-all ${
                            regFilter === cat.id 
                              ? 'bg-cyber-orange/20 text-cyber-orange border border-cyber-orange/50' 
                              : 'bg-cyber-darker/50 text-cyber-muted border border-cyber-border hover:border-cyber-orange/30'
                          }`}
                        >
                          {cat.icon && <span className="mr-1">{cat.icon}</span>}
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Regulatory Items by Status */}
                  {(() => {
                    // passLikelihood: 0-100 (for non-active items)
                    // xrplImpact: 'positive' | 'negative' | 'neutral' | 'mixed'
                    // industryImpact: 'positive' | 'negative' | 'neutral' | 'mixed'
                    const allItems = [
                      // ACTIVE Items (already passed, so passLikelihood = 100)
                      { id: 1, type: 'SEC RULE', typeColor: 'cyber-green', jurisdiction: 'US', status: 'active', title: 'Spot Bitcoin & Ethereum ETF Framework', desc: 'Guidelines for cryptocurrency ETF listings and trading on US exchanges', categories: ['sec', 'crypto'], url: 'https://www.sec.gov/rules/proposed.shtml', passLikelihood: 100, xrplImpact: 'positive', industryImpact: 'positive' },
                      { id: 2, type: 'MiCA', typeColor: 'cyber-green', jurisdiction: 'EU', status: 'active', title: 'Markets in Crypto-Assets Regulation', desc: 'Comprehensive EU framework for crypto asset service providers', categories: ['crypto', 'dlt', 'banking', 'global'], url: 'https://www.esma.europa.eu/esmas-activities/digital-finance-and-innovation/markets-crypto-assets-regulation-mica', passLikelihood: 100, xrplImpact: 'positive', industryImpact: 'positive' },
                      { id: 3, type: 'AI ACT', typeColor: 'cyber-green', jurisdiction: 'EU', status: 'active', title: 'EU AI Act - Risk-Based Framework', desc: 'Comprehensive regulations for AI, AGI, and ASI development and deployment', categories: ['ai', 'global'], url: 'https://artificialintelligenceact.eu/', passLikelihood: 100, xrplImpact: 'neutral', industryImpact: 'mixed' },
                      { id: 4, type: 'OCC', typeColor: 'cyber-green', jurisdiction: 'US', status: 'active', title: 'Bank Crypto Custody Guidelines', desc: 'Office of the Comptroller guidelines for banks holding digital assets', categories: ['banking', 'crypto'], url: 'https://www.occ.gov/topics/supervision-and-examination/bank-management/financial-technology/index-financial-technology.html', passLikelihood: 100, xrplImpact: 'positive', industryImpact: 'positive' },
                      { id: 5, type: 'IRS', typeColor: 'cyber-green', jurisdiction: 'US', status: 'active', title: 'Digital Asset Reporting (Form 1099-DA)', desc: 'Mandatory reporting for crypto transactions, staking rewards, and DeFi income', categories: ['irs', 'crypto', 'dlt'], url: 'https://www.irs.gov/businesses/small-businesses-self-employed/digital-assets', passLikelihood: 100, xrplImpact: 'neutral', industryImpact: 'mixed' },
                      { id: 6, type: 'FATF', typeColor: 'cyber-green', jurisdiction: 'GLOBAL', status: 'active', title: 'Travel Rule for Virtual Assets', desc: 'Financial Action Task Force guidelines for crypto transaction reporting', categories: ['crypto', 'banking', 'global'], url: 'https://www.fatf-gafi.org/en/topics/virtual-assets.html', passLikelihood: 100, xrplImpact: 'neutral', industryImpact: 'mixed' },
                      { id: 7, type: 'BIS', typeColor: 'cyber-green', jurisdiction: 'GLOBAL', status: 'active', title: 'CBDC Interoperability Standards', desc: 'Bank for International Settlements guidelines for central bank digital currencies', categories: ['banking', 'dlt', 'global'], url: 'https://www.bis.org/topics/cbdc.htm', passLikelihood: 100, xrplImpact: 'positive', industryImpact: 'positive' },
                      { id: 8, type: 'DTCC', typeColor: 'cyber-green', jurisdiction: 'US', status: 'active', title: 'T+1 Settlement & DLT Integration', desc: 'Blockchain-based settlement infrastructure for securities clearing', categories: ['dlt', 'sec', 'banking'], url: 'https://www.dtcc.com/news/2024', passLikelihood: 100, xrplImpact: 'positive', industryImpact: 'positive' },
                      
                      // PENDING Items
                      { id: 9, type: 'EXEC ORDER', typeColor: 'cyber-yellow', jurisdiction: 'US', status: 'pending', title: 'Executive Order on Digital Assets', desc: 'Framework for responsible development of digital assets and blockchain technology', categories: ['crypto', 'dlt', 'banking'], url: 'https://www.whitehouse.gov/briefing-room/presidential-actions/', passLikelihood: 85, xrplImpact: 'positive', industryImpact: 'positive' },
                      { id: 10, type: 'FIT21', typeColor: 'cyber-yellow', jurisdiction: 'US', status: 'pending', title: 'Financial Innovation & Technology Act', desc: 'Comprehensive crypto regulatory framework defining SEC vs CFTC jurisdiction', categories: ['crypto', 'sec', 'dlt'], url: 'https://www.congress.gov/bill/118th-congress/house-bill/4763', passLikelihood: 72, xrplImpact: 'positive', industryImpact: 'positive' },
                      { id: 11, type: 'STABLE', typeColor: 'cyber-yellow', jurisdiction: 'US', status: 'pending', title: 'Stablecoin TRUST Act', desc: 'Federal framework for stablecoin issuance and reserve requirements', categories: ['crypto', 'banking'], url: 'https://www.congress.gov/search?q=%7B%22search%22%3A%22stablecoin%22%7D', passLikelihood: 68, xrplImpact: 'positive', industryImpact: 'positive' },
                      { id: 12, type: 'WEF', typeColor: 'cyber-yellow', jurisdiction: 'GLOBAL', status: 'pending', title: 'Global Digital Asset Governance', desc: 'World Economic Forum recommendations for international crypto standards', categories: ['crypto', 'dlt', 'banking', 'global'], url: 'https://www.weforum.org/topics/blockchain-and-digital-assets/', passLikelihood: 55, xrplImpact: 'mixed', industryImpact: 'mixed' },
                      { id: 13, type: 'FED', typeColor: 'cyber-yellow', jurisdiction: 'US', status: 'pending', title: 'FedNow & Digital Dollar Study', desc: 'Federal Reserve research on instant payments and potential CBDC', categories: ['banking', 'dlt', 'global'], url: 'https://www.federalreserve.gov/paymentsystems/fednow_about.htm', passLikelihood: 40, xrplImpact: 'mixed', industryImpact: 'mixed' },
                      { id: 14, type: 'USPTO', typeColor: 'cyber-yellow', jurisdiction: 'US', status: 'pending', title: 'AI-Generated Inventions Policy', desc: 'Patent office guidance on AI and AGI as inventors or tools', categories: ['ai'], url: 'https://www.uspto.gov/initiatives/artificial-intelligence', passLikelihood: 78, xrplImpact: 'neutral', industryImpact: 'positive' },
                      
                      // PROPOSED Items
                      { id: 15, type: 'FINCEN', typeColor: 'cyber-orange', jurisdiction: 'US', status: 'proposed', title: 'AML/KYC Requirements for DeFi', desc: 'New reporting requirements for decentralized finance protocols', categories: ['dlt', 'banking', 'crypto'], url: 'https://www.fincen.gov/news-room', passLikelihood: 62, xrplImpact: 'negative', industryImpact: 'negative' },
                      { id: 16, type: 'CFTC', typeColor: 'cyber-orange', jurisdiction: 'US', status: 'proposed', title: 'Digital Commodity Classification', desc: 'Framework for tokenized commodities and agricultural assets on blockchain', categories: ['crypto', 'dlt'], url: 'https://www.cftc.gov/LawRegulation/index.htm', passLikelihood: 58, xrplImpact: 'positive', industryImpact: 'positive' },
                      { id: 17, type: 'SEC', typeColor: 'cyber-orange', jurisdiction: 'US', status: 'proposed', title: 'Crypto Exchange Registration Rules', desc: 'Proposed requirements for crypto trading platforms to register as exchanges', categories: ['sec', 'crypto'], url: 'https://www.sec.gov/rules/proposed.shtml', passLikelihood: 45, xrplImpact: 'mixed', industryImpact: 'negative' },
                      { id: 18, type: 'TREASURY', typeColor: 'cyber-orange', jurisdiction: 'US', status: 'proposed', title: 'Digital Asset Sanctions Framework', desc: 'OFAC guidance on crypto sanctions compliance and reporting', categories: ['crypto', 'banking', 'global'], url: 'https://home.treasury.gov/policy-issues/financial-sanctions/recent-actions', passLikelihood: 75, xrplImpact: 'neutral', industryImpact: 'mixed' },
                      { id: 19, type: 'EU', typeColor: 'cyber-orange', jurisdiction: 'EU', status: 'proposed', title: 'Digital Euro Framework', desc: 'European Central Bank proposal for retail CBDC implementation', categories: ['banking', 'dlt', 'global'], url: 'https://www.ecb.europa.eu/paym/digital_euro/html/index.en.html', passLikelihood: 70, xrplImpact: 'mixed', industryImpact: 'mixed' },
                      { id: 20, type: 'G20', typeColor: 'cyber-orange', jurisdiction: 'GLOBAL', status: 'proposed', title: 'Cross-Border Crypto Tax Framework', desc: 'International coordination on crypto taxation and information sharing', categories: ['irs', 'crypto', 'global'], url: 'https://www.oecd.org/tax/crypto-asset-reporting-framework-and-amendments-to-the-common-reporting-standard.htm', passLikelihood: 65, xrplImpact: 'neutral', industryImpact: 'mixed' },
                      
                      // WATCH Items - Patents & IP (no pass likelihood, just impact)
                      { id: 21, type: 'USPTO', typeColor: 'cyber-purple', jurisdiction: 'US', status: 'watch', title: 'US Patent Office - Blockchain Patents', desc: 'USPTO database for cryptocurrency, DLT, and blockchain technology patents', categories: ['dlt', 'crypto'], url: 'https://www.uspto.gov/patents', passLikelihood: null, xrplImpact: 'positive', industryImpact: 'positive' },
                      { id: 22, type: 'USPTO', typeColor: 'cyber-purple', jurisdiction: 'US', status: 'watch', title: 'USPTO - AI/ML Patent Search', desc: 'US patents related to artificial intelligence and machine learning inventions', categories: ['ai'], url: 'https://www.uspto.gov/initiatives/artificial-intelligence', passLikelihood: null, xrplImpact: 'neutral', industryImpact: 'positive' },
                      { id: 23, type: 'WIPO', typeColor: 'cyber-purple', jurisdiction: 'GLOBAL', status: 'watch', title: 'WIPO Global Patent Database', desc: 'World Intellectual Property Organization - search international blockchain & AI patents', categories: ['dlt', 'crypto', 'ai', 'global'], url: 'https://patentscope.wipo.int/search/en/search.jsf', passLikelihood: null, xrplImpact: 'neutral', industryImpact: 'positive' },
                      { id: 24, type: 'EPO', typeColor: 'cyber-purple', jurisdiction: 'EU', status: 'watch', title: 'European Patent Office - DLT Patents', desc: 'EPO Espacenet database for European blockchain and crypto patents', categories: ['dlt', 'crypto', 'global'], url: 'https://worldwide.espacenet.com/', passLikelihood: null, xrplImpact: 'neutral', industryImpact: 'positive' },
                      { id: 25, type: 'COPYRIGHT', typeColor: 'cyber-purple', jurisdiction: 'US', status: 'watch', title: 'US Copyright Office - Digital Works', desc: 'Copyright registration for NFTs, digital art, and blockchain-based creative works', categories: ['dlt', 'crypto'], url: 'https://www.copyright.gov/', passLikelihood: null, xrplImpact: 'positive', industryImpact: 'positive' },
                      { id: 26, type: 'PATENT', typeColor: 'cyber-purple', jurisdiction: 'GLOBAL', status: 'watch', title: 'Ripple Labs Patent Portfolio', desc: 'Key patents related to XRP Ledger technology and cross-border payments', categories: ['dlt', 'crypto', 'global'], url: 'https://patents.google.com/?assignee=Ripple+Labs&oq=Ripple+Labs', passLikelihood: null, xrplImpact: 'positive', industryImpact: 'positive' },
                      { id: 27, type: 'PATENT', typeColor: 'cyber-purple', jurisdiction: 'US', status: 'watch', title: 'Blockchain Patent Tracker', desc: 'Major tech company blockchain patents (IBM, Mastercard, Bank of America)', categories: ['dlt', 'crypto', 'banking'], url: 'https://patents.google.com/?q=blockchain&oq=blockchain', passLikelihood: null, xrplImpact: 'neutral', industryImpact: 'positive' },
                      
                      // WATCH Items - Legal Cases
                      { id: 28, type: 'CASE', typeColor: 'cyber-cyan', jurisdiction: 'US', status: 'watch', title: 'SEC vs Coinbase Litigation', desc: 'Landmark case defining crypto securities classification', categories: ['sec', 'crypto'], url: 'https://www.sec.gov/litigation/litreleases.htm', passLikelihood: 55, xrplImpact: 'positive', industryImpact: 'positive' },
                      { id: 29, type: 'CASE', typeColor: 'cyber-cyan', jurisdiction: 'US', status: 'watch', title: 'Tornado Cash Sanctions Appeal', desc: 'Constitutional challenge to OFAC crypto sanctions', categories: ['crypto', 'dlt'], url: 'https://www.coincenter.org/', passLikelihood: 45, xrplImpact: 'positive', industryImpact: 'positive' },
                    ];
                    
                    const filteredItems = allItems.filter(item => regFilter === 'all' || item.categories.includes(regFilter));
                    const activeItems = filteredItems.filter(i => i.status === 'active');
                    const pendingItems = filteredItems.filter(i => i.status === 'pending');
                    const proposedItems = filteredItems.filter(i => i.status === 'proposed');
                    const watchItems = filteredItems.filter(i => i.status === 'watch');
                    
                    const getImpactColor = (impact: string) => {
                      switch(impact) {
                        case 'positive': return 'text-cyber-green';
                        case 'negative': return 'text-cyber-red';
                        case 'mixed': return 'text-cyber-yellow';
                        default: return 'text-cyber-muted';
                      }
                    };
                    
                    const getImpactIcon = (impact: string) => {
                      switch(impact) {
                        case 'positive': return '▲';
                        case 'negative': return '▼';
                        case 'mixed': return '◆';
                        default: return '●';
                      }
                    };
                    
                    const getPassColor = (likelihood: number | null) => {
                      if (likelihood === null) return 'bg-cyber-muted';
                      if (likelihood >= 75) return 'bg-cyber-green';
                      if (likelihood >= 50) return 'bg-cyber-yellow';
                      if (likelihood >= 25) return 'bg-cyber-orange';
                      return 'bg-cyber-red';
                    };
                    
                    const renderItem = (item: typeof allItems[0]) => (
                      <a 
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block p-3 rounded bg-cyber-darker/50 border-l-4 border-${item.typeColor} hover:bg-cyber-darker/80 transition-all cursor-pointer group`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs rounded bg-${item.typeColor}/20 text-${item.typeColor} font-medium`}>{item.type}</span>
                            <span className={`px-2 py-0.5 text-xs rounded ${item.jurisdiction === 'US' ? 'bg-cyber-blue/20 text-cyber-blue' : item.jurisdiction === 'EU' ? 'bg-cyber-cyan/20 text-cyber-cyan' : 'bg-cyber-purple/20 text-cyber-purple'}`}>{item.jurisdiction}</span>
                          </div>
                          <ArrowRight size={14} className="text-cyber-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-sm text-cyber-text mb-1 group-hover:text-cyber-orange transition-colors font-medium">{item.title}</p>
                        <p className="text-xs text-cyber-muted leading-relaxed mb-3">{item.desc}</p>
                        
                        {/* Predictive Analytics Section */}
                        <div className="bg-cyber-dark/50 rounded p-2 space-y-2">
                          {/* Pass Likelihood Bar */}
                          {item.passLikelihood !== null && item.status !== 'active' && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-cyber-muted w-16">Pass %</span>
                              <div className="flex-1 h-2 bg-cyber-darker rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${getPassColor(item.passLikelihood)} transition-all`}
                                  style={{ width: `${item.passLikelihood}%` }}
                                />
                              </div>
                              <span className={`text-xs font-medium w-10 text-right ${getPassColor(item.passLikelihood).replace('bg-', 'text-')}`}>
                                {item.passLikelihood}%
                              </span>
                            </div>
                          )}
                          
                          {/* Impact Indicators */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-cyber-muted">XRPL:</span>
                                <span className={`text-xs font-medium ${getImpactColor(item.xrplImpact)}`}>
                                  {getImpactIcon(item.xrplImpact)} {item.xrplImpact.toUpperCase()}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-cyber-muted">Industry:</span>
                                <span className={`text-xs font-medium ${getImpactColor(item.industryImpact)}`}>
                                  {getImpactIcon(item.industryImpact)} {item.industryImpact.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-cyber-orange">{item.categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(' • ')}</span>
                        </div>
                      </a>
                    );
                    
                    return (
                      <div className="space-y-4 mb-4">
                        {/* ACTIVE Section */}
                        {activeItems.length > 0 && (
                          <div className="cyber-panel p-4">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-cyber-green/30">
                              <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
                              <span className="font-cyber text-sm text-cyber-green">ACTIVE ({activeItems.length})</span>
                              <span className="text-xs text-cyber-muted ml-auto">Currently in effect</span>
                            </div>
                            <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                              {activeItems.map(renderItem)}
                            </div>
                          </div>
                        )}
                        
                        {/* PENDING Section */}
                        {pendingItems.length > 0 && (
                          <div className="cyber-panel p-4">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-cyber-yellow/30">
                              <div className="w-2 h-2 rounded-full bg-cyber-yellow animate-pulse" />
                              <span className="font-cyber text-sm text-cyber-yellow">PENDING ({pendingItems.length})</span>
                              <span className="text-xs text-cyber-muted ml-auto">Awaiting vote/approval</span>
                            </div>
                            <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                              {pendingItems.map(renderItem)}
                            </div>
                          </div>
                        )}
                        
                        {/* PROPOSED Section */}
                        {proposedItems.length > 0 && (
                          <div className="cyber-panel p-4">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-cyber-orange/30">
                              <div className="w-2 h-2 rounded-full bg-cyber-orange animate-pulse" />
                              <span className="font-cyber text-sm text-cyber-orange">PROPOSED ({proposedItems.length})</span>
                              <span className="text-xs text-cyber-muted ml-auto">Under consideration</span>
                            </div>
                            <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                              {proposedItems.map(renderItem)}
                            </div>
                          </div>
                        )}
                        
                        {/* WATCH Section */}
                        {watchItems.length > 0 && (
                          <div className="cyber-panel p-4">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-cyber-purple/30">
                              <div className="w-2 h-2 rounded-full bg-cyber-purple animate-pulse" />
                              <span className="font-cyber text-sm text-cyber-purple">WATCH ({watchItems.length})</span>
                              <span className="text-xs text-cyber-muted ml-auto">Patents & Legal cases</span>
                            </div>
                            <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                              {watchItems.map(renderItem)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  
                  {/* Bottom Actions - Direct Links */}
                  <div className="cyber-panel p-3">
                    <p className="text-xs text-cyber-muted mb-2 text-center">Regulatory Agencies</p>
                    <div className="flex items-center justify-center gap-2 flex-wrap mb-3">
                      <a href="https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=&company=&dateb=&owner=include&count=40&search_text=crypto" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded bg-cyber-darker/50 border border-cyber-border hover:border-cyber-orange/50 hover:bg-cyber-orange/5 transition-all group">
                        <Activity size={14} className="text-cyber-muted group-hover:text-cyber-orange transition-colors" />
                        <span className="font-cyber text-xs text-cyber-text">SEC</span>
                      </a>
                      <a href="https://www.cftc.gov/digitalassets/index.htm" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded bg-cyber-darker/50 border border-cyber-border hover:border-cyber-orange/50 hover:bg-cyber-orange/5 transition-all group">
                        <TrendingUp size={14} className="text-cyber-muted group-hover:text-cyber-orange transition-colors" />
                        <span className="font-cyber text-xs text-cyber-text">CFTC</span>
                      </a>
                      <a href="https://www.fincen.gov/resources/advisoriesbulletinsfact-sheets" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded bg-cyber-darker/50 border border-cyber-border hover:border-cyber-orange/50 hover:bg-cyber-orange/5 transition-all group">
                        <Database size={14} className="text-cyber-muted group-hover:text-cyber-orange transition-colors" />
                        <span className="font-cyber text-xs text-cyber-text">FinCEN</span>
                      </a>
                      <a href="https://www.irs.gov/businesses/small-businesses-self-employed/virtual-currencies" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded bg-cyber-darker/50 border border-cyber-border hover:border-cyber-orange/50 hover:bg-cyber-orange/5 transition-all group">
                        <Wallet size={14} className="text-cyber-muted group-hover:text-cyber-orange transition-colors" />
                        <span className="font-cyber text-xs text-cyber-text">IRS</span>
                      </a>
                      <a href="https://www.congress.gov/search?q=%7B%22source%22%3A%22legislation%22%2C%22search%22%3A%22cryptocurrency%22%7D" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded bg-cyber-darker/50 border border-cyber-border hover:border-cyber-orange/50 hover:bg-cyber-orange/5 transition-all group">
                        <FileText size={14} className="text-cyber-muted group-hover:text-cyber-orange transition-colors" />
                        <span className="font-cyber text-xs text-cyber-text">Congress</span>
                      </a>
                      <a href="https://www.bis.org/topics/cbdc.htm" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded bg-cyber-darker/50 border border-cyber-border hover:border-cyber-orange/50 hover:bg-cyber-orange/5 transition-all group">
                        <Globe size={14} className="text-cyber-muted group-hover:text-cyber-orange transition-colors" />
                        <span className="font-cyber text-xs text-cyber-text">BIS</span>
                      </a>
                    </div>
                    <p className="text-xs text-cyber-muted mb-2 text-center">Patent & Copyright Offices</p>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <a href="https://www.uspto.gov/patents" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded bg-cyber-darker/50 border border-cyber-purple/30 hover:border-cyber-purple/50 hover:bg-cyber-purple/5 transition-all group">
                        <Star size={14} className="text-cyber-purple group-hover:text-cyber-purple transition-colors" />
                        <span className="font-cyber text-xs text-cyber-text">USPTO</span>
                      </a>
                      <a href="https://www.copyright.gov/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded bg-cyber-darker/50 border border-cyber-purple/30 hover:border-cyber-purple/50 hover:bg-cyber-purple/5 transition-all group">
                        <FileText size={14} className="text-cyber-purple group-hover:text-cyber-purple transition-colors" />
                        <span className="font-cyber text-xs text-cyber-text">Copyright</span>
                      </a>
                      <a href="https://patentscope.wipo.int/search/en/search.jsf" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded bg-cyber-darker/50 border border-cyber-purple/30 hover:border-cyber-purple/50 hover:bg-cyber-purple/5 transition-all group">
                        <Globe size={14} className="text-cyber-purple group-hover:text-cyber-purple transition-colors" />
                        <span className="font-cyber text-xs text-cyber-text">WIPO</span>
                      </a>
                      <a href="https://worldwide.espacenet.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded bg-cyber-darker/50 border border-cyber-purple/30 hover:border-cyber-purple/50 hover:bg-cyber-purple/5 transition-all group">
                        <Database size={14} className="text-cyber-purple group-hover:text-cyber-purple transition-colors" />
                        <span className="font-cyber text-xs text-cyber-text">EPO</span>
                      </a>
                      <a href="https://patents.google.com/?q=blockchain+OR+cryptocurrency" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded bg-cyber-darker/50 border border-cyber-purple/30 hover:border-cyber-purple/50 hover:bg-cyber-purple/5 transition-all group">
                        <Zap size={14} className="text-cyber-purple group-hover:text-cyber-purple transition-colors" />
                        <span className="font-cyber text-xs text-cyber-text">Google Patents</span>
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'governance' && (
                <motion.div
                  key="governance"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Governance Header */}
                  <div className="cyber-panel p-4 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-cyber text-xl tracking-wider">
                        <span className="text-cyber-text">XRPL</span>
                        <span className="text-cyber-purple ml-2">GOVERNANCE</span>
                      </h2>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyber-purple animate-pulse" />
                        <span className="text-xs text-cyber-purple font-cyber">LIVE</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-purple/30 text-center">
                        <p className="text-2xl font-cyber text-cyber-purple">35</p>
                        <p className="text-[10px] text-cyber-muted">Active Amendments</p>
                      </div>
                      <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-green/30 text-center">
                        <p className="text-2xl font-cyber text-cyber-green">150+</p>
                        <p className="text-[10px] text-cyber-muted">Validators</p>
                      </div>
                      <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-yellow/30 text-center">
                        <p className="text-2xl font-cyber text-cyber-yellow">80%</p>
                        <p className="text-[10px] text-cyber-muted">Threshold</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Voting Power & Proposals */}
                  <div className="cyber-panel p-4 mb-4">
                    <h3 className="font-cyber text-sm text-cyber-purple mb-4 flex items-center gap-2">
                      <Users size={16} />
                      VALIDATOR VOTING STATUS
                    </h3>
                    
                    <div className="space-y-3">
                      {[
                        { name: 'fixNFTokenDirV1', support: 80, status: 'Gaining' },
                        { name: 'Clawback', support: 91, status: 'Near Threshold' },
                        { name: 'PriceOracle', support: 71, status: 'Building' },
                        { name: 'DID', support: 57, status: 'Early Stage' },
                      ].map((item) => (
                        <div key={item.name} className="p-3 rounded bg-cyber-darker/50 border border-cyber-border/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-cyber-text">{item.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              item.support >= 80 ? 'bg-cyber-green/20 text-cyber-green' : 
                              item.support >= 70 ? 'bg-cyber-yellow/20 text-cyber-yellow' : 
                              'bg-cyber-muted/20 text-cyber-muted'
                            }`}>{item.status}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-cyber-darker rounded-full overflow-hidden">
                              <motion.div 
                                className={`h-full ${item.support >= 80 ? 'bg-cyber-green' : item.support >= 70 ? 'bg-cyber-yellow' : 'bg-cyber-purple'}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${item.support}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                            <span className="text-xs text-cyber-muted w-10 text-right">{item.support}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="cyber-panel p-3">
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                      <a href="https://xrpl.org/amendments.html" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded bg-cyber-darker/50 border border-cyber-border hover:border-cyber-purple/50 hover:bg-cyber-purple/5 transition-all group">
                        <FileText size={16} className="text-cyber-muted group-hover:text-cyber-purple transition-colors" />
                        <span className="font-cyber text-sm text-cyber-text">Amendments Docs</span>
                      </a>
                      <a href="https://livenet.xrpl.org/amendments" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded bg-cyber-darker/50 border border-cyber-border hover:border-cyber-purple/50 hover:bg-cyber-purple/5 transition-all group">
                        <Globe size={16} className="text-cyber-muted group-hover:text-cyber-purple transition-colors" />
                        <span className="font-cyber text-sm text-cyber-text">Live Explorer</span>
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'impact' && (
                <motion.div
                  key="impact"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Impact Tool Header */}
                  <div className="cyber-panel p-4 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-cyber text-xl tracking-wider">
                        <span className="text-cyber-text">LEDGER</span>
                        <span className="text-cyber-glow ml-2">IMPACT</span>
                        <span className="text-cyber-muted ml-2">ANALYZER</span>
                      </h2>
                      <div className="flex items-center gap-2">
                        <Zap size={16} className="text-cyber-glow" />
                      </div>
                    </div>
                    
                    {/* Amendment Impact Forecast */}
                    <div className="bg-cyber-darker/50 rounded-lg p-4 border border-cyber-glow/30">
                      <p className="text-xs text-cyber-muted mb-3 tracking-wider">Proposed Amendment Forecast</p>
                      <div className="flex items-center gap-6 flex-wrap">
                        <div className="flex items-center gap-2">
                          <TrendingUp size={20} className="text-cyber-green" />
                          <span className="font-cyber text-lg text-cyber-green">+8.4%</span>
                          <span className="text-xs text-cyber-muted">efficiency</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Database size={20} className="text-cyber-glow" />
                          <span className="font-cyber text-lg text-cyber-glow">+115k</span>
                          <span className="text-xs text-cyber-muted">TPS capacity</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity size={20} className="text-cyber-cyan" />
                          <span className="font-cyber text-lg text-cyber-cyan">-12%</span>
                          <span className="text-xs text-cyber-muted">latency</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Impact Tool */}
                  <div className="cyber-panel p-4 mb-4">
                    <LedgerImpactTool />
                  </div>
                  
                  {/* Pathfinding Tool */}
                  <div className="cyber-panel p-4 mb-4">
                    <PathfindingTool />
                  </div>
                  
                  {/* Paper Trading Simulator */}
                  <div className="cyber-panel p-4 mb-4">
                    <PaperTradingPanel compact />
                  </div>
                  
                  <div className="cyber-panel p-3">
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                      {[{ icon: Wallet, label: 'Portfolio Impact' }, { icon: Database, label: 'Historic Data' }, { icon: Activity, label: 'Benchmarks' }].map((item) => (
                        <button key={item.label} className="flex items-center gap-2 px-4 py-2 rounded bg-cyber-darker/50 border border-cyber-border hover:border-cyber-glow/50 hover:bg-cyber-glow/5 transition-all group">
                          <item.icon size={16} className="text-cyber-muted group-hover:text-cyber-glow transition-colors" />
                          <span className="font-cyber text-sm text-cyber-text">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          {/* Right Panel - Tools & Wallet */}
          <motion.div 
            className="lg:col-span-3 space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Quick Access Tools */}
            <div className="cyber-panel p-4">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-cyber-border">
                <Zap size={16} className="text-cyber-cyan" />
                <span className="font-cyber text-sm text-cyber-cyan tracking-wider">QUICK ACCESS</span>
              </div>
              <div className="space-y-2">
                <button 
                  onClick={() => setActiveTab('impact')}
                  className={`w-full flex items-center gap-3 p-3 rounded transition-all ${
                    activeTab === 'impact' 
                      ? 'bg-cyber-glow/20 border border-cyber-glow/50 text-cyber-glow' 
                      : 'bg-cyber-darker/50 border border-cyber-border hover:border-cyber-glow/30 text-cyber-text'
                  }`}
                >
                  <Activity size={18} />
                  <div className="text-left">
                    <p className="font-cyber text-sm">Impact Tool</p>
                    <p className="text-[10px] text-cyber-muted">Analyze amendments</p>
                  </div>
                </button>
                <button 
                  onClick={() => setActiveTab('governance')}
                  className={`w-full flex items-center gap-3 p-3 rounded transition-all ${
                    activeTab === 'governance' 
                      ? 'bg-cyber-purple/20 border border-cyber-purple/50 text-cyber-purple' 
                      : 'bg-cyber-darker/50 border border-cyber-border hover:border-cyber-purple/30 text-cyber-text'
                  }`}
                >
                  <Users size={18} />
                  <div className="text-left">
                    <p className="font-cyber text-sm">Governance</p>
                    <p className="text-[10px] text-cyber-muted">Voting status</p>
                  </div>
                </button>
                <button 
                  onClick={() => setActiveTab('regulations')}
                  className={`w-full flex items-center gap-3 p-3 rounded transition-all ${
                    activeTab === 'regulations' 
                      ? 'bg-cyber-orange/20 border border-cyber-orange/50 text-cyber-orange' 
                      : 'bg-cyber-darker/50 border border-cyber-border hover:border-cyber-orange/30 text-cyber-text'
                  }`}
                >
                  <FileText size={18} />
                  <div className="text-left">
                    <p className="font-cyber text-sm">Regulations</p>
                    <p className="text-[10px] text-cyber-muted">Laws & compliance</p>
                  </div>
                </button>
              </div>
            </div>
            
            {/* Wallet Connect - Multiple Providers */}
            <WalletConnect />
          </motion.div>
        </div>
        
        {/* Page Navigation Cards */}
        <motion.div 
          className="mt-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="font-cyber text-lg text-cyber-glow mb-4 tracking-wider">EXPLORE CONTROL ROOM</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pageCards.map((card, idx) => {
              const Icon = card.icon
              return (
                <Link 
                  key={card.path}
                  to={card.path}
                  className="group"
                >
                  <motion.div 
                    className={`cyber-panel cyber-card p-5 h-full bg-gradient-to-br ${card.gradient}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + idx * 0.1 }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-3 rounded-lg bg-${card.color}/10 border border-${card.color}/30`}>
                        <Icon size={24} className={`text-${card.color}`} />
                      </div>
                      <ArrowRight size={20} className="text-cyber-muted group-hover:text-cyber-glow group-hover:translate-x-1 transition-all" />
                    </div>
                    
                    <h4 className="font-cyber text-lg text-cyber-text mb-1">{card.title}</h4>
                    <p className={`text-xs text-${card.color} mb-2 tracking-wider`}>{card.subtitle}</p>
                    <p className="text-sm text-cyber-muted mb-4">{card.description}</p>
                    
                    <div className="flex items-center gap-4 pt-3 border-t border-cyber-border">
                      {card.stats.map((stat) => (
                        <div key={stat.label}>
                          <p className="text-xs text-cyber-muted">{stat.label}</p>
                          <p className={`font-cyber text-sm text-${card.color}`}>{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </Link>
              )
            })}
          </div>
        </motion.div>
        
        {/* Live Feeds Footer */}
        <motion.div 
          className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {/* Twitter/X Feed */}
          <div className="cyber-panel p-4">
            <div className="flex items-center gap-2 mb-4">
              <Twitter size={16} className="text-cyber-glow" />
              <span className="font-cyber text-sm text-cyber-glow tracking-wider">LIVE FEED</span>
              <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse ml-auto" />
            </div>
            <div className="space-y-3">
              {[
                { user: '@Ripple', text: 'RLUSD continues strong growth...', time: '2m' },
                { user: '@XRPL_Labs', text: 'New Xaman update deployed...', time: '15m' },
                { user: '@validator_42', text: 'Node metrics looking healthy...', time: '1h' },
              ].map((tweet, idx) => (
                <div key={idx} className="p-3 rounded bg-cyber-darker/50 border border-cyber-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-cyber-glow">{tweet.user}</span>
                    <span className="text-xs text-cyber-muted">{tweet.time}</span>
                  </div>
                  <p className="text-sm text-cyber-text">{tweet.text}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* GitHub Activity */}
          <div className="cyber-panel p-4">
            <div className="flex items-center gap-2 mb-4">
              <Github size={16} className="text-cyber-purple" />
              <span className="font-cyber text-sm text-cyber-purple tracking-wider">GITHUB ACTIVITY</span>
              <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse ml-auto" />
            </div>
            <div className="space-y-3">
              {[
                { repo: 'ripple/rippled', action: 'merged PR #4521', time: '5m' },
                { repo: 'XRPLF/xrpl.js', action: 'new release v3.2.0', time: '2h' },
                { repo: 'XRPL-Labs/Xaman', action: '12 new commits', time: '4h' },
              ].map((activity, idx) => (
                <div key={idx} className="p-3 rounded bg-cyber-darker/50 border border-cyber-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-cyber-purple">{activity.repo}</span>
                    <span className="text-xs text-cyber-muted">{activity.time}</span>
                  </div>
                  <p className="text-sm text-cyber-text">{activity.action}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
