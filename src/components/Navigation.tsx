import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Globe, Skull, User, HeartPulse, Home, Menu, X, TrendingUp, TrendingDown, Brain, Activity, Cpu } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

// XRP Price Hook - fetches from CoinGecko
function useXRPPrice() {
  const [price, setPrice] = useState<number | null>(null)
  const [change24h, setChange24h] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd&include_24hr_change=true'
        )
        if (!response.ok) throw new Error('Failed to fetch price')
        const data = await response.json()
        setPrice(data.ripple.usd)
        setChange24h(data.ripple.usd_24h_change)
        setError(null)
      } catch (err) {
        console.error('[Price] Error fetching XRP price:', err)
        setError('Failed to load')
      } finally {
        setLoading(false)
      }
    }

    // Fetch immediately
    fetchPrice()

    // Refresh every 30 seconds
    const interval = setInterval(fetchPrice, 30000)

    return () => clearInterval(interval)
  }, [])

  return { price, change24h, loading, error }
}

// Live Ledger Index Hook - fetches from XRPL
function useLedgerIndex() {
  const [ledgerIndex, setLedgerIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const XRPL_WS_ENDPOINTS = [
      'wss://xrplcluster.com',
      'wss://s1.ripple.com',
      'wss://s2.ripple.com',
    ]
    
    let currentEndpointIndex = 0
    let isConnected = false

    const connect = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return

      const endpoint = XRPL_WS_ENDPOINTS[currentEndpointIndex]
      console.log(`[Ledger] Connecting to ${endpoint}...`)
      
      try {
        wsRef.current = new WebSocket(endpoint)

        wsRef.current.onopen = () => {
          console.log('[Ledger] WebSocket connected')
          isConnected = true
          setError(null)
          
          // Subscribe to ledger stream
          wsRef.current?.send(JSON.stringify({
            command: 'subscribe',
            streams: ['ledger']
          }))
          
          // Also request current ledger immediately
          wsRef.current?.send(JSON.stringify({
            command: 'ledger',
            ledger_index: 'validated'
          }))
        }

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            // Handle ledger subscription updates
            if (data.type === 'ledgerClosed' && data.ledger_index) {
              setLedgerIndex(data.ledger_index)
              setLoading(false)
            }
            
            // Handle initial ledger response
            if (data.result?.ledger_index) {
              setLedgerIndex(data.result.ledger_index)
              setLoading(false)
            }
            
            // Handle ledger response with ledger object
            if (data.result?.ledger?.ledger_index) {
              setLedgerIndex(data.result.ledger.ledger_index)
              setLoading(false)
            }
          } catch (err) {
            console.error('[Ledger] Error parsing message:', err)
          }
        }

        wsRef.current.onerror = (err) => {
          console.error('[Ledger] WebSocket error:', err)
          setError('Connection error')
        }

        wsRef.current.onclose = () => {
          console.log('[Ledger] WebSocket closed')
          isConnected = false
          
          // Try next endpoint and reconnect
          currentEndpointIndex = (currentEndpointIndex + 1) % XRPL_WS_ENDPOINTS.length
          
          // Reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isConnected) {
              connect()
            }
          }, 3000)
        }
      } catch (err) {
        console.error('[Ledger] Failed to create WebSocket:', err)
        setError('Failed to connect')
        setLoading(false)
        
        // Try reconnecting
        reconnectTimeoutRef.current = setTimeout(() => {
          currentEndpointIndex = (currentEndpointIndex + 1) % XRPL_WS_ENDPOINTS.length
          connect()
        }, 3000)
      }
    }

    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  return { ledgerIndex, loading, error }
}

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/terminal', label: 'Terminal', icon: Activity },
  { path: '/carv', label: 'CARV', icon: Cpu },
  { path: '/network', label: 'Network', icon: Globe },
  { path: '/underworld', label: 'Underworld', icon: Skull },
  { path: '/memetic-lab', label: 'Memetic Lab', icon: Brain },
  { path: '/character', label: 'Character', icon: User },
  { path: '/clinic', label: 'Clinic', icon: HeartPulse },
]

