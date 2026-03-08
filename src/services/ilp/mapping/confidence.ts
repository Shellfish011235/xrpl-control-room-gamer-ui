/**
 * ILP Mapping — Confidence Scoring Engine
 * Inputs: source quality, freshness, corroboration, observation type.
 * Output: 0–100 score, label, explanation for UI.
 */

import type { DataClass, DataProvenance } from './canonical';

export interface ConfidenceInputs {
  source_quality: number;      // 0–1, e.g. direct API=1, scrape=0.6, probe=0.5
  freshness_seconds: number;   // age of data
  corroborating_sources: number;
  is_direct_observation: boolean;
  connector_uptime_percent?: number;
  route_success_count?: number;
  quote_settlement_agreement?: boolean; // quote matched settlement
  telemetry_completeness: number;       // 0–1, fraction of expected fields present
}

const FRESHNESS_DECAY_HALFLIFE_SEC = 3600; // 1 hour

function freshnessFactor(ageSeconds: number): number {
  if (ageSeconds <= 0) return 1;
  return Math.pow(0.5, ageSeconds / FRESHNESS_DECAY_HALFLIFE_SEC);
}

function dataClassBaseScore(class_: DataClass): number {
  switch (class_) {
    case 'observed': return 90;
    case 'derived': return 75;
    case 'inferred': return 55;
    case 'unknown': return 20;
    default: return 40;
  }
}

/**
 * Compute confidence score 0–100 and human-readable label + explanation.
 */
export function computeConfidence(
  provenance: DataProvenance,
  inputs: Partial<ConfidenceInputs> = {}
): { score: number; label: string; explanation: string } {
  const {
    source_quality = 0.7,
    freshness_seconds = 0,
    corroborating_sources = 1,
    is_direct_observation = false,
    connector_uptime_percent,
    route_success_count,
    quote_settlement_agreement,
    telemetry_completeness = 1,
  } = inputs;

  const base = dataClassBaseScore(provenance.class);
  const fresh = freshnessFactor(freshness_seconds);
  const corroboration = Math.min(1, 0.5 + corroborating_sources * 0.15);
  const directBonus = is_direct_observation ? 5 : 0;
  const uptimeBonus = connector_uptime_percent != null ? (connector_uptime_percent / 100) * 3 : 0;
  const successBonus = route_success_count != null && route_success_count > 0 ? Math.min(5, Math.log10(route_success_count + 1) * 2) : 0;
  const agreementBonus = quote_settlement_agreement === true ? 5 : 0;
  const completenessBonus = telemetry_completeness * 2;

  const raw = (base * 0.4 + 60 * source_quality * 0.3) * fresh
    + (corroboration * 10) + directBonus + uptimeBonus + successBonus + agreementBonus + completenessBonus;
  const score = Math.round(Math.min(100, Math.max(0, raw)));

  const label = score >= 90 ? 'High' : score >= 70 ? 'Medium' : score >= 40 ? 'Low' : 'Very low';
  const explanation = [
    `Data class: ${provenance.class}.`,
    freshness_seconds > 0 ? `Data age: ${Math.round(freshness_seconds / 60)} min.` : 'Fresh.',
    corroborating_sources > 1 ? `${corroborating_sources} sources.` : '',
    is_direct_observation ? 'Directly observed.' : 'Not directly observed.',
    provenance.explanation ?? '',
  ].filter(Boolean).join(' ');

  return { score, label, explanation };
}

/**
 * Assign data_class from source type (for ingestion).
 */
export function dataClassFromSource(source: 'ledger_api' | 'connector_api' | 'quote_response' | 'probe' | 'inference' | 'registry'): DataClass {
  switch (source) {
    case 'ledger_api':
    case 'connector_api':
    case 'quote_response':
      return 'observed';
    case 'registry':
      return 'derived';
    case 'probe':
      return 'derived'; // probe is synthetic but we derive health from it
    case 'inference':
      return 'inferred';
    default:
      return 'unknown';
  }
}
