import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  Globe, Skull, User, HeartPulse, Zap, TrendingUp, TrendingDown, 
  Activity, Wallet, Database, ArrowRight, Star, Trophy, Coins,
  Image as ImageIcon, ChevronRight, Github, Twitter
} from 'lucide-react'
import { ProfilePictureUpload } from '../components/ProfilePictureUpload'
import { useProfileStore } from '../store/profileStore'

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
  const { username, reputation, socialScore, skillPoints } = useProfileStore()

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
                <ChevronRight size={14} className="text-cyber-muted ml-auto" />
              </div>
              
              {/* Avatar Section - Now with upload capability */}
              <div className="relative mb-4">
                <ProfilePictureUpload size="lg" />
              </div>
              
              {/* Username */}
              <div className="text-center mb-4">
                <h2 className="font-cyber text-lg text-cyber-text">{username}</h2>
                <p className="text-xs text-cyber-muted">Member since 2024</p>
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
              
              {/* Holdings */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 p-2 rounded bg-cyber-darker/50 border border-cyber-border/50">
                  <ImageIcon size={14} className="text-cyber-yellow" />
                  <span className="text-sm text-cyber-muted">Memes</span>
                  <span className="font-cyber text-cyber-yellow ml-auto">12</span>
                  <ChevronRight size={14} className="text-cyber-muted" />
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-cyber-darker/50 border border-cyber-border/50">
                  <Database size={14} className="text-cyber-purple" />
                  <span className="text-sm text-cyber-muted">NFTs</span>
                  <span className="font-cyber text-cyber-purple ml-auto">8</span>
                  <ChevronRight size={14} className="text-cyber-muted" />
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-cyber-darker/50 border border-cyber-border/50">
                  <Trophy size={14} className="text-cyber-orange" />
                  <span className="text-sm text-cyber-muted">Achievements</span>
                  <ChevronRight size={14} className="text-cyber-muted ml-auto" />
                </div>
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
            {/* Top Navigation Tabs */}
            <div className="cyber-panel p-2 mb-4">
              <div className="flex items-center gap-2">
                {['Scenarios', 'Governance', 'Impact Tool'].map((tab, idx) => (
                  <button 
                    key={tab}
                    className={`px-4 py-2 rounded font-cyber text-sm tracking-wider transition-all ${
                      idx === 2 
                        ? 'bg-cyber-glow/20 text-cyber-glow border border-cyber-glow/50' 
                        : 'text-cyber-muted hover:text-cyber-text hover:bg-cyber-border/30'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-1 h-3 bg-cyber-glow/50 rounded" />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Dropple Simulator Header */}
            <div className="cyber-panel p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-cyber text-xl tracking-wider">
                  <span className="text-cyber-text">DROPPLE</span>
                  <span className="text-cyber-muted ml-2">TO</span>
                  <span className="text-cyber-glow ml-2">SIMULATE</span>
                </h2>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="w-1 h-1 rounded-full bg-cyber-muted" />
                  ))}
                </div>
              </div>
              
              {/* Proposed Amendment Forecast */}
              <div className="bg-cyber-darker/50 rounded-lg p-4 border border-cyber-border">
                <p className="text-xs text-cyber-muted mb-3 tracking-wider">Proposed Amendment Forecast</p>
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={20} className="text-cyber-green" />
                    <span className="font-cyber text-lg text-cyber-green">+8.4%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Database size={20} className="text-cyber-glow" />
                    <span className="font-cyber text-lg text-cyber-glow">+115k</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingDown size={20} className="text-cyber-red" />
                    <span className="font-cyber text-lg text-cyber-red">-250 XRP</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 3D City Visualization Placeholder */}
            <div className="cyber-panel p-4 mb-4 relative overflow-hidden min-h-[300px]">
              {/* Isometric City Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-cyber-navy/50 to-cyber-darker">
                {/* Grid lines */}
                <div className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: `
                      linear-gradient(90deg, rgba(0, 212, 255, 0.1) 1px, transparent 1px),
                      linear-gradient(rgba(0, 212, 255, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '30px 30px',
                    transform: 'perspective(500px) rotateX(60deg)',
                    transformOrigin: 'center bottom'
                  }}
                />
              </div>
              
              {/* Floating Labels */}
              <div className="relative z-10 h-full flex items-center justify-center gap-8">
                {/* VOTE Node */}
                <motion.div 
                  className="relative"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="px-4 py-2 rounded-lg bg-cyber-yellow/20 border border-cyber-yellow text-cyber-yellow font-cyber text-sm">
                    VOTE
                  </div>
                  <div className="absolute top-full left-1/2 w-px h-16 bg-gradient-to-b from-cyber-yellow to-transparent" />
                </motion.div>
                
                {/* DEX Node */}
                <motion.div 
                  className="relative"
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                  <div className="px-4 py-2 rounded-lg bg-cyber-purple/20 border border-cyber-purple text-cyber-purple font-cyber text-sm">
                    DEX
                  </div>
                  <div className="absolute top-full left-1/2 w-px h-20 bg-gradient-to-b from-cyber-purple to-transparent" />
                </motion.div>
                
                {/* AMM Node */}
                <motion.div 
                  className="relative"
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                  <div className="px-4 py-2 rounded-lg bg-cyber-cyan/20 border border-cyber-cyan text-cyber-cyan font-cyber text-sm">
                    AMM
                  </div>
                  <div className="absolute top-full left-1/2 w-px h-14 bg-gradient-to-b from-cyber-cyan to-transparent" />
                </motion.div>
              </div>
              
              {/* Connecting Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-5">
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(0, 212, 255, 0.5)" />
                    <stop offset="50%" stopColor="rgba(168, 85, 247, 0.5)" />
                    <stop offset="100%" stopColor="rgba(0, 255, 136, 0.5)" />
                  </linearGradient>
                </defs>
                <path 
                  d="M100,150 Q200,100 300,150 T500,150" 
                  fill="none" 
                  stroke="url(#lineGradient)" 
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  className="animate-pulse"
                />
              </svg>
              
              {/* Bottom Label */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
                <p className="font-cyber text-sm text-cyber-muted tracking-wider">
                  Drag & Drop Your Assets to Simulate Outcomes
                </p>
              </div>
            </div>
            
            {/* Bottom Action Bar */}
            <div className="cyber-panel p-3">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                {[
                  { icon: Wallet, label: 'Portfolio' },
                  { icon: Database, label: 'Treasury Models' },
                  { icon: Activity, label: 'My Proposals' },
                ].map((item) => (
                  <button 
                    key={item.label}
                    className="flex items-center gap-2 px-4 py-2 rounded bg-cyber-darker/50 border border-cyber-border hover:border-cyber-glow/50 hover:bg-cyber-glow/5 transition-all group"
                  >
                    <item.icon size={16} className="text-cyber-muted group-hover:text-cyber-glow transition-colors" />
                    <span className="font-cyber text-sm text-cyber-text">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
          
          {/* Right Panel - Tools & Wallet */}
          <motion.div 
            className="lg:col-span-3 space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Ledger Impact Tool */}
            <div className="cyber-panel p-4">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                <div className="w-2 h-2 rounded-full bg-cyber-cyan animate-pulse" />
                <span className="font-cyber text-sm text-cyber-cyan tracking-wider">LEDGER IMPACT TOOL</span>
              </div>
              
              {/* Risk Analysis Bars */}
              <div className="mb-4">
                <p className="text-xs text-cyber-muted mb-2">Risk Analysis</p>
                <div className="space-y-2">
                  {[
                    { color: 'bg-cyber-green', width: '70%' },
                    { color: 'bg-cyber-yellow', width: '45%' },
                    { color: 'bg-cyber-red', width: '25%' },
                  ].map((bar, idx) => (
                    <div key={idx} className="cyber-progress h-2">
                      <motion.div 
                        className={`cyber-progress-bar ${bar.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: bar.width }}
                        transition={{ delay: 0.5 + idx * 0.1, duration: 0.8 }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Drag & Drop Zone */}
              <div className="bg-cyber-darker/50 rounded-lg p-3 border border-dashed border-cyber-border mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-cyber text-sm text-cyber-glow">Drag & Drop</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <ChevronRight key={i} size={12} className="text-cyber-glow/50" />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Quick Links */}
              <div className="space-y-2">
                {[
                  { icon: Database, label: 'Historic Data', color: 'text-cyber-glow' },
                  { icon: Wallet, label: 'Wallet API', color: 'text-cyber-purple' },
                  { icon: TrendingUp, label: 'Market Trends', color: 'text-cyber-green' },
                ].map((link) => (
                  <button 
                    key={link.label}
                    className="w-full flex items-center gap-3 p-3 rounded bg-cyber-darker/50 border border-cyber-border hover:border-cyber-glow/30 transition-all group"
                  >
                    <link.icon size={16} className={link.color} />
                    <span className="text-sm text-cyber-text">{link.label}</span>
                    <ChevronRight size={14} className="text-cyber-muted ml-auto group-hover:text-cyber-glow transition-colors" />
                  </button>
                ))}
              </div>
            </div>
            
            {/* Xaman Wallet Connect */}
            <div className="cyber-panel p-4">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                <span className="font-cyber text-sm text-cyber-yellow tracking-wider">SIGN WITH XAMAN</span>
              </div>
              
              {/* QR Code Placeholder */}
              <div className="bg-white rounded-lg p-4 mb-4 aspect-square max-w-[150px] mx-auto">
                <div className="w-full h-full bg-cyber-darker rounded grid grid-cols-8 grid-rows-8 gap-0.5 p-1">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`rounded-sm ${Math.random() > 0.5 ? 'bg-cyber-darker' : 'bg-white'}`}
                    />
                  ))}
                </div>
              </div>
              
              <button className="w-full cyber-btn">
                Connect XAMAN Wallet
              </button>
            </div>
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
