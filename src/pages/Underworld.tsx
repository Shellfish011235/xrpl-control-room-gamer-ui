import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { 
  Skull, Shield, AlertTriangle, Scale, FileText, Clock,
  ChevronRight, Globe, TrendingUp,
  Eye, Bell, ExternalLink, Building, Landmark,
  CheckCircle, Activity, Sparkles, Cpu,
} from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts'
import {
  regulatoryItems,
  regulatoryAgencies,
  getRegulatoryStats,
  getItemsByStatus,
  getImpactColor,
  getStatusColor,
  getRegulatoryIpTechItems,
  sortRegulatoryItemsForIpTab,
  type RegulatoryItem,
} from '../data/regulatoryData'
import { countryRegulatoryStatus } from '../data/globeContent'
import { getCorridorStats, odlPartners, xrplConnectedChains, crossChainBridges } from '../data/corridorData'

// Calculate real risk metrics from data
const calculateRiskMetrics = () => {
  const activeItems = getItemsByStatus('active')
  const pendingItems = getItemsByStatus('pending')
  const proposedItems = getItemsByStatus('proposed')
  
  const usItems = regulatoryItems.filter(i => i.countryCode === 'US')
  const usPositive = usItems.filter(i => i.xrplImpact === 'positive').length
  const usTotal = usItems.length
  
  const globalItems = regulatoryItems.filter(i => i.jurisdiction === 'GLOBAL')
  const globalPositive = globalItems.filter(i => i.xrplImpact === 'positive').length
  
  const favorableCountries = Object.values(countryRegulatoryStatus).filter(c => c.status === 'favorable').length
  const totalCountries = Object.keys(countryRegulatoryStatus).length
  
  return [
    { subject: 'SEC Clarity', value: Math.round((usPositive / Math.max(usTotal, 1)) * 100), fullMark: 100 },
    { subject: 'CFTC Position', value: 85, fullMark: 100 }, // Based on commodity classification
    { subject: 'Global Adoption', value: Math.round((favorableCountries / totalCountries) * 100), fullMark: 100 },
    { subject: 'Banking Access', value: Math.round(activeItems.filter(i => i.categories.includes('banking')).length / activeItems.length * 100), fullMark: 100 },
    { subject: 'Tax Framework', value: 70, fullMark: 100 }, // IRS reporting active
    { subject: 'DeFi Regs', value: Math.round(proposedItems.filter(i => i.categories.includes('dlt')).length > 0 ? 45 : 60), fullMark: 100 },
  ]
}

