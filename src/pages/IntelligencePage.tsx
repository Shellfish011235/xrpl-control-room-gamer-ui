/**
 * XRPL Intelligence dashboard: Whale Tracker, Liquidity Flow, Validator Monitor, Bot Cluster, AI-Agent Activity.
 */

import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { useXRPLIntelligence } from '../hooks/useXRPLIntelligence';
import ValidatorMonitor from '../components/intelligence/ValidatorMonitor';
import WhaleTracker from '../components/intelligence/WhaleTracker';
import LiquidityFlowPanel from '../components/intelligence/LiquidityFlowPanel';
import BotClusterPanel from '../components/intelligence/BotClusterPanel';
import AIAgentActivityPanel from '../components/intelligence/AIAgentActivityPanel';

export default function IntelligencePage() {
  const { connectionState, lastLedgerIndex, lastUpdated, error, refresh } = useXRPLIntelligence();

  return (
    <div className="min-h-screen px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        <header className="py-6 border-b border-cyber-border">
          <h1 className="font-cyber text-2xl uppercase tracking-wider text-cyber-glow">
            XRPL Intelligence
          </h1>
          <p className="text-sm text-cyber-muted mt-1">
            Network analytics, whale tracking, liquidity flow, and heuristic bot/agent detection.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <span className={`flex items-center gap-2 text-sm ${connectionState === 'connected' ? 'text-cyber-green' : 'text-cyber-red'}`}>
              {connectionState === 'connected' ? <Wifi size={18} /> : <WifiOff size={18} />}
              {connectionState}
            </span>
            {lastLedgerIndex != null && (
              <span className="text-sm text-cyber-glow font-cyber">
                Ledger #{lastLedgerIndex.toLocaleString()}
              </span>
            )}
            <span className="text-xs text-cyber-muted">
              Last updated {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '—'}
            </span>
            <button
              type="button"
              onClick={refresh}
              className="flex items-center gap-1 px-2 py-1 rounded border border-cyber-border text-cyber-muted hover:text-cyber-text text-xs"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            {error && (
              <span className="flex items-center gap-1 text-xs text-cyber-red">
                <AlertCircle size={12} /> {error}
              </span>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-6">
          <ValidatorMonitor />
          <WhaleTracker />
          <LiquidityFlowPanel />
          <BotClusterPanel />
          <div className="lg:col-span-2">
            <AIAgentActivityPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
