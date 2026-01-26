// PIE Viewer Component
// Displays Payment Intent Envelopes with their details

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Hash, Clock, User, DollarSign,
  ChevronDown, ChevronRight, Shield, CheckCircle,
  XCircle, Loader, AlertTriangle
} from 'lucide-react';
import { PaymentIntentEnvelope, PIEStatus } from '../../services/carv/types';

interface PIEViewerProps {
  pies: PaymentIntentEnvelope[];
  title?: string;
  maxDisplay?: number;
  showDetails?: boolean;
}

export function PIEViewer({ 
  pies, 
  title = 'Payment Intents', 
  maxDisplay = 10,
  showDetails = true 
}: PIEViewerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const displayPIEs = pies.slice(-maxDisplay).reverse();

  const statusColors: Record<PIEStatus, string> = {
    pending: 'text-cyber-yellow bg-cyber-yellow/20 border-cyber-yellow/30',
    validated: 'text-cyber-cyan bg-cyber-cyan/20 border-cyber-cyan/30',
    attested: 'text-cyber-purple bg-cyber-purple/20 border-cyber-purple/30',
    routing: 'text-cyber-orange bg-cyber-orange/20 border-cyber-orange/30',
    settled: 'text-cyber-green bg-cyber-green/20 border-cyber-green/30',
    failed: 'text-cyber-red bg-cyber-red/20 border-cyber-red/30',
    rejected: 'text-cyber-red bg-cyber-red/20 border-cyber-red/30',
    expired: 'text-cyber-muted bg-cyber-darker border-cyber-border',
  };

  const statusIcons: Record<PIEStatus, React.ReactNode> = {
    pending: <Clock size={12} />,
    validated: <Shield size={12} />,
    attested: <FileText size={12} />,
    routing: <Loader size={12} className="animate-spin" />,
    settled: <CheckCircle size={12} />,
    failed: <XCircle size={12} />,
    rejected: <AlertTriangle size={12} />,
    expired: <Clock size={12} />,
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-cyber-cyan font-cyber">{title}</span>
        <span className="text-[10px] text-cyber-muted">{pies.length} total</span>
      </div>

      {displayPIEs.length === 0 ? (
        <div className="text-center py-6 text-cyber-muted">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No PIEs yet</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
          {displayPIEs.map((pie) => (
            <motion.div
              key={pie.intent_id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-cyber-darker/50 rounded border border-cyber-border overflow-hidden"
            >
              {/* Header Row */}
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-cyber-darker/80"
                onClick={() => setExpandedId(expandedId === pie.intent_id ? null : pie.intent_id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded border ${statusColors[pie.status]}`}>
                    {statusIcons[pie.status]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-cyber text-sm text-cyber-text">
                        {parseFloat(pie.amount).toFixed(4)} {pie.asset}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] border ${statusColors[pie.status]}`}>
                        {pie.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-cyber-muted">
                      <span>→ {pie.payee.slice(0, 8)}...</span>
                      <span>•</span>
                      <span>{pie.constraints.venue}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-cyber-muted">
                    {new Date(pie.created_at).toLocaleTimeString()}
                  </span>
                  {showDetails && (
                    expandedId === pie.intent_id 
                      ? <ChevronDown size={14} className="text-cyber-muted" />
                      : <ChevronRight size={14} className="text-cyber-muted" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {showDetails && expandedId === pie.intent_id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-cyber-border"
                  >
                    <div className="p-3 space-y-3 text-[10px]">
                      {/* IDs */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-cyber-muted">Intent ID</span>
                          <p className="text-cyber-text font-mono truncate">{pie.intent_id}</p>
                        </div>
                        <div>
                          <span className="text-cyber-muted">Expires</span>
                          <p className="text-cyber-text">{new Date(pie.expiry).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* Parties */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-cyber-muted">Payer</span>
                          <p className="text-cyber-text font-mono truncate">{pie.payer}</p>
                        </div>
                        <div>
                          <span className="text-cyber-muted">Payee</span>
                          <p className="text-cyber-text font-mono truncate">{pie.payee}</p>
                        </div>
                      </div>

                      {/* Constraints */}
                      <div>
                        <span className="text-cyber-cyan font-cyber">CONSTRAINTS</span>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          <div className="p-1.5 rounded bg-cyber-darker">
                            <span className="text-cyber-muted">Max Fee</span>
                            <p className="text-cyber-text">{pie.constraints.max_fee}</p>
                          </div>
                          <div className="p-1.5 rounded bg-cyber-darker">
                            <span className="text-cyber-muted">Slippage</span>
                            <p className="text-cyber-text">{pie.constraints.slippage_bps} bps</p>
                          </div>
                          <div className="p-1.5 rounded bg-cyber-darker">
                            <span className="text-cyber-muted">Venue</span>
                            <p className="text-cyber-text">{pie.constraints.venue}</p>
                          </div>
                        </div>
                      </div>

                      {/* Proofs */}
                      <div>
                        <span className="text-cyber-purple font-cyber">PROOFS</span>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <div className="p-1.5 rounded bg-cyber-darker">
                            <span className="text-cyber-muted">Market Hash</span>
                            <p className="text-cyber-text font-mono">{pie.proofs.market_snapshot_hash}</p>
                          </div>
                          <div className="p-1.5 rounded bg-cyber-darker">
                            <span className="text-cyber-muted">Regime Hash</span>
                            <p className="text-cyber-text font-mono">{pie.proofs.regime_summary_hash}</p>
                          </div>
                          <div className="p-1.5 rounded bg-cyber-darker">
                            <span className="text-cyber-muted">Model</span>
                            <p className="text-cyber-text">{pie.proofs.model_version}</p>
                          </div>
                          <div className="p-1.5 rounded bg-cyber-darker">
                            <span className="text-cyber-muted">Computed</span>
                            <p className="text-cyber-text">{new Date(pie.proofs.compute_timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PIEViewer;