// Build timeline from regulatory items
const buildRegulatoryTimeline = () => {
  const recentItems = [...regulatoryItems]
    .filter(item => item.status !== 'watch')
    .sort((a, b) => {
      const dateA = a.effectiveDate || a.lastUpdated || '2025-01-01'
      const dateB = b.effectiveDate || b.lastUpdated || '2025-01-01'
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })
    .slice(0, 6)
  
  const iconMap: Record<string, typeof FileText> = {
    'SEC RULE': Scale,
    'MiCA': Globe,
    'EXEC ORDER': Shield,
    'FIT21': FileText,
    'CLARITY': FileText,
    'GENIUS': Landmark,
    'SEC/CFTC': Scale,
    'CBLR': Landmark,
    'OCC/FDIC': Building,
    'ILF': Globe,
    'RIPPLE': Building,
    'IBM': Building,
    'INVENTOR': FileText,
    'DARPA': Shield,
    'NEURALINK': Activity,
    'PARADROMICS': Activity,
    'BCI': Activity,
    'STANFORD': Building,
    'CROSS-REF': Eye,
    'LANDSCAPE': Globe,
    'NEUROMORPHIC': Cpu,
    'SPW-R': Activity,
    'MEDTECH': Activity,
    'EXOS': Landmark,
    'STABLE': Landmark,
    'CFTC': Scale,
    'FINCEN': AlertTriangle,
    'JFSA': Building,
    'MAS': Building,
    'VARA': Shield,
    'FCA': Building,
  }
  
  return recentItems.map(item => ({
    date: item.effectiveDate ? new Date(item.effectiveDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Pending',
    title: item.title.length > 40 ? item.title.slice(0, 40) + '...' : item.title,
    description: item.desc.length > 60 ? item.desc.slice(0, 60) + '...' : item.desc,
    type: item.xrplImpact === 'positive' ? 'positive' : item.xrplImpact === 'negative' ? 'negative' : 'neutral',
    icon: iconMap[item.type] || FileText,
    status: item.status,
    url: item.url,
    jurisdiction: item.jurisdiction,
  }))
}

// Build alerts from recent high-impact items; use real dates from data (no fake "2 hours ago")
const buildAlerts = () => {
  const highImpact = regulatoryItems
    .filter(i => i.status === 'pending' || i.status === 'proposed')
    .filter(i => i.xrplImpact === 'positive' || i.xrplImpact === 'negative')
    .slice(0, 5)

  const formatDate = (item: RegulatoryItem) => {
    const raw = item.effectiveDate || item.lastUpdated
    if (!raw) return item.status === 'pending' ? 'Pending' : 'Proposed'
    try {
      const d = new Date(raw)
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', ...(d.getDate() !== 1 ? { day: 'numeric' } : {}) })
    } catch {
      return raw
    }
  }

  return highImpact.map(item => ({
    title: `${item.type} - ${item.jurisdiction}`,
    time: item.effectiveDate ? `Effective ${formatDate(item)}` : item.lastUpdated ? `Updated ${formatDate(item)}` : formatDate(item),
    severity: item.xrplImpact === 'negative' ? 'high' : item.status === 'pending' ? 'medium' : 'low',
    summary: item.title,
    url: item.url,
  }))
}

/** Regulations content: used standalone on /underworld and embedded in Network → Regulation lens */
export function RegulationsContent() {
  const [mainTab, setMainTab] = useState<'overview' | 'ip'>('overview')
  
  const riskMetrics = useMemo(() => calculateRiskMetrics(), [])
  const regulatoryTimeline = useMemo(() => buildRegulatoryTimeline(), [])
  const alerts = useMemo(() => buildAlerts(), [])
  const stats = useMemo(() => getRegulatoryStats(), [])
  const corridorStats = useMemo(() => getCorridorStats(), [])
  const ipTechItems = useMemo(
    () => [...getRegulatoryIpTechItems()].sort(sortRegulatoryItemsForIpTab),
    []
  )
  const ipPatentAgencies = useMemo(
    () => regulatoryAgencies.filter((a) => a.category === 'patent'),
    []
  )
  const ipStats = useMemo(() => {
    const by = (s: RegulatoryItem['status']) => ipTechItems.filter((i) => i.status === s).length
    return {
      total: ipTechItems.length,
      active: by('active'),
      pending: by('pending'),
      proposed: by('proposed'),
      watch: by('watch'),
    }
  }, [ipTechItems])
  
  return (
    <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Skull className="text-cyber-purple" size={28} />
            <h1 className="font-cyber text-2xl text-cyber-text tracking-wider">REGULATIONS</h1>
            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded bg-cyber-green/10 border border-cyber-green/30">
                <CheckCircle size={14} className="text-cyber-green" />
                <span className="text-xs text-cyber-green font-cyber">{stats.active} ACTIVE</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded bg-cyber-yellow/10 border border-cyber-yellow/30">
                <Clock size={14} className="text-cyber-yellow" />
                <span className="text-xs text-cyber-yellow font-cyber">{stats.pending} PENDING</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded bg-cyber-red/10 border border-cyber-red/30">
                <AlertTriangle size={14} className="text-cyber-red" />
                <span className="text-xs text-cyber-red font-cyber">{alerts.length} ALERTS</span>
              </div>
            </div>
          </div>
          <p className="text-cyber-muted">
            Regulatory Intelligence & Compliance Monitoring · {stats.total} tracked items across {stats.countriesWithProfiles} jurisdictions
          </p>
          <p className="text-[10px] text-cyber-muted mt-1 flex items-center gap-2">
            <Clock size={10} />
            Data as of {stats.dataAsOf ?? 'N/A'} · Curated dataset, not live. Verify with official sources for latest.
          </p>
          
          <div className="flex flex-wrap gap-2 mt-4" role="tablist" aria-label="Regulations views">
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === 'overview'}
              onClick={() => setMainTab('overview')}
              className={`px-4 py-2 rounded font-cyber text-xs tracking-wide border transition-colors ${
                mainTab === 'overview'
                  ? 'bg-cyber-purple/20 border-cyber-purple/60 text-cyber-glow'
                  : 'bg-cyber-darker/50 border-cyber-border text-cyber-muted hover:border-cyber-purple/40'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === 'ip'}
              onClick={() => setMainTab('ip')}
              className={`px-4 py-2 rounded font-cyber text-xs tracking-wide border transition-colors flex items-center gap-2 ${
                mainTab === 'ip'
                  ? 'bg-cyber-purple/20 border-cyber-purple/60 text-cyber-glow'
                  : 'bg-cyber-darker/50 border-cyber-border text-cyber-muted hover:border-cyber-purple/40'
              }`}
            >
              <Sparkles size={14} className="text-cyber-magenta shrink-0" />
              IP · DLT · AI & marketplaces
            </button>
          </div>
        </motion.div>
        
        {mainTab === 'ip' ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
            role="tabpanel"
          >
            <div className="cyber-panel p-4 border-cyber-magenta/30">
              <p className="text-sm text-cyber-text mb-2 font-cyber tracking-wide">BLOCKCHAIN · DLT · COPYRIGHT · PATENTS · AI / AGENTIC COMMERCE</p>
              <p className="text-xs text-cyber-muted leading-relaxed">
                Curated rows tagged for intellectual property, ledger-based assets, and oversight of AI-driven marketplaces (including impersonation, platform duties, and patent/copyright offices).
                Expand the dataset by tagging new <code className="text-cyber-glow/90">ip</code> entries in <code className="text-cyber-glow/90">regulatoryData.ts</code>.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Tracked', value: ipStats.total, color: 'text-cyber-text' },
                { label: 'Active', value: ipStats.active, color: 'text-cyber-green' },
                { label: 'Pending', value: ipStats.pending, color: 'text-cyber-yellow' },
                { label: 'Proposed', value: ipStats.proposed, color: 'text-cyber-orange' },
                { label: 'Watch', value: ipStats.watch, color: 'text-cyber-purple' },
              ].map((row) => (
                <div key={row.label} className="cyber-panel p-3">
                  <p className="text-[10px] text-cyber-muted mb-1">{row.label}</p>
                  <span className={`font-cyber text-xl ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {ipTechItems.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cyber-panel p-4 border-cyber-border hover:border-cyber-magenta/40 transition-colors group flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-cyber text-xs text-cyber-magenta">{item.type}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded shrink-0 ${
                        item.status === 'active'
                          ? 'bg-cyber-green/20 text-cyber-green'
                          : item.status === 'pending'
                            ? 'bg-cyber-yellow/20 text-cyber-yellow'
                            : item.status === 'proposed'
                              ? 'bg-cyber-orange/20 text-cyber-orange'
                              : 'bg-cyber-purple/20 text-cyber-purple'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <h3 className="text-sm text-cyber-text font-medium group-hover:text-cyber-glow transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-cyber-muted line-clamp-3 flex-1">{item.desc}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-cyber-border/50">
                    <span className="text-[10px] text-cyber-purple">{item.jurisdiction}</span>
                    <ExternalLink size={12} className="text-cyber-muted opacity-0 group-hover:opacity-100" />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.categories.map((c) => (
                      <span key={c} className="text-[9px] px-1 py-0.5 rounded bg-cyber-darker text-cyber-muted">
                        {c}
                      </span>
                    ))}
                  </div>
                </a>
              ))}
            </div>
            
            <div className="cyber-panel p-4 border-cyber-purple/30">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-cyber-border">
                <Building size={16} className="text-cyber-purple" />
                <span className="font-cyber text-sm text-cyber-purple">PATENT & COPYRIGHT OFFICES</span>
                <span className="text-xs text-cyber-muted">({ipPatentAgencies.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ipPatentAgencies.map((agency) => (
                  <a
                    key={agency.id}
                    href={agency.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded bg-cyber-darker/50 border border-cyber-purple/30 hover:border-cyber-purple/55 transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-cyber text-cyber-purple">{agency.shortName}</span>
                      <span className="text-[9px] text-cyber-muted">{agency.jurisdiction}</span>
                      <ExternalLink size={8} className="text-cyber-muted opacity-0 group-hover:opacity-100" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <>
        {/* Stats Bar */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="cyber-panel p-3">
            <p className="text-[10px] text-cyber-muted mb-1">XRPL Positive</p>
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-cyber-green" />
              <span className="font-cyber text-xl text-cyber-green">{stats.xrplPositive}</span>
            </div>
          </div>
          <div className="cyber-panel p-3">
            <p className="text-[10px] text-cyber-muted mb-1">ODL Partners</p>
            <div className="flex items-center gap-2">
              <Building size={16} className="text-cyber-glow" />
              <span className="font-cyber text-xl text-cyber-glow">{corridorStats.activePartners}</span>
            </div>
          </div>
          <div className="cyber-panel p-3">
            <p className="text-[10px] text-cyber-muted mb-1">Payment Corridors</p>
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-cyber-purple" />
              <span className="font-cyber text-xl text-cyber-purple">{corridorStats.totalCorridors}</span>
            </div>
          </div>
          <div className="cyber-panel p-3">
            <p className="text-[10px] text-cyber-muted mb-1">Active Bridges</p>
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-cyber-cyan" />
              <span className="font-cyber text-xl text-cyber-cyan">{corridorStats.activeBridges}</span>
            </div>
          </div>
          <div className="cyber-panel p-3">
            <p className="text-[10px] text-cyber-muted mb-1">Connected Chains</p>
            <div className="flex items-center gap-2">
              <Landmark size={16} className="text-cyber-yellow" />
              <span className="font-cyber text-xl text-cyber-yellow">{corridorStats.connectedChains}</span>
            </div>
          </div>
          <div className="cyber-panel p-3">
            <p className="text-[10px] text-cyber-muted mb-1">Total corridor market (est.)</p>
            <p className="text-[9px] text-cyber-muted mb-0.5">Not ODL volume · World Bank/central banks</p>
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-cyber-green" />
              <span className="font-cyber text-lg text-cyber-green">{corridorStats.estimatedMonthlyVolume}</span>
            </div>
          </div>
        </motion.div>
        <p className="text-[10px] text-cyber-muted -mt-2 mb-4">
          Corridor & bridge metrics as of {corridorStats.dataAsOf ?? 'N/A'} · Total market sourced; ODL share not public.
        </p>
        
        {/* Alert Ticker */}
        <motion.div 
          className="cyber-panel p-3 mb-6 border-cyber-purple/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="flex items-center gap-2 shrink-0">
              <Bell size={14} className="text-cyber-purple" />
              <span className="font-cyber text-xs text-cyber-purple">TRACKED ALERTS</span>
              <span className="text-[9px] text-cyber-muted">(curated)</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <motion.div 
                className="flex items-center gap-8 whitespace-nowrap"
                animate={{ x: [0, -800] }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              >
                {[...alerts, ...alerts].map((alert, idx) => (
                  <span key={idx} className="text-sm text-cyber-text">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      alert.severity === 'high' ? 'bg-cyber-red' : 
                      alert.severity === 'medium' ? 'bg-cyber-yellow' : 'bg-cyber-green'
                    }`} />
                    {alert.title}: {alert.summary}
                  </span>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Risk Radar */}
          <motion.div 
            className="lg:col-span-4 space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="cyber-panel p-4 border-cyber-purple/30">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                <Eye size={16} className="text-cyber-purple" />
                <span className="font-cyber text-sm text-cyber-purple">RISK RADAR</span>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={riskMetrics}>
                    <PolarGrid stroke="rgba(168, 85, 247, 0.2)" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: '#64748b', fontSize: 10 }}
                    />
                    <Radar
                      name="Risk"
                      dataKey="value"
                      stroke="#a855f7"
                      fill="#a855f7"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-4">
                {riskMetrics.map((metric) => (
                  <div key={metric.subject} className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/50">
                    <p className="text-xs text-cyber-muted">{metric.subject}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 cyber-progress h-1.5">
                        <div 
                          className={`cyber-progress-bar ${metric.value >= 70 ? 'bg-cyber-green' : metric.value >= 50 ? 'bg-cyber-yellow' : 'bg-cyber-red'}`}
                          style={{ width: `${metric.value}%` }}
                        />
                      </div>
                      <span className={`text-xs font-cyber ${metric.value >= 70 ? 'text-cyber-green' : metric.value >= 50 ? 'text-cyber-yellow' : 'text-cyber-red'}`}>{metric.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          
          {/* Center Column - Timeline */}
          <motion.div 
            className="lg:col-span-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="cyber-panel p-4 border-cyber-purple/30">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                <Clock size={16} className="text-cyber-glow" />
                <span className="font-cyber text-sm text-cyber-glow">REGULATORY TIMELINE</span>
              </div>
              
              <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                {regulatoryTimeline.map((event, idx) => {
                  const Icon = event.icon
                  const typeColors = {
                    positive: 'border-cyber-green bg-cyber-green/10 text-cyber-green',
                    negative: 'border-cyber-red bg-cyber-red/10 text-cyber-red',
                    neutral: 'border-cyber-yellow bg-cyber-yellow/10 text-cyber-yellow'
                  }
                  
                  return (
                    <motion.a
                      key={idx}
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative pl-8 block group"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + idx * 0.1 }}
                    >
                      {/* Timeline Line */}
                      {idx < regulatoryTimeline.length - 1 && (
                        <div className="absolute left-3 top-8 bottom-0 w-px bg-gradient-to-b from-cyber-purple to-transparent" />
                      )}
                      
                      {/* Event Dot */}
                      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 ${typeColors[event.type as keyof typeof typeColors]} flex items-center justify-center`}>
                        <Icon size={12} />
                      </div>
                      
                      {/* Event Content */}
                      <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-border/50 hover:border-cyber-purple/30 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-cyber text-sm text-cyber-text group-hover:text-cyber-glow transition-colors">{event.title}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              event.status === 'active' ? 'bg-cyber-green/20 text-cyber-green' :
                              event.status === 'pending' ? 'bg-cyber-yellow/20 text-cyber-yellow' :
                              'bg-cyber-orange/20 text-cyber-orange'
                            }`}>{event.status}</span>
                            <span className="text-xs text-cyber-muted">{event.date}</span>
                          </div>
                        </div>
                        <p className="text-xs text-cyber-muted">{event.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-cyber-purple">{event.jurisdiction}</span>
                          <ExternalLink size={10} className="text-cyber-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </motion.a>
                  )
                })}
              </div>
            </div>
          </motion.div>
          
          {/* Right Column - Recent Alerts */}
          <motion.div 
            className="lg:col-span-3 space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Recent Alerts */}
            <div className="cyber-panel p-4 border-cyber-purple/30">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                <AlertTriangle size={16} className="text-cyber-yellow" />
                <span className="font-cyber text-sm text-cyber-yellow">RECENT ALERTS</span>
              </div>
              
              <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                {alerts.map((alert, idx) => {
                  const severityColors = {
                    high: 'border-cyber-red/50 bg-cyber-red/5',
                    medium: 'border-cyber-yellow/50 bg-cyber-yellow/5',
                    low: 'border-cyber-green/50 bg-cyber-green/5'
                  }
                  
                  return (
                    <motion.a
                      key={idx}
                      href={alert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block p-2 rounded border ${severityColors[alert.severity as keyof typeof severityColors]} hover:bg-cyber-darker/50 transition-colors group`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + idx * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-cyber-text font-medium">{alert.title}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                          alert.severity === 'high' ? 'bg-cyber-red/20 text-cyber-red' :
                          alert.severity === 'medium' ? 'bg-cyber-yellow/20 text-cyber-yellow' :
                          'bg-cyber-green/20 text-cyber-green'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-[10px] text-cyber-muted line-clamp-2">{alert.summary}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] text-cyber-muted">{alert.time}</span>
                        <ExternalLink size={8} className="text-cyber-muted opacity-0 group-hover:opacity-100" />
                      </div>
                    </motion.a>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Bottom Section - Compliance Summaries */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {[
            {
              title: 'SEC/CFTC Status',
              icon: Scale,
              items: [
                'XRP classified as non-security (programmatic sales)',
                'Spot BTC & ETH ETFs approved and trading',
                'CLARITY Act / FIT21 lineage: SEC vs CFTC digital-asset roles',
                'ETF applications for XRP under consideration'
              ],
              color: 'cyber-glow',
              stat: `${regulatoryItems.filter(i => i.type.includes('SEC') || i.type.includes('CFTC')).length} items`,
            },
            {
              title: 'Global Framework',
              icon: Globe,
              items: [
                'MiCA fully implemented in EU',
                `${odlPartners.length} active ODL partners worldwide`,
                `${Object.values(countryRegulatoryStatus).filter(c => c.status === 'favorable').length} favorable jurisdictions`,
                'FATF Travel Rule compliance active'
              ],
              color: 'cyber-purple',
              stat: `${stats.countriesWithProfiles} jurisdictions`,
            },
            {
              title: 'Cross-Chain Bridges',
              icon: Landmark,
              items: [
                `${xrplConnectedChains.filter(c => c.status === 'mainnet').length} mainnet chains connected`,
                `${crossChainBridges.filter(b => b.status === 'mainnet').length} active bridge protocols`,
                'XRPL EVM Sidechain live',
                'Flare FAssets enabling trustless XRP'
              ],
              color: 'cyber-cyan',
              stat: corridorStats.estimatedMonthlyVolume,
            },
            {
              title: 'Executive Orders',
              icon: Shield,
              items: [
                'EO 14178 pro-innovation directive',
                'Interagency coordination mandated',
                'CBDC research ongoing',
                'Digital Dollar study in progress'
              ],
              color: 'cyber-green',
              stat: 'Active',
            },
          ].map((card) => {
            const Icon = card.icon
            return (
              <div key={card.title} className={`cyber-panel p-4 border-${card.color}/30`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Icon size={18} className={`text-${card.color}`} />
                    <h3 className={`font-cyber text-sm text-${card.color}`}>{card.title}</h3>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded bg-${card.color}/20 text-${card.color}`}>
                    {card.stat}
                  </span>
                </div>
                <ul className="space-y-2">
                  {card.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <ChevronRight size={14} className={`text-${card.color} mt-0.5 shrink-0`} />
                      <span className="text-xs text-cyber-text">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </motion.div>
        
        {/* Regulatory Agencies Quick Links */}
        <motion.div 
          className="mt-6 cyber-panel p-4 border-cyber-purple/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
            <Building size={16} className="text-cyber-orange" />
            <span className="font-cyber text-sm text-cyber-orange">REGULATORY AGENCIES</span>
            <span className="text-xs text-cyber-muted ml-2">({regulatoryAgencies.length} tracked)</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {regulatoryAgencies.map((agency) => (
              <a
                key={agency.id}
                href={agency.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-3 py-1.5 rounded bg-cyber-darker/50 border border-${agency.color}/30 hover:border-${agency.color}/60 hover:bg-${agency.color}/10 transition-all group`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-cyber text-${agency.color}`}>{agency.shortName}</span>
                  <span className="text-[9px] text-cyber-muted">{agency.jurisdiction}</span>
                  <ExternalLink size={8} className="text-cyber-muted opacity-0 group-hover:opacity-100" />
                </div>
              </a>
            ))}
          </div>
        </motion.div>
        </>
        )}
    </div>
  )
}

export default function Underworld() {
  return (
    <div className="min-h-screen pt-20 pb-8 px-4 lg:px-8">
      <RegulationsContent />
    </div>
  )
}
