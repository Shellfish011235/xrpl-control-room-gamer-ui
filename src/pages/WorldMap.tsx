import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { 
  Globe, Server, Users, Link2,
  Route, Scale, Building, Eye, X
} from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { WorldGlobe } from '../components/globe/WorldGlobe'
import { useGlobeStore } from '../store/globeStore'
import { 
  lensMetadata, 
  getHubs, 
  getCorridors,
  getHubById,
  getCorridorById,
  getBriefForLens,
  countryRegulatoryStatus
} from '../data/globeContent'
import type { GlobeLens, GlobeHub } from '../types/globe'

// Lens icons mapping
const lensIcons: Record<GlobeLens, React.ReactNode> = {
  validators: <Server size={14} />,
  ilp: <Link2 size={14} />,
  corridors: <Route size={14} />,
  community: <Users size={14} />,
  regulation: <Scale size={14} />,
  projects: <Building size={14} />
}

const lensOrder: GlobeLens[] = ['validators', 'ilp', 'corridors', 'community', 'regulation', 'projects']

// Hub type colors
const hubTypeColors: Record<GlobeHub['type'], string> = {
  headquarters: '#00d4ff',
  financial: '#00aaff',
  validator: '#00ff88',
  development: '#a855f7',
  partnership: '#ffd700',
  regional_hq: '#00ffff',
  emerging: '#ff00ff',
  academic: '#6366f1',
  exchange: '#14b8a6'
}

const hubTypeLabels: Record<GlobeHub['type'], string> = {
  headquarters: 'Headquarters',
  financial: 'Financial Hub',
  validator: 'Validator Cluster',
  development: 'Development',
  partnership: 'Partnership',
  regional_hq: 'Regional HQ',
  emerging: 'Emerging',
  academic: 'Academic',
  exchange: 'Exchange Hub'
}

// Mock TPS data
const tpsHistory = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  tps: Math.floor(800 + Math.random() * 700),
}))

