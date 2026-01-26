// Venue Router Panel Component
// Shows venue status and routing statistics

import React from 'react';
import { motion } from 'framer-motion';
import {
  Route, Globe, Zap, Server, Activity,
  CheckCircle, XCircle, Clock
} from 'lucide-react';
import { VenueConfig, VenueType } from '../../services/carv/types';

interface VenuePanelProps {
  venues: VenueConfig[];
  stats?: {
    total: number;
    success: number;
    failed: number;
    byVenue: Record<VenueType, number>;
  };
  onToggleVenue?: (venue: VenueType, enabled: boolean) => void;
}

export function VenuePanel({ venues, stats, onToggleVenue }: VenuePanelProps) {
  const venueIcons: Record<VenueType, React.ReactNode> = {
    xrpl: <Globe size={16} />,
    polymarket: <Activity size={16} />,
    ilp: <Zap size={16} />,
    open_payments: <Server size={16} />,
    simulation: <Clock size={16} />,
  };

  const venueColors: Record<VenueType, string> = {
    xrpl: 'text-cyber-cyan border-cyber-cyan/30 bg-cyber-cyan/10',
    polymarket: 'text-cyber-purple border-cyber-purple/30 bg-cyber-purple/10',
    ilp: 'text-cyber-orange border-cyber-orange/30 bg-cyber-orange/10',
    open_payments: 'text-cyber-green border-cyber-green/30 bg-cyber-green/10',
    simulation: 'text-cyber-yellow border-cyber-yellow/30 bg-cyber-yellow/10',
  };

  const successRate = stats && stats.total > 0 
    ? ((stats.success / stats.total) * 100).toFixed(1)
    : '100.0';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-cyber-cyan font-cyber flex items-center gap-2">
          <Route size={14} />
          VENUE ROUTER
        </span>
        {stats && (
          <div className="flex items-center gap-3 text-[10px]">
            <span className="text-cyber-green flex items-center gap-1">
              <CheckCircle size={10} /> {stats.success}
            </span>
            <span className="text-cyber-red flex items-center gap-1">
              <XCircle size={10} /> {stats.failed}
            </span>
            <span className="text-cyber-text">{successRate}%</span>
          </div>
        )}
      </div>

      {/* Venue List */}
      <div className="space-y-2">
        {venues.map((venue) => {
          const routeCount = stats?.byVenue[venue.venue] || 0;
          
          return (
            <motion.div
              key={venue.venue}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`p-3 rounded border ${
                venue.enabled 
                  ? venueColors[venue.venue]
                  : 'text-cyber-muted border-cyber-border/50 bg-cyber-darker/30 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={venue.enabled ? '' : 'opacity-50'}>
                    {venueIcons[venue.venue]}
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">{venue.venue.replace('_', ' ')}</p>
                    <div className="flex items-center gap-2 text-[10px] opacity-70">
                      <span>P{venue.priority}</span>
                      <span>•</span>
                      <span>{venue.latency_ms}ms</span>
                      <span>•</span>
                      <span>Fee: {venue.fee_estimate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Route count */}
                  <div className="text-right">
                    <p className="text-sm font-cyber">{routeCount}</p>
                    <p className="text-[9px] opacity-70">routes</p>
                  </div>

                  {/* Toggle */}
                  {onToggleVenue && (
                    <button
                      onClick={() => onToggleVenue(venue.venue, !venue.enabled)}
                      className={`w-8 h-4 rounded-full transition-all ${
                        venue.enabled ? 'bg-cyber-green' : 'bg-cyber-border'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full bg-white transition-all ${
                        venue.enabled ? 'translate-x-4' : 'translate-x-0.5'
                      }`} />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar for max amount */}
              <div className="mt-2">
                <div className="flex justify-between text-[9px] mb-1">
                  <span>Max: {venue.max_amount === Infinity ? '∞' : venue.max_amount}</span>
                </div>
                <div className="h-1 rounded-full bg-cyber-darker overflow-hidden">
                  <div 
                    className={`h-full ${venue.enabled ? 'bg-current' : 'bg-cyber-muted'}`}
                    style={{ width: venue.max_amount === Infinity ? '100%' : '50%' }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Routing Logic Info */}
      <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border">
        <p className="text-[10px] text-cyber-muted">
          <span className="text-cyber-cyan">Routing Logic:</span> Priority-based selection with 
          automatic fallback. Venues sorted by priority (P1 = highest). If primary fails, 
          system attempts alternatives in order.
        </p>
      </div>
    </div>
  );
}

export default VenuePanel;
