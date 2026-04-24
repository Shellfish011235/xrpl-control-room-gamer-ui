/**
 * Demo mock: corridor-level exposure (TigerBeetle-inspired), keyed by ilpData `ILPCorridor.id`.
 */

import type { CorridorExposure, OperatorSettlementStatus } from '../../types/settlement'

function e(
  corridorId: string,
  source: string,
  dest: string,
  assetPath: string,
  row: {
    dP: string
    dB: string
    cP: string
    cB: string
    net: string
    util: number
    ex: number
    last: string
    st: OperatorSettlementStatus
  }
): CorridorExposure {
  return {
    corridorId,
    source,
    destination: dest,
    assetPath,
    debitsPending: row.dP,
    debitsPosted: row.dB,
    creditsPending: row.cP,
    creditsPosted: row.cB,
    pendingExposure: row.dP,
    postedExposure: row.cB,
    netExposure: row.net,
    creditUtilizationPct: row.util,
    exceptionCount: row.ex,
    lastSettlementAt: row.last,
    settlementStatus: row.st,
  }
}

const iso = (minsAgo: number) => new Date(Date.now() - minsAgo * 60_000).toISOString()

export const MOCK_DEMO_EXPOSURE_BY_ID: Record<string, CorridorExposure> = {
  'us-mx-remit': e('us-mx-remit', 'ILF Rafiki (US)', 'Fynbos (EU) · MX rail', 'USD → USDC → MXN', {
    dP: '1.24M',
    dB: '980K',
    cP: '1.10M',
    cB: '940K',
    net: '−82K',
    util: 64,
    ex: 0,
    last: iso(8),
    st: 'settled',
  }),
  'us-ph-remit': e('us-ph-remit', 'Uphold (US)', 'GateHub (PH)', 'USD → XRP → PHP', {
    dP: '420K',
    dB: '1.1M',
    cP: '400K',
    cB: '1.0M',
    net: '−45K',
    util: 58,
    ex: 1,
    last: iso(45),
    st: 'pending',
  }),
  'jp-ph-remit': e('jp-ph-remit', 'Connector JP', 'Connector PH', 'JPY → XRP → PHP', {
    dP: '88K',
    dB: '512K',
    cP: '80K',
    cB: '500K',
    net: '−12K',
    util: 41,
    ex: 0,
    last: iso(20),
    st: 'settled',
  }),
  'eu-uk-b2b': e('eu-uk-b2b', 'Fynbos (EU)', 'UK PSP', 'EUR → GBP', {
    dP: '2.1M',
    dB: '8.2M',
    cP: '1.9M',
    cB: '7.8M',
    net: '−210K',
    util: 72,
    ex: 0,
    last: iso(3),
    st: 'settled',
  }),
  'webmon-global': e('webmon-global', 'Coil-adj. stub', 'Publisher mesh', 'STREAM units', {
    dP: '12.4K',
    dB: '890K',
    cP: '12.0K',
    cB: '880K',
    net: '−1.2K',
    util: 22,
    ex: 0,
    last: iso(1),
    st: 'settled',
  }),
  'sg-cbdc-pilot': e('sg-cbdc-pilot', 'SG connector', 'Partner CBDC', 'XSGD ↔ trial', {
    dP: '0',
    dB: '0',
    cP: '0',
    cB: '0',
    net: '0',
    util: 0,
    ex: 0,
    last: iso(120),
    st: 'stale',
  }),
  'us-eu-b2b': e('us-eu-b2b', 'ILF Rafiki (US)', 'Fynbos (EU)', 'USD → EUR', {
    dP: '3.4M',
    dB: '11M',
    cP: '3.2M',
    cB: '10.6M',
    net: '−180K',
    util: 69,
    ex: 2,
    last: iso(90),
    st: 'exception',
  }),
  'asia-micropay': e('asia-micropay', 'SG hub', 'Regional peers', 'Multi-asset', {
    dP: '54K',
    dB: '200K',
    cP: '50K',
    cB: '198K',
    net: '−4K',
    util: 35,
    ex: 0,
    last: iso(6),
    st: 'pending',
  }),
}
