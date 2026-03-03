import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  HeartPulse, TrendingUp, DollarSign, 
  Activity, PieChart as PieChartIcon, BarChart3, LineChart as LineChartIcon,
  ChevronRight, ExternalLink, BookOpen, Code, Video,
  Wrench, Calculator, RefreshCw, Info, Wallet, Loader2
} from 'lucide-react'
import { 
  AreaChart, Area, BarChart, Bar,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, 
  PieChart, Pie, Cell
} from 'recharts'
import { useXRPPrice } from '../services/websocketPriceFeeds'
import { useXRPPriceHistory, type ChartPeriod } from '../hooks/useXRPPriceHistory'
import { useXRPPriceVolumeHistory } from '../hooks/useXRPPriceVolumeHistory'
import VolumePriceScatterChart from '../components/VolumePriceScatterChart'
import { useXRPETF } from '../hooks/useXRPETF'
import { useStablecoinComparison } from '../hooks/useStablecoinComparison'
import { useWalletStore } from '../store/walletStore'

// Illustrative data for RLUSD, ETF, allocation (not live APIs). XRP price is wired to live feed below.
const rlusdMetrics = {
  marketCap: '2.45B',
  price: '1.0001',
  volume24h: '847M',
  holders: '125K',
  change24h: '+0.01%'
}

const ETF_FALLBACK = {
  inflows: '+$247M',
  aum: '$12.8B',
  flowHistory: Array.from({ length: 14 }, (_, i) => ({
    day: `Day ${i + 1}`,
    inflow: (Math.floor(Math.random() * 200) + 50) * 1e6,
    outflow: -Math.floor(Math.random() * 80) * 1e6,
  })),
}

/** Reference AUM and XRP holdings per ETF (US spot). Approximate, from public data. Links to ETFdb. */
const XRP_ETF_REFERENCE: { ticker: string; issuer: string; aumM: number; xrpHoldingsM: number; url: string }[] = [
  { ticker: 'XRPC', issuer: 'Canary Capital', aumM: 269.6, xrpHoldingsM: 191.4, url: 'https://etfdb.com/etf/XRPC/' },
  { ticker: 'XRP', issuer: 'Bitwise', aumM: 259.7, xrpHoldingsM: 184.3, url: 'https://etfdb.com/etf/XRP/' },
  { ticker: 'XRPZ', issuer: 'Franklin Templeton', aumM: 231.8, xrpHoldingsM: 164.5, url: 'https://etfdb.com/etf/XRPZ/' },
  { ticker: 'TOXR', issuer: '21Shares', aumM: 173.1, xrpHoldingsM: 123.0, url: 'https://etfdb.com/etf/TOXR/' },
  { ticker: 'GXRP', issuer: 'Grayscale', aumM: 77.8, xrpHoldingsM: 55.1, url: 'https://etfdb.com/etf/GXRP/' },
  { ticker: 'XRPR', issuer: 'REX / Osprey', aumM: 88.4, xrpHoldingsM: 45.9, url: 'https://etfdb.com/etf/XRPR/' },
  { ticker: 'XRPI', issuer: 'Volatility Shares', aumM: 114.2, xrpHoldingsM: 0, url: 'https://etfdb.com/etf/XRPI/' },
]
const XRP_ETF_REFERENCE_AS_OF = 'Feb 2026'

