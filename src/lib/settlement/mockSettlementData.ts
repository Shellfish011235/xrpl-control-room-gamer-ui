/**
 * Demo-only mock settlement and exposure data.
 * Replace with live feeds via the realtime adapter; do not import in paths that should stay production-pure.
 */

import type { CorridorExposure, IlpCorridorInspectorSettlement, SettlementQueueSummary } from '../../types/settlement'
import { MOCK_DEMO_EXPOSURE_BY_ID } from './mockCorridorExposure'
import { MOCK_DEMO_SETTLEMENT_BY_ID } from './mockCorridorInspectorSettlement'

export { MOCK_DEMO_EXPOSURE_BY_ID, MOCK_DEMO_SETTLEMENT_BY_ID }

const DEMO_QUEUE: SettlementQueueSummary = {
  pendingCount: 14,
  postedCount: 1284,
  voidedCount: 3,
  expiredCount: 1,
  correctedCount: 2,
  oldestPendingAgeSeconds: 420,
  lastPostedAt: new Date().toISOString(),
}

export function getMockSettlementQueueSummary(_demo = true): SettlementQueueSummary {
  if (!_demo) {
    return {
      pendingCount: 0,
      postedCount: 0,
      voidedCount: 0,
      expiredCount: 0,
      correctedCount: 0,
      oldestPendingAgeSeconds: 0,
      lastPostedAt: new Date(0).toISOString(),
    }
  }
  return { ...DEMO_QUEUE, lastPostedAt: new Date().toISOString() }
}

export function getMockCorridorExposure(corridorId: string, demo = true): CorridorExposure | null {
  if (!demo) return null
  return MOCK_DEMO_EXPOSURE_BY_ID[corridorId] ?? null
}

export function getMockCorridorExposuresList(demo = true): CorridorExposure[] {
  if (!demo) return []
  return Object.values(MOCK_DEMO_EXPOSURE_BY_ID)
}

export function getMockInspectorSettlement(corridorId: string, demo = true): IlpCorridorInspectorSettlement | null {
  if (!demo) return null
  return MOCK_DEMO_SETTLEMENT_BY_ID[corridorId] ?? null
}
