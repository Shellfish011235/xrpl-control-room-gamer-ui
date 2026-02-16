/**
 * Cross-Chain Nexus – Bridge-First hub. XRPL ↔ EVM/SOL flows.
 * Phase 3 / Bridge workaround. Cytoscape viz placeholder.
 */

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRightLeft, Zap, ExternalLink } from 'lucide-react';
import { fetchBridgeFlows, fetchBridgeRoutes } from '../services/bridgeService';

export default function Bridges() {
  const { data: flows = [] } = useQuery({
    queryKey: ['bridgeFlows'],
    queryFn: fetchBridgeFlows,
    staleTime: 60_000,
  });
  const { data: routes = [] } = useQuery({
    queryKey: ['bridgeRoutes'],
    queryFn: fetchBridgeRoutes,
    staleTime: 60_000,
  });

  return (
    <div className="min-h-screen pt-20 pb-8 px-4 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyber-purple/20 flex items-center justify-center">
            <ArrowRightLeft className="w-5 h-5 text-cyber-purple" />
          </div>
          <div>
            <h1 className="font-cyber text-xl text-cyber-text">CROSS-CHAIN NEXUS</h1>
            <p className="text-xs text-cyber-muted">XRPL ↔ EVM · Solana · Bridge flows</p>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/40">
            BETA
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Flow list */}
        <div className="lg:col-span-2 cyber-panel p-6 rounded-lg border border-cyber-border">
          <h2 className="font-cyber text-cyber-glow mb-4 flex items-center gap-2">
            <Zap size={18} />
            LIVE FLOWS (24H)
          </h2>
          <div className="space-y-3">
            {flows.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between p-3 rounded-lg bg-cyber-darker/50 border border-cyber-border"
              >
                <span className="font-mono text-sm text-cyber-text">
                  {f.sourceChain} → {f.destChain}
                </span>
                <span className="text-cyber-muted text-xs">{f.asset}</span>
                <span className="text-cyber-cyan text-sm">
                  ${(f.volumeUsd24h / 1_000_000).toFixed(2)}M
                </span>
                <span className="text-cyber-muted text-xs">{f.txCount24h} txs</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    f.status === 'active' ? 'bg-cyber-green' : 'bg-cyber-yellow'
                  }`}
                  title={f.status}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Routes */}
        <div className="cyber-panel p-6 rounded-lg border border-cyber-border">
          <h2 className="font-cyber text-cyber-glow mb-4">ROUTES</h2>
          <div className="space-y-2">
            {routes.map((r, i) => (
              <div key={i} className="text-sm text-cyber-muted">
                {r.fromChain} {r.fromAsset} → {r.toChain} {r.toAsset} (~{r.estimatedTimeMinutes}m)
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-cyber-muted">
            Bridge executor (Xaman flow for XRP → mXRP) and Cytoscape graph coming in Phase 3.
          </p>
          <a
            href="https://docs.xrplevm.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-3 text-cyber-cyan text-xs hover:underline"
          >
            <ExternalLink size={12} />
            XRPL EVM Docs
          </a>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-8 text-center text-xs text-cyber-muted"
      >
        XRPL + Bridges = Institutional Edge. Data: Axelar-style APIs; DefiLlama yields next.
      </motion.p>
    </div>
  );
}
