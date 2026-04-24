/**
 * Demo mock: inspector "Settlement state" for selected ILP corridor (ilpData `ILPCorridor.id`).
 */

import type { IlpCorridorInspectorSettlement } from '../../types/settlement'

const isoM = (m: number) => new Date(Date.now() - m * 60_000).toISOString()

export const MOCK_DEMO_SETTLEMENT_BY_ID: Record<string, IlpCorridorInspectorSettlement> = {
  'us-mx-remit': {
    pendingBalance: '1.24M USD',
    postedBalance: '2.1M USD',
    netOwed: '82K (net to peer)',
    feeAccrual: '1.1K (session)',
    settlementLag: '8m',
    exceptionOrCorrection: 'none',
    lastSettlementAt: isoM(8),
  },
  'us-ph-remit': {
    pendingBalance: '420K',
    postedBalance: '2.0M',
    netOwed: '45K',
    feeAccrual: null,
    settlementLag: '45m',
    exceptionOrCorrection: 'exception',
    lastSettlementAt: isoM(45),
    notes: '1 linked prepare pending settlement window.',
  },
  'jp-ph-remit': {
    pendingBalance: '88K',
    postedBalance: '1.0M',
    netOwed: '12K',
    feeAccrual: '240',
    settlementLag: '20m',
    exceptionOrCorrection: 'none',
    lastSettlementAt: isoM(20),
  },
  'eu-uk-b2b': {
    pendingBalance: '2.1M',
    postedBalance: '16M',
    netOwed: '210K',
    feeAccrual: '4.2K',
    settlementLag: '3m',
    exceptionOrCorrection: 'none',
    lastSettlementAt: isoM(3),
  },
  'webmon-global': {
    pendingBalance: '12.4K u',
    postedBalance: '1.77M u',
    netOwed: '1.2K',
    feeAccrual: null,
    settlementLag: '1m',
    exceptionOrCorrection: 'none',
    lastSettlementAt: isoM(1),
  },
  'sg-cbdc-pilot': {
    pendingBalance: '0',
    postedBalance: '0',
    netOwed: '0',
    feeAccrual: null,
    settlementLag: '—',
    exceptionOrCorrection: 'pending',
    lastSettlementAt: isoM(120),
    notes: 'Pilot idle; no pending transfers in demo ledger.',
  },
  'us-eu-b2b': {
    pendingBalance: '3.4M',
    postedBalance: '21.6M',
    netOwed: '180K',
    feeAccrual: '6.0K',
    settlementLag: '90m',
    exceptionOrCorrection: 'correction',
    lastSettlementAt: isoM(90),
    notes: 'Correcting transfer linked to T-2 batch.',
  },
  'asia-micropay': {
    pendingBalance: '54K',
    postedBalance: '400K',
    netOwed: '4K',
    feeAccrual: '80',
    settlementLag: '6m',
    exceptionOrCorrection: 'none',
    lastSettlementAt: isoM(6),
  },
}