export default function Navigation() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { price, change24h, loading } = useXRPPrice()
  const { ledgerIndex, loading: ledgerLoading } = useLedgerIndex()

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top Border Glow */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-cyber-glow to-transparent" />
      
      <nav className="cyber-panel border-t-0 rounded-t-none px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyber-glow to-cyber-blue flex items-center justify-center cyber-glow">
                <span className="font-cyber font-bold text-lg text-cyber-darker">XR</span>
              </div>
              <div className="absolute -inset-1 rounded-lg bg-cyber-glow/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-cyber text-lg font-bold tracking-wider text-cyber-text group-hover:text-cyber-glow transition-colors">
                XRPL
              </h1>
              <p className="text-xs text-cyber-muted -mt-1 tracking-widest">CONTROL ROOM</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              const Icon = item.icon
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative px-4 py-2 group"
                >
                  <div className={`flex items-center gap-2 transition-all duration-300 ${
                    isActive ? 'text-cyber-glow' : 'text-cyber-muted hover:text-cyber-text'
                  }`}>
                    <Icon size={18} className={isActive ? 'drop-shadow-[0_0_8px_var(--color-cyber-glow)]' : ''} />
                    <span className="font-cyber text-sm tracking-wider uppercase">{item.label}</span>
                  </div>
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-cyber-glow via-cyber-cyan to-cyber-glow"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  
                  {/* Hover Glow */}
                  <div className="absolute inset-0 rounded-lg bg-cyber-glow/0 group-hover:bg-cyber-glow/5 transition-colors" />
                </Link>
              )
            })}
          </div>

          {/* Status Indicators */}
          <div className="hidden lg:flex items-center gap-4">
            {/* XRP Price */}
            <div className="flex items-center gap-3 px-3 py-1.5 cyber-panel border-cyber-glow/30">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyber-glow to-cyber-blue flex items-center justify-center">
                  <span className="font-cyber text-[10px] font-bold text-cyber-darker">X</span>
                </div>
                <div>
                  <p className="text-[10px] text-cyber-muted leading-none">XRP/USD</p>
                  {loading ? (
                    <p className="font-cyber text-sm text-cyber-glow animate-pulse">...</p>
                  ) : price !== null ? (
                    <p className="font-cyber text-sm text-cyber-glow">${price.toFixed(4)}</p>
                  ) : (
                    <p className="font-cyber text-sm text-cyber-muted">--</p>
                  )}
                </div>
              </div>
              {!loading && change24h !== null && (
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-cyber ${
                  change24h >= 0 
                    ? 'bg-cyber-green/20 text-cyber-green' 
                    : 'bg-cyber-red/20 text-cyber-red'
                }`}>
                  {change24h >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  <span>{Math.abs(change24h).toFixed(2)}%</span>
                </div>
              )}
            </div>

            {/* Live Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 cyber-panel border-cyber-green/30">
              <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
              <span className="text-xs font-cyber text-cyber-green">LIVE</span>
            </div>

            {/* Ledger - Live Feed */}
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <p className="text-xs text-cyber-muted">LEDGER</p>
                {!ledgerLoading && ledgerIndex && (
                  <div className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" title="Live" />
                )}
              </div>
              {ledgerLoading ? (
                <p className="font-cyber text-sm text-cyber-glow animate-pulse">Loading...</p>
              ) : ledgerIndex ? (
                <p className="font-cyber text-sm text-cyber-glow">#{ledgerIndex.toLocaleString()}</p>
              ) : (
                <p className="font-cyber text-sm text-cyber-muted">--</p>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-cyber-text hover:text-cyber-glow transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-cyber-border"
          >
            {/* Mobile XRP Price */}
            <div className="px-4 py-3 border-b border-cyber-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyber-glow to-cyber-blue flex items-center justify-center">
                  <span className="font-cyber text-xs font-bold text-cyber-darker">XRP</span>
                </div>
                <div>
                  <p className="text-[10px] text-cyber-muted">XRP/USD</p>
                  {loading ? (
                    <p className="font-cyber text-lg text-cyber-glow animate-pulse">...</p>
                  ) : price !== null ? (
                    <p className="font-cyber text-lg text-cyber-glow">${price.toFixed(4)}</p>
                  ) : (
                    <p className="font-cyber text-lg text-cyber-muted">--</p>
                  )}
                </div>
              </div>
              {!loading && change24h !== null && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-cyber ${
                  change24h >= 0 
                    ? 'bg-cyber-green/20 text-cyber-green' 
                    : 'bg-cyber-red/20 text-cyber-red'
                }`}>
                  {change24h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  <span>{Math.abs(change24h).toFixed(2)}%</span>
                </div>
              )}
            </div>

            <div className="py-4 space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive 
                        ? 'bg-cyber-glow/10 text-cyber-glow border border-cyber-glow/30' 
                        : 'text-cyber-muted hover:text-cyber-text hover:bg-cyber-border/20'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-cyber tracking-wider uppercase">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </nav>
      
      {/* Corner Decorations */}
      <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-cyber-glow/50" />
      <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-cyber-glow/50" />
    </header>
  )
}
