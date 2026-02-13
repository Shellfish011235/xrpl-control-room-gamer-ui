import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'
import Navigation from './components/Navigation'
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
import Home from './pages/Home'
import Network from './pages/Network'
import Underworld from './pages/Underworld'
import Character from './pages/Character'
import Clinic from './pages/Clinic'
import MemeticLab from './pages/MemeticLab'
import Terminal from './pages/Terminal'
import CARV from './pages/CARV'
import Micropayments from './pages/Micropayments'
import AgentEconomy from './pages/AgentEconomy'

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
          <div className="min-h-screen bg-cyber-darker cyber-grid hex-pattern relative">
          {/* Ambient Background Effects */}
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyber-glow/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyber-purple/5 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyber-blue/5 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          
          <Navigation />
          
          <main className="relative z-10">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/network" element={<Network />} />
                <Route path="/world" element={<Navigate to="/network" replace />} />
                <Route path="/ilp-map" element={<Navigate to="/network" replace />} />
                <Route path="/underworld" element={<Underworld />} />
                <Route path="/character" element={<Character />} />
                <Route path="/clinic" element={<Clinic />} />
                <Route path="/memetic-lab" element={<MemeticLab />} />
                <Route path="/terminal" element={<Terminal />} />
                <Route path="/carv" element={<CARV />} />
                <Route path="/micropayments" element={<Micropayments />} />
                <Route path="/agent-economy" element={<AgentEconomy />} />
              </Routes>
            </AnimatePresence>
          </main>
          </div>
        </Router>
      </QueryClientProvider>
    </RootErrorBoundary>
  )
}

export default App