export default function WorldMap() {
  const { activeLens, setActiveLens, selection, clearSelection } = useGlobeStore()
  const hubs = useMemo(() => getHubs(), [])
  const corridors = useMemo(() => getCorridors(), [])
  const brief = useMemo(() => getBriefForLens(activeLens), [activeLens])
  const lens = lensMetadata[activeLens]
  
  // Get region distribution
  const regionData = useMemo(() => {
    const regions: Record<string, { nodes: number; color: string }> = {
      'North America': { nodes: 0, color: '#00d4ff' },
      'Europe': { nodes: 0, color: '#a855f7' },
      'Asia Pacific': { nodes: 0, color: '#00ff88' },
      'Middle East': { nodes: 0, color: '#ffd700' },
      'Other': { nodes: 0, color: '#ff8c00' },
    }
    
    hubs.forEach(hub => {
      if (['US', 'CA'].includes(hub.countryIso2)) regions['North America'].nodes += hub.validators
      else if (['GB', 'DE', 'FR', 'NL', 'CH'].includes(hub.countryIso2)) regions['Europe'].nodes += hub.validators
      else if (['JP', 'SG', 'KR', 'AU', 'IN'].includes(hub.countryIso2)) regions['Asia Pacific'].nodes += hub.validators
      else if (['AE'].includes(hub.countryIso2)) regions['Middle East'].nodes += hub.validators
      else regions['Other'].nodes += hub.validators
    })
    
    return Object.entries(regions).map(([name, data]) => ({ name, ...data }))
  }, [hubs])
  
  // Selection context
  const selectionContext = useMemo(() => {
    if (selection.type === 'none') return null
    
    if (selection.type === 'hub' && selection.id) {
      return getHubById(selection.id)
    }
    if (selection.type === 'corridor' && selection.id) {
      return getCorridorById(selection.id)
    }
    if (selection.type === 'country' && selection.countryIso2) {
      const status = countryRegulatoryStatus[selection.countryIso2]
      return { 
        name: selection.countryIso2, 
        description: status?.label || 'Selected country',
        type: 'country' as const
      }
    }
    return null
  }, [selection])
  
  // Network stats
  const networkStats = useMemo(() => [
    { label: 'Active Validators', value: hubs.reduce((sum, h) => sum + h.validators, 0).toString(), change: '+3', color: 'cyber-green' },
    { label: 'Total Hubs', value: hubs.length.toString(), change: '+2', color: 'cyber-glow' },
    { label: 'Corridors', value: corridors.length.toString(), change: '+1', color: 'cyber-purple' },
    { label: 'TPS (Current)', value: '1,500', change: '+8.3%', color: 'cyber-cyan' },
  ], [hubs, corridors])

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
            <Globe className="text-cyber-glow" size={28} />
            <h1 className="font-cyber text-2xl text-cyber-text tracking-wider">WORLD MAP</h1>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
              <span className="text-xs text-cyber-green font-cyber">LIVE</span>
            </div>
          </div>
          <p className="text-cyber-muted">Global XRPL Network Visualization & Analytics</p>
        </motion.div>
        
        {/* Stats Bar */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {networkStats.map((stat) => (
            <div key={stat.label} className="cyber-panel p-4">
              <p className="text-xs text-cyber-muted mb-1">{stat.label}</p>
              <div className="flex items-end gap-2">
                <span className={`font-cyber text-2xl text-${stat.color}`}>{stat.value}</span>
                <span className="text-xs text-cyber-green mb-1">{stat.change}</span>
              </div>
            </div>
          ))}
        </motion.div>
        
        {/* Lens Tabs */}
        <motion.div 
          className="cyber-panel p-2 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-1 flex-wrap">
            {lensOrder.map((lensKey) => {
              const meta = lensMetadata[lensKey]
              const isActive = activeLens === lensKey
              
              return (
                <button
                  key={lensKey}
                  onClick={() => setActiveLens(lensKey)}
                  className={`flex items-center gap-2 px-4 py-2 rounded font-cyber text-xs tracking-wider transition-all ${
                    isActive 
                      ? 'bg-cyber-glow/20 border border-cyber-glow/50' 
                      : 'text-cyber-muted hover:text-cyber-text hover:bg-cyber-border/30'
                  }`}
                  style={isActive ? { color: meta.color } : undefined}
                >
                  {lensIcons[lensKey]}
                  <span className="hidden sm:inline">{meta.label}</span>
                </button>
              )
            })}
          </div>
        </motion.div>
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Filters & Legend */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="cyber-panel p-4 sticky top-24">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                <Eye size={14} className="text-cyber-glow" />
                <span className="font-cyber text-sm text-cyber-glow">ACTIVE LENS</span>
              </div>
              
              <div className="mb-4">
                <div 
                  className="flex items-center gap-3 p-3 rounded bg-cyber-darker/50 border"
                  style={{ borderColor: `${lens.color}50` }}
                >
                  <div 
                    className="w-10 h-10 rounded flex items-center justify-center"
                    style={{ backgroundColor: `${lens.color}20`, color: lens.color }}
                  >
                    {lensIcons[activeLens]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-cyber-text">{lens.label}</p>
                    <p className="text-[10px] text-cyber-muted">{brief.items.length} items</p>
                  </div>
                </div>
                <p className="text-xs text-cyber-muted mt-2">{lens.description}</p>
              </div>
              
              {/* Hub Legend */}
              <div className="mb-4">
                <p className="text-xs text-cyber-muted mb-2 font-cyber">HUB TYPES</p>
                <div className="space-y-1">
                  {Object.entries(hubTypeColors).slice(0, 6).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-[10px] text-cyber-muted">
                        {hubTypeLabels[type as GlobeHub['type']]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Regulatory Legend (show on regulation lens) */}
              {activeLens === 'regulation' && (
                <div className="mb-4 pt-4 border-t border-cyber-border">
                  <p className="text-xs text-cyber-muted mb-2 font-cyber">REGULATORY STATUS</p>
                  <div className="space-y-1">
                    {[
                      { status: 'Favorable', color: 'rgba(0, 255, 136, 0.6)' },
                      { status: 'Regulated', color: 'rgba(0, 170, 255, 0.6)' },
                      { status: 'Developing', color: 'rgba(255, 215, 0, 0.6)' },
                      { status: 'Restricted', color: 'rgba(255, 68, 68, 0.6)' },
                    ].map((item) => (
                      <div key={item.status} className="flex items-center gap-2">
                        <div 
                          className="w-4 h-2 rounded-sm"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-[10px] text-cyber-muted">{item.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
          
          {/* Center - Globe */}
          <motion.div 
            className="lg:col-span-7"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="cyber-panel p-2 h-full min-h-[500px]">
              <WorldGlobe className="h-full min-h-[480px]" />
            </div>
          </motion.div>
          
          {/* Right Sidebar - Stats & Selection */}
          <motion.div 
            className="lg:col-span-3 space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Selection Panel */}
            {selectionContext && (
              <div className="cyber-panel p-4 border-cyber-glow/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-cyber text-sm text-cyber-glow">SELECTED</span>
                  <button 
                    onClick={clearSelection}
                    className="p-1 hover:bg-cyber-glow/10 rounded transition-colors"
                  >
                    <X size={14} className="text-cyber-muted" />
                  </button>
                </div>
                
                {'city' in selectionContext ? (
                  // Hub selection
                  <div>
                    <h3 className="font-cyber text-lg text-cyber-text mb-1">
                      {(selectionContext as GlobeHub).name}
                    </h3>
                    <p className="text-xs text-cyber-muted mb-3">
                      {(selectionContext as GlobeHub).city}, {(selectionContext as GlobeHub).countryIso2}
                    </p>
                    <p className="text-sm text-cyber-text mb-3">
                      {(selectionContext as GlobeHub).description}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/50 text-center">
                        <p className="font-cyber text-lg text-cyber-green">
                          {(selectionContext as GlobeHub).validators}
                        </p>
                        <p className="text-[10px] text-cyber-muted">Validators</p>
                      </div>
                      <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/50 text-center">
                        <p className="font-cyber text-lg text-cyber-purple">
                          {(selectionContext as GlobeHub).projects}
                        </p>
                        <p className="text-[10px] text-cyber-muted">Projects</p>
                      </div>
                    </div>
                  </div>
                ) : 'from' in selectionContext ? (
                  // Corridor selection
                  <div>
                    <h3 className="font-cyber text-lg text-cyber-text mb-1">
                      {selectionContext.name}
                    </h3>
                    <p className="text-sm text-cyber-text mb-2">
                      {selectionContext.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs border ${
                        selectionContext.volume === 'high' ? 'border-cyber-green/50 text-cyber-green' :
                        selectionContext.volume === 'medium' ? 'border-cyber-yellow/50 text-cyber-yellow' :
                        'border-cyber-muted/50 text-cyber-muted'
                      }`}>
                        {selectionContext.volume} volume
                      </span>
                      <span className="px-2 py-1 rounded text-xs border border-cyber-purple/50 text-cyber-purple">
                        {selectionContext.type}
                      </span>
                    </div>
                  </div>
                ) : (
                  // Country selection
                  <div>
                    <h3 className="font-cyber text-lg text-cyber-text mb-1">
                      {selectionContext.name}
                    </h3>
                    <p className="text-sm text-cyber-muted">
                      {selectionContext.description}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Region Distribution */}
            <div className="cyber-panel p-4">
              <h3 className="font-cyber text-sm text-cyber-glow mb-4">REGION DISTRIBUTION</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={regionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={60}
                      dataKey="nodes"
                      stroke="transparent"
                    >
                      {regionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {regionData.map((region) => (
                  <div key={region.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: region.color }} />
                      <span className="text-xs text-cyber-text">{region.name}</span>
                    </div>
                    <span className="text-xs text-cyber-muted font-cyber">{region.nodes}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* TPS Chart */}
            <div className="cyber-panel p-4">
              <h3 className="font-cyber text-sm text-cyber-cyan mb-4">NETWORK TPS (24H)</h3>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tpsHistory}>
                    <defs>
                      <linearGradient id="tpsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="tps" 
                      stroke="#00d4ff" 
                      fill="url(#tpsGradient)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Top Hubs */}
            <div className="cyber-panel p-4">
              <h3 className="font-cyber text-sm text-cyber-purple mb-4">TOP HUBS</h3>
              <div className="space-y-2">
                {hubs.slice(0, 5).map((hub, idx) => (
                  <button
                    key={hub.id}
                    onClick={() => useGlobeStore.getState().setSelection({ type: 'hub', id: hub.id, countryIso2: hub.countryIso2 })}
                    className="w-full flex items-center justify-between p-2 rounded bg-cyber-darker/50 border border-cyber-border/50 hover:border-cyber-glow/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-cyber-muted w-4">{idx + 1}.</span>
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: hubTypeColors[hub.type] }}
                      />
                      <span className="text-sm text-cyber-text">{hub.city}</span>
                    </div>
                    <span className="text-xs text-cyber-glow font-cyber">{hub.validators}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