/** Publicly listed companies using or holding XRP (treasury, lending, reserves). Not ETFs. */
const XRP_LISTED_COMPANIES: { ticker: string; company: string; exchange: string; note: string; url: string }[] = [
  { ticker: 'XRPN', company: 'Evernorth Holdings', exchange: 'Nasdaq', note: 'XRP treasury; $1B+ XRP acquisition', url: 'https://www.nasdaq.com/market-activity/stocks/XRPN' },
  { ticker: 'GPUS', company: 'Hyperscale Data', exchange: 'NYSE American', note: 'GPUs & data centers; XRP acquisition & lending (Ault Capital)', url: 'https://www.nasdaq.com/market-activity/stocks/GPUS' },
  { ticker: 'VVPR', company: 'VivoPower International', exchange: 'Nasdaq', note: '$100M XRP treasury (planned)', url: 'https://www.nasdaq.com/market-activity/stocks/VVPR' },
  { ticker: 'TDTH', company: 'Trident Digital Tech', exchange: 'Nasdaq', note: '$500M XRP reserve (planned)', url: 'https://www.nasdaq.com/market-activity/stocks/TDTH' },
  { ticker: 'WETO', company: 'Webus International', exchange: 'Nasdaq', note: '$300M XRP reserve (planned)', url: 'https://www.nasdaq.com/market-activity/stocks/WETO' },
  { ticker: 'WGRX', company: 'Wellgistics Health', exchange: 'Nasdaq', note: '$100M credit facility for XRP reserve', url: 'https://www.nasdaq.com/market-activity/stocks/WGRX' },
  { ticker: 'WKSP', company: 'Worksport', exchange: 'Nasdaq', note: '$5M XRP reserve allocation', url: 'https://www.nasdaq.com/market-activity/stocks/WKSP' },
]

const ALLOCATION_COLORS = ['#00d4ff', '#00ff88', '#a855f7', '#ffd700', '#64748b']
const DEFAULT_ALLOCATION = [
  { name: 'XRP', value: 45, color: '#00d4ff' },
  { name: 'RLUSD', value: 25, color: '#00ff88' },
  { name: 'ETF', value: 20, color: '#a855f7' },
  { name: 'Other', value: 10, color: '#ffd700' },
]

/** Fallback when CoinGecko stablecoin feed unavailable */
const STABLECOIN_FALLBACK = [
  { name: 'RLUSD', mcap: 2.45, volume: 0.85, backing: 100 },
  { name: 'USDC', mcap: 45.2, volume: 8.2, backing: 100 },
  { name: 'USDT', mcap: 120.5, volume: 65.4, backing: 99 },
  { name: 'DAI', mcap: 5.3, volume: 0.42, backing: 150 },
]

const RLUSD_OFFICIAL_URL = 'https://ripple.com/ripple-usd/'
const RLUSD_PARTNERS_URL = 'https://ripple.com/solutions/stablecoin/rlusdpartners/'
/** Places to purchase or trade RLUSD. Official list: ripple.com/solutions/stablecoin/rlusdpartners/ */
const RLUSD_BUY_LINKS: { name: string; url: string }[] = [
  { name: 'Ripple (official)', url: RLUSD_OFFICIAL_URL },
  { name: 'All RLUSD partners', url: RLUSD_PARTNERS_URL },
  { name: 'Kraken', url: 'https://www.kraken.com/prices/ripple-usd-rlusd' },
  { name: 'Uphold', url: 'https://www.uphold.com/en-us/assets/crypto/ripple-usd' },
  { name: 'Bitstamp', url: 'https://www.bitstamp.net/crypto/rlusd/' },
  { name: 'Gemini', url: 'https://www.gemini.com/prices/ripple-usd' },
  { name: 'Bitget', url: 'https://www.bitget.com/spot/rlusdusdt' },
  { name: 'MoonPay', url: 'https://www.moonpay.com/buy/rlusd' },
  { name: 'Revolut', url: 'https://www.revolut.com/crypto/' },
]

const resources = [
  {
    category: 'Documentation',
    icon: BookOpen,
    color: 'cyber-glow',
    items: [
      { name: 'XRPL Docs', url: 'https://xrpl.org' },
      { name: 'Ripple Developer Portal', url: 'https://ripple.com/build' },
      { name: 'RLUSD (Ripple)', url: 'https://ripple.com/ripple-usd/' },
    ]
  },
  {
    category: 'SDKs & Libraries',
    icon: Code,
    color: 'cyber-purple',
    items: [
      { name: 'xrpl.js (JavaScript)', url: 'https://js.xrpl.org' },
      { name: 'xrpl-py (Python)', url: 'https://xrpl-py.readthedocs.io' },
      { name: 'xrpl4j (Java)', url: 'https://github.com/XRPLF/xrpl4j' },
    ]
  },
  {
    category: 'Tools',
    icon: Wrench,
    color: 'cyber-green',
    items: [
      { name: 'XRPL Explorer', url: 'https://livenet.xrpl.org' },
      { name: 'Testnet Faucet', url: 'https://xrpl.org/xrp-testnet-faucet.html' },
      { name: 'XRPScan', url: 'https://xrpscan.com' },
    ]
  },
  {
    category: 'Learning',
    icon: Video,
    color: 'cyber-yellow',
    items: [
      { name: 'XRPL Learn', url: 'https://xrpl.org/learn.html' },
      { name: 'Ripple YouTube', url: 'https://www.youtube.com/ripple' },
      { name: 'Developer Workshops', url: 'https://ripple.com/build/events' },
    ]
  },
]

