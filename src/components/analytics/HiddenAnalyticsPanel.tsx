/**
 * Hidden analytics panel: AI Payment Routing, Liquidity Stress, Corridor Emergence.
 * Uses ConfidenceBadge and AnomalyChip. Clearly labels mock data.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Droplets, Sparkles, AlertTriangle } from 'lucide-react';
import { fetchHiddenAnalytics } from '../../analytics-hidden';
import type {
  HiddenAnalyticsPayload,
  RoutingSignal,
  LiquidityStressSignal,
  CorridorEmergenceSignal,
} from '../../analytics-hidden';
import { ConfidenceBadge } from '../telemetry/ConfidenceBadge';
import { AnomalyChip } from '../telemetry/AnomalyChip';
import { isMockHiddenPayload } from '../../analytics-hidden/mock';

export function HiddenAnalyticsPanel() {
  const [payload, setPayload] = useState<HiddenAnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchHiddenAnalytics({ mockOnly: false })
      .then((data) => {
        if (!cancelled) setPayload(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && !payload) {
    return (
      <div className="neon-panel p-6">
        <p className="text-cyber-muted">Loading hidden analytics…</p>
      </div>
    );
  }

  const data = payload!;
  const isMock = isMockHiddenPayload(data);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="neon-panel p-4">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-5 h-5 text-cyber-cyan" />
          <h2 className="font-cyber text-lg text-cyber-text">Hidden Analytics</h2>
        </div>
        <p className="text-sm text-cyber-muted mb-3">
          AI payment routing signals, liquidity stress, and corridor emergence. All signals carry confidence and provenance — do not treat as confirmed fact.
        </p>
        {isMock && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyber-yellow/10 border border-cyber-yellow/30 text-cyber-yellow text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Data is mock. No live analytics pipeline connected.</span>
          </div>
        )}
      </div>

      {/* Layer 1: AI Payment Routing */}
      <section className="space-y-2">
        <h3 className="font-cyber text-cyber-cyan flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI Payment Routing Signals
        </h3>
        <p className="text-xs text-cyber-muted">
          Patterns that may suggest machine-driven or agentic behavior. Inferred from timing/cadence — not confirmed.
        </p>
        {data.ai_routing_signals.length === 0 ? (
          <p className="text-cyber-muted text-sm">No signals.</p>
        ) : (
          <div className="space-y-3">
            {data.ai_routing_signals.map((s: RoutingSignal) => (
              <div
                key={s.id}
                className="p-3 rounded-lg border border-cyber-border bg-cyber-darker/50 space-y-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-cyber text-sm text-cyber-text">
                    {s.entity_type}: {s.entity_id}
                  </span>
                  <span className="text-xs text-cyber-muted">score {s.score}</span>
                  <ConfidenceBadge
                    confidence={s.confidence}
                    observationClass={s.observation_class}
                    compact
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {s.anomaly_tags.map((tag) => (
                    <AnomalyChip
                      key={tag}
                      severity="medium"
                      message={tag}
                      compact
                    />
                  ))}
                </div>
                {s.explanation && (
                  <p className="text-[11px] text-cyber-muted">{s.explanation}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Layer 2: Liquidity Stress */}
      <section className="space-y-2">
        <h3 className="font-cyber text-cyber-cyan flex items-center gap-2">
          <Droplets className="w-4 h-4" />
          Liquidity Stress
        </h3>
        <p className="text-xs text-cyber-muted">
          Signs of corridor/route strain. Derived from quote latency, failures, variance — thresholds illustrative.
        </p>
        {data.liquidity_stress_signals.length === 0 ? (
          <p className="text-cyber-muted text-sm">No signals.</p>
        ) : (
          <div className="space-y-3">
            {data.liquidity_stress_signals.map((s: LiquidityStressSignal) => (
              <div
                key={s.id}
                className="p-3 rounded-lg border border-cyber-border bg-cyber-darker/50 space-y-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-cyber text-sm text-cyber-text">
                    {s.entity_type}: {s.entity_id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] ${
                      s.severity === 'critical'
                        ? 'bg-cyber-red/20 text-cyber-red border border-cyber-red/40'
                        : s.severity === 'high'
                          ? 'bg-cyber-orange/20 text-cyber-orange border border-cyber-orange/40'
                          : s.severity === 'medium'
                            ? 'bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/40'
                            : 'bg-cyber-muted/20 text-cyber-muted border border-cyber-border'
                    }`}
                  >
                    {s.severity}
                  </span>
                  <span className="text-xs text-cyber-muted">stress {s.stress_score}</span>
                  <ConfidenceBadge
                    confidence={s.confidence}
                    observationClass={s.observation_class}
                    compact
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {s.anomaly_tags.map((tag) => (
                    <AnomalyChip
                      key={tag}
                      severity="medium"
                      message={tag}
                      compact
                    />
                  ))}
                </div>
                {s.explanation && (
                  <p className="text-[11px] text-cyber-muted">{s.explanation}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Layer 3: Corridor Emergence */}
      <section className="space-y-2">
        <h3 className="font-cyber text-cyber-cyan flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Corridor Emergence
        </h3>
        <p className="text-xs text-cyber-muted">
          New or accelerating corridors. Inferred from activity patterns — not confirmed new routes.
        </p>
        {data.corridor_emergence_signals.length === 0 ? (
          <p className="text-cyber-muted text-sm">No signals.</p>
        ) : (
          <div className="space-y-3">
            {data.corridor_emergence_signals.map((s: CorridorEmergenceSignal) => (
              <div
                key={s.id}
                className="p-3 rounded-lg border border-cyber-border bg-cyber-darker/50 space-y-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-cyber text-sm text-cyber-text">
                    {s.entity_type}: {s.entity_id}
                  </span>
                  <span className="text-xs text-cyber-muted">emergence {s.emergence_score}</span>
                  <ConfidenceBadge
                    confidence={s.confidence}
                    observationClass={s.observation_class}
                    compact
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {s.anomaly_tags.map((tag) => (
                    <AnomalyChip
                      key={tag}
                      severity="low"
                      message={tag}
                      compact
                    />
                  ))}
                </div>
                {s.explanation && (
                  <p className="text-[11px] text-cyber-muted">{s.explanation}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Anomalies list */}
      {data.anomalies.length > 0 && (
        <div className="neon-panel p-4 border-cyber-yellow/30">
          <p className="text-xs text-cyber-yellow mb-2">Anomalies / notes</p>
          <ul className="space-y-1">
            {data.anomalies.map((a) => (
              <li key={a.id}>
                <AnomalyChip
                  severity={a.severity}
                  message={a.message}
                  compact
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
