/**
 * ILP Mapping — Normalization Rules
 * Heterogeneous ILP data → canonical field names, dedup, clock skew, missing ts.
 */

import type { DataClass } from './canonical';

// ==================== FIELD-LEVEL RULES ====================

const CONNECTOR_NAME_ALIASES: Record<string, string> = {
  'rafiki': 'Rafiki',
  'rafiki-connector': 'Rafiki',
  'rafiki-mainnet': 'Rafiki',
  'rafiki-testnet': 'Rafiki Testnet',
  'xpring-connector': 'Xpring Connector',
  'ilp-kit': 'ILP Kit',
};

const ASSET_SYMBOL_NORMALIZE: Record<string, string> = {
  'XRP': 'XRP',
  'xrp': 'XRP',
  'USD': 'USD',
  'usd': 'USD',
  'EUR': 'EUR',
  'eur': 'EUR',
  'native': 'native',
};

/** Normalize connector name across environments (testnet/mainnet/sandbox). */
export function normalizeConnectorName(raw: string): string {
  const key = raw.trim().toLowerCase().replace(/\s+/g, '-');
  return CONNECTOR_NAME_ALIASES[key] ?? raw.trim();
}

/** Normalize asset symbol; avoid collisions (e.g. ledger-scoped if needed). */
export function normalizeAssetSymbol(symbol: string, ledgerId?: string): string {
  const s = symbol.trim().toUpperCase();
  const base = ASSET_SYMBOL_NORMALIZE[s] ?? s;
  if (ledgerId && ['USD', 'EUR'].includes(base)) {
    return `${base}.${ledgerId}`;
  }
  return base;
}

/** Dedupe payment/route by id; prefer newest observed_at. */
export function dedupeById<T extends { id: string; observed_at?: string }>(items: T[]): T[] {
  const byId = new Map<string, T>();
  for (const item of items) {
    const existing = byId.get(item.id);
    const obs = item.observed_at ?? '';
    if (!existing || (existing.observed_at ?? '') < obs) {
      byId.set(item.id, item);
    }
  }
  return Array.from(byId.values());
}

/** Same route from multiple telemetry sources: merge source_ids, take max confidence. */
export function mergeRouteProvenance(
  sourceIds: string[],
  dataClass: DataClass,
  confidence: number
): { source_ids: string[]; data_class: DataClass; confidence: number } {
  const merged: { source_ids: string[]; data_class: DataClass; confidence: number } = {
    source_ids: [...new Set(sourceIds)],
    data_class: dataClass,
    confidence: Math.min(100, confidence),
  };
  return merged;
}

/** Clock skew: cap observed_at to server_now ± maxSkewSeconds. */
export function clampTimestamp(
  observedAt: string,
  serverNow: Date,
  maxSkewSeconds: number = 300
): string {
  const ts = new Date(observedAt).getTime();
  const now = serverNow.getTime();
  const min = now - maxSkewSeconds * 1000;
  const max = now + maxSkewSeconds * 1000;
  const clamped = Math.min(max, Math.max(min, ts));
  return new Date(clamped).toISOString();
}

/** Missing timestamp: use fallback and mark provenance as derived. */
export function ensureTimestamp(
  observedAt: string | undefined,
  fallback: string
): { value: string; was_missing: boolean } {
  if (observedAt && !Number.isNaN(new Date(observedAt).getTime())) {
    return { value: observedAt, was_missing: false };
  }
  return { value: fallback, was_missing: true };
}

/** Payment ID vs settlement ID: prefer canonical payment_attempt_id; settlement carries settlement_id. */
export const PAYMENT_ID_PRIORITY = ['payment_attempt_id', 'payment_id', 'transfer_id', 'id'] as const;

export function pickPaymentId(obj: Record<string, unknown>): string | null {
  for (const key of PAYMENT_ID_PRIORITY) {
    const v = obj[key];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return null;
}

/** Partial route visibility: mark data_class as inferred when hops are incomplete. */
export function routeVisibilityClass(
  hopCount: number,
  expectedMinHops: number
): DataClass {
  if (hopCount >= expectedMinHops) return 'observed';
  if (hopCount > 0) return 'inferred';
  return 'unknown';
}

/** Duplicate probes: keep one per (probe_type, target_connector_id, time_bucket). */
export function probeDedupeKey(
  probeType: string,
  targetConnectorId: string | undefined,
  executedAt: string,
  bucketMinutes: number = 5
): string {
  const t = new Date(executedAt).getTime();
  const bucket = Math.floor(t / (bucketMinutes * 60 * 1000));
  return `${probeType}:${targetConnectorId ?? 'global'}:${bucket}`;
}
