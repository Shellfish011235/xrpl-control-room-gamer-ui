import { useEffect, lazy, Suspense, useRef } from 'react'
import { lazyWithRetry } from './lib/lazyWithRetry'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'
import Navigation from './components/Navigation'
import { GlobalAgentPanel } from './components/GlobalAgentPanel'
import { PlatformModeBar } from './components/PlatformModeBar'
import { DisclaimerBanner } from './components/DisclaimerBanner'
import { ProfileBackground } from './components/ProfileBackground'
import { RootErrorBoundary } from './components/RootErrorBoundary'

/** Slower scroll speed site-wide so options in scrollable boxes are easier to see. */
const SCROLL_SPEED_FACTOR = 0.4

function getScrollableElement(el: HTMLElement | null): HTMLElement | null {
  while (el && el !== document.body) {
    const { overflowY, overflowX, overflow } = getComputedStyle(el)
    const canScrollY = el.scrollHeight > el.clientHeight
    const canScrollX = el.scrollWidth > el.clientWidth
    const scrollableY = (overflowY === 'auto' || overflowY === 'scroll' || overflow === 'auto' || overflow === 'scroll') && canScrollY
    const scrollableX = (overflowX === 'auto' || overflowX === 'scroll' || overflow === 'auto' || overflow === 'scroll') && canScrollX
    if (scrollableY || scrollableX) return el
    el = el.parentElement
  }
  return null
}

