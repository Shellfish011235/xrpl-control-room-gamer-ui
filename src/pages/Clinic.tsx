import { motion } from 'framer-motion'
import { 
  HeartPulse, TrendingUp, TrendingDown, DollarSign, 
  Activity, PieChart as PieChartIcon, BarChart3, LineChart as LineChartIcon,
  ChevronRight, ExternalLink, BookOpen, Code, Video,
  FileText, Github, Wrench, Calculator, RefreshCw
} from 'lucide-react'
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, 
  PieChart, Pie, Cell
} from 'recharts'

// Mock data
const rlusdMetrics = {
  marketCap: '2.45B',
  price: '1.0001',
  volume24h: '847M',
  holders: '125K',
  change24h: '+0.01%'
}

const etfData = {
  inflows: '+$247M',
  aum: '$12.8B',
  change: '+8.4%',
  volume: '15.2M'
}

const priceHistory = Array.from({ length: 30 }, (_, i) => ({
  date: `Jan ${i + 1}`,
  xrp: 2.15 + Math.sin(i * 0.2) * 0.3 + Math.random() * 0.1,
  rlusd: 1 + (Math.random() - 0.5) * 0.002
}))

const etfFlowHistory = Array.from({ length: 14 }, (_, i) => ({
  day: `Day ${i + 1}`,
  inflow: Math.floor(Math.random() * 200) + 50,
  outflow: -Math.floor(Math.random() * 80)
}))

const portfolioAllocation = [
  { name: 'XRP', value: 45, color: '#00d4ff' },
  { name: 'RLUSD', value: 25, color: '#00ff88' },
  { name: 'ETF', value: 20, color: '#a855f7' },
  { name: 'Other', value: 10, color: '#ffd700' },
]

const stablecoinComparison = [
  { name: 'RLUSD', mcap: 2.45, volume: 0.85, backing: 100 },
  { name: 'USDC', mcap: 45.2, volume: 8.2, backing: 100 },
  { name: 'USDT', mcap: 120.5, volume: 65.4, backing: 99 },
  { name: 'DAI', mcap: 5.3, volume: 0.42, backing: 150 },
]

const resources = [
  {
    category: 'Documentation',
    icon: BookOpen,
    color: 'cyber-glow',
    items: [
      { name: 'XRPL Docs', url: 'https://xrpl.org' },
      { name: 'Ripple Developer Portal', url: 'https://ripple.com/build' },
      { name: 'RLUSD Documentation', url: '#' },
    ]
  },
  {
    category: 'SDKs & Libraries',
    icon: Code,
    color: 'cyber-purple',
    items: [
      { name: 'xrpl.js (JavaScript)', url: '#' },
      { name: 'xrpl-py (Python)', url: '#' },
      { name: 'xrpl4j (Java)', url: '#' },
    ]
  },
  {
    category: 'Tools',
    icon: Wrench,
    color: 'cyber-green',
    items: [
      { name: 'XRPL Explorer', url: '#' },
      { name: 'Testnet Faucet', url: '#' },
      { name: 'Transaction Decoder', url: '#' },
    ]
  },
  {
    category: 'Learning',
    icon: Video,
    color: 'cyber-yellow',
    items: [
      { name: 'XRPL Learning Portal', url: '#' },
      { name: 'YouTube Tutorials', url: '#' },
      { name: 'Developer Workshops', url: '#' },
    ]
  },
]

