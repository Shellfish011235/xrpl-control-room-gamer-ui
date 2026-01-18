import { motion } from 'framer-motion'
import { 
  Globe, MapPin, Server, Users, Zap, Activity, Database,
  ChevronRight, Filter, Search, Maximize2, Layers
} from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts'

// Mock data
const networkStats = [
  { label: 'Active Validators', value: '150+', change: '+3', color: 'cyber-green' },
  { label: 'Total Nodes', value: '1,247', change: '+12', color: 'cyber-glow' },
  { label: 'Countries', value: '45', change: '+2', color: 'cyber-purple' },
  { label: 'TPS (Current)', value: '1,500', change: '+8.3%', color: 'cyber-cyan' },
]

const regionData = [
  { name: 'North America', nodes: 420, validators: 52, color: '#00d4ff' },
  { name: 'Europe', nodes: 380, validators: 48, color: '#a855f7' },
  { name: 'Asia Pacific', nodes: 290, validators: 35, color: '#00ff88' },
  { name: 'Latin America', nodes: 85, validators: 10, color: '#ffd700' },
  { name: 'Other', nodes: 72, validators: 5, color: '#ff8c00' },
]

const tpsHistory = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  tps: Math.floor(800 + Math.random() * 700),
  ledgers: Math.floor(200 + Math.random() * 100)
}))

const hotspots = [
  { city: 'San Francisco', lat: 37.7749, lng: -122.4194, nodes: 85, type: 'hub' },
  { city: 'London', lat: 51.5074, lng: -0.1278, nodes: 72, type: 'hub' },
  { city: 'Singapore', lat: 1.3521, lng: 103.8198, nodes: 65, type: 'hub' },
  { city: 'Tokyo', lat: 35.6762, lng: 139.6503, nodes: 58, type: 'validator' },
  { city: 'Frankfurt', lat: 50.1109, lng: 8.6821, nodes: 48, type: 'validator' },
  { city: 'Sydney', lat: -33.8688, lng: 151.2093, nodes: 42, type: 'node' },
]

