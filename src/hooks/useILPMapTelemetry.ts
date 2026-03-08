/**
 * Hook to load ILP graph telemetry and key it by ledger id and corridor key
 * for use in ConnectorMap (certainty-driven styling + tooltips).
 */

import { useEffect, useState } from 'react';
import { fetchILPGraph } from '../services/ilp/mapping/fetchGraph';
import type { ILPGraphPayload } from '../services/ilp/mapping/graphPayload';
import type { ObservationClass } from '../types/telemetry-truth-model';
import { lineStyleFromObservationClass, opacityFromConfidence } from '../types/telemetry-visual-rules';

export interface MapNodeTelemetry {
  observation_class: ObservationClass;
  confidence: number;
  health: string;
  freshness: string;
  /** For rendering: solid | dashed | dotted */
  lineStyle: 'solid' | 'dashed' | 'dotted';
  /** 0–1 */
  opacity: number;
  /** 0–1 */
  glow: number;
  label?: string;
  explanation?: string;
}

export interface MapEdgeTelemetry {
  observation_class: ObservationClass;
  confidence: number;
  health: string;
  freshness: string;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  opacity: number;
  glow: number;
  corridor_id?: string;
  from_asset?: string;
  to_asset?: string;
  volume_24h_usd?: number;
}

/** Map data_class (ILP graph) to ObservationClass (shared telemetry) */
function toObservationClass(dataClass: string): ObservationClass {
  if (dataClass === 'observed' || dataClass === 'derived' || dataClass === 'inferred' || dataClass === 'synthetic' || dataClass === 'unknown') {
    return dataClass as ObservationClass;
  }
  return 'unknown';
}

function buildTelemetryFromPayload(payload: ILPGraphPayload): {
  ledgerTelemetry: Record<string, MapNodeTelemetry>;
  corridorTelemetryByKey: Record<string, MapEdgeTelemetry>;
  corridorTelemetryById: Record<string, MapEdgeTelemetry>;
} {
  const ledgerTelemetry: Record<string, MapNodeTelemetry> = {};
  const corridorTelemetryByKey: Record<string, MapEdgeTelemetry> = {};
  const corridorTelemetryById: Record<string, MapEdgeTelemetry> = {};

  for (const n of payload.nodes) {
    const oc = toObservationClass(n.data_class ?? 'unknown');
    ledgerTelemetry[n.id] = {
      observation_class: oc,
      confidence: n.confidence ?? 0,
      health: (n as { status?: string }).status ?? 'unknown',
      freshness: payload.freshness ?? 'unknown',
      lineStyle: lineStyleFromObservationClass(oc),
      opacity: opacityFromConfidence(n.confidence ?? 0),
      glow: n.glow ?? 0.5,
      label: n.label,
    };
  }

  for (const e of payload.edges) {
    const oc = toObservationClass(e.data_class ?? 'unknown');
    const telemetry: MapEdgeTelemetry = {
      observation_class: oc,
      confidence: e.confidence ?? 0,
      health: 'unknown',
      freshness: payload.freshness ?? 'unknown',
      lineStyle: lineStyleFromObservationClass(oc),
      opacity: opacityFromConfidence(e.confidence ?? 0),
      glow: e.glow ?? 0.5,
      corridor_id: e.corridor_id,
      from_asset: e.from_asset,
      to_asset: e.to_asset,
      volume_24h_usd: e.volume_24h_usd,
    };
    const key = `${e.source_id}-${e.target_id}`;
    corridorTelemetryByKey[key] = telemetry;
    if (e.corridor_id) {
      corridorTelemetryById[e.corridor_id] = telemetry;
    }
  }

  // Alias keys so topology ledger ids (e.g. ethereum) match graph ids (e.g. eth)
  if (corridorTelemetryByKey['xrpl-eth']) corridorTelemetryByKey['xrpl-ethereum'] = corridorTelemetryByKey['xrpl-eth'];
  if (corridorTelemetryByKey['eth-xrpl']) corridorTelemetryByKey['ethereum-xrpl'] = corridorTelemetryByKey['eth-xrpl'];

  return { ledgerTelemetry, corridorTelemetryByKey, corridorTelemetryById };
}

export interface UseILPMapTelemetryResult {
  /** Ledger id → telemetry (for nodes) */
  ledgerTelemetry: Record<string, MapNodeTelemetry>;
  /** Corridor id → telemetry */
  corridorTelemetryById: Record<string, MapEdgeTelemetry>;
  /** "from_ledger-to_ledger" → telemetry (fallback when id not matched) */
  corridorTelemetryByKey: Record<string, MapEdgeTelemetry>;
  loading: boolean;
  /** Get edge telemetry for a corridor (tries id then from-to key) */
  getCorridorTelemetry: (corridorId: string, fromLedger: string, toLedger: string) => MapEdgeTelemetry | null;
  /** Get node telemetry for a ledger */
  getLedgerTelemetry: (ledgerId: string) => MapNodeTelemetry | null;
  contains_synthetic: boolean;
}

export function useILPMapTelemetry(): UseILPMapTelemetryResult {
  const [payload, setPayload] = useState<ILPGraphPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchILPGraph({ mockOnly: false })
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

  const { ledgerTelemetry, corridorTelemetryByKey, corridorTelemetryById } = payload
    ? buildTelemetryFromPayload(payload)
    : {
        ledgerTelemetry: {},
        corridorTelemetryByKey: {},
        corridorTelemetryById: {},
      };

  const getCorridorTelemetry = (corridorId: string, fromLedger: string, toLedger: string): MapEdgeTelemetry | null => {
    return corridorTelemetryById[corridorId] ?? corridorTelemetryByKey[`${fromLedger}-${toLedger}`] ?? null;
  };

  const getLedgerTelemetry = (ledgerId: string): MapNodeTelemetry | null => {
    return ledgerTelemetry[ledgerId] ?? null;
  };

  return {
    ledgerTelemetry,
    corridorTelemetryById,
    corridorTelemetryByKey,
    loading,
    getCorridorTelemetry,
    getLedgerTelemetry,
    contains_synthetic: payload?.contains_synthetic ?? false,
  };
}