// Lazy-load pages so first load is fast (especially on mobile / in-app browsers like X)
const Network = lazyWithRetry(() => import('./pages/Network'))
const Underworld = lazyWithRetry(() => import('./pages/Underworld'))
const Character = lazyWithRetry(() => import('./pages/Character'))
const MemeticLab = lazyWithRetry(() => import('./pages/MemeticLab'))
const Terminal = lazyWithRetry(() => import('./pages/Terminal'))
const Learn = lazyWithRetry(() => import('./pages/Learn'))
const PayPage = lazyWithRetry(() => import('./pages/PayPage'))
const PayAgentsPage = lazyWithRetry(() => import('./pages/PayPage').then((m) => ({ default: m.PayAgentsPage })))
const PayAgentsRedirect = lazyWithRetry(() => import('./pages/PayPage').then((m) => ({ default: m.PayAgentsRedirect })))
const PayCARVRedirect = lazyWithRetry(() => import('./pages/PayPage').then((m) => ({ default: m.PayCARVRedirect })))
const Tools = lazyWithRetry(() => import('./pages/Tools'))
const Bridges = lazyWithRetry(() => import('./pages/Bridges'))
const Agents = lazyWithRetry(() => import('./pages/Agents'))
const Optimizer = lazyWithRetry(() => import('./pages/Optimizer'))
const LedgerImpactPage = lazyWithRetry(() => import('./pages/LedgerImpactPage'))
const Builder = lazyWithRetry(() => import('./pages/Builder'))
const AmendmentDetail = lazyWithRetry(() => import('./pages/AmendmentDetail'))
const GovernanceGuide = lazyWithRetry(() => import('./pages/GovernanceGuide'))
const MvpWalletPage = lazyWithRetry(() => import('./pages/MvpWalletPage'))
const DexOrderPage = lazyWithRetry(() => import('./pages/DexOrderPage'))
const ControlRoomPage = lazyWithRetry(() => import('./pages/ControlRoomPage'))
const IntelligencePage = lazyWithRetry(() => import('./pages/IntelligencePage'))

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyber-glow/30 border-t-cyber-glow" />
    </div>
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  // Lazy-init Xaman and wire connect/disconnect → strategy store (Orchestra/strategy agents use correct owner)
  const xamanSyncCleanupRef = useRef<(() => void) | null>(null)
  useEffect(() => {
    import('./config/xaman').then(({ initializeXaman }) => {
      try {
        const xamanConfig = initializeXaman()
        console.log('🚀 XRPL Control Room ready')
        console.log(`📱 Xaman mode: ${xamanConfig.mode}`)
      } catch (e) {
        console.warn('[Xaman] Init failed:', e)
      }
    }).catch((e) => console.warn('[Xaman] Load failed:', e))

    Promise.all([
      import('./services/xaman'),
      import('./store/strategyStore'),
      import('./store/walletStore'),
    ]).then(([{ xamanService }, { useStrategyStore }, { useWalletStore }]) => {
      const onConnected = (session: { address: string } | null) => {
        if (session?.address) useStrategyStore.getState().setWalletAddress(session.address)
      }
      const onDisconnected = () => {
        const { activeWalletId, wallets } = useWalletStore.getState()
        const active = activeWalletId ? wallets.find((w) => w.id === activeWalletId) : null
        useStrategyStore.getState().setWalletAddress(active?.address ?? null)
      }
      xamanService.on('connected', onConnected)
      xamanService.on('disconnected', onDisconnected)
      xamanSyncCleanupRef.current = () => {
        xamanService.off('connected', onConnected)
        xamanService.off('disconnected', onDisconnected)
      }
      const addr = xamanService.getAddress()
      if (addr) useStrategyStore.getState().setWalletAddress(addr)
    }).catch(() => {})

    return () => {
      xamanSyncCleanupRef.current?.()
      xamanSyncCleanupRef.current = null
    }
  }, [])

  useEffect(() => {
    function onWheel(e: WheelEvent) {
      const scrollable = getScrollableElement(e.target as HTMLElement)
      if (!scrollable) return
      const deltaY = e.deltaY * SCROLL_SPEED_FACTOR
      const deltaX = e.deltaX * SCROLL_SPEED_FACTOR
      if (deltaY !== 0 || deltaX !== 0) {
        e.preventDefault()
        scrollable.scrollTop += deltaY
        scrollable.scrollLeft += deltaX
      }
    }
    document.addEventListener('wheel', onWheel, { passive: false, capture: true })
    return () => document.removeEventListener('wheel', onWheel, { capture: true })
  }, [])

  return (
    <RootErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen min-h-[100dvh] w-full max-w-full bg-cyber-darker relative overflow-x-hidden">
          <ProfileBackground />
          <Navigation />
          <DisclaimerBanner />

          <main className="relative z-10 pt-[7rem] pt-[calc(7rem+env(safe-area-inset-top,0px))]">
            <PlatformModeBar />
            <GlobalAgentPanel />
            <Suspense fallback={<PageLoader />}>
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<Character />} />
                  <Route path="/character" element={<Navigate to="/" replace />} />
                  <Route path="/portfolio" element={<Navigate to="/" replace state={{ section: 'portfolio' }} />} />
                  <Route path="/clinic" element={<Navigate to="/" replace />} />
                  <Route path="/intelligence" element={<IntelligencePage />} />
                  <Route path="/network" element={<Network />} />
                  <Route path="/world" element={<Navigate to="/network" replace />} />
                  <Route path="/ilp-map" element={<Navigate to="/network" replace />} />
                  <Route path="/underworld" element={<Underworld />} />
                  <Route path="/memetic-lab" element={<MemeticLab />} />
                  <Route path="/terminal" element={<Terminal />} />
                  <Route path="/pay" element={<PayPage />} />
                  <Route path="/pay/agents" element={<PayAgentsRedirect />} />
                  <Route path="/pay/carv" element={<PayCARVRedirect />} />
                  <Route path="/stream" element={<Navigate to="/pay" replace />} />
                  <Route path="/micropayments" element={<Navigate to="/pay" replace />} />
                  <Route path="/agent-economy" element={<Navigate to="/pay/agents" replace />} />
                  <Route path="/carv" element={<Navigate to="/pay/carv" replace />} />
                  <Route path="/radar" element={<Navigate to="/network" replace />} />
                  <Route path="/learn" element={<Learn />} />
                  <Route path="/tools" element={<Tools />}>
                    <Route index element={<Navigate to="/tools/control-room" replace />} />
                    <Route path="ledger-impact" element={<LedgerImpactPage />} />
                    <Route path="optimizer" element={<Optimizer />} />
                    <Route path="nfts" element={<Navigate to="/tools" replace />} />
                    <Route path="bridges" element={<Bridges />} />
                    <Route path="agents" element={<Agents />} />
                    <Route path="control-room" element={<ControlRoomPage />} />
                    <Route path="builder" element={<Builder />} />
                    <Route path="wallet" element={<MvpWalletPage />} />
                    <Route path="dex-order" element={<DexOrderPage />} />
                  </Route>
                  <Route path="/optimizer" element={<Navigate to="/tools" replace />} />
                  <Route path="/nfts" element={<Navigate to="/tools" replace />} />
                  <Route path="/bridges" element={<Navigate to="/tools/bridges" replace />} />
                  <Route path="/agents" element={<Navigate to="/tools/agents" replace />} />
                  <Route path="/liquidity-crush" element={<Navigate to="/tools" replace />} />
                  <Route path="/amendment/:amendmentId" element={<AmendmentDetail />} />
                  <Route path="/governance-guide" element={<GovernanceGuide />} />
                  <Route path="/wallet" element={<MvpWalletPage />} />
                  <Route path="/mvp-wallet" element={<Navigate to="/wallet" replace />} />
                  <Route path="/innovation" element={<Navigate to="/network" replace />} />
                </Routes>
              </AnimatePresence>
            </Suspense>
          </main>
          </div>
        </Router>
      </QueryClientProvider>
    </RootErrorBoundary>
  )
}

export default App
