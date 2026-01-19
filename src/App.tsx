import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'
import Navigation from './components/Navigation'
import Home from './pages/Home'
import WorldMap from './pages/WorldMap'
import Underworld from './pages/Underworld'
import Character from './pages/Character'
import Clinic from './pages/Clinic'
import MemeticLab from './pages/MemeticLab'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
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
                <Route path="/world" element={<WorldMap />} />
                <Route path="/underworld" element={<Underworld />} />
                <Route path="/character" element={<Character />} />
                <Route path="/clinic" element={<Clinic />} />
                <Route path="/memetic-lab" element={<MemeticLab />} />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App
