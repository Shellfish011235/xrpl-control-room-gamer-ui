// Ledger Detail Panel
// Shows detailed information about a selected ledger

import { motion } from 'framer-motion';
import {
  Globe, Server, Clock, Zap,
  ExternalLink, Activity
} from 'lucide-react';
import type { Ledger } from '../../services/ilp/types';
import { useILPStore } from '../../store/ilpStore';

interface LedgerDetailProps {
  ledger: Ledger;
  onClose: () => void;
}

export function LedgerDetail({ ledger, onClose }: LedgerDetailProps) {
  const { corridors, connectors } = useILPStore();

  // Find connected corridors
  const connectedCorridors = corridors.filter(
    c => c.from_ledger === ledger.id || c.to_ledger === ledger.id
  );

  const activeCorridors = connectedCorridors.filter(c => c.status === 'active');

  const domainColors = {
    'on-ledger': 'text-cyber-cyan bg-cyber-cyan/20 border-cyber-cyan/30',
    'off-ledger': 'text-cyber-orange bg-cyber-orange/20 border-cyber-orange/30',
    'hybrid': 'text-cyber-purple bg-cyber-purple/20 border-cyber-purple/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="cyber-panel p-4 w-80"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-cyber-border">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyber-cyan" />
          <span className="font-cyber text-sm text-cyber-cyan">LEDGER</span>
        </div>
        <button onClick={onClose} className="text-cyber-muted hover:text-cyber-text">✕</button>
      </div>

      {/* Name & Type */}
      <div className="mb-4">
        <h3 className="text-lg font-cyber text-cyber-text">{ledger.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className={`px-2 py-0.5 rounded text-[10px] border ${domainColors[ledger.domain]}`}>
            {ledger.domain.toUpperCase()}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-cyber-darker text-cyber-muted border border-cyber-border">
            {ledger.type}
          </span>
          {ledger.supports_ilp_adapter && (
            <span className="px-2 py-0.5 rounded text-[10px] bg-cyber-green/20 text-cyber-green border border-cyber-green/30">
              ILP ✓
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border">
          <div className="flex items-center gap-1 text-cyber-muted text-[10px]">
            <Clock size={10} />
            <span>Finality</span>
          </div>
          <p className="font-cyber text-sm text-cyber-text">
            {ledger.finality_seconds < 60 
              ? `${ledger.finality_seconds}s`
              : ledger.finality_seconds < 3600
              ? `${Math.round(ledger.finality_seconds / 60)}m`
              : `${Math.round(ledger.finality_seconds / 3600)}h`
            }
          </p>
        </div>
        <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border">
          <div className="flex items-center gap-1 text-cyber-muted text-[10px]">
            <Zap size={10} />
            <span>TPS</span>
          </div>
          <p className="font-cyber text-sm text-cyber-text">
            {ledger.tps_estimate.toLocaleString()}
          </p>
        </div>
        <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border">
          <div className="flex items-center gap-1 text-cyber-muted text-[10px]">
            <Server size={10} />
            <span>Consensus</span>
          </div>
          <p className="font-cyber text-[10px] text-cyber-text truncate" title={ledger.consensus}>
            {ledger.consensus}
          </p>
        </div>
        <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border">
          <div className="flex items-center gap-1 text-cyber-muted text-[10px]">
            <Activity size={10} />
            <span>Native Asset</span>
          </div>
          <p className="font-cyber text-sm text-cyber-text">{ledger.native_asset}</p>
        </div>
      </div>

      {/* Risk Flags */}
      {ledger.risk_flags.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] text-cyber-muted mb-1">RISK FLAGS</p>
          <div className="flex flex-wrap gap-1">
            {ledger.risk_flags.map(flag => (
              <span
                key={flag}
                className="px-2 py-0.5 rounded text-[10px] bg-cyber-red/10 text-cyber-red border border-cyber-red/30"
              >
                {flag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Corridors */}
      <div className="mb-4">
        <p className="text-[10px] text-cyber-muted mb-2">
          CORRIDORS ({activeCorridors.length}/{connectedCorridors.length} active)
        </p>
        <div className="space-y-1 max-h-[150px] overflow-y-auto custom-scrollbar">
          {connectedCorridors.map(corridor => {
            const targetLedger = corridor.from_ledger === ledger.id 
              ? corridor.to_ledger 
              : corridor.from_ledger;
            const connector = connectors.find(c => c.id === corridor.connector_id);
            
            return (
              <div
                key={corridor.id}
                className={`p-2 rounded text-[10px] ${
                  corridor.status === 'active'
                    ? 'bg-cyber-green/10 border border-cyber-green/30'
                    : corridor.status === 'experimental'
                    ? 'bg-cyber-yellow/10 border border-cyber-yellow/30'
                    : 'bg-cyber-darker/50 border border-cyber-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-cyber-text">
                    → {targetLedger.toUpperCase()}
                  </span>
                  <span className={
                    corridor.status === 'active' ? 'text-cyber-green' :
                    corridor.status === 'experimental' ? 'text-cyber-yellow' :
                    'text-cyber-muted'
                  }>
                    {corridor.status}
                  </span>
                </div>
                {connector && (
                  <div className="text-cyber-muted mt-0.5">
                    Trust: {(connector.trust_score * 100).toFixed(0)}% • 
                    {connector.latency_ms}ms
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Links */}
      {ledger.metadata && (
        <div className="flex gap-2">
          {ledger.metadata.website && (
            <a
              href={ledger.metadata.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-2 py-1.5 rounded bg-cyber-darker border border-cyber-border text-cyber-muted hover:text-cyber-cyan text-[10px] flex items-center justify-center gap-1"
            >
              <ExternalLink size={10} />
              Website
            </a>
          )}
          {ledger.metadata.explorer && (
            <a
              href={ledger.metadata.explorer}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-2 py-1.5 rounded bg-cyber-darker border border-cyber-border text-cyber-muted hover:text-cyber-cyan text-[10px] flex items-center justify-center gap-1"
            >
              <ExternalLink size={10} />
              Explorer
            </a>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default LedgerDetail;