export default function WorldMap() {
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
          {networkStats.map((stat, idx) => (
            <div key={stat.label} className="cyber-panel p-4">
              <p className="text-xs text-cyber-muted mb-1">{stat.label}</p>
              <div className="flex items-end gap-2">
                <span className={`font-cyber text-2xl text-${stat.color}`}>{stat.value}</span>
                <span className="text-xs text-cyber-green mb-1">{stat.change}</span>
              </div>
            </div>
          ))}
        </motion.div>
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Filters */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="cyber-panel p-4 sticky top-24">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                <Filter size={14} className="text-cyber-glow" />
                <span className="font-cyber text-sm text-cyber-glow">FILTERS</span>
              </div>
              
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
                  <input 
                    type="text"
                    placeholder="Search location..."
                    className="w-full bg-cyber-darker border border-cyber-border rounded pl-9 pr-3 py-2 text-sm text-cyber-text placeholder:text-cyber-muted focus:border-cyber-glow focus:outline-none"
                  />
                </div>
              </div>
              
              {/* Region Filter */}
              <div className="mb-4">
                <p className="text-xs text-cyber-muted mb-2">REGION</p>
                <div className="space-y-2">
                  {['All Regions', 'North America', 'Europe', 'Asia Pacific', 'Other'].map((region) => (
                    <label key={region} className="flex items-center gap-2 cursor-pointer group">
                      <div className="w-4 h-4 rounded border border-cyber-border group-hover:border-cyber-glow transition-colors flex items-center justify-center">
                        {region === 'All Regions' && <div className="w-2 h-2 rounded-sm bg-cyber-glow" />}
                      </div>
                      <span className="text-sm text-cyber-text">{region}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Node Type Filter */}
              <div className="mb-4">
                <p className="text-xs text-cyber-muted mb-2">NODE TYPE</p>
                <div className="space-y-2">
                  {[
                    { name: 'Validators', color: 'cyber-purple' },
                    { name: 'Full Nodes', color: 'cyber-glow' },
                    { name: 'Hubs', color: 'cyber-green' },
                  ].map((type) => (
                    <label key={type.name} className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-4 h-4 rounded border border-${type.color}/50 group-hover:border-${type.color} transition-colors flex items-center justify-center`}>
                        <div className={`w-2 h-2 rounded-sm bg-${type.color}`} />
                      </div>
                      <span className="text-sm text-cyber-text">{type.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Layers */}
              <div>
                <p className="text-xs text-cyber-muted mb-2">LAYERS</p>
                <div className="space-y-2">
                  {['Network Traffic', 'Validator UNLs', 'Latency Heat Map'].map((layer) => (
                    <button key={layer} className="w-full flex items-center gap-2 p-2 rounded bg-cyber-darker/50 border border-cyber-border hover:border-cyber-glow/30 transition-all text-left">
                      <Layers size={14} className="text-cyber-muted" />
                      <span className="text-xs text-cyber-text">{layer}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Center - Map Visualization */}
          <motion.div 
            className="lg:col-span-7"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="cyber-panel p-4 h-full">
              {/* Map Controls */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded bg-cyber-darker border border-cyber-border hover:border-cyber-glow transition-colors">
                    <Maximize2 size={16} className="text-cyber-muted" />
                  </button>
                  <span className="font-cyber text-sm text-cyber-muted">Interactive Globe</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-cyber-muted">Zoom:</span>
                  <input type="range" min="1" max="10" defaultValue="3" className="w-24 accent-cyber-glow" />
                </div>
              </div>
              
              {/* Map Placeholder - SVG World Map */}
              <div className="relative aspect-[16/10] rounded-lg bg-cyber-darker overflow-hidden border border-cyber-border">
                {/* World Map Background */}
                <div className="absolute inset-0 opacity-30">
                  <svg viewBox="0 0 1000 500" className="w-full h-full">
                    {/* Simplified world continents */}
                    <path 
                      d="M150,150 Q200,100 280,120 L350,150 Q400,180 380,220 L300,250 Q250,280 200,250 L150,200 Z" 
                      fill="rgba(0, 212, 255, 0.2)" 
                      stroke="rgba(0, 212, 255, 0.5)"
                    />
                    <path 
                      d="M450,100 Q500,80 580,100 L620,150 Q650,200 600,250 L520,280 Q470,260 450,200 Z" 
                      fill="rgba(168, 85, 247, 0.2)" 
                      stroke="rgba(168, 85, 247, 0.5)"
                    />
                    <path 
                      d="M700,120 Q780,100 850,140 L880,200 Q900,280 820,320 L720,300 Q680,250 700,180 Z" 
                      fill="rgba(0, 255, 136, 0.2)" 
                      stroke="rgba(0, 255, 136, 0.5)"
                    />
                    <path 
                      d="M200,300 Q250,280 300,320 L320,380 Q300,420 250,400 L200,350 Z" 
                      fill="rgba(255, 215, 0, 0.2)" 
                      stroke="rgba(255, 215, 0, 0.5)"
                    />
                    <path 
                      d="M750,350 Q800,330 850,360 L870,420 Q850,450 800,440 L750,400 Z" 
                      fill="rgba(0, 212, 255, 0.2)" 
                      stroke="rgba(0, 212, 255, 0.5)"
                    />
                  </svg>
                </div>
                
                {/* Node Hotspots */}
                {hotspots.map((spot, idx) => {
                  const x = ((spot.lng + 180) / 360) * 100
                  const y = ((90 - spot.lat) / 180) * 100
                  const colors = {
                    hub: 'cyber-glow',
                    validator: 'cyber-purple',
                    node: 'cyber-green'
                  }
                  const color = colors[spot.type as keyof typeof colors]
                  
                  return (
                    <motion.div
                      key={spot.city}
                      className="absolute"
                      style={{ left: `${x}%`, top: `${y}%` }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.5 + idx * 0.1 }}
                    >
                      <div className="relative group cursor-pointer">
                        {/* Pulse Ring */}
                        <div className={`absolute -inset-4 rounded-full bg-${color}/20 animate-ping`} />
                        
                        {/* Node Dot */}
                        <div className={`w-3 h-3 rounded-full bg-${color} shadow-lg shadow-${color}/50`} />
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="cyber-panel px-3 py-2 whitespace-nowrap">
                            <p className="font-cyber text-sm text-cyber-text">{spot.city}</p>
                            <p className="text-xs text-cyber-muted">{spot.nodes} nodes</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
                
                {/* Connection Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <defs>
                    <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgba(0, 212, 255, 0.6)" />
                      <stop offset="100%" stopColor="rgba(168, 85, 247, 0.6)" />
                    </linearGradient>
                  </defs>
                  {/* Animated connection lines between hubs */}
                  <line x1="15%" y1="35%" x2="48%" y2="28%" stroke="url(#connectionGradient)" strokeWidth="1" strokeDasharray="4,4" className="animate-pulse" />
                  <line x1="48%" y1="28%" x2="82%" y2="32%" stroke="url(#connectionGradient)" strokeWidth="1" strokeDasharray="4,4" className="animate-pulse" />
                  <line x1="15%" y1="35%" x2="25%" y2="60%" stroke="rgba(255, 215, 0, 0.4)" strokeWidth="1" strokeDasharray="4,4" />
                </svg>
                
                {/* Grid Overlay */}
                <div className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(90deg, rgba(0, 212, 255, 0.1) 1px, transparent 1px),
                      linear-gradient(rgba(0, 212, 255, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '10% 10%'
                  }}
                />
              </div>
              
              {/* Legend */}
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-cyber-border">
                {[
                  { label: 'Hub', color: 'bg-cyber-glow' },
                  { label: 'Validator', color: 'bg-cyber-purple' },
                  { label: 'Full Node', color: 'bg-cyber-green' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-xs text-cyber-muted">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          
          {/* Right Sidebar - Stats */}
          <motion.div 
            className="lg:col-span-3 space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Region Distribution */}
            <div className="cyber-panel p-4">
              <h3 className="font-cyber text-sm text-cyber-glow mb-4">REGION DISTRIBUTION</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={regionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
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
                    <span className="text-xs text-cyber-muted">{region.nodes}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* TPS Chart */}
            <div className="cyber-panel p-4">
              <h3 className="font-cyber text-sm text-cyber-glow mb-4">NETWORK TPS (24H)</h3>
              <div className="h-32">
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
            
            {/* Top Locations */}
            <div className="cyber-panel p-4">
              <h3 className="font-cyber text-sm text-cyber-purple mb-4">TOP LOCATIONS</h3>
              <div className="space-y-2">
                {hotspots.slice(0, 5).map((spot, idx) => (
                  <div key={spot.city} className="flex items-center justify-between p-2 rounded bg-cyber-darker/50 border border-cyber-border/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-cyber-muted w-4">{idx + 1}.</span>
                      <MapPin size={12} className="text-cyber-glow" />
                      <span className="text-sm text-cyber-text">{spot.city}</span>
                    </div>
                    <span className="text-xs text-cyber-glow">{spot.nodes}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
