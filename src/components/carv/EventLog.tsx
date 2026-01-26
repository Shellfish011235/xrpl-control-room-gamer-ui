// CARV Event Log Component
// Real-time feed of system events

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, FileText, Shield, CheckCircle, XCircle,
  Route, Database, AlertTriangle, Settings, Zap
} from 'lucide-react';
import { CARVEvent } from '../../services/carv/types';

interface EventLogProps {
  events: CARVEvent[];
  maxDisplay?: number;
}

export function EventLog({ events, maxDisplay = 50 }: EventLogProps) {
  const displayEvents = events.slice(-maxDisplay).reverse();

  const getEventStyle = (event: CARVEvent): { icon: React.ReactNode; color: string; label: string } => {
    switch (event.type) {
      case 'PIE_CREATED':
        return { icon: <FileText size={12} />, color: 'text-cyber-cyan', label: 'PIE Created' };
      case 'PIE_VALIDATED':
        return { icon: <Shield size={12} />, color: 'text-cyber-green', label: 'Validated' };
      case 'PIE_REJECTED':
        return { icon: <XCircle size={12} />, color: 'text-cyber-red', label: 'Rejected' };
      case 'BATCH_CREATED':
        return { icon: <Database size={12} />, color: 'text-cyber-purple', label: 'Batch Created' };
      case 'BATCH_ATTESTED':
        return { icon: <CheckCircle size={12} />, color: 'text-cyber-purple', label: 'Batch Attested' };
      case 'PIE_ROUTED':
        return { icon: <Route size={12} />, color: 'text-cyber-orange', label: 'Routed' };
      case 'PIE_SETTLED':
        return { icon: <CheckCircle size={12} />, color: 'text-cyber-green', label: 'Settled' };
      case 'ESCALATION_ALERT':
        return { icon: <AlertTriangle size={12} />, color: 'text-cyber-red', label: 'ALERT' };
      case 'MODE_CHANGED':
        return { icon: <Settings size={12} />, color: 'text-cyber-yellow', label: 'Mode Changed' };
      case 'REGIME_UPDATED':
        return { icon: <Zap size={12} />, color: 'text-cyber-cyan', label: 'Regime Updated' };
      default:
        return { icon: <Activity size={12} />, color: 'text-cyber-muted', label: 'Event' };
    }
  };

  const getEventDetails = (event: CARVEvent): string => {
    switch (event.type) {
      case 'PIE_CREATED':
        return `${event.pie.amount} ${event.pie.asset} → ${event.pie.payee.slice(0, 8)}...`;
      case 'PIE_VALIDATED':
        return event.result.reason;
      case 'PIE_REJECTED':
        return event.result.reason;
      case 'BATCH_CREATED':
        return `Batch ${event.batch.batch_id.slice(0, 8)}... (${event.batch.pies.length} PIEs)`;
      case 'BATCH_ATTESTED':
        return `Root: ${event.batch.merkle_root.slice(0, 12)}...`;
      case 'PIE_ROUTED':
        return event.result.success 
          ? `${event.result.venue} - ${event.result.tx_hash?.slice(0, 12)}...`
          : `Failed: ${event.result.error}`;
      case 'PIE_SETTLED':
        return `Entry ${event.entry.entry_id.slice(0, 8)}... - G/L: $${event.entry.realized_gain_loss.toFixed(2)}`;
      case 'ESCALATION_ALERT':
        return event.reason;
      case 'MODE_CHANGED':
        return `Switched to ${event.mode.toUpperCase()} mode`;
      case 'REGIME_UPDATED':
        return `Hash: ${event.hash}`;
      default:
        return '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-cyber-cyan font-cyber flex items-center gap-2">
          <Activity size={14} />
          EVENT LOG
        </span>
        <span className="text-[10px] text-cyber-muted">{events.length} events</span>
      </div>

      {displayEvents.length === 0 ? (
        <div className="text-center py-6 text-cyber-muted">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No events yet</p>
        </div>
      ) : (
        <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
          <AnimatePresence>
            {displayEvents.map((event, idx) => {
              const { icon, color, label } = getEventStyle(event);
              const details = getEventDetails(event);
              const timestamp = new Date().toLocaleTimeString();

              return (
                <motion.div
                  key={`${event.type}-${idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-2 p-2 rounded bg-cyber-darker/30 hover:bg-cyber-darker/50"
                >
                  <div className={`p-1 rounded ${color} bg-current/10`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-cyber ${color}`}>{label}</span>
                      <span className="text-[9px] text-cyber-muted">{timestamp}</span>
                    </div>
                    <p className="text-[10px] text-cyber-text truncate">{details}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default EventLog;