/** Portfolio section content (RLUSD, ETF, health, charts). Used inside Profile page. */
export function PortfolioContent() {
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('1M')
  const { price: xrpPrice, change24h: xrpChange24h, loading: xrpLoading, source: xrpSource } = useXRPPrice()
  const { data: priceHistoryData, isLoading: priceHistoryLoading, dataUpdatedAt, refetch: refetchPriceHistory } = useXRPPriceHistory(chartPeriod)
  const { data: priceVolumeData, isLoading: priceVolumeLoading, refetch: refetchPriceVolume } = useXRPPriceVolumeHistory(chartPeriod)
  const { inflows24h, flowHistory: etfFlowHistoryLive, perEtfFlow, loading: etfLoading, source: etfSource, refetch: refetchETF, dataUpdatedAt: etfUpdatedAt } = useXRPETF()
  const { rows: stablecoinRows, loading: stablecoinLoading, dataUpdatedAt: stablecoinUpdatedAt } = useStablecoinComparison()
  const { wallets, activeWalletId, refreshAllWallets } = useWalletStore()
  const activeWallet = activeWalletId ? wallets.find((w) => w.id === activeWalletId) : wallets[0]
  const isRefreshing = activeWallet?.isLoading ?? false
  const balanceXRP = activeWallet?.balance ?? 0
  const tokens = activeWallet?.tokens ?? []
  const lastUpdated = activeWallet?.lastUpdated

  const totalValueUSD = xrpPrice > 0 ? balanceXRP * xrpPrice : 0
  const hasWallet = activeWallet && activeWallet.provider !== 'demo'

  const portfolioAllocation = (() => {
    if (!hasWallet || (balanceXRP === 0 && tokens.length === 0)) return DEFAULT_ALLOCATION
    const items: Array<{ name: string; value: number; color: string }> = []
    if (balanceXRP > 0) items.push({ name: 'XRP', value: balanceXRP, color: ALLOCATION_COLORS[0] })
    tokens.forEach((t, i) => {
      items.push({
        name: t.currency.length > 8 ? `${t.currency.slice(0, 6)}…` : t.currency,
        value: Math.abs(t.balance),
        color: ALLOCATION_COLORS[(i + 1) % ALLOCATION_COLORS.length],
      })
    })
    if (items.length === 0) return DEFAULT_ALLOCATION
    return items
  })()

  const portfolioHealth = hasWallet ? (balanceXRP > 0 ? { score: 94, label: 'Active' } : { score: 0, label: 'Empty' }) : { score: null, label: 'Connect wallet' }

  const handleRefresh = () => {
    if (activeWallet) useWalletStore.getState().refreshWallet(activeWallet.id)
    else refreshAllWallets()
  }

  const chartData = (priceHistoryData?.length ? priceHistoryData : undefined) ?? Array.from({ length: 30 }, (_, i) => ({
    date: `Day ${i + 1}`,
    xrp: 2.15 + Math.sin(i * 0.2) * 0.3,
  }))

  const etfInflowsDisplay =
    etfSource && inflows24h != null
      ? (inflows24h >= 0 ? '+' : '') + '$' + (Math.abs(inflows24h) >= 1e9 ? (inflows24h / 1e9).toFixed(2) + 'B' : (inflows24h / 1e6).toFixed(1) + 'M')
      : ETF_FALLBACK.inflows
  const etfFlowChartData = etfFlowHistoryLive.length > 0 ? etfFlowHistoryLive : ETF_FALLBACK.flowHistory

  const [etfFlowDays, setEtfFlowDays] = useState<7 | 14>(14)
  const etfFlowChartDataSliced = etfFlowChartData.slice(-etfFlowDays)
  const etfPeriodNet = etfFlowChartDataSliced.reduce((s, d) => s + d.inflow + d.outflow, 0)
  const formatFlowUsd = (n: number) =>
    n === 0 ? '$0' : (n >= 1e9 ? (n / 1e9).toFixed(2) + 'B' : (n / 1e6).toFixed(2) + 'M')
  const etfPeriodNetDisplay = (etfPeriodNet >= 0 ? '+' : '') + '$' + formatFlowUsd(Math.abs(etfPeriodNet))

  return (
    <>
        {/* Data disclaimer: RLUSD/ETF illustrative; XRP and wallet data are live */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-cyber-darker/60 border border-cyber-border text-[11px] text-cyber-muted"
        >
          <Info size={14} className="shrink-0 text-cyber-cyan" />
          <span>XRP price and wallet balances are live. Set VITE_COINGLASS_API_KEY for live XRP ETF flows. RLUSD uses illustrative data.</span>
        </motion.div>

        {/* My Portfolio – real wallet data when connected */}
        {hasWallet && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="cyber-panel p-4 mb-6 border-cyber-glow/40"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wallet size={18} className="text-cyber-glow" />
                <span className="font-cyber text-sm text-cyber-glow">MY PORTFOLIO</span>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-cyber-muted hover:text-cyber-cyan hover:bg-cyber-cyan/10 border border-transparent hover:border-cyber-cyan/30 disabled:opacity-50"
              >
                {isRefreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Refresh
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] text-cyber-muted uppercase tracking-wider">Total (XRP value)</p>
                <p className="font-cyber text-xl text-cyber-text">
                  {xrpLoading ? '…' : totalValueUSD > 0 ? `$${totalValueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-cyber-muted uppercase tracking-wider">XRP balance</p>
                <p className="font-cyber text-xl text-cyber-glow">{balanceXRP.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-[10px] text-cyber-muted uppercase tracking-wider">Tokens</p>
                <p className="font-cyber text-xl text-cyber-text">{tokens.length}</p>
              </div>
              <div>
                <p className="text-[10px] text-cyber-muted uppercase tracking-wider">Last updated</p>
                <p className="text-sm text-cyber-muted">
                  {lastUpdated ? new Date(lastUpdated).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {!hasWallet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 mb-4 px-4 py-3 rounded-lg bg-cyber-darker border border-cyber-border text-xs text-cyber-muted"
          >
            <Wallet size={16} className="shrink-0 text-cyber-cyan" />
            <span>Connect a wallet on the Profile tab to see your live portfolio value and allocation here.</span>
          </motion.div>
        )}

        {/* Top Stats Row */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* RLUSD Card – illustrative */}
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
          
          {/* XRP ETF Inflows – live when VITE_COINGLASS_API_KEY set */}
          <div className="cyber-panel p-4 border-cyber-purple/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-cyber-muted">XRP ETF Net Flow (24h)</span>
              {etfSource ? (
                <span className="text-[10px] text-cyber-purple">Live</span>
              ) : (
                <TrendingUp size={14} className="text-cyber-green" />
              )}
            </div>
            {etfLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 size={18} className="animate-spin text-cyber-muted" />
                <span className="text-cyber-muted text-sm">…</span>
              </div>
            ) : (
              <span className={`font-cyber text-2xl ${etfSource && inflows24h != null ? (inflows24h >= 0 ? 'text-cyber-green' : 'text-cyber-red') : 'text-cyber-green'}`}>
                {etfInflowsDisplay}
              </span>
            )}
            <div className="mt-2 pt-2 border-t border-cyber-border flex items-center justify-between">
              <span className="text-xs text-cyber-muted">Source: {etfSource || 'illustrative'}</span>
              {etfSource && etfUpdatedAt > 0 && (
                <span className="text-[10px] text-cyber-muted">
                  Updated {new Date(etfUpdatedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
          
          {/* XRP Price – live */}
          <div className="cyber-panel p-4 border-cyber-glow/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-cyber-muted">XRP Price</span>
              {!xrpLoading && xrpChange24h != null && (
                <span className={`text-xs ${xrpChange24h >= 0 ? 'text-cyber-green' : 'text-cyber-red'}`}>
                  {xrpChange24h >= 0 ? '+' : ''}{xrpChange24h.toFixed(2)}%
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-cyber text-2xl text-cyber-glow">
                {xrpLoading ? '…' : xrpPrice != null ? `$${xrpPrice.toFixed(4)}` : '—'}
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-cyber-border">
              <span className="text-xs text-cyber-muted">
                {xrpSource ? `${xrpSource}` : 'Live'}
              </span>
            </div>
          </div>
          
          {/* Portfolio Health – active when wallet connected */}
          <div className="cyber-panel p-4 border-cyber-cyan/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-cyber-muted">Portfolio Health</span>
              <Activity size={14} className="text-cyber-cyan" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-cyber text-2xl text-cyber-cyan">
                {portfolioHealth.score != null ? portfolioHealth.score : '—'}
              </span>
              {portfolioHealth.score != null && <span className="text-sm text-cyber-muted">/100</span>}
            </div>
            <div className="mt-2 pt-2 border-t border-cyber-border">
              <span className={`text-xs ${portfolioHealth.label === 'Active' ? 'text-cyber-green' : portfolioHealth.label === 'Empty' ? 'text-cyber-yellow' : 'text-cyber-muted'}`}>
                {portfolioHealth.label}
              </span>
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
                  <span className="font-cyber text-sm text-cyber-glow">XRP PRICE HISTORY</span>
                  {priceHistoryLoading && <Loader2 size={14} className="animate-spin text-cyber-muted" />}
                  {!priceHistoryLoading && dataUpdatedAt > 0 && (
                    <span className="text-[10px] text-cyber-muted">
                      Updated {new Date(dataUpdatedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => refetchPriceHistory()}
                    disabled={priceHistoryLoading}
                    className="p-1.5 rounded text-cyber-muted hover:text-cyber-glow hover:bg-cyber-glow/10 disabled:opacity-50"
                    title="Refresh price history"
                  >
                    <RefreshCw size={14} className={priceHistoryLoading ? 'animate-spin' : ''} />
                  </button>
                  {(['1D', '1W', '1M'] as const).map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setChartPeriod(period)}
                      className={`px-3 py-1 text-xs rounded ${
                        chartPeriod === period
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
                  <AreaChart data={chartData}>
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
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`$${Number(value).toFixed(4)}`, 'XRP']}
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

            {/* Volume vs Price scatter – key indicators for outliers */}
            <div className="cyber-panel p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={16} className="text-cyber-cyan" />
                <span className="font-cyber text-sm text-cyber-cyan">VOLUME vs PRICE (BY DAY)</span>
              </div>
              <VolumePriceScatterChart
                data={priceVolumeData ?? []}
                period={chartPeriod}
                loading={priceVolumeLoading}
                onRefresh={() => refetchPriceVolume()}
              />
            </div>
            
            {/* XRP ETF Flows Chart – live when CoinGlass API key set */}
            <div className="cyber-panel p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-cyber-purple" />
                  <span className="font-cyber text-sm text-cyber-purple">XRP ETF FLOW</span>
                  {etfSource && (
                    <button
                      type="button"
                      onClick={() => refetchETF()}
                      disabled={etfLoading}
                      className="p-1 rounded text-cyber-muted hover:text-cyber-purple disabled:opacity-50"
                      title="Refresh ETF data"
                    >
                      <RefreshCw size={12} className={etfLoading ? 'animate-spin' : ''} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {([7, 14] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setEtfFlowDays(d)}
                      className={`px-2 py-1 text-xs rounded ${
                        etfFlowDays === d
                          ? 'bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/40'
                          : 'bg-cyber-darker text-cyber-muted border border-cyber-border hover:border-cyber-purple/30'
                      }`}
                    >
                      {d}D
                    </button>
                  ))}
                  <span className="text-xs text-cyber-muted">{etfSource ? 'Live' : 'Sample data'}</span>
                </div>
              </div>
              {!etfSource && (
                <p className="text-[11px] text-cyber-yellow/90 mb-2 px-2 py-1.5 rounded bg-cyber-yellow/10 border border-cyber-yellow/30">
                  No live feed. Add <code className="bg-cyber-darker px-1 rounded">VITE_COINGLASS_API_KEY</code> to <code className="bg-cyber-darker px-1 rounded">.env</code> for real XRP ETF flows (CoinGlass).
                </p>
              )}
              {etfFlowChartDataSliced.length > 0 && (
                <p className="text-[11px] text-cyber-muted mb-2">
                  <span className={etfPeriodNet >= 0 ? 'text-cyber-green' : 'text-cyber-red'}>
                    {etfFlowDays}-day net: {etfPeriodNetDisplay}
                  </span>
                </p>
              )}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={etfFlowChartDataSliced}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.1)" />
                    <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => { const abs = Math.abs(Number(v)); const s = Number(v) < 0 ? '-' : ''; return s + (abs >= 1e6 ? `${abs / 1e6}M` : abs >= 1e3 ? `${abs / 1e3}K` : String(abs)); }} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length || !label) return null
                        const inflow = (payload.find((p) => p.dataKey === 'inflow')?.value as number) ?? 0
                        const outflow = (payload.find((p) => p.dataKey === 'outflow')?.value as number) ?? 0
                        const net = inflow + outflow
                        return (
                          <div className="px-3 py-2 rounded bg-cyber-darker border border-cyber-border text-xs">
                            <p className="font-cyber text-cyber-purple mb-1.5">{label}</p>
                            <p className="text-cyber-green">Inflow: ${(inflow / 1e6).toFixed(2)}M</p>
                            <p className="text-cyber-red">Outflow: ${(Math.abs(outflow) / 1e6).toFixed(2)}M</p>
                            <p className={net >= 0 ? 'text-cyber-green' : 'text-cyber-red'}>Net: {(net >= 0 ? '+' : '') + '$' + (Math.abs(net) / 1e6).toFixed(2)}M</p>
                          </div>
                        )
                      }}
                      contentStyle={{
                        backgroundColor: '#111827',
                        border: '1px solid #1e3a5f',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="inflow" fill="#00ff88" radius={[4, 4, 0, 0]} name="Inflow" />
                    <Bar dataKey="outflow" fill="#ff4444" radius={[4, 4, 0, 0]} name="Outflow" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 pt-3 border-t border-cyber-border">
                <p className="text-[10px] text-cyber-muted uppercase tracking-wider mb-2">
                  XRP spot ETFs (US) · AUM & holdings approx. as of {XRP_ETF_REFERENCE_AS_OF}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-cyber-border text-cyber-muted">
                        <th className="text-left py-1.5 font-normal">Ticker</th>
                        <th className="text-left py-1.5 font-normal">Issuer</th>
                        <th className="text-right py-1.5 font-normal">AUM</th>
                        <th className="text-right py-1.5 font-normal">XRP held</th>
                        {etfSource && Object.keys(perEtfFlow).length > 0 && (
                          <th className="text-right py-1.5 font-normal">Flow (latest)</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {XRP_ETF_REFERENCE.map(({ ticker, issuer, aumM, xrpHoldingsM, url }) => (
                        <tr key={ticker} className="border-b border-cyber-border/50">
                          <td className="py-1.5">
                            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-cyber text-cyber-purple hover:text-cyber-glow hover:underline">
                              {ticker}
                              <ExternalLink size={10} className="opacity-70" />
                            </a>
                          </td>
                          <td className="py-1.5 text-cyber-text">{issuer}</td>
                          <td className="py-1.5 text-right text-cyber-text">${aumM.toFixed(1)}M</td>
                          <td className="py-1.5 text-right text-cyber-muted">{xrpHoldingsM > 0 ? `${xrpHoldingsM.toFixed(1)}M` : '—'}</td>
                          {etfSource && Object.keys(perEtfFlow).length > 0 && (
                            <td className="py-1.5 text-right">
                              {perEtfFlow[ticker] != null ? (
                                <span className={perEtfFlow[ticker] >= 0 ? 'text-cyber-green' : 'text-cyber-red'}>
                                  {(perEtfFlow[ticker] >= 0 ? '+' : '') + '$' + (Math.abs(perEtfFlow[ticker]) / 1e6).toFixed(2)}M
                                </span>
                              ) : (
                                <span className="text-cyber-muted">—</span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-cyber-border">
                <p className="text-[10px] text-cyber-muted uppercase tracking-wider mb-2">
                  Listed companies using or holding XRP (not ETFs)
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-cyber-border text-cyber-muted">
                        <th className="text-left py-1.5 font-normal">Ticker</th>
                        <th className="text-left py-1.5 font-normal">Company</th>
                        <th className="text-left py-1.5 font-normal">Exchange</th>
                        <th className="text-left py-1.5 font-normal">XRP exposure</th>
                      </tr>
                    </thead>
                    <tbody>
                      {XRP_LISTED_COMPANIES.map(({ ticker, company, exchange, note, url }) => (
                        <tr key={ticker} className="border-b border-cyber-border/50">
                          <td className="py-1.5">
                            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-cyber text-cyber-cyan hover:text-cyber-glow hover:underline">
                              {ticker}
                              <ExternalLink size={10} className="opacity-70" />
                            </a>
                          </td>
                          <td className="py-1.5 text-cyber-text">{company}</td>
                          <td className="py-1.5 text-cyber-muted">{exchange}</td>
                          <td className="py-1.5 text-cyber-muted max-w-[200px] truncate" title={note}>{note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                    {stablecoinRows.map((coin, idx) => (
                      <tr key={coin.name} className="border-b border-cyber-border/50 hover:bg-cyber-darker/50">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-cyber ${
                              idx === 0 ? 'bg-cyber-green/20 text-cyber-green' : 'bg-cyber-border text-cyber-muted'
                            }`}>
                              {coin.name[0]}
                            </div>
                            {coin.name === 'RLUSD' ? (
                              <a href={RLUSD_OFFICIAL_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-cyber-green font-medium hover:text-cyber-glow hover:underline">
                                {coin.name}
                                <ExternalLink size={10} className="opacity-70" />
                              </a>
                            ) : (
                              <span className="text-sm text-cyber-text">{coin.name}</span>
                            )}
                            {idx === 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-cyber-green/20 text-cyber-green">XRPL</span>}
                          </div>
                        </td>
                        <td className="text-right py-3 text-sm text-cyber-text">${coin.mcap >= 1 ? coin.mcap.toFixed(1) : coin.mcap.toFixed(2)}B</td>
                        <td className="text-right py-3 text-sm text-cyber-text">${coin.volume >= 1 ? coin.volume.toFixed(1) : coin.volume.toFixed(2)}B</td>
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
              <div className="mt-3 pt-3 border-t border-cyber-border">
                <p className="text-[10px] text-cyber-muted uppercase tracking-wider mb-2">Where to buy RLUSD</p>
                <div className="flex flex-wrap gap-2">
                  {RLUSD_BUY_LINKS.map(({ name, url }) => (
                    <a
                      key={name}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-cyber-darker border border-cyber-border text-cyber-text hover:border-cyber-green/50 hover:text-cyber-green"
                    >
                      {name}
                      <ExternalLink size={10} className="opacity-70" />
                    </a>
                  ))}
                </div>
                <p className="text-[10px] text-cyber-muted mt-2">Official list: Ripple RLUSD partners. Not endorsement.</p>
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
                    <span className="text-sm text-cyber-muted">
                      {hasWallet && portfolioAllocation[0]?.name === 'XRP'
                        ? item.name === 'XRP'
                          ? `${Number(item.value).toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP`
                          : `${Number(item.value).toLocaleString(undefined, { maximumFractionDigits: 4 })}`
                        : `${item.value}%`}
                    </span>
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
    </>
  )
}

export default function Clinic() {
  return (
    <div className="min-h-screen pt-20 pb-8 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div className="mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <HeartPulse className="text-cyber-green" size={28} />
            <h1 className="font-cyber text-2xl text-cyber-text tracking-wider">PORTFOLIO</h1>
          </div>
          <p className="text-cyber-muted">Portfolio Health, Stablecoins, ETFs & Resources</p>
        </motion.div>
        <PortfolioContent />
      </div>
    </div>
  )
}
