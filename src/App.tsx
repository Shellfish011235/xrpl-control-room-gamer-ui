import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'
import Navigation from './components/Navigation'
import { GlobalAgentPanel } from './components/GlobalAgentPanel'
import { PlatformModeBar } from './components/PlatformModeBar'
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
const Network = lazy(() => import('./pages/Network'))
const Underworld = lazy(() => import('./pages/Underworld'))
const Character = lazy(() => import('./pages/Character'))
const MemeticLab = lazy(() => import('./pages/MemeticLab'))
const Terminal = lazy(() => import('./pages/Terminal'))
const Learn = lazy(() => import('./pages/Learn'))
const PayPage = lazy(() => import('./pages/PayPage'))
const PayAgentsPage = lazy(() => import('./pages/PayPage').then((m) => ({ default: m.PayAgentsPage })))
const PayAgentsRedirect = lazy(() => import('./pages/PayPage').then((m) => ({ default: m.PayAgentsRedirect })))
const PayCARVRedirect = lazy(() => import('./pages/PayPage').then((m) => ({ default: m.PayCARVRedirect })))

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
  // Lazy-init Xaman so its import never blocks or breaks first paint (local or Vercel)
  useEffect(() => {
    import('./config/xaman').then(({ initializeXaman }) => {
      try {
        const xamanConfig = initializeXaman()
        console.log('🚀 XRPL Control Room ready')
        console.log(`📱 Xaman mode: ${xamanConfig.mode}`)
      } catch (e) {
        console.warn('[Xaman] Init failed (demo mode):', e)
      }
    }).catch((e) => console.warn('[Xaman] Load failed:', e))
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
          <div className="min-h-screen bg-cyber-darker relative">
          <ProfileBackground />
          <Navigation />

          <main className="relative z-10 pt-16">
            <PlatformModeBar />
            <GlobalAgentPanel />
            <Suspense fallback={<PageLoader />}>
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<Character />} />
                  <Route path="/character" element={<Navigate to="/" replace />} />
                  <Route path="/clinic" element={<Navigate to="/" replace />} />
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