export default function Clinic() {
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
            <HeartPulse className="text-cyber-green" size={28} />
            <h1 className="font-cyber text-2xl text-cyber-text tracking-wider">CLINIC</h1>
            <div className="ml-auto flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded bg-cyber-darker border border-cyber-border hover:border-cyber-green/50 transition-colors">
                <RefreshCw size={14} className="text-cyber-green" />
                <span className="text-xs text-cyber-text">Refresh Data</span>
              </button>
            </div>
          </div>
          <p className="text-cyber-muted">Portfolio Health, Stablecoins, ETFs & Resources</p>
        </motion.div>
        
        {/* Top Stats Row */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* RLUSD Card */}
          <div className="cyber-panel p-4 border-cyber-green/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-cyber-muted">RLUSD Price</span>
              <span className="text-xs text-cyber-green">{rlusdMetrics.change24h}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign size={20} className="text-cyber-green" />
              <span className="font-cyber text-2xl text-cyber-text">{rlusdMetrics.price}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-cyber-border">
              <span className="text-xs text-cyber-muted">Market Cap: ${rlusdMetrics.marketCap}</span>
            </div>
          </div>
          
          {/* ETF Inflows */}
          <div className="cyber-panel p-4 border-cyber-purple/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-cyber-muted">ETF Inflows (24h)</span>
              <TrendingUp size={14} className="text-cyber-green" />
            </div>
            <span className="font-cyber text-2xl text-cyber-green">{etfData.inflows}</span>
            <div className="mt-2 pt-2 border-t border-cyber-border">
              <span className="text-xs text-cyber-muted">AUM: {etfData.aum}</span>
            </div>
          </div>
          
          {/* XRP Price */}
          <div className="cyber-panel p-4 border-cyber-glow/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-cyber-muted">XRP Price</span>
              <span className="text-xs text-cyber-green">+3.2%</span>
            </div>
            <span className="font-cyber text-2xl text-cyber-glow">$2.34</span>
            <div className="mt-2 pt-2 border-t border-cyber-border">
              <span className="text-xs text-cyber-muted">24h Vol: $1.2B</span>
            </div>
          </div>
          
          {/* Portfolio Health */}
          <div className="cyber-panel p-4 border-cyber-cyan/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-cyber-muted">Portfolio Health</span>
              <Activity size={14} className="text-cyber-cyan" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-cyber text-2xl text-cyber-cyan">94</span>
              <span className="text-sm text-cyber-muted">/100</span>
            </div>
            <div className="mt-2 pt-2 border-t border-cyber-border">
              <span className="text-xs text-cyber-green">Excellent</span>
            </div>
          </div>
        </motion.div>
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Charts */}
          <motion.div 
            className="lg:col-span-8 space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Price Chart */}
            <div className="cyber-panel p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <LineChartIcon size={16} className="text-cyber-glow" />
                  <span className="font-cyber text-sm text-cyber-glow">PRICE HISTORY</span>
                </div>
                <div className="flex items-center gap-2">
                  {['1D', '1W', '1M', '3M'].map((period, idx) => (
                    <button 
                      key={period}
                      className={`px-3 py-1 text-xs rounded ${
                        idx === 2 
                          ? 'bg-cyber-glow/20 text-cyber-glow border border-cyber-glow/30' 
                          : 'bg-cyber-darker text-cyber-muted border border-cyber-border hover:border-cyber-glow/30'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={priceHistory}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.1)" />
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#111827', 
                        border: '1px solid #1e3a5f',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="xrp" 
                      stroke="#00d4ff" 
                      fill="url(#priceGradient)" 
                      strokeWidth={2}
                      name="XRP"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* ETF Flows Chart */}
            <div className="cyber-panel p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-cyber-purple" />
                  <span className="font-cyber text-sm text-cyber-purple">ETF FLOW ANALYSIS</span>
                </div>
                <span className="text-xs text-cyber-muted">Last 14 days</span>
              </div>
              
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={etfFlowHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.1)" />
                    <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#111827', 
                        border: '1px solid #1e3a5f',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="inflow" fill="#00ff88" radius={[4, 4, 0, 0]} name="Inflow" />
                    <Bar dataKey="outflow" fill="#ff4444" radius={[4, 4, 0, 0]} name="Outflow" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Stablecoin Comparison */}
            <div className="cyber-panel p-4">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                <DollarSign size={16} className="text-cyber-green" />
                <span className="font-cyber text-sm text-cyber-green">STABLECOIN COMPARISON</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cyber-border">
                      <th className="text-left py-2 text-xs text-cyber-muted font-normal">Token</th>
                      <th className="text-right py-2 text-xs text-cyber-muted font-normal">Market Cap</th>
                      <th className="text-right py-2 text-xs text-cyber-muted font-normal">24h Volume</th>
                      <th className="text-right py-2 text-xs text-cyber-muted font-normal">Backing %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stablecoinComparison.map((coin, idx) => (
                      <tr key={coin.name} className="border-b border-cyber-border/50 hover:bg-cyber-darker/50">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-cyber ${
                              idx === 0 ? 'bg-cyber-green/20 text-cyber-green' : 'bg-cyber-border text-cyber-muted'
                            }`}>
                              {coin.name[0]}
                            </div>
                            <span className={`text-sm ${idx === 0 ? 'text-cyber-green font-medium' : 'text-cyber-text'}`}>
                              {coin.name}
                            </span>
                            {idx === 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-cyber-green/20 text-cyber-green">XRPL</span>}
                          </div>
                        </td>
                        <td className="text-right py-3 text-sm text-cyber-text">${coin.mcap}B</td>
                        <td className="text-right py-3 text-sm text-cyber-text">${coin.volume}B</td>
                        <td className="text-right py-3">
                          <span className={`text-sm ${coin.backing >= 100 ? 'text-cyber-green' : 'text-cyber-yellow'}`}>
                            {coin.backing}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
          
          {/* Right Column - Portfolio & Resources */}
          <motion.div 
            className="lg:col-span-4 space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Portfolio Allocation */}
            <div className="cyber-panel p-4">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                <PieChartIcon size={16} className="text-cyber-cyan" />
                <span className="font-cyber text-sm text-cyber-cyan">PORTFOLIO ALLOCATION</span>
              </div>
              
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={portfolioAllocation}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      dataKey="value"
                      stroke="transparent"
                    >
                      {portfolioAllocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-2 mt-4">
                {portfolioAllocation.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-cyber-text">{item.name}</span>
                    </div>
                    <span className="text-sm text-cyber-muted">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Projection Calculator */}
            <div className="cyber-panel p-4">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                <Calculator size={16} className="text-cyber-yellow" />
                <span className="font-cyber text-sm text-cyber-yellow">PROJECTION CALCULATOR</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-cyber-muted block mb-1">Investment Amount</label>
                  <input 
                    type="text" 
                    defaultValue="$10,000"
                    className="w-full bg-cyber-darker border border-cyber-border rounded px-3 py-2 text-sm text-cyber-text focus:border-cyber-yellow focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-cyber-muted block mb-1">Time Period</label>
                  <select className="w-full bg-cyber-darker border border-cyber-border rounded px-3 py-2 text-sm text-cyber-text focus:border-cyber-yellow focus:outline-none">
                    <option>1 Year</option>
                    <option>3 Years</option>
                    <option>5 Years</option>
                  </select>
                </div>
                <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-yellow/30">
                  <p className="text-xs text-cyber-muted mb-1">Projected Value (Conservative)</p>
                  <p className="font-cyber text-xl text-cyber-yellow">$15,420</p>
                  <p className="text-xs text-cyber-green">+54.2% potential growth</p>
                </div>
              </div>
            </div>
            
            {/* Quick Resources */}
            <div className="cyber-panel p-4">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                <BookOpen size={16} className="text-cyber-glow" />
                <span className="font-cyber text-sm text-cyber-glow">RESOURCES</span>
              </div>
              
              <div className="space-y-3">
                {resources.map((category) => (
                  <div key={category.category}>
                    <div className="flex items-center gap-2 mb-2">
                      <category.icon size={12} className={`text-${category.color}`} />
                      <span className={`text-xs text-${category.color}`}>{category.category}</span>
                    </div>
                    <div className="space-y-1 pl-4">
                      {category.items.map((item) => (
                        <a
                          key={item.name}
                          href={item.url}
                          className="flex items-center gap-2 py-1 text-sm text-cyber-text hover:text-cyber-glow transition-colors group"
                        >
                          <ChevronRight size={12} className="text-cyber-muted group-hover:text-cyber-glow" />
                          <span>{item.name}</span>
                          <ExternalLink size={10} className="text-cyber-muted opacity-0 group-hover:opacity-100" />
                        </a>
                      ))}
                    </div>
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
