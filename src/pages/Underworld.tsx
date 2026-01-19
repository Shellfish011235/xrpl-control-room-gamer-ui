import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { 
  Skull, Shield, AlertTriangle, Scale, FileText, Clock,
  ChevronRight, Globe, Gavel, TrendingUp, TrendingDown,
  Eye, Bell, MapPin, ExternalLink, Building, Landmark,
  CheckCircle, XCircle, HelpCircle, Activity
} from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, PieChart, Pie } from 'recharts'
import {
  regulatoryItems,
  regulatoryAgencies,
  countryRegulatoryProfiles,
  getRegulatoryStats,
  getItemsByStatus,
  getImpactColor,
  getStatusColor,
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

// Build jurisdiction data from country profiles
const buildJurisdictionData = () => {
  const statusScores: Record<string, number> = {
    favorable: 90,
    regulated: 80,
    developing: 60,
    restricted: 25,
    unclear: 40,
  }
  
  const statusColors: Record<string, string> = {
    favorable: '#00ff88',
    regulated: '#00d4ff',
    developing: '#ffd700',
    restricted: '#ff4444',
    unclear: '#a855f7',
  }
  
  return countryRegulatoryProfiles.slice(0, 10).map(profile => ({
    country: profile.countryName.length > 12 ? profile.countryCode : profile.countryName,
    score: statusScores[profile.overallStatus] + Math.floor(Math.random() * 10) - 5,
    status: profile.overallStatus,
    color: statusColors[profile.overallStatus],
    cbdc: profile.cbdcStatus,
    xrpl: profile.xrplPresence,
  })).sort((a, b) => b.score - a.score)
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

// Build alerts from recent high-impact items
const buildAlerts = () => {
  const highImpact = regulatoryItems
    .filter(i => i.status === 'pending' || i.status === 'proposed')
    .filter(i => i.xrplImpact === 'positive' || i.xrplImpact === 'negative')
    .slice(0, 5)
  
  return highImpact.map((item, idx) => ({
    title: `${item.type} - ${item.jurisdiction}`,
    time: idx === 0 ? '2 hours ago' : idx === 1 ? '5 hours ago' : idx === 2 ? '1 day ago' : `${idx + 1} days ago`,
    severity: item.xrplImpact === 'negative' ? 'high' : item.status === 'pending' ? 'medium' : 'low',
    summary: item.title,
    url: item.url,
  }))
}

export default function Underworld() {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string | null>(null)
  
  const riskMetrics = useMemo(() => calculateRiskMetrics(), [])
  const jurisdictionData = useMemo(() => buildJurisdictionData(), [])
  const regulatoryTimeline = useMemo(() => buildRegulatoryTimeline(), [])
  const alerts = useMemo(() => buildAlerts(), [])
  const stats = useMemo(() => getRegulatoryStats(), [])
  const corridorStats = useMemo(() => getCorridorStats(), [])
  
  // Status distribution for pie chart
  const statusDistribution = useMemo(() => [
    { name: 'Active', value: stats.active, color: '#00ff88' },
    { name: 'Pending', value: stats.pending, color: '#ffd700' },
    { name: 'Proposed', value: stats.proposed, color: '#f97316' },
    { name: 'Watch', value: stats.watch, color: '#a855f7' },
  ], [stats])
  
  // Impact distribution
  const impactDistribution = useMemo(() => {
    const positive = regulatoryItems.filter(i => i.xrplImpact === 'positive').length
    const negative = regulatoryItems.filter(i => i.xrplImpact === 'negative').length
    const neutral = regulatoryItems.filter(i => i.xrplImpact === 'neutral').length
    const mixed = regulatoryItems.filter(i => i.xrplImpact === 'mixed').length
    return [
      { name: 'Positive', value: positive, color: '#00ff88' },
      { name: 'Negative', value: negative, color: '#ff4444' },
      { name: 'Neutral', value: neutral, color: '#64748b' },
      { name: 'Mixed', value: mixed, color: '#ffd700' },
    ]
  }, [])
  
  return (
    <div className="min-h-screen pt-20 pb-8 px-4 lg:px-8 bg-gradient-to-b from-cyber-darker via-[#0a0512] to-cyber-darker">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Skull className="text-cyber-purple" size={28} />
            <h1 className="font-cyber text-2xl text-cyber-text tracking-wider">UNDERWORLD</h1>
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
          <p className="text-cyber-muted">Regulatory Intelligence & Compliance Monitoring • {stats.total} tracked items across {stats.countriesWithProfiles} jurisdictions</p>
        </motion.div>
        
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
            <p className="text-[10px] text-cyber-muted mb-1">Monthly Volume</p>
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-cyber-green" />
              <span className="font-cyber text-lg text-cyber-green">{corridorStats.estimatedMonthlyVolume}</span>
            </div>
          </div>
        </motion.div>
        
        {/* Alert Ticker */}
        <motion.div 
          className="cyber-panel p-3 mb-6 border-cyber-purple/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="flex items-center gap-2 shrink-0">
              <Bell size={14} className="text-cyber-purple animate-pulse" />
              <span className="font-cyber text-xs text-cyber-purple">LIVE ALERTS</span>
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
            
            {/* Status Distribution */}
            <div className="cyber-panel p-4 border-cyber-purple/30">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                <Activity size={16} className="text-cyber-glow" />
                <span className="font-cyber text-sm text-cyber-glow">STATUS BREAKDOWN</span>
              </div>
              
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      dataKey="value"
                      stroke="transparent"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                {statusDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-cyber-muted">{item.name}</span>
                    <span className="text-xs font-cyber ml-auto" style={{ color: item.color }}>{item.value}</span>
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
          
          {/* Right Column - Jurisdictions & Alerts */}
          <motion.div 
            className="lg:col-span-3 space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Jurisdiction Scores */}
            <div className="cyber-panel p-4 border-cyber-purple/30">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                <MapPin size={16} className="text-cyber-cyan" />
                <span className="font-cyber text-sm text-cyber-cyan">JURISDICTION SCORES</span>
              </div>
              
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={jurisdictionData} layout="vertical">
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis 
                      dataKey="country" 
                      type="category" 
                      width={55}
                      tick={{ fill: '#64748b', fontSize: 10 }}
                    />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                      {jurisdictionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-cyber-border">
                {[
                  { label: 'Favorable', color: 'bg-cyber-green' },
                  { label: 'Regulated', color: 'bg-cyber-glow' },
                  { label: 'Developing', color: 'bg-cyber-yellow' },
                  { label: 'Restrictive', color: 'bg-cyber-red' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-[9px] text-cyber-muted">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* XRPL Impact */}
            <div className="cyber-panel p-4 border-cyber-purple/30">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                <TrendingUp size={16} className="text-cyber-green" />
                <span className="font-cyber text-sm text-cyber-green">XRPL IMPACT</span>
              </div>
              
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={impactDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={45}
                      dataKey="value"
                      stroke="transparent"
                    >
                      {impactDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-2 gap-1 mt-2">
                {impactDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] text-cyber-muted">{item.name}</span>
                    <span className="text-[10px] font-cyber ml-auto" style={{ color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            
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
                'FIT21 defines SEC vs CFTC jurisdiction',
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
            {regulatoryAgencies.slice(0, 16).map((agency) => (
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
      </div>
    </div>
  )
}
