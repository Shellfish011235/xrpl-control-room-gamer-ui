import { motion } from 'framer-motion'
import { 
  Skull, Shield, AlertTriangle, Scale, FileText, Clock,
  ChevronRight, TrendingUp, TrendingDown, Globe, Gavel,
  Eye, Bell, MapPin, Calendar
} from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell } from 'recharts'

// Mock data
const riskMetrics = [
  { subject: 'SEC Clarity', value: 75, fullMark: 100 },
  { subject: 'CFTC Position', value: 85, fullMark: 100 },
  { subject: 'Global Adoption', value: 90, fullMark: 100 },
  { subject: 'Banking Access', value: 60, fullMark: 100 },
  { subject: 'Tax Framework', value: 70, fullMark: 100 },
  { subject: 'DeFi Regs', value: 45, fullMark: 100 },
]

const jurisdictionData = [
  { country: 'USA', score: 72, status: 'developing', color: '#00d4ff' },
  { country: 'EU', score: 85, status: 'favorable', color: '#00ff88' },
  { country: 'UK', score: 78, status: 'favorable', color: '#00ff88' },
  { country: 'Japan', score: 92, status: 'favorable', color: '#00ff88' },
  { country: 'Singapore', score: 88, status: 'favorable', color: '#00ff88' },
  { country: 'UAE', score: 82, status: 'favorable', color: '#00d4ff' },
  { country: 'China', score: 25, status: 'restrictive', color: '#ff4444' },
]

const regulatoryTimeline = [
  {
    date: 'Jan 2026',
    title: 'GENIUS Act Progress',
    description: 'Stablecoin regulatory framework advances in Congress',
    type: 'positive',
    icon: FileText
  },
  {
    date: 'Dec 2025',
    title: 'SEC vs Ripple Appeal',
    description: 'SEC appeal deadline approaches for landmark case',
    type: 'neutral',
    icon: Gavel
  },
  {
    date: 'Nov 2025',
    title: 'EO 14178 Implementation',
    description: 'Executive Order on digital assets implementation begins',
    type: 'positive',
    icon: Shield
  },
  {
    date: 'Oct 2025',
    title: 'CFTC Guidance Update',
    description: 'New CFTC guidelines for digital commodities published',
    type: 'positive',
    icon: Scale
  },
  {
    date: 'Sep 2025',
    title: 'MiCA Full Effect',
    description: 'EU Markets in Crypto-Assets regulation fully implemented',
    type: 'positive',
    icon: Globe
  },
]

const alerts = [
  { 
    title: 'SEC Chairman Statement',
    time: '2 hours ago',
    severity: 'medium',
    summary: 'Chair Atkins signals openness to crypto ETF innovation'
  },
  { 
    title: 'Japan Licensing Update',
    time: '5 hours ago',
    severity: 'low',
    summary: 'FSA streamlines crypto exchange licensing process'
  },
  { 
    title: 'EU AML Directive',
    time: '1 day ago',
    severity: 'high',
    summary: 'New AML requirements for crypto service providers'
  },
]

export default function Underworld() {
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
              <div className="flex items-center gap-2 px-3 py-1 rounded bg-cyber-red/10 border border-cyber-red/30">
                <AlertTriangle size={14} className="text-cyber-red" />
                <span className="text-xs text-cyber-red font-cyber">3 ALERTS</span>
              </div>
            </div>
          </div>
          <p className="text-cyber-muted">Regulatory Intelligence & Compliance Monitoring</p>
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
                animate={{ x: [0, -500] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
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
            className="lg:col-span-4"
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
                          className="cyber-progress-bar bg-cyber-purple"
                          style={{ width: `${metric.value}%` }}
                        />
                      </div>
                      <span className="text-xs text-cyber-purple font-cyber">{metric.value}</span>
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
              
              <div className="space-y-4">
                {regulatoryTimeline.map((event, idx) => {
                  const Icon = event.icon
                  const typeColors = {
                    positive: 'border-cyber-green bg-cyber-green/10 text-cyber-green',
                    negative: 'border-cyber-red bg-cyber-red/10 text-cyber-red',
                    neutral: 'border-cyber-yellow bg-cyber-yellow/10 text-cyber-yellow'
                  }
                  
                  return (
                    <motion.div
                      key={event.title}
                      className="relative pl-8"
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
                          <span className="font-cyber text-sm text-cyber-text">{event.title}</span>
                          <span className="text-xs text-cyber-muted">{event.date}</span>
                        </div>
                        <p className="text-xs text-cyber-muted">{event.description}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
          
          {/* Right Column - Jurisdictions */}
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
              
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={jurisdictionData} layout="vertical">
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis 
                      dataKey="country" 
                      type="category" 
                      width={60}
                      tick={{ fill: '#64748b', fontSize: 11 }}
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
                  { label: 'Developing', color: 'bg-cyber-glow' },
                  { label: 'Restrictive', color: 'bg-cyber-red' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-xs text-cyber-muted">{item.label}</span>
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
              
              <div className="space-y-3">
                {alerts.map((alert, idx) => {
                  const severityColors = {
                    high: 'border-cyber-red/50 bg-cyber-red/5',
                    medium: 'border-cyber-yellow/50 bg-cyber-yellow/5',
                    low: 'border-cyber-green/50 bg-cyber-green/5'
                  }
                  
                  return (
                    <motion.div
                      key={alert.title}
                      className={`p-3 rounded border ${severityColors[alert.severity as keyof typeof severityColors]} cursor-pointer hover:bg-cyber-darker/50 transition-colors`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + idx * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-cyber-text font-medium">{alert.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          alert.severity === 'high' ? 'bg-cyber-red/20 text-cyber-red' :
                          alert.severity === 'medium' ? 'bg-cyber-yellow/20 text-cyber-yellow' :
                          'bg-cyber-green/20 text-cyber-green'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs text-cyber-muted mb-1">{alert.summary}</p>
                      <span className="text-xs text-cyber-muted">{alert.time}</span>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Bottom Section - Compliance Summaries */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6"
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
                'Institutional sales may still require registration',
                'ETF applications under review'
              ],
              color: 'cyber-glow'
            },
            {
              title: 'GENIUS Act',
              icon: FileText,
              items: [
                'Stablecoin regulatory framework proposed',
                'Federal licensing pathway for issuers',
                'Reserve and audit requirements defined'
              ],
              color: 'cyber-purple'
            },
            {
              title: 'Executive Order 14178',
              icon: Shield,
              items: [
                'Pro-innovation crypto policy directive',
                'Interagency coordination mandated',
                'Regulatory clarity timeline established'
              ],
              color: 'cyber-cyan'
            },
          ].map((card) => {
            const Icon = card.icon
            return (
              <div key={card.title} className={`cyber-panel p-4 border-${card.color}/30`}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon size={18} className={`text-${card.color}`} />
                  <h3 className={`font-cyber text-sm text-${card.color}`}>{card.title}</h3>
                </div>
                <ul className="space-y-2">
                  {card.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <ChevronRight size={14} className={`text-${card.color} mt-0.5 shrink-0`} />
                      <span className="text-sm text-cyber-text">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}
