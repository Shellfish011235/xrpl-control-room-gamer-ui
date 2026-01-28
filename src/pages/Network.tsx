import { motion, AnimatePresence } from 'framer-motion'
import { useMemo, useState, useEffect } from 'react'
import { 
  Globe, Server, Users, Link2,
  Route, Scale, Building, Eye, X, RefreshCw, Wifi, WifiOff,
  ArrowRight, ExternalLink, Shield, AlertTriangle, CheckCircle, Clock,
  Network as NetworkIcon
} from 'lucide-react'
import { ConnectorMap } from '../components/ilp/ConnectorMap'
import { useILPStore } from '../store/ilpStore'
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { WorldGlobe } from '../components/globe/WorldGlobe'
import { useGlobeStore } from '../store/globeStore'
import { useLiveNetworkData } from '../hooks/useLiveNetworkData'
import { 
  lensMetadata, 
  getHubs, 
  getCorridors,
  getHubById,
  getCorridorById,
  getBriefForLens,
  countryRegulatoryStatus
} from '../data/globeContent'
import {
  regulatoryItems,
  regulatoryAgencies,
  countryRegulatoryProfiles,
  getCountryProfile,
  getItemsForCountry,
  getGlobalItems,
  getRegulatoryStats,
  getStatusColor as getRegStatusColor,
  getImpactColor,
  getImpactIcon,
  getPassLikelihoodColor,
  type RegulatoryItem,
  type RegulatoryStatus,
  type RegulatoryCategory,
} from '../data/regulatoryData'
import {
  ilpRepositories,
  ilpConnectorInstances,
  ilpCorridors,
  ilpUseCases,
  ilpProtocolSpecs,
  getILPStats,
  getConnectorsByCountry,
  getRepositoriesByType,
  getXRPLIntegratedRepos,
  getTypeColor as getILPTypeColor,
  getStatusColor as getILPStatusColor,
  type ILPConnectorInstance,
  type ILPCorridor,
  type ILPRepository,
} from '../data/ilpData'
import {
  paymentCorridors,
  odlPartners,
  crossChainBridges,
  xrplConnectedChains,
  getCorridorStats,
  getCorridorsByCountry,
  getPartnersByCountry,
  getPartnerById,
  getCorridorById as getPaymentCorridorById,
  getChainById,
  getBridgeById,
  getVolumeColor,
  getTypeColor as getCorridorTypeColor,
  getChainStatusColor,
  type PaymentCorridor,
  type ODLPartner,
  type CrossChainBridge,
  type XRPLConnectedChain,
} from '../data/corridorData'
import type { GlobeLens, GlobeHub } from '../types/globe'
import {
  xrplCategories,
  getAllProjects,
  type XRPLProject,
} from '../data/xrplExpandedData'

// Lens icons mapping
const lensIcons: Record<GlobeLens, React.ReactNode> = {
  validators: <Server size={14} />,
  ilp: <Link2 size={14} />,
  corridors: <Route size={14} />,
  community: <Users size={14} />,  // Combined Community/Projects
  regulation: <Scale size={14} />,
}

const lensOrder: GlobeLens[] = ['validators', 'ilp', 'corridors', 'community', 'regulation']

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
  exchange: '#14b8a6',
  regulatory: '#f97316'
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
  exchange: 'Exchange Hub',
  regulatory: 'Regulatory Hub'
}

// Country code to name mapping for corridor legend
const countryCodeNames: Record<string, string> = {
  jp: 'Japan',
  ph: 'Philippines',
  vn: 'Vietnam',
  id: 'Indonesia',
  th: 'Thailand',
  my: 'Malaysia',
  sg: 'Singapore',
  kr: 'South Korea',
  mx: 'Mexico',
  us: 'United States',
  gb: 'United Kingdom',
  eu: 'Europe',
  ae: 'UAE',
  in: 'India',
  au: 'Australia',
  br: 'Brazil',
}

// Helper to decode corridor code like "jp-ph" to "Japan → Philippines"
function decodeCorridorCode(code: string): string {
  const parts = code.toLowerCase().split('-')
  if (parts.length === 2) {
    const from = countryCodeNames[parts[0]] || parts[0].toUpperCase()
    const to = countryCodeNames[parts[1]] || parts[1].toUpperCase()
    return `${from} → ${to}`
  }
  return code
}

