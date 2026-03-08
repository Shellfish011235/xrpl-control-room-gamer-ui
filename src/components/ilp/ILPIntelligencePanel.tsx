/**
 * ILP / Open Payments / Rafiki Intelligence Panel (Stage 1 + Stage 2).
 * Renders: known connectors, Rafiki nodes, Open Payments providers, quote latency, route health.
 * Confidence badges and observed vs inferred labels from shared telemetry truth model.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Server,
  Wallet,
  Globe,
  Activity,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { fetchILPIntel } from '../../ilp-intel';
import type {
  ILPIntelPayload,
  KnownConnector,
  RafikiNode,
  OpenPaymentsProviderNode,
  QuoteLatencyMetric,
  RouteHealthMetric,
  ConnectorLiveness,
} from '../../ilp-intel';
import {
  getConfidenceLabel,
  getObservationClassLabel,
  shouldShowWarningBadge,
} from '../../types/telemetry-visual-rules';
import type { ObservationClass } from '../../types/telemetry-truth-model';

// ==================== BADGE + ROW HELPERS ====================

function ConfidenceBadge({
  confidence,
  observationClass,
  showWarning,
}: {
  confidence: number;
  observationClass: ObservationClass;
  showWarning: boolean;
}) {
  const label = getConfidenceLabel(confidence, observationClass);
  const obsLabel = getObservationClassLabel(observationClass);
  const isHigh = confidence >= 70 && observationClass === 'observed';
  const isSynthetic = observationClass === 'synthetic';
  const isInferred = observationClass === 'inferred' || observationClass === 'unknown';
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] border border-cyber-border"
      title={`${obsLabel} · ${label} (${confidence}%)`}
    >
      {showWarning && <AlertTriangle className="w-3 h-3 text-cyber-yellow shrink-0" />}
      <span
        className={
          isHigh
            ? 'text-cyber-cyan'
            : isSynthetic
              ? 'text-cyber-orange'
              : isInferred
                ? 'text-cyber-yellow'
                : 'text-cyber-muted'
        }
      >
        {obsLabel}
      </span>
      <span className="text-cyber-muted">·</span>
      <span className="text-cyber-muted">{label}</span>
    </span>
  );
}

function EntityRow({
  label,
  subtitle,
  observationClass,
  confidence,
  freshness,
  health,
  provenance,
  isProbeDerived,
  children,
}: {
  label: string;
  subtitle?: string;
  observationClass: ObservationClass;
  confidence: number;
  freshness: string;
  health: string;
  provenance?: { source_ids?: string[]; explanation?: string };
  isProbeDerived?: boolean;
  children?: React.ReactNode;
}) {
  const showWarning = shouldShowWarningBadge({
    observation_class: observationClass,
    confidence,
    freshness: freshness as 'live' | 'recent' | 'stale' | 'unknown',
  });
  return (
    <div className="p-3 rounded-lg border border-cyber-border bg-cyber-darker/50 space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-cyber text-sm text-cyber-text">{label}</span>
        {subtitle && <span className="text-xs text-cyber-muted">{subtitle}</span>}
        <ConfidenceBadge
          confidence={confidence}
          observationClass={observationClass}
          showWarning={showWarning}
        />
        {isProbeDerived && (
          <span className="px-2 py-0.5 rounded text-[10px] bg-cyber-orange/20 text-cyber-orange border border-cyber-orange/30">
            Probe-derived
          </span>
        )}
      </div>
      {provenance?.explanation && (
        <p className="text-[11px] text-cyber-muted">{provenance.explanation}</p>
      )}
      <div className="flex items-center gap-3 text-[10px] text-cyber-muted">
        <span>Health: {health}</span>
        <span>Freshness: {freshness}</span>
      </div>
      {children}
    </div>
  );
}

// ==================== PANEL ====================

export function ILPIntelligencePanel() {
  const [payload, setPayload] = useState<ILPIntelPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  type SectionId = 'connectors' | 'rafiki' | 'openpayments' | 'metrics';
const [sectionOpen, setSectionOpen] = useState<SectionId | null>('connectors');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchILPIntel({ mockOnly: false })
      .then((data) => {
        if (!cancelled) setPayload(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
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
        <p className="text-cyber-muted">Loading ILP intelligence…</p>
      </div>
    );
  }

  if (error && !payload) {
    return (
      <div className="neon-panel p-6">
        <p className="text-cyber-yellow">Using mock data (API unavailable).</p>
        <p className="text-cyber-muted text-sm mt-1">{error}</p>
      </div>
    );
  }

  const data = payload!;
  const isMock = data.anomalies?.some((a) => a.message?.toLowerCase().includes('mock')) ?? false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header + disclaimer */}
      <div className="neon-panel p-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-cyber-cyan" />
          <h2 className="font-cyber text-lg text-cyber-text">Interledger / Open Payments</h2>
        </div>
        <p className="text-sm text-cyber-muted mb-3">
          Connectors, Rafiki nodes, and Open Payments providers. Routing metrics from observed or probe-derived data.
        </p>
        {isMock && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyber-yellow/10 border border-cyber-yellow/30 text-cyber-yellow text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Data is mock. No live connector or probe data connected.</span>
          </div>
        )}
        {data.contains_synthetic && !isMock && (
          <p className="text-xs text-cyber-muted">Some metrics are from probes (synthetic).</p>
        )}
      </div>

      {/* Stage 1: Metadata / ecosystem */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setSectionOpen((s) => (s === 'connectors' ? null : 'connectors'))}
          className="flex items-center gap-2 w-full text-left font-cyber text-cyber-cyan"
        >
          {sectionOpen === 'connectors' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <Server className="w-4 h-4" />
          Known connectors
        </button>
        {sectionOpen === 'connectors' && (
          <div className="space-y-2">
            {data.connectors.length === 0 ? (
              <p className="text-cyber-muted text-sm">No connectors loaded.</p>
            ) : (
              data.connectors.map((c: KnownConnector) => (
                <EntityRow
                  key={c.id}
                  label={c.label}
                  subtitle={c.operator}
                  observationClass={c.observation_class}
                  confidence={c.confidence}
                  freshness={c.freshness}
                  health={c.health}
                  provenance={c.provenance}
                  isProbeDerived={c.is_probe_derived}
                />
              ))
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setSectionOpen((s) => (s === 'rafiki' ? null : 'rafiki'))}
          className="flex items-center gap-2 w-full text-left font-cyber text-cyber-cyan"
        >
          {sectionOpen === 'rafiki' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <Globe className="w-4 h-4" />
          Rafiki nodes
        </button>
        {sectionOpen === 'rafiki' && (
          <div className="space-y-2">
            {data.rafiki_nodes.length === 0 ? (
              <p className="text-cyber-muted text-sm">No Rafiki nodes.</p>
            ) : (
              data.rafiki_nodes.map((n: RafikiNode) => (
                <EntityRow
                  key={n.id}
                  label={n.label}
                  subtitle={n.subtitle ?? n.version ?? n.open_payments_url}
                  observationClass={n.observation_class}
                  confidence={n.confidence}
                  freshness={n.freshness}
                  health={n.health}
                  provenance={n.provenance}
                />
              ))
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setSectionOpen((s) => (s === 'openpayments' ? null : 'openpayments'))}
          className="flex items-center gap-2 w-full text-left font-cyber text-cyber-cyan"
        >
          {sectionOpen === 'openpayments' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <Wallet className="w-4 h-4" />
          Open Payments providers
        </button>
        {sectionOpen === 'openpayments' && (
          <div className="space-y-2">
            {data.open_payments_providers.length === 0 ? (
              <p className="text-cyber-muted text-sm">No Open Payments providers.</p>
            ) : (
              data.open_payments_providers.map((p: OpenPaymentsProviderNode) => (
                <EntityRow
                  key={p.id}
                  label={p.label}
                  subtitle={p.payment_pointer ?? p.provider_url}
                  observationClass={p.observation_class}
                  confidence={p.confidence}
                  freshness={p.freshness}
                  health={p.health}
                  provenance={p.provenance}
                />
              ))
            )}
            {(data.wallet_providers?.length ?? 0) > 0 && (
              <>
                <p className="text-xs text-cyber-muted mt-2">Wallet providers</p>
                {data.wallet_providers!.map((w) => (
                  <EntityRow
                    key={w.id}
                    label={w.label}
                    subtitle={w.provider_name}
                    observationClass={w.observation_class}
                    confidence={w.confidence}
                    freshness={w.freshness}
                    health={w.health}
                    provenance={w.provenance}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Stage 2: Routing intelligence metrics */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setSectionOpen((s) => (s === 'metrics' ? null : 'metrics'))}
          className="flex items-center gap-2 w-full text-left font-cyber text-cyber-cyan"
        >
          {sectionOpen === 'metrics' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <Activity className="w-4 h-4" />
          Quote latency & route health
        </button>
        {sectionOpen === 'metrics' && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-cyber-muted mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Quote latency
              </p>
              <div className="space-y-2">
                {data.quote_latency.length === 0 ? (
                  <p className="text-cyber-muted text-sm">No quote latency data.</p>
                ) : (
                  data.quote_latency.map((q: QuoteLatencyMetric) => (
                    <div
                      key={q.id}
                      className="p-3 rounded-lg border border-cyber-border bg-cyber-darker/50 flex flex-wrap items-center gap-2"
                    >
                      <span className="font-mono text-sm text-cyber-text">{q.latency_ms} ms</span>
                      <ConfidenceBadge
                        confidence={q.confidence}
                        observationClass={q.observation_class}
                        showWarning={q.is_synthetic || q.confidence < 50}
                      />
                      {q.is_synthetic && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-cyber-orange/20 text-cyber-orange border border-cyber-orange/30">
                          Probe
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-cyber-muted mb-2">Route health</p>
              <div className="space-y-2">
                {data.route_health.length === 0 ? (
                  <p className="text-cyber-muted text-sm">No route health data.</p>
                ) : (
                  data.route_health.map((r: RouteHealthMetric) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-lg border border-cyber-border bg-cyber-darker/50 flex flex-wrap items-center gap-2"
                    >
                      <span className="font-cyber text-sm text-cyber-text">{r.route_id}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          r.health === 'up'
                            ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/30'
                            : r.health === 'degraded'
                              ? 'bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/30'
                              : 'bg-cyber-red/20 text-cyber-red border border-cyber-red/30'
                        }`}
                      >
                        {r.health}
                      </span>
                      {r.success_rate != null && (
                        <span className="text-cyber-muted text-xs">{(r.success_rate * 100).toFixed(0)}% success</span>
                      )}
                      <ConfidenceBadge
                        confidence={r.confidence}
                        observationClass={r.observation_class}
                        showWarning={r.is_synthetic || r.confidence < 50}
                      />
                      {r.is_synthetic && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-cyber-orange/20 text-cyber-orange border border-cyber-orange/30">
                          Probe
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-cyber-muted mb-2">Connector liveness</p>
              <div className="space-y-2">
                {data.connector_liveness.length === 0 ? (
                  <p className="text-cyber-muted text-sm">No liveness data.</p>
                ) : (
                  data.connector_liveness.map((c: ConnectorLiveness) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-lg border border-cyber-border bg-cyber-darker/50 flex flex-wrap items-center gap-2"
                    >
                      <span className="font-cyber text-sm text-cyber-text">{c.connector_id}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          c.status === 'up'
                            ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/30'
                            : c.status === 'down'
                              ? 'bg-cyber-red/20 text-cyber-red border border-cyber-red/30'
                              : 'bg-cyber-muted/20 text-cyber-muted border border-cyber-border'
                        }`}
                      >
                        {c.status}
                      </span>
                      {c.latency_ms != null && (
                        <span className="text-cyber-muted text-xs">{c.latency_ms} ms</span>
                      )}
                      <ConfidenceBadge
                        confidence={c.confidence}
                        observationClass={c.observation_class}
                        showWarning={c.is_synthetic || c.confidence < 50}
                      />
                      {c.is_synthetic && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-cyber-orange/20 text-cyber-orange border border-cyber-orange/30">
                          Probe
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Anomalies */}
      {data.anomalies.length > 0 && (
        <div className="neon-panel p-4 border-cyber-yellow/30">
          <p className="text-xs text-cyber-yellow mb-2">Anomalies / notes</p>
          <ul className="space-y-1 text-sm text-cyber-muted">
            {data.anomalies.map((a) => (
              <li key={a.id}>{a.message}</li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
