import { useState } from 'react'
import { motion } from 'framer-motion'
import LedgerHeartbeat from '@/modules/visualization/LedgerHeartbeat'
import ReactorCoreView from '@/modules/visualization/ReactorCoreView'

export default function SectorRadarPage() {
  const [view, setView] = useState<'reactor' | 'data'>('reactor')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="px-4 py-8 flex flex-col items-center min-h-[60vh]"
    >
      <div className="mb-4 flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setView('reactor')}
          className={`rounded-lg border px-3 py-1.5 transition-colors ${
            view === 'reactor'
              ? 'border-cyber-glow/50 bg-cyber-glow/10 text-cyber-glow'
              : 'border-white/10 text-cyber-muted hover:border-white/20'
          }`}
        >
          Reactor
        </button>
        <button
          type="button"
          onClick={() => setView('data')}
          className={`rounded-lg border px-3 py-1.5 transition-colors ${
            view === 'data'
              ? 'border-cyber-glow/50 bg-cyber-glow/10 text-cyber-glow'
              : 'border-white/10 text-cyber-muted hover:border-white/20'
          }`}
        >
          Data
        </button>
      </div>
      {view === 'reactor' ? <ReactorCoreView /> : <LedgerHeartbeat />}
    </motion.div>
  )
}