export default function Network() {
  const { activeLens, setActiveLens, selection, clearSelection } = useGlobeStore()
  const { 
    validators: liveValidators,
    stats: liveStats,
    isLoading: isLoadingLive,
    error: liveError,
    showLiveData,
    toggleShowLiveData,
    refetch: refetchLiveData
  } = useLiveNetworkData({ refreshInterval: 60000 })
  
  const hubs = useMemo(() => getHubs(), [])
  const corridors = useMemo(() => getCorridors(), [])
  const brief = useMemo(() => getBriefForLens(activeLens), [activeLens])
  const lens = lensMetadata[activeLens]
  
  // Regulatory data state
  const [regFilter, setRegFilter] = useState<RegulatoryCategory | 'all'>('all')
  const [regStatusFilter, setRegStatusFilter] = useState<RegulatoryStatus | 'all'>('all')
  const regStats = useMemo(() => getRegulatoryStats(), [])
  
  // Get regulatory items for selected country
  const selectedCountryRegData = useMemo(() => {
    if (selection.type === 'country' && selection.countryIso2) {
      const profile = getCountryProfile(selection.countryIso2)
      const items = getItemsForCountry(selection.countryIso2)
      const globalItems = getGlobalItems()
      return { profile, items, globalItems }
    }
    return null
  }, [selection])
  
  // Filter regulatory items
  const filteredRegItems = useMemo(() => {
    let items = regulatoryItems
    
    if (regFilter !== 'all') {
      items = items.filter(i => i.categories.includes(regFilter))
    }
    if (regStatusFilter !== 'all') {
      items = items.filter(i => i.status === regStatusFilter)
    }
    
    return items
  }, [regFilter, regStatusFilter])
  
  // ILP data state
  const [ilpFilter, setIlpFilter] = useState<'all' | 'connectors' | 'repos' | 'corridors'>('all')
  const [selectedConnector, setSelectedConnector] = useState<ILPConnectorInstance | null>(null)
  const ilpStats = useMemo(() => getILPStats(), [])
  
  // Corridor data state
  const [corridorFilter, setCorridorFilter] = useState<'all' | 'corridors' | 'partners' | 'bridges' | 'chains'>('all')
  const [selectedBridge, setSelectedBridge] = useState<CrossChainBridge | null>(null)
  const [selectedChain, setSelectedChain] = useState<XRPLConnectedChain | null>(null)
  const [selectedPartner, setSelectedPartner] = useState<ODLPartner | null>(null)
  const corridorStats = useMemo(() => getCorridorStats(), [])
  
  // Community & Projects data state
  const [communityFilter, setCommunityFilter] = useState<keyof typeof xrplCategories | 'all'>('all')
  const [selectedProject, setSelectedProject] = useState<XRPLProject | null>(null)
  const allProjects = useMemo(() => getAllProjects(), [])
  
  // Filter community/projects items
  const filteredCommunityItems = useMemo(() => {
    if (communityFilter === 'all') {
      return allProjects
    }
    return allProjects.filter(p => p.category === communityFilter)
  }, [communityFilter, allProjects])
  
  // Get ILP data for selected country
  const selectedCountryILPData = useMemo(() => {
    if (selection.type === 'country' && selection.countryIso2) {
      const connectors = getConnectorsByCountry(selection.countryIso2)
      const corridorsFrom = ilpCorridors.filter(c => c.from.countryCode === selection.countryIso2)
      const corridorsTo = ilpCorridors.filter(c => c.to.countryCode === selection.countryIso2)
      return { connectors, corridorsFrom, corridorsTo }
    }
    return null
  }, [selection])
  
  // Get XRPL-integrated repos
  const xrplRepos = useMemo(() => getXRPLIntegratedRepos(), [])
  
  // Get corridor data for selected country
  const selectedCountryCorridorData = useMemo(() => {
    if (selection.type === 'country' && selection.countryIso2) {
      const corridorsFromTo = getCorridorsByCountry(selection.countryIso2)
      const partners = getPartnersByCountry(selection.countryIso2)
      return { corridors: corridorsFromTo, partners }
    }
    return null
  }, [selection])
  
  // Get region distribution - use live data when available
  const regionData = useMemo(() => {
    const regions: Record<string, { nodes: number; color: string }> = {
      'North America': { nodes: 0, color: '#00d4ff' },
      'Europe': { nodes: 0, color: '#a855f7' },
      'Asia Pacific': { nodes: 0, color: '#00ff88' },
      'Middle East': { nodes: 0, color: '#ffd700' },
      'Other': { nodes: 0, color: '#ff8c00' },
    }
    
    // Country code to region mapping
    const countryToRegion: Record<string, string> = {
      US: 'North America', CA: 'North America', MX: 'North America',
      GB: 'Europe', DE: 'Europe', FR: 'Europe', NL: 'Europe', CH: 'Europe',
      IT: 'Europe', ES: 'Europe', SE: 'Europe', NO: 'Europe', FI: 'Europe',
      PL: 'Europe', AT: 'Europe', BE: 'Europe', IE: 'Europe', PT: 'Europe',
      JP: 'Asia Pacific', SG: 'Asia Pacific', KR: 'Asia Pacific', 
      AU: 'Asia Pacific', IN: 'Asia Pacific', CN: 'Asia Pacific',
      HK: 'Asia Pacific', TW: 'Asia Pacific', NZ: 'Asia Pacific',
      TH: 'Asia Pacific', MY: 'Asia Pacific', PH: 'Asia Pacific',
      AE: 'Middle East', SA: 'Middle East', IL: 'Middle East',
      QA: 'Middle East', KW: 'Middle East', BH: 'Middle East',
    }
    
    if (showLiveData && liveStats && liveStats.topCountries.length > 0) {
      // Use live data
      liveStats.topCountries.forEach(({ code, count }) => {
        const region = countryToRegion[code] || 'Other'
        regions[region].nodes += count
      })
    } else {
      // Fallback to static hub data
      hubs.forEach(hub => {
        const region = countryToRegion[hub.countryIso2] || 'Other'
        regions[region].nodes += hub.validators
      })
    }
    
    return Object.entries(regions)
      .map(([name, data]) => ({ name, ...data }))
      .filter(r => r.nodes > 0)
  }, [hubs, liveStats, showLiveData])
  
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
  
  // Network stats - use live data when available
  const networkStats = useMemo(() => {
    if (liveStats && showLiveData) {
      return [
        { 
          label: 'UNL Validators', 
          value: liveStats.unlValidators.toString(), 
          change: `${liveStats.activeValidators} active`, 
          color: 'cyber-green',
          live: true
        },
        { 
          label: 'Total Validators', 
          value: liveStats.totalValidators.toString(), 
          change: `${(liveStats.averageAgreement * 100).toFixed(1)}% avg`, 
          color: 'cyber-glow',
          live: true
        },
        { 
          label: 'Agreement', 
          value: `${(liveStats.averageAgreement * 100).toFixed(1)}%`, 
          change: '24h average', 
          color: 'cyber-purple',
          live: true
        },
        { 
          label: 'Global Hubs', 
          value: hubs.length.toString(), 
          change: `${corridors.length} corridors`, 
          color: 'cyber-cyan',
          live: false
        },
      ]
    }
    
    // Fallback to static hub data
    return [
      { label: 'Active Validators', value: hubs.reduce((sum, h) => sum + h.validators, 0).toString(), change: '+3', color: 'cyber-green', live: false },
      { label: 'Total Hubs', value: hubs.length.toString(), change: '+2', color: 'cyber-glow', live: false },
      { label: 'Corridors', value: corridors.length.toString(), change: '+1', color: 'cyber-purple', live: false },
      { label: 'Agreement', value: '99.5%', change: '24h avg', color: 'cyber-cyan', live: false },
    ]
  }, [hubs, corridors, liveStats, showLiveData])

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
            <h1 className="font-cyber text-2xl text-cyber-text tracking-wider">NETWORK</h1>
            <div className="ml-auto flex items-center gap-4">
              {/* Live data toggle */}
              <button
                onClick={toggleShowLiveData}
                className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-all ${
                  showLiveData 
                    ? 'border-cyber-green/50 bg-cyber-green/10 text-cyber-green' 
                    : 'border-cyber-border text-cyber-muted hover:border-cyber-muted'
                }`}
              >
                {showLiveData ? <Wifi size={14} /> : <WifiOff size={14} />}
                <span className="text-xs font-cyber">
                  {showLiveData ? 'LIVE' : 'STATIC'}
                </span>
              </button>
              
              {/* Refresh button */}
              {showLiveData && (
                <button
                  onClick={() => refetchLiveData()}
                  disabled={isLoadingLive}
                  className="p-2 rounded border border-cyber-border hover:border-cyber-glow/50 hover:bg-cyber-glow/10 transition-all disabled:opacity-50"
                >
                  <RefreshCw size={14} className={`text-cyber-glow ${isLoadingLive ? 'animate-spin' : ''}`} />
                </button>
              )}
              
              {/* Status indicator */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  isLoadingLive 
                    ? 'bg-cyber-yellow animate-pulse' 
                    : liveError 
                      ? 'bg-red-500' 
                      : showLiveData && liveStats 
                        ? 'bg-cyber-green animate-pulse' 
                        : 'bg-cyber-muted'
                }`} />
                <span className={`text-xs font-cyber ${
                  isLoadingLive 
                    ? 'text-cyber-yellow' 
                    : liveError 
                      ? 'text-red-500' 
                      : showLiveData && liveStats 
                        ? 'text-cyber-green' 
                        : 'text-cyber-muted'
                }`}>
                  {isLoadingLive 
                    ? 'LOADING' 
                    : liveError 
                      ? 'ERROR' 
                      : showLiveData && liveStats 
                        ? 'XRPSCAN' 
                        : 'OFFLINE'}
                </span>
              </div>
            </div>
          </div>
          <p className="text-cyber-muted">
            Global XRPL Network Visualization & Analytics
            {showLiveData && liveStats && (
              <span className="ml-2 text-cyber-glow text-xs">
                • {liveValidators.length} validators mapped
              </span>
            )}
          </p>
          {liveError && (
            <p className="text-xs text-red-400 mt-1">
              ⚠️ {liveError}
            </p>
          )}
        </motion.div>
        
        {/* Stats Bar */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {networkStats.map((stat) => (
            <div key={stat.label} className="cyber-panel p-4 relative">
              {stat.live && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-cyber-green/20 border border-cyber-green/30">
                  <span className="text-[8px] font-cyber text-cyber-green">LIVE</span>
                </div>
              )}
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
              
              {/* Live Validator Legend - shown when live data is active */}
              {showLiveData && (activeLens === 'validators' || activeLens === 'community') && (
                <div className="mb-4">
                  <p className="text-xs text-cyber-muted mb-2 font-cyber">VALIDATOR STATUS</p>
                  <div className="space-y-1">
                    {[
                      { label: 'Excellent (99%+)', color: '#00ff88' },
                      { label: 'Good (95-99%)', color: '#00d4ff' },
                      { label: 'Warning (90-95%)', color: '#ffd700' },
                      { label: 'Poor (<90%)', color: '#ff4444' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-[10px] text-cyber-muted">
                          {item.label}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-cyber-border/30">
                      <div className="w-3 h-3 rounded-full border-2 border-cyber-green bg-transparent" />
                      <span className="text-[10px] text-cyber-muted">UNL Validator</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Hub Legend */}
              <div className="mb-4">
                <p className="text-xs text-cyber-muted mb-2 font-cyber">HUB TYPES ({hubs.length} total)</p>
                <div className="space-y-1 max-h-[180px] overflow-y-auto custom-scrollbar">
                  {Object.entries(hubTypeColors).map(([type, color]) => {
                    const count = hubs.filter(h => h.type === type).length;
                    return (
                      <div key={type} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-[10px] text-cyber-muted">
                            {hubTypeLabels[type as GlobeHub['type']]}
                          </span>
                        </div>
                        <span className="text-[9px] text-cyber-glow font-cyber">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* ILP Legend & Filters (show on ILP lens) */}
              {activeLens === 'ilp' && (
                <div className="mb-4 pt-4 border-t border-cyber-border">
                  <p className="text-xs text-cyber-muted mb-2 font-cyber">ILP NETWORK</p>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-1 mb-3">
                    <button 
                      onClick={() => setIlpFilter(ilpFilter === 'connectors' ? 'all' : 'connectors')}
                      className={`p-1.5 rounded text-center transition-all ${
                        ilpFilter === 'connectors' ? 'bg-cyber-green/20 border border-cyber-green/50' : 'bg-cyber-darker/50 border border-cyber-border/50'
                      }`}
                    >
                      <p className="text-sm font-cyber text-cyber-green">{ilpStats.activeConnectors}</p>
                      <p className="text-[8px] text-cyber-muted">Connectors</p>
                    </button>
                    <button 
                      onClick={() => setIlpFilter(ilpFilter === 'corridors' ? 'all' : 'corridors')}
                      className={`p-1.5 rounded text-center transition-all ${
                        ilpFilter === 'corridors' ? 'bg-cyber-purple/20 border border-cyber-purple/50' : 'bg-cyber-darker/50 border border-cyber-border/50'
                      }`}
                    >
                      <p className="text-sm font-cyber text-cyber-purple">{ilpStats.corridors}</p>
                      <p className="text-[8px] text-cyber-muted">Corridors</p>
                    </button>
                    <button 
                      onClick={() => setIlpFilter(ilpFilter === 'repos' ? 'all' : 'repos')}
                      className={`p-1.5 rounded text-center transition-all ${
                        ilpFilter === 'repos' ? 'bg-cyber-glow/20 border border-cyber-glow/50' : 'bg-cyber-darker/50 border border-cyber-border/50'
                      }`}
                    >
                      <p className="text-sm font-cyber text-cyber-glow">{ilpStats.totalRepos}</p>
                      <p className="text-[8px] text-cyber-muted">GitHub Repos</p>
                    </button>
                    <div className="p-1.5 rounded bg-cyber-darker/50 border border-cyber-border/50 text-center">
                      <p className="text-sm font-cyber text-cyber-yellow">{ilpStats.protocols}</p>
                      <p className="text-[8px] text-cyber-muted">Protocols</p>
                    </div>
                  </div>
                  
                  {/* Corridor Types Legend */}
                  <p className="text-[10px] text-cyber-muted mb-1 font-cyber">CORRIDOR TYPES</p>
                  <div className="space-y-1 mb-3">
                    {[
                      { type: 'remittance', label: 'Remittance', color: '#00ff88' },
                      { type: 'b2b', label: 'B2B Payments', color: '#00d4ff' },
                      { type: 'micropayment', label: 'Micropayments', color: '#a855f7' },
                      { type: 'cbdc', label: 'CBDC Pilot', color: '#ffd700' },
                    ].map((item) => (
                      <div key={item.type} className="flex items-center gap-2">
                        <div 
                          className="w-6 h-1 rounded"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-[10px] text-cyber-muted">{item.label}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Use Cases */}
                  <p className="text-[10px] text-cyber-muted mb-1 font-cyber">USE CASES</p>
                  <div className="flex flex-wrap gap-1">
                    {ilpUseCases.slice(0, 4).map((useCase) => (
                      <span 
                        key={useCase.id}
                        className="px-1.5 py-0.5 rounded text-[9px] bg-cyber-darker/50 border border-cyber-border/50"
                        style={{ color: useCase.color }}
                      >
                        {useCase.icon} {useCase.name.split(' ')[0]}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Corridors Legend & Filters (show on corridors lens) */}
              {activeLens === 'corridors' && (
                <div className="mb-4 pt-4 border-t border-cyber-border">
                  <p className="text-xs text-cyber-muted mb-2 font-cyber">PAYMENT CORRIDORS</p>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-1 mb-3">
                    <button 
                      onClick={() => setCorridorFilter(corridorFilter === 'corridors' ? 'all' : 'corridors')}
                      className={`p-1.5 rounded text-center transition-all ${
                        corridorFilter === 'corridors' ? 'bg-cyber-green/20 border border-cyber-green/50' : 'bg-cyber-darker/50 border border-cyber-border/50'
                      }`}
                    >
                      <p className="text-sm font-cyber text-cyber-green">{corridorStats.totalCorridors}</p>
                      <p className="text-[8px] text-cyber-muted">Corridors</p>
                    </button>
                    <button 
                      onClick={() => setCorridorFilter(corridorFilter === 'partners' ? 'all' : 'partners')}
                      className={`p-1.5 rounded text-center transition-all ${
                        corridorFilter === 'partners' ? 'bg-cyber-glow/20 border border-cyber-glow/50' : 'bg-cyber-darker/50 border border-cyber-border/50'
                      }`}
                    >
                      <p className="text-sm font-cyber text-cyber-glow">{corridorStats.totalPartners}</p>
                      <p className="text-[8px] text-cyber-muted">ODL Partners</p>
                    </button>
                    <button 
                      onClick={() => setCorridorFilter(corridorFilter === 'bridges' ? 'all' : 'bridges')}
                      className={`p-1.5 rounded text-center transition-all ${
                        corridorFilter === 'bridges' ? 'bg-cyber-purple/20 border border-cyber-purple/50' : 'bg-cyber-darker/50 border border-cyber-border/50'
                      }`}
                    >
                      <p className="text-sm font-cyber text-cyber-purple">{corridorStats.activeBridges}</p>
                      <p className="text-[8px] text-cyber-muted">Bridges</p>
                    </button>
                    <button 
                      onClick={() => setCorridorFilter(corridorFilter === 'chains' ? 'all' : 'chains')}
                      className={`p-1.5 rounded text-center transition-all ${
                        corridorFilter === 'chains' ? 'bg-cyber-cyan/20 border border-cyber-cyan/50' : 'bg-cyber-darker/50 border border-cyber-border/50'
                      }`}
                    >
                      <p className="text-sm font-cyber text-cyber-cyan">{corridorStats.connectedChains}</p>
                      <p className="text-[8px] text-cyber-muted">Chains</p>
                    </button>
                  </div>
                  
                  {/* Monthly Volume */}
                  <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/50 mb-3">
                    <p className="text-[9px] text-cyber-muted">Est. Monthly ODL Volume</p>
                    <p className="text-lg font-cyber text-cyber-green">{corridorStats.estimatedMonthlyVolume}</p>
                  </div>
                  
                  {/* Volume Legend */}
                  <p className="text-[10px] text-cyber-muted mb-1 font-cyber">VOLUME LEVELS</p>
                  <div className="space-y-1 mb-3">
                    {[
                      { level: 'high' as const, label: 'High Volume' },
                      { level: 'medium' as const, label: 'Medium Volume' },
                      { level: 'low' as const, label: 'Low Volume' },
                      { level: 'emerging' as const, label: 'Emerging' },
                    ].map((item) => (
                      <div key={item.level} className="flex items-center gap-2">
                        <div 
                          className="w-6 h-1 rounded"
                          style={{ backgroundColor: getVolumeColor(item.level) }}
                        />
                        <span className="text-[10px] text-cyber-muted">{item.label}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Chain Status Legend */}
                  <p className="text-[10px] text-cyber-muted mb-1 font-cyber">CHAIN STATUS</p>
                  <div className="space-y-1">
                    {[
                      { status: 'mainnet' as const, label: 'Mainnet' },
                      { status: 'testnet' as const, label: 'Testnet' },
                      { status: 'devnet' as const, label: 'Devnet' },
                    ].map((item) => (
                      <div key={item.status} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getChainStatusColor(item.status) }}
                        />
                        <span className="text-[10px] text-cyber-muted">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Regulatory Legend & Filters (show on regulation lens) */}
              {activeLens === 'regulation' && (
                <div className="mb-4 pt-4 border-t border-cyber-border">
                  <p className="text-xs text-cyber-muted mb-2 font-cyber">REGULATORY STATUS</p>
                  <div className="space-y-1 mb-4">
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
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-1 mb-3">
                    <button 
                      onClick={() => setRegStatusFilter(regStatusFilter === 'active' ? 'all' : 'active')}
                      className={`p-1.5 rounded text-center transition-all ${
                        regStatusFilter === 'active' ? 'bg-cyber-green/20 border border-cyber-green/50' : 'bg-cyber-darker/50 border border-cyber-border/50'
                      }`}
                    >
                      <p className="text-sm font-cyber text-cyber-green">{regStats.active}</p>
                      <p className="text-[8px] text-cyber-muted">Active</p>
                    </button>
                    <button 
                      onClick={() => setRegStatusFilter(regStatusFilter === 'pending' ? 'all' : 'pending')}
                      className={`p-1.5 rounded text-center transition-all ${
                        regStatusFilter === 'pending' ? 'bg-cyber-yellow/20 border border-cyber-yellow/50' : 'bg-cyber-darker/50 border border-cyber-border/50'
                      }`}
                    >
                      <p className="text-sm font-cyber text-cyber-yellow">{regStats.pending}</p>
                      <p className="text-[8px] text-cyber-muted">Pending</p>
                    </button>
                    <button 
                      onClick={() => setRegStatusFilter(regStatusFilter === 'proposed' ? 'all' : 'proposed')}
                      className={`p-1.5 rounded text-center transition-all ${
                        regStatusFilter === 'proposed' ? 'bg-cyber-orange/20 border border-cyber-orange/50' : 'bg-cyber-darker/50 border border-cyber-border/50'
                      }`}
                    >
                      <p className="text-sm font-cyber text-cyber-orange">{regStats.proposed}</p>
                      <p className="text-[8px] text-cyber-muted">Proposed</p>
                    </button>
                    <button 
                      onClick={() => setRegStatusFilter(regStatusFilter === 'watch' ? 'all' : 'watch')}
                      className={`p-1.5 rounded text-center transition-all ${
                        regStatusFilter === 'watch' ? 'bg-cyber-purple/20 border border-cyber-purple/50' : 'bg-cyber-darker/50 border border-cyber-border/50'
                      }`}
                    >
                      <p className="text-sm font-cyber text-cyber-purple">{regStats.watch}</p>
                      <p className="text-[8px] text-cyber-muted">Watch</p>
                    </button>
                  </div>
                  
                  {/* Category Filter */}
                  <p className="text-[10px] text-cyber-muted mb-1 font-cyber">CATEGORY</p>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { id: 'all' as const, label: 'All' },
                      { id: 'crypto' as const, label: '₿' },
                      { id: 'dlt' as const, label: '⛓️' },
                      { id: 'banking' as const, label: '🏦' },
                      { id: 'sec' as const, label: '📊' },
                    ].map((cat) => (
                      <button 
                        key={cat.id}
                        onClick={() => setRegFilter(cat.id)}
                        className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                          regFilter === cat.id 
                            ? 'bg-cyber-orange/20 text-cyber-orange border border-cyber-orange/50' 
                            : 'bg-cyber-darker/50 text-cyber-muted border border-cyber-border hover:border-cyber-orange/30'
                        }`}
                      >
                        {cat.label}
                      </button>
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
            
            {/* Regulatory Country Profile (when in regulation lens) */}
            {activeLens === 'regulation' && selectedCountryRegData?.profile && (
              <motion.div 
                className="cyber-panel p-4 border-cyber-orange/30"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={16} className="text-cyber-orange" />
                  <span className="font-cyber text-sm text-cyber-orange">REGULATORY PROFILE</span>
                </div>
                
                <h3 className="font-cyber text-lg text-cyber-text mb-1">
                  {selectedCountryRegData.profile.countryName}
                </h3>
                
                {/* Status Badge */}
                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded mb-3 ${
                  selectedCountryRegData.profile.overallStatus === 'favorable' ? 'bg-cyber-green/20 text-cyber-green' :
                  selectedCountryRegData.profile.overallStatus === 'regulated' ? 'bg-cyber-blue/20 text-cyber-blue' :
                  selectedCountryRegData.profile.overallStatus === 'developing' ? 'bg-cyber-yellow/20 text-cyber-yellow' :
                  selectedCountryRegData.profile.overallStatus === 'restricted' ? 'bg-cyber-red/20 text-cyber-red' :
                  'bg-cyber-muted/20 text-cyber-muted'
                }`}>
                  {selectedCountryRegData.profile.overallStatus === 'favorable' && <CheckCircle size={12} />}
                  {selectedCountryRegData.profile.overallStatus === 'developing' && <Clock size={12} />}
                  {selectedCountryRegData.profile.overallStatus === 'restricted' && <AlertTriangle size={12} />}
                  <span className="text-xs font-medium">{selectedCountryRegData.profile.statusLabel}</span>
                </div>
                
                {/* Quick Facts */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/30">
                    <p className="text-[9px] text-cyber-muted">Crypto Legal</p>
                    <p className={`text-xs font-medium ${selectedCountryRegData.profile.cryptoLegal ? 'text-cyber-green' : 'text-cyber-red'}`}>
                      {selectedCountryRegData.profile.cryptoLegal ? '✓ Yes' : '✗ No'}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/30">
                    <p className="text-[9px] text-cyber-muted">XRPL Presence</p>
                    <p className={`text-xs font-medium ${
                      selectedCountryRegData.profile.xrplPresence === 'strong' ? 'text-cyber-green' :
                      selectedCountryRegData.profile.xrplPresence === 'moderate' ? 'text-cyber-yellow' :
                      'text-cyber-muted'
                    }`}>
                      {selectedCountryRegData.profile.xrplPresence.charAt(0).toUpperCase() + selectedCountryRegData.profile.xrplPresence.slice(1)}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/30">
                    <p className="text-[9px] text-cyber-muted">CBDC Status</p>
                    <p className={`text-xs font-medium ${
                      selectedCountryRegData.profile.cbdcStatus === 'active' ? 'text-cyber-green' :
                      selectedCountryRegData.profile.cbdcStatus === 'pilot' ? 'text-cyber-cyan' :
                      'text-cyber-muted'
                    }`}>
                      {selectedCountryRegData.profile.cbdcStatus.charAt(0).toUpperCase() + selectedCountryRegData.profile.cbdcStatus.slice(1)}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/30">
                    <p className="text-[9px] text-cyber-muted">Primary Agency</p>
                    <p className="text-xs font-medium text-cyber-text">
                      {selectedCountryRegData.profile.primaryAgency || 'N/A'}
                    </p>
                  </div>
                </div>
                
                {/* Key Developments */}
                {selectedCountryRegData.profile.keyDevelopments.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] text-cyber-muted mb-1 font-cyber">KEY DEVELOPMENTS</p>
                    <div className="space-y-1">
                      {selectedCountryRegData.profile.keyDevelopments.slice(0, 3).map((dev, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-cyber-orange text-xs">›</span>
                          <span className="text-xs text-cyber-text">{dev}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Country-specific Regulatory Items */}
                {selectedCountryRegData.items.length > 0 && (
                  <div>
                    <p className="text-[10px] text-cyber-muted mb-2 font-cyber">
                      ACTIVE REGULATIONS ({selectedCountryRegData.items.length})
                    </p>
                    <div className="max-h-[150px] overflow-y-auto space-y-1.5 custom-scrollbar">
                      {selectedCountryRegData.items.map((item) => (
                        <a
                          key={item.id}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`block p-2 rounded bg-cyber-darker/50 border-l-2 border-${getRegStatusColor(item.status)} hover:bg-cyber-darker/80 transition-all group`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded bg-${getRegStatusColor(item.status)}/20 text-${getRegStatusColor(item.status)}`}>
                              {item.type}
                            </span>
                            <ExternalLink size={10} className="text-cyber-muted opacity-0 group-hover:opacity-100" />
                          </div>
                          <p className="text-xs text-cyber-text mt-1 line-clamp-1">{item.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[9px] ${getImpactColor(item.xrplImpact)}`}>
                              XRPL {getImpactIcon(item.xrplImpact)}
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
            
            {/* ILP Connectors Panel (when in ILP lens) */}
            {activeLens === 'ilp' && (
              <motion.div 
                className="cyber-panel p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-cyber text-sm text-cyber-purple">
                    {ilpFilter === 'connectors' ? 'CONNECTORS' : 
                     ilpFilter === 'corridors' ? 'CORRIDORS' : 
                     ilpFilter === 'repos' ? 'GITHUB REPOS' : 'ILP ECOSYSTEM'}
                  </span>
                </div>
                
                {/* Connectors List */}
                {(ilpFilter === 'all' || ilpFilter === 'connectors') && (
                  <div className="mb-4">
                    <p className="text-[10px] text-cyber-muted mb-2">Active Connectors ({ilpStats.activeConnectors})</p>
                    <div className="max-h-[150px] overflow-y-auto space-y-1.5 custom-scrollbar">
                      {ilpConnectorInstances.filter(c => c.status === 'online').slice(0, 6).map((connector) => (
                        <button
                          key={connector.id}
                          onClick={() => setSelectedConnector(selectedConnector?.id === connector.id ? null : connector)}
                          className={`w-full text-left p-2 rounded bg-cyber-darker/50 border transition-all ${
                            selectedConnector?.id === connector.id 
                              ? 'border-cyber-green/50 bg-cyber-green/10' 
                              : 'border-cyber-border/30 hover:border-cyber-purple/30'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: getILPStatusColor(connector.status) }}
                            />
                            <span className="text-xs text-cyber-text font-medium truncate">{connector.name}</span>
                          </div>
                          <p className="text-[9px] text-cyber-muted mt-0.5 truncate">
                            {connector.operator} • {connector.location?.city || 'Global'}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Selected Connector Details */}
                {selectedConnector && (
                  <motion.div 
                    className="mb-4 p-3 rounded bg-cyber-purple/10 border border-cyber-purple/30"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-cyber text-sm text-cyber-purple">{selectedConnector.name}</span>
                      <button onClick={() => setSelectedConnector(null)} className="text-cyber-muted hover:text-cyber-text">
                        <X size={12} />
                      </button>
                    </div>
                    <p className="text-[10px] text-cyber-muted mb-2">{selectedConnector.operator}</p>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <p className="text-[9px] text-cyber-muted">Implementation</p>
                        <p className="text-xs text-cyber-text">{selectedConnector.implementation}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-cyber-muted">Type</p>
                        <p className="text-xs text-cyber-text capitalize">{selectedConnector.type}</p>
                      </div>
                    </div>
                    <div className="mb-2">
                      <p className="text-[9px] text-cyber-muted mb-1">Assets</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedConnector.supportedAssets.map((asset) => (
                          <span key={asset} className="px-1.5 py-0.5 rounded text-[9px] bg-cyber-glow/20 text-cyber-glow">
                            {asset}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] text-cyber-muted mb-1">Features</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedConnector.features.slice(0, 3).map((feature) => (
                          <span key={feature} className="px-1.5 py-0.5 rounded text-[9px] bg-cyber-darker/50 text-cyber-text">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                    {selectedConnector.url && (
                      <a 
                        href={selectedConnector.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 flex items-center gap-1 text-[10px] text-cyber-purple hover:text-cyber-glow"
                      >
                        <ExternalLink size={10} /> Visit Website
                      </a>
                    )}
                  </motion.div>
                )}
                
                {/* Corridors List */}
                {(ilpFilter === 'all' || ilpFilter === 'corridors') && (
                  <div className="mb-4">
                    <p className="text-[10px] text-cyber-muted mb-2">Payment Corridors ({ilpCorridors.length})</p>
                    <div className="max-h-[120px] overflow-y-auto space-y-1.5 custom-scrollbar">
                      {ilpCorridors.slice(0, 5).map((corridor) => (
                        <div 
                          key={corridor.id}
                          className="p-2 rounded bg-cyber-darker/50 border-l-2 transition-all hover:bg-cyber-darker/80"
                          style={{ borderColor: getILPTypeColor(corridor.type) }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-cyber-text font-medium">{corridor.name}</span>
                            {corridor.xrplBacked && (
                              <span className="text-[8px] px-1 py-0.5 rounded bg-cyber-green/20 text-cyber-green">XRP</span>
                            )}
                          </div>
                          <p className="text-[9px] text-cyber-muted mt-0.5">{corridor.description}</p>
                          {corridor.monthlyVolume && (
                            <p className="text-[10px] text-cyber-glow mt-1">{corridor.monthlyVolume}/month</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* GitHub Repos List */}
                {(ilpFilter === 'all' || ilpFilter === 'repos') && (
                  <div>
                    <p className="text-[10px] text-cyber-muted mb-2">
                      GitHub Repositories ({ilpFilter === 'repos' ? ilpRepositories.length : 'Top 4'})
                    </p>
                    <div className="max-h-[150px] overflow-y-auto space-y-1.5 custom-scrollbar">
                      {(ilpFilter === 'repos' ? ilpRepositories : ilpRepositories.slice(0, 4)).map((repo) => (
                        <a
                          key={repo.id}
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-2 rounded bg-cyber-darker/50 border border-cyber-border/30 hover:border-cyber-glow/30 transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-cyber-text font-medium group-hover:text-cyber-glow truncate">
                              {repo.name}
                            </span>
                            <ExternalLink size={10} className="text-cyber-muted opacity-0 group-hover:opacity-100" />
                          </div>
                          <p className="text-[9px] text-cyber-muted mt-0.5 line-clamp-1">{repo.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[8px] px-1 py-0.5 rounded ${
                              repo.status === 'active' ? 'bg-cyber-green/20 text-cyber-green' :
                              repo.status === 'maintained' ? 'bg-cyber-yellow/20 text-cyber-yellow' :
                              'bg-cyber-muted/20 text-cyber-muted'
                            }`}>
                              {repo.status}
                            </span>
                            {repo.xrplIntegration && (
                              <span className="text-[8px] px-1 py-0.5 rounded bg-cyber-glow/20 text-cyber-glow">XRPL</span>
                            )}
                            {repo.languages.slice(0, 2).map((lang) => (
                              <span key={lang} className="text-[8px] text-cyber-muted">{lang}</span>
                            ))}
                          </div>
                        </a>
                      ))}
                    </div>
                    
                    {/* Quick Links to Key Repos */}
                    <div className="mt-3 pt-3 border-t border-cyber-border/30">
                      <p className="text-[10px] text-cyber-muted mb-2">Quick Links</p>
                      <div className="flex flex-wrap gap-1">
                        <a href="https://github.com/interledger/rafiki" target="_blank" rel="noopener noreferrer" 
                           className="px-2 py-1 rounded text-[9px] bg-cyber-green/20 text-cyber-green hover:bg-cyber-green/30">
                          Rafiki
                        </a>
                        <a href="https://github.com/interledger/rfcs" target="_blank" rel="noopener noreferrer"
                           className="px-2 py-1 rounded text-[9px] bg-cyber-purple/20 text-cyber-purple hover:bg-cyber-purple/30">
                          RFCs
                        </a>
                        <a href="https://github.com/interledger/open-payments" target="_blank" rel="noopener noreferrer"
                           className="px-2 py-1 rounded text-[9px] bg-cyber-glow/20 text-cyber-glow hover:bg-cyber-glow/30">
                          Open Payments
                        </a>
                        <a href="https://rafiki.dev" target="_blank" rel="noopener noreferrer"
                           className="px-2 py-1 rounded text-[9px] bg-cyber-cyan/20 text-cyber-cyan hover:bg-cyber-cyan/30">
                          Docs
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Corridors Panel (when in corridors lens) */}
            {activeLens === 'corridors' && (
              <motion.div 
                className="cyber-panel p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-cyber text-sm text-cyber-green">
                    {corridorFilter === 'corridors' ? 'PAYMENT CORRIDORS' : 
                     corridorFilter === 'partners' ? 'ODL PARTNERS' : 
                     corridorFilter === 'bridges' ? 'CROSS-CHAIN BRIDGES' : 
                     corridorFilter === 'chains' ? 'XRPL-CONNECTED CHAINS' : 'CORRIDORS ECOSYSTEM'}
                  </span>
                </div>
                
                {/* Payment Corridors List */}
                {(corridorFilter === 'all' || corridorFilter === 'corridors') && (
                  <div className="mb-4">
                    <p className="text-[10px] text-cyber-muted mb-2">Top Corridors ({paymentCorridors.filter(c => c.volume === 'high').length} high volume)</p>
                    <div className="max-h-[150px] overflow-y-auto space-y-1.5 custom-scrollbar">
                      {paymentCorridors.filter(c => c.volume === 'high' || c.volume === 'medium').slice(0, 6).map((corridor) => (
                        <div 
                          key={corridor.id}
                          className="p-2 rounded bg-cyber-darker/50 border-l-2 transition-all hover:bg-cyber-darker/80"
                          style={{ borderColor: getVolumeColor(corridor.volume) }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-cyber-text font-medium">{corridor.name}</span>
                            <div className="flex items-center gap-1">
                              {corridor.odlEnabled && (
                                <span className="text-[8px] px-1 py-0.5 rounded bg-cyber-green/20 text-cyber-green">ODL</span>
                              )}
                            </div>
                          </div>
                          <p className="text-[9px] text-cyber-muted mt-0.5">{corridor.type} • {corridor.volume}</p>
                          {corridor.monthlyVolume && (
                            <p className="text-[10px] text-cyber-glow mt-1">{corridor.monthlyVolume}/month</p>
                          )}
                          {corridor.growthYoY && (
                            <span className="text-[9px] text-cyber-green">{corridor.growthYoY} YoY</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* ODL Partners List */}
                {(corridorFilter === 'all' || corridorFilter === 'partners') && (
                  <div className="mb-4">
                    <p className="text-[10px] text-cyber-muted mb-2">ODL Partners ({odlPartners.filter(p => p.status === 'active').length} active)</p>
                    <div className="max-h-[120px] overflow-y-auto space-y-1.5 custom-scrollbar">
                      {odlPartners.filter(p => p.status === 'active').slice(0, 5).map((partner) => (
                        <button
                          key={partner.id}
                          onClick={() => setSelectedPartner(selectedPartner?.id === partner.id ? null : partner)}
                          className={`w-full text-left p-2 rounded bg-cyber-darker/50 border transition-all ${
                            selectedPartner?.id === partner.id 
                              ? 'border-cyber-glow/50 bg-cyber-glow/10' 
                              : 'border-cyber-border/30 hover:border-cyber-glow/30'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: partner.xrpIntegration === 'full' ? '#00ff88' : '#ffd700' }}
                            />
                            <span className="text-xs text-cyber-text font-medium truncate">{partner.name}</span>
                          </div>
                          <p className="text-[9px] text-cyber-muted mt-0.5 truncate">
                            {partner.headquarters.city}, {partner.headquarters.countryCode} • {partner.type}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Selected Partner Details */}
                {selectedPartner && (
                  <motion.div 
                    className="mb-4 p-3 rounded bg-cyber-glow/10 border border-cyber-glow/30"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-cyber text-sm text-cyber-glow">{selectedPartner.name}</span>
                      <button onClick={() => setSelectedPartner(null)} className="text-cyber-muted hover:text-cyber-text">
                        <X size={12} />
                      </button>
                    </div>
                    <p className="text-[10px] text-cyber-muted mb-2">{selectedPartner.description}</p>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <p className="text-[9px] text-cyber-muted">Type</p>
                        <p className="text-xs text-cyber-text capitalize">{selectedPartner.type.replace('-', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-cyber-muted">XRP Integration</p>
                        <p className={`text-xs capitalize ${selectedPartner.xrpIntegration === 'full' ? 'text-cyber-green' : 'text-cyber-yellow'}`}>
                          {selectedPartner.xrpIntegration}
                        </p>
                      </div>
                    </div>
                    <div className="mb-2">
                      <p className="text-[9px] text-cyber-muted mb-1">Services</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedPartner.services.slice(0, 3).map((service) => (
                          <span key={service} className="px-1.5 py-0.5 rounded text-[9px] bg-cyber-darker/50 text-cyber-text">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] text-cyber-muted mb-1">Corridors ({selectedPartner.corridors.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedPartner.corridors.map((corr) => (
                          <span 
                            key={corr} 
                            className="px-1.5 py-0.5 rounded text-[9px] bg-cyber-green/20 text-cyber-green cursor-help"
                            title={decodeCorridorCode(corr)}
                          >
                            {corr}
                          </span>
                        ))}
                      </div>
                      {/* Corridor Legend */}
                      <div className="mt-2 pt-2 border-t border-cyber-border/20">
                        <p className="text-[8px] text-cyber-muted mb-1">LEGEND (hover for details)</p>
                        <div className="text-[8px] text-cyber-muted space-y-0.5">
                          {selectedPartner.corridors.slice(0, 4).map((corr) => (
                            <div key={`legend-${corr}`} className="flex items-center gap-1">
                              <span className="text-cyber-green font-mono">{corr}</span>
                              <span className="text-cyber-muted">= {decodeCorridorCode(corr)}</span>
                            </div>
                          ))}
                          {selectedPartner.corridors.length > 4 && (
                            <span className="text-cyber-muted">+{selectedPartner.corridors.length - 4} more</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {selectedPartner.website && (
                      <a 
                        href={selectedPartner.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 flex items-center gap-1 text-[10px] text-cyber-glow hover:text-cyber-cyan"
                      >
                        <ExternalLink size={10} /> Visit Website
                      </a>
                    )}
                  </motion.div>
                )}
                
                {/* Cross-Chain Bridges List */}
                {(corridorFilter === 'all' || corridorFilter === 'bridges') && (
                  <div className="mb-4">
                    <p className="text-[10px] text-cyber-muted mb-2">Cross-Chain Bridges ({crossChainBridges.filter(b => b.status === 'mainnet').length} active)</p>
                    <div className="max-h-[120px] overflow-y-auto space-y-1.5 custom-scrollbar">
                      {crossChainBridges.filter(b => b.status !== 'deprecated').slice(0, 5).map((bridge) => (
                        <button
                          key={bridge.id}
                          onClick={() => setSelectedBridge(selectedBridge?.id === bridge.id ? null : bridge)}
                          className={`w-full text-left p-2 rounded bg-cyber-darker/50 border transition-all ${
                            selectedBridge?.id === bridge.id 
                              ? 'border-cyber-purple/50 bg-cyber-purple/10' 
                              : 'border-cyber-border/30 hover:border-cyber-purple/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-cyber-text font-medium truncate">{bridge.name}</span>
                            <span className={`text-[8px] px-1 py-0.5 rounded ${
                              bridge.status === 'mainnet' ? 'bg-cyber-green/20 text-cyber-green' :
                              bridge.status === 'testnet' ? 'bg-cyber-cyan/20 text-cyber-cyan' :
                              'bg-cyber-muted/20 text-cyber-muted'
                            }`}>
                              {bridge.status}
                            </span>
                          </div>
                          <p className="text-[9px] text-cyber-muted mt-0.5 truncate">{bridge.type} • {bridge.chains.join(' ↔ ')}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Selected Bridge Details */}
                {selectedBridge && (
                  <motion.div 
                    className="mb-4 p-3 rounded bg-cyber-purple/10 border border-cyber-purple/30"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-cyber text-sm text-cyber-purple">{selectedBridge.name}</span>
                      <button onClick={() => setSelectedBridge(null)} className="text-cyber-muted hover:text-cyber-text">
                        <X size={12} />
                      </button>
                    </div>
                    <p className="text-[10px] text-cyber-muted mb-2">{selectedBridge.description}</p>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <p className="text-[9px] text-cyber-muted">Type</p>
                        <p className="text-xs text-cyber-text capitalize">{selectedBridge.type.replace('-', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-cyber-muted">Security</p>
                        <p className="text-xs text-cyber-text truncate">{selectedBridge.securityModel.split(' ')[0]}</p>
                      </div>
                    </div>
                    <div className="mb-2">
                      <p className="text-[9px] text-cyber-muted mb-1">Supported Assets</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedBridge.supportedAssets.map((asset) => (
                          <span key={asset} className="px-1.5 py-0.5 rounded text-[9px] bg-cyber-glow/20 text-cyber-glow">
                            {asset}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] text-cyber-muted mb-1">Features</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedBridge.features.slice(0, 4).map((feature) => (
                          <span key={feature} className="px-1.5 py-0.5 rounded text-[9px] bg-cyber-darker/50 text-cyber-text">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {selectedBridge.githubUrl && (
                        <a 
                          href={selectedBridge.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] text-cyber-purple hover:text-cyber-glow"
                        >
                          <ExternalLink size={10} /> GitHub
                        </a>
                      )}
                      {selectedBridge.website && (
                        <a 
                          href={selectedBridge.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] text-cyber-purple hover:text-cyber-glow"
                        >
                          <ExternalLink size={10} /> Website
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}
                
                {/* XRPL-Connected Chains */}
                {(corridorFilter === 'all' || corridorFilter === 'chains') && (
                  <div className="mb-4">
                    <p className="text-[10px] text-cyber-muted mb-2">XRPL-Connected Chains ({xrplConnectedChains.filter(c => c.status === 'mainnet').length} mainnet)</p>
                    <div className="max-h-[150px] overflow-y-auto space-y-1.5 custom-scrollbar">
                      {xrplConnectedChains.filter(c => c.status === 'mainnet').map((chain) => (
                        <button
                          key={chain.id}
                          onClick={() => setSelectedChain(selectedChain?.id === chain.id ? null : chain)}
                          className={`w-full text-left p-2 rounded bg-cyber-darker/50 border transition-all ${
                            selectedChain?.id === chain.id 
                              ? 'border-cyber-cyan/50 bg-cyber-cyan/10' 
                              : 'border-cyber-border/30 hover:border-cyber-cyan/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-cyber-text font-medium truncate">{chain.name}</span>
                              <span className="text-[9px] text-cyber-glow">{chain.symbol}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {chain.evmCompatible && (
                                <span className="text-[8px] px-1 py-0.5 rounded bg-cyber-purple/20 text-cyber-purple">EVM</span>
                              )}
                              {chain.xrpBridge && (
                                <span className="text-[8px] px-1 py-0.5 rounded bg-cyber-green/20 text-cyber-green">XRP</span>
                              )}
                            </div>
                          </div>
                          <p className="text-[9px] text-cyber-muted mt-0.5 truncate">{chain.type} • {chain.consensus.split(' ')[0]}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Selected Chain Details */}
                {selectedChain && (
                  <motion.div 
                    className="mb-4 p-3 rounded bg-cyber-cyan/10 border border-cyber-cyan/30"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-cyber text-sm text-cyber-cyan">{selectedChain.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyber-darker/50 text-cyber-glow">{selectedChain.symbol}</span>
                      </div>
                      <button onClick={() => setSelectedChain(null)} className="text-cyber-muted hover:text-cyber-text">
                        <X size={12} />
                      </button>
                    </div>
                    <p className="text-[10px] text-cyber-muted mb-2">{selectedChain.description}</p>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <p className="text-[9px] text-cyber-muted">Type</p>
                        <p className="text-xs text-cyber-text capitalize">{selectedChain.type.replace('-', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-cyber-muted">Consensus</p>
                        <p className="text-xs text-cyber-text truncate">{selectedChain.consensus.split(' ')[0]}</p>
                      </div>
                    </div>
                    <div className="mb-2">
                      <p className="text-[9px] text-cyber-muted mb-1">Features</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedChain.features.slice(0, 4).map((feature) => (
                          <span key={feature} className="px-1.5 py-0.5 rounded text-[9px] bg-cyber-darker/50 text-cyber-text">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mb-2">
                      <p className="text-[9px] text-cyber-muted mb-1">Use Cases</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedChain.useCases.slice(0, 4).map((useCase) => (
                          <span key={useCase} className="px-1.5 py-0.5 rounded text-[9px] bg-cyber-cyan/20 text-cyber-cyan">
                            {useCase}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* GitHub Repos for this Chain */}
                    {selectedChain.githubRepos.length > 0 && (
                      <div className="mb-2">
                        <p className="text-[9px] text-cyber-muted mb-1">GitHub Repositories ({selectedChain.githubRepos.length})</p>
                        <div className="space-y-1">
                          {selectedChain.githubRepos.slice(0, 3).map((repo) => (
                            <a
                              key={repo.name}
                              href={repo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-1.5 rounded bg-cyber-darker/50 hover:bg-cyber-darker/80 transition-all group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-cyber-text font-medium group-hover:text-cyber-cyan">{repo.name}</span>
                                <ExternalLink size={8} className="text-cyber-muted opacity-0 group-hover:opacity-100" />
                              </div>
                              <p className="text-[9px] text-cyber-muted truncate">{repo.purpose}</p>
                              {repo.language && (
                                <span className="text-[8px] text-cyber-purple">{repo.language}</span>
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-2">
                      {selectedChain.website && (
                        <a 
                          href={selectedChain.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] text-cyber-cyan hover:text-cyber-glow"
                        >
                          <ExternalLink size={10} /> Website
                        </a>
                      )}
                      {selectedChain.docsUrl && (
                        <a 
                          href={selectedChain.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] text-cyber-cyan hover:text-cyber-glow"
                        >
                          <ExternalLink size={10} /> Docs
                        </a>
                      )}
                      {selectedChain.explorerUrl && (
                        <a 
                          href={selectedChain.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] text-cyber-cyan hover:text-cyber-glow"
                        >
                          <ExternalLink size={10} /> Explorer
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}
                
                {/* Quick Links */}
                <div className="mt-3 pt-3 border-t border-cyber-border/30">
                  <p className="text-[10px] text-cyber-muted mb-2">Quick Links</p>
                  <div className="flex flex-wrap gap-1">
                    <a href="https://xrplevm.org" target="_blank" rel="noopener noreferrer" 
                       className="px-2 py-1 rounded text-[9px] bg-cyber-green/20 text-cyber-green hover:bg-cyber-green/30">
                      XRPL EVM
                    </a>
                    <a href="https://flare.network" target="_blank" rel="noopener noreferrer"
                       className="px-2 py-1 rounded text-[9px] bg-cyber-purple/20 text-cyber-purple hover:bg-cyber-purple/30">
                      Flare
                    </a>
                    <a href="https://www.coreum.com" target="_blank" rel="noopener noreferrer"
                       className="px-2 py-1 rounded text-[9px] bg-cyber-glow/20 text-cyber-glow hover:bg-cyber-glow/30">
                      Coreum
                    </a>
                    <a href="https://xahau.network" target="_blank" rel="noopener noreferrer"
                       className="px-2 py-1 rounded text-[9px] bg-cyber-cyan/20 text-cyber-cyan hover:bg-cyber-cyan/30">
                      Xahau
                    </a>
                    <a href="https://www.therootnetwork.com" target="_blank" rel="noopener noreferrer"
                       className="px-2 py-1 rounded text-[9px] bg-cyber-yellow/20 text-cyber-yellow hover:bg-cyber-yellow/30">
                      Root Network
                    </a>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Corridor Country Data (when in corridors lens and country selected) */}
            {activeLens === 'corridors' && selectedCountryCorridorData && (selectedCountryCorridorData.corridors.length > 0 || selectedCountryCorridorData.partners.length > 0) && (
              <motion.div 
                className="cyber-panel p-4 border-cyber-green/30"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Route size={16} className="text-cyber-green" />
                  <span className="font-cyber text-sm text-cyber-green">CORRIDORS IN THIS REGION</span>
                </div>
                
                {selectedCountryCorridorData.corridors.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] text-cyber-muted mb-1">Payment Corridors ({selectedCountryCorridorData.corridors.length})</p>
                    {selectedCountryCorridorData.corridors.map((c) => (
                      <div key={c.id} className="p-2 rounded bg-cyber-darker/50 border-l-2 mb-1" style={{ borderColor: getVolumeColor(c.volume) }}>
                        <span className="text-xs text-cyber-text">{c.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {c.monthlyVolume && <span className="text-[9px] text-cyber-green">{c.monthlyVolume}</span>}
                          <span className="text-[9px] text-cyber-muted">{c.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedCountryCorridorData.partners.length > 0 && (
                  <div>
                    <p className="text-[10px] text-cyber-muted mb-1">ODL Partners ({selectedCountryCorridorData.partners.length})</p>
                    {selectedCountryCorridorData.partners.map((p) => (
                      <div key={p.id} className="p-2 rounded bg-cyber-darker/50 mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.xrpIntegration === 'full' ? '#00ff88' : '#ffd700' }} />
                          <span className="text-xs text-cyber-text">{p.name}</span>
                        </div>
                        <p className="text-[9px] text-cyber-muted">{p.type}</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
            
            {/* ILP Country Data (when in ILP lens and country selected) */}
            {activeLens === 'ilp' && selectedCountryILPData && (selectedCountryILPData.connectors.length > 0 || selectedCountryILPData.corridorsFrom.length > 0 || selectedCountryILPData.corridorsTo.length > 0) && (
              <motion.div 
                className="cyber-panel p-4 border-cyber-purple/30"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Link2 size={16} className="text-cyber-purple" />
                  <span className="font-cyber text-sm text-cyber-purple">ILP IN THIS REGION</span>
                </div>
                
                {selectedCountryILPData.connectors.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] text-cyber-muted mb-1">Connectors ({selectedCountryILPData.connectors.length})</p>
                    {selectedCountryILPData.connectors.map((c) => (
                      <div key={c.id} className="p-2 rounded bg-cyber-darker/50 mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getILPStatusColor(c.status) }} />
                          <span className="text-xs text-cyber-text">{c.name}</span>
                        </div>
                        <p className="text-[9px] text-cyber-muted">{c.operator}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedCountryILPData.corridorsFrom.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] text-cyber-muted mb-1">Outbound Corridors</p>
                    {selectedCountryILPData.corridorsFrom.map((c) => (
                      <div key={c.id} className="p-2 rounded bg-cyber-darker/50 border-l-2 mb-1" style={{ borderColor: getILPTypeColor(c.type) }}>
                        <span className="text-xs text-cyber-text">{c.name}</span>
                        {c.monthlyVolume && <span className="text-[9px] text-cyber-green ml-2">{c.monthlyVolume}</span>}
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedCountryILPData.corridorsTo.length > 0 && (
                  <div>
                    <p className="text-[10px] text-cyber-muted mb-1">Inbound Corridors</p>
                    {selectedCountryILPData.corridorsTo.map((c) => (
                      <div key={c.id} className="p-2 rounded bg-cyber-darker/50 border-l-2 mb-1" style={{ borderColor: getILPTypeColor(c.type) }}>
                        <span className="text-xs text-cyber-text">{c.name}</span>
                        {c.monthlyVolume && <span className="text-[9px] text-cyber-green ml-2">{c.monthlyVolume}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Regulatory Items List (when in regulation lens and no country selected) */}
            {activeLens === 'regulation' && !selectedCountryRegData?.profile && (
              <motion.div 
                className="cyber-panel p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-cyber text-sm text-cyber-orange">
                    REGULATIONS ({filteredRegItems.length})
                  </span>
                  {(regFilter !== 'all' || regStatusFilter !== 'all') && (
                    <button 
                      onClick={() => { setRegFilter('all'); setRegStatusFilter('all'); }}
                      className="text-[10px] text-cyber-muted hover:text-cyber-orange"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
                
                <div className="max-h-[250px] overflow-y-auto space-y-2 custom-scrollbar">
                  {filteredRegItems.slice(0, 10).map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block p-2 rounded bg-cyber-darker/50 border-l-2 border-${getRegStatusColor(item.status)} hover:bg-cyber-darker/80 transition-all group`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] px-1 py-0.5 rounded bg-${getRegStatusColor(item.status)}/20 text-${getRegStatusColor(item.status)}`}>
                            {item.status.toUpperCase()}
                          </span>
                          <span className="text-[9px] text-cyber-muted">{item.jurisdiction}</span>
                        </div>
                        <ExternalLink size={10} className="text-cyber-muted opacity-0 group-hover:opacity-100" />
                      </div>
                      <p className="text-xs text-cyber-text font-medium line-clamp-1 group-hover:text-cyber-orange transition-colors">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-cyber-muted line-clamp-1 mt-0.5">
                        {item.desc}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-[9px] ${getImpactColor(item.xrplImpact)}`}>
                          XRPL: {getImpactIcon(item.xrplImpact)} {item.xrplImpact}
                        </span>
                        {item.passLikelihood !== null && item.status !== 'active' && (
                          <span className={`text-[9px] ${getPassLikelihoodColor(item.passLikelihood).replace('bg-', 'text-')}`}>
                            {item.passLikelihood}% likely
                          </span>
                        )}
                      </div>
                    </a>
                  ))}
                  {filteredRegItems.length > 10 && (
                    <p className="text-[10px] text-cyber-muted text-center pt-2">
                      +{filteredRegItems.length - 10} more items...
                    </p>
                  )}
                </div>
                
                {/* Quick Agency Links */}
                <div className="mt-3 pt-3 border-t border-cyber-border/30">
                  <p className="text-[10px] text-cyber-muted mb-2">QUICK LINKS</p>
                  <div className="flex flex-wrap gap-1">
                    {regulatoryAgencies.slice(0, 6).map((agency) => (
                      <a
                        key={agency.id}
                        href={agency.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-2 py-1 rounded text-[10px] bg-cyber-darker/50 border border-${agency.color}/30 hover:border-${agency.color}/60 text-cyber-text hover:text-${agency.color} transition-all`}
                      >
                        {agency.shortName}
                      </a>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Community/Projects Panel (combined view) */}
            {activeLens === 'community' && (
              <motion.div 
                className="cyber-panel p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-cyber text-sm text-cyber-cyan">
                    COMMUNITY / PROJECTS ({filteredCommunityItems.length})
                  </span>
                  {communityFilter !== 'all' && (
                    <button 
                      onClick={() => setCommunityFilter('all')}
                      className="text-[10px] text-cyber-muted hover:text-cyber-cyan"
                    >
                      Clear filter
                    </button>
                  )}
                </div>
                
                {/* Category Filters */}
                <div className="flex flex-wrap gap-1 mb-3">
                  <button
                    onClick={() => setCommunityFilter('all')}
                    className={`px-2 py-1 rounded text-[10px] transition-all ${
                      communityFilter === 'all'
                        ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/50'
                        : 'bg-cyber-darker/50 text-cyber-muted border border-cyber-border hover:border-cyber-cyan/30'
                    }`}
                  >
                    All
                  </button>
                  {Object.entries(xrplCategories).map(([key, cat]) => (
                    <button
                      key={key}
                      onClick={() => setCommunityFilter(key as keyof typeof xrplCategories)}
                      className={`px-2 py-1 rounded text-[10px] transition-all flex items-center gap-1 ${
                        communityFilter === key
                          ? `bg-${cat.color}/20 text-${cat.color} border border-${cat.color}/50`
                          : 'bg-cyber-darker/50 text-cyber-muted border border-cyber-border hover:border-cyber-cyan/30'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span className="hidden sm:inline">{cat.name}</span>
                    </button>
                  ))}
                </div>
                
                {/* Projects List */}
                <div className="max-h-[300px] overflow-y-auto space-y-2 custom-scrollbar">
                  {filteredCommunityItems.slice(0, 15).map((project, idx) => {
                    const category = xrplCategories[project.category as keyof typeof xrplCategories]
                    return (
                      <motion.div
                        key={`${project.name}-${idx}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className={`p-3 rounded bg-cyber-darker/50 border-l-2 border-${category?.color || 'cyber-cyan'} hover:bg-cyber-darker/80 transition-all cursor-pointer group`}
                        onClick={() => setSelectedProject(project)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{category?.icon}</span>
                            <span className="text-xs text-cyber-text font-medium group-hover:text-cyber-cyan transition-colors">
                              {project.name}
                            </span>
                          </div>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded bg-${category?.color || 'cyber-cyan'}/20 text-${category?.color || 'cyber-cyan'}`}>
                            {category?.name || project.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-cyber-muted line-clamp-2">
                          {project.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[9px] text-cyber-muted">📍 {project.location}</span>
                          {project.links.length > 0 && (
                            <a
                              href={project.links[0]}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[9px] text-cyber-cyan hover:text-cyber-glow flex items-center gap-0.5"
                            >
                              <ExternalLink size={8} /> Link
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                  {filteredCommunityItems.length > 15 && (
                    <p className="text-[10px] text-cyber-muted text-center pt-2">
                      +{filteredCommunityItems.length - 15} more items...
                    </p>
                  )}
                </div>
                
                {/* Category Stats */}
                <div className="mt-3 pt-3 border-t border-cyber-border/30">
                  <p className="text-[10px] text-cyber-muted mb-2">CATEGORY BREAKDOWN</p>
                  <div className="grid grid-cols-4 gap-1">
                    {Object.entries(xrplCategories).slice(0, 4).map(([key, cat]) => (
                      <div 
                        key={key}
                        className={`p-2 rounded bg-cyber-darker/50 border border-${cat.color}/30 text-center cursor-pointer hover:border-${cat.color}/60 transition-all`}
                        onClick={() => setCommunityFilter(key as keyof typeof xrplCategories)}
                      >
                        <p className={`text-sm font-cyber text-${cat.color}`}>{cat.data.length}</p>
                        <p className="text-[8px] text-cyber-muted">{cat.icon}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-1 mt-1">
                    {Object.entries(xrplCategories).slice(4).map(([key, cat]) => (
                      <div 
                        key={key}
                        className={`p-2 rounded bg-cyber-darker/50 border border-${cat.color}/30 text-center cursor-pointer hover:border-${cat.color}/60 transition-all`}
                        onClick={() => setCommunityFilter(key as keyof typeof xrplCategories)}
                      >
                        <p className={`text-sm font-cyber text-${cat.color}`}>{cat.data.length}</p>
                        <p className="text-[8px] text-cyber-muted">{cat.icon}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Quick Links */}
                <div className="mt-3 pt-3 border-t border-cyber-border/30">
                  <p className="text-[10px] text-cyber-muted mb-2">QUICK LINKS</p>
                  <div className="flex flex-wrap gap-1">
                    <a href="https://xrpl.org/community" target="_blank" rel="noopener noreferrer" 
                       className="px-2 py-1 rounded text-[9px] bg-cyber-glow/20 text-cyber-glow hover:bg-cyber-glow/30">
                      XRPL.org
                    </a>
                    <a href="https://www.xrpl-commons.org" target="_blank" rel="noopener noreferrer"
                       className="px-2 py-1 rounded text-[9px] bg-cyber-purple/20 text-cyber-purple hover:bg-cyber-purple/30">
                      XRPL Commons
                    </a>
                    <a href="https://xrpcafe.com" target="_blank" rel="noopener noreferrer"
                       className="px-2 py-1 rounded text-[9px] bg-cyber-cyan/20 text-cyber-cyan hover:bg-cyber-cyan/30">
                      XRP Cafe
                    </a>
                    <a href="https://xpmarket.com" target="_blank" rel="noopener noreferrer"
                       className="px-2 py-1 rounded text-[9px] bg-cyber-green/20 text-cyber-green hover:bg-cyber-green/30">
                      XPMarket
                    </a>
                    <a href="https://www.easya.io" target="_blank" rel="noopener noreferrer"
                       className="px-2 py-1 rounded text-[9px] bg-cyber-yellow/20 text-cyber-yellow hover:bg-cyber-yellow/30">
                      EasyA
                    </a>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Selected Project Detail Modal */}
            {selectedProject && (
              <motion.div 
                className="cyber-panel p-4 border-cyber-cyan/30"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{xrplCategories[selectedProject.category as keyof typeof xrplCategories]?.icon}</span>
                    <span className="font-cyber text-sm text-cyber-cyan">{selectedProject.name}</span>
                  </div>
                  <button 
                    onClick={() => setSelectedProject(null)}
                    className="p-1 hover:bg-cyber-red/20 rounded transition-colors"
                  >
                    <X size={14} className="text-cyber-muted hover:text-cyber-red" />
                  </button>
                </div>
                
                <p className="text-xs text-cyber-text mb-3">{selectedProject.description}</p>
                
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-cyber-muted">📍 Location:</span>
                    <span className="text-xs text-cyber-text">{selectedProject.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-cyber-muted">📂 Category:</span>
                    <span className={`text-xs text-${xrplCategories[selectedProject.category as keyof typeof xrplCategories]?.color || 'cyber-cyan'}`}>
                      {xrplCategories[selectedProject.category as keyof typeof xrplCategories]?.name || selectedProject.category}
                    </span>
                  </div>
                </div>
                
                {selectedProject.links.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded bg-cyber-cyan/20 text-cyber-cyan hover:bg-cyber-cyan/30 text-xs transition-all"
                      >
                        <ExternalLink size={12} />
                        {link.includes('x.com') || link.includes('twitter') ? 'X/Twitter' : 
                         link.includes('github') ? 'GitHub' :
                         link.includes('facebook') ? 'Facebook' :
                         link.includes('youtube') ? 'YouTube' :
                         link.includes('udemy') ? 'Udemy' :
                         'Website'}
                      </a>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Validators Panel (shown on validators lens with live data) */}
            {activeLens === 'validators' && showLiveData && liveStats && (
              <motion.div 
                className="cyber-panel p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-cyber text-sm text-cyber-glow">VALIDATORS</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
                    <span className="text-[10px] text-cyber-green">LIVE</span>
                  </div>
                </div>
                
                {/* Validator Stats */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-border/30 text-center">
                    <p className="text-2xl font-cyber text-cyber-glow">{liveStats.totalValidators}</p>
                    <p className="text-[9px] text-cyber-muted">Total Validators</p>
                  </div>
                  <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-border/30 text-center">
                    <p className="text-2xl font-cyber text-cyber-cyan">{liveStats.unlValidators}</p>
                    <p className="text-[9px] text-cyber-muted">UNL Validators</p>
                  </div>
                </div>
                
                {/* Agreement */}
                <div className="p-2 rounded bg-gradient-to-r from-cyber-green/20 to-cyber-glow/20 border border-cyber-green/30">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-cyber-muted">Average Agreement (24h)</span>
                    <span className="text-sm font-cyber text-cyber-green">
                      {(liveStats.averageAgreement * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-cyber-darker/50 rounded mt-1">
                    <div 
                      className="h-full rounded bg-gradient-to-r from-cyber-green to-cyber-glow"
                      style={{ width: `${liveStats.averageAgreement * 100}%` }}
                    />
                  </div>
                </div>
                
                {/* Last Updated */}
                <div className="mt-3 pt-2 border-t border-cyber-border/30 flex items-center justify-between">
                  <span className="text-[9px] text-cyber-muted">Last updated</span>
                  <span className="text-[9px] text-cyber-glow">
                    {liveStats.lastUpdated ? new Date(liveStats.lastUpdated).toLocaleTimeString() : 'N/A'}
                  </span>
                </div>
              </motion.div>
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
          </motion.div>
        </div>
      </div>

      {/* Network Topology Section */}
      <NetworkTopologySection />
    </div>
  )
}

// Network Topology Section Component
function NetworkTopologySection() {
  const { initialized, ledgers, connectors, corridors, initialize } = useILPStore();

  // Initialize ILP store on mount
  useEffect(() => {
    if (!initialized || ledgers.length === 0) {
      initialize();
    }
  }, [initialized, ledgers.length, initialize]);

  // Stats
  const activeCorridors = corridors.filter(c => c.status === 'active').length;
  const avgTrust = connectors.length > 0 
    ? connectors.reduce((sum, c) => sum + c.trust_score, 0) / connectors.length 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-8 px-4 lg:px-8"
    >
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-cyber-cyan/20 flex items-center justify-center">
          <NetworkIcon className="w-5 h-5 text-cyber-cyan" />
        </div>
        <div>
          <h2 className="font-cyber text-lg text-cyber-text">LEDGER TOPOLOGY</h2>
          <p className="text-xs text-cyber-muted">
            How XRPL connects to other networks • Trust-based corridor visualization
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="ml-auto hidden md:flex items-center gap-4 px-4 py-2 cyber-panel">
          <div className="text-center">
            <p className="text-[10px] text-cyber-muted">Ledgers</p>
            <p className="font-cyber text-sm text-cyber-text">{ledgers.length}</p>
          </div>
          <div className="w-px h-6 bg-cyber-border" />
          <div className="text-center">
            <p className="text-[10px] text-cyber-muted">Corridors</p>
            <p className="font-cyber text-sm text-cyber-green">{activeCorridors}</p>
          </div>
          <div className="w-px h-6 bg-cyber-border" />
          <div className="text-center">
            <p className="text-[10px] text-cyber-muted">Avg Trust</p>
            <p className={`font-cyber text-sm ${avgTrust > 0.7 ? 'text-cyber-green' : avgTrust > 0.5 ? 'text-cyber-yellow' : 'text-cyber-red'}`}>
              {(avgTrust * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Connector Map */}
      <div className="cyber-panel p-2" style={{ minHeight: '450px' }}>
        <ConnectorMap
          onLedgerClick={(ledger) => console.log('Clicked ledger:', ledger.name)}
          onCorridorClick={(corridor) => console.log('Clicked corridor:', corridor.id)}
        />
      </div>

      {/* Philosophy Footer */}
      <div className="mt-4 text-center">
        <p className="text-[10px] text-cyber-muted italic">
          "ILP does not connect blockchains. Connectors do. Trust is a topology, not a claim."
        </p>
      </div>
    </motion.div>
  );
}
