/**
 * Shared visual language and UI rules for Validator, Connector, and Payment Corridor maps.
 * One graph engine: node/edge type + observation_class + confidence + freshness → style.
 * Prevents overclaiming: wording and styles reflect what we actually know.
 */

import type { ObservationClass, FreshnessState, HealthState, ConfidenceScore } from './telemetry-truth-model';
import type { BaseNode, BaseEdge } from './telemetry-truth-model';

// ==================== VISUAL LANGUAGE (shared across all 3 maps) ====================

export const VISUAL_RULES = {
  /** Line style by observation class */
  lineStyle: {
    observed: 'solid' as const,
    derived: 'solid' as const,   // solid but can use secondary color
    inferred: 'dashed' as const,
    synthetic: 'dotted' as const,
    unknown: 'dotted' as const,
  },
  /** Glow intensity 0–1: driven by health (and optionally activity) */
  glowByHealth: {
    up: 1,
    degraded: 0.6,
    down: 0.2,
    unknown: 0.5,
  },
  /** Thickness 0–1: volume or importance (from payload; do not invent) */
  thickness: 'from_payload' as const,
  /** Opacity 0–1: confidence (confidence / 100, with minimum 0.3 so not invisible) */
  opacityMin: 0.3,
  /** Warning badge: show when stale or weak evidence */
  warningBadge: {
    whenFreshness: ['stale', 'unknown'] as FreshnessState[],
    whenConfidenceBelow: 50,
    whenObservationClass: ['inferred', 'synthetic', 'unknown'] as ObservationClass[],
  },
} as const;

// ==================== CONFIDENCE BADGE ====================

export type ConfidenceLabel = 'High' | 'Medium' | 'Low' | 'Very low' | 'Synthetic';

export function getConfidenceLabel(score: ConfidenceScore, observationClass: ObservationClass): ConfidenceLabel {
  if (observationClass === 'synthetic') return 'Synthetic';
  if (score >= 85) return 'High';
  if (score >= 70) return 'Medium';
  if (score >= 40) return 'Low';
  return 'Very low';
}

export function getObservationClassLabel(observationClass: ObservationClass): string {
  switch (observationClass) {
    case 'observed': return 'Observed';
    case 'derived': return 'Derived';
    case 'inferred': return 'Inferred';
    case 'synthetic': return 'Probe / synthetic';
    case 'unknown': return 'Unknown';
    default: return 'Unknown';
  }
}

/** Whether to show a warning badge (stale or weak evidence) */
export function shouldShowWarningBadge(
  nodeOrEdge: Pick<BaseNode | BaseEdge, 'observation_class' | 'confidence' | 'freshness'>
): boolean {
  const { observation_class, confidence, freshness } = nodeOrEdge;
  if (VISUAL_RULES.warningBadge.whenFreshness.includes(freshness)) return true;
  if (confidence < VISUAL_RULES.warningBadge.whenConfidenceBelow) return true;
  if (VISUAL_RULES.warningBadge.whenObservationClass.includes(observation_class)) return true;
  return false;
}

/** Opacity from confidence (0–1) */
export function opacityFromConfidence(confidence: ConfidenceScore): number {
  return Math.max(VISUAL_RULES.opacityMin, Math.min(1, confidence / 100));
}

/** Line style from observation class */
export function lineStyleFromObservationClass(observationClass: ObservationClass): 'solid' | 'dashed' | 'dotted' {
  return VISUAL_RULES.lineStyle[observationClass] ?? 'dotted';
}

/** Glow from health */
export function glowFromHealth(health: HealthState): number {
  return VISUAL_RULES.glowByHealth[health] ?? 0.5;
}

// ==================== TOOLTIP LOGIC (provenance, freshness, certainty) ====================

export interface TooltipSection {
  label: string;
  value: string;
  highlight?: 'warning' | 'success' | 'muted';
}

export function buildTooltipSections(
  nodeOrEdge: BaseNode | BaseEdge,
  options?: { includeProvenance?: boolean; includeAnomalies?: boolean; anomalyMessages?: Record<string, string> }
): TooltipSection[] {
  const { includeProvenance = true, includeAnomalies = true, anomalyMessages = {} } = options ?? {};
  const sections: TooltipSection[] = [];
  const obs = nodeOrEdge.observation_class;
  const conf = nodeOrEdge.confidence;
  const fresh = nodeOrEdge.freshness;

  sections.push({
    label: 'Certainty',
    value: getObservationClassLabel(obs),
    highlight: obs === 'observed' ? 'success' : obs === 'inferred' || obs === 'unknown' ? 'warning' : 'muted',
  });
  sections.push({
    label: 'Confidence',
    value: `${conf}% — ${getConfidenceLabel(conf, obs)}`,
    highlight: conf < 50 ? 'warning' : undefined,
  });
  sections.push({
    label: 'Freshness',
    value: fresh === 'live' ? 'Live' : fresh === 'recent' ? 'Recent' : fresh === 'stale' ? 'Stale' : 'Unknown',
    highlight: fresh === 'stale' || fresh === 'unknown' ? 'warning' : undefined,
  });
  if (includeProvenance && nodeOrEdge.provenance) {
    const p = nodeOrEdge.provenance;
    sections.push({
      label: 'Source',
      value: p.source_ids?.length ? p.source_ids.join(', ') : '—',
      highlight: undefined,
    });
    if (p.observed_at) {
      sections.push({ label: 'Observed at', value: new Date(p.observed_at).toLocaleString(), highlight: undefined });
    }
    if (p.explanation) {
      sections.push({ label: 'Note', value: p.explanation, highlight: 'muted' });
    }
  }
  if (includeAnomalies && nodeOrEdge.anomaly_ids?.length) {
    const msgs = nodeOrEdge.anomaly_ids
      .map((id) => anomalyMessages[id] ?? id)
      .join('; ');
    sections.push({ label: 'Anomalies', value: msgs, highlight: 'warning' });
  }
  return sections;
}

// ==================== OVERCLAIMING RULES (wording — what the map must never pretend) ====================

export const OVERCLAIM_RULES = {
  validator: [
    'Do not label a validator as "UNL" unless unl_confirmed is true.',
    'Do not show inferred influence as "observed uptime" or "agreement".',
    'Do not show estimated location as "confirmed location".',
    'Do not present inferred validator links as "UNL relationship".',
  ],
  connector: [
    'Do not show probe-only routes as confirmed live routes.',
    'Do not label connector health as observed if only from synthetic probes.',
    'Do not draw inferred corridors as solid observed corridors.',
  ],
  payment_corridor: [
    'Do not label inferred flows as "XRPL-confirmed" or "observed settlement".',
    'Do not show estimated volume as "observed volume".',
    'Prefer wording: "Observed XRPL settlement corridor", "Probable corridor cluster", "Inferred payment relationship", "XRPL-confirmed, upstream routing unknown".',
  ],
} as const;

/** Suggested short label for a payment corridor edge (honest wording) */
export function paymentCorridorEdgeLabel(
  xrplConfirmed: boolean,
  observationClass: ObservationClass
): string {
  if (observationClass === 'synthetic') return 'Probe-confirmed route';
  if (xrplConfirmed && observationClass === 'observed') return 'Observed XRPL settlement corridor';
  if (observationClass === 'inferred' || observationClass === 'derived') return 'Probable corridor cluster';
  if (xrplConfirmed) return 'XRPL-confirmed, upstream routing unknown';
  return 'Inferred payment relationship';
}
