import type { CorridorExposure, SettlementQueueSummary } from '../types/settlement'

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function num(v: unknown, d = 0): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  return Number.isFinite(n) ? n : d
}

function str(v: unknown, d = ''): string {
  return typeof v === 'string' ? v : d
}

const QUEUE_SCALAR_KEYS = [
  'pendingCount',
  'postedCount',
  'voidedCount',
  'expiredCount',
  'correctedCount',
  'oldestPendingAgeSeconds',
] as const

function looksLikeQueueTopLevel(data: Record<string, unknown>): boolean {
  return QUEUE_SCALAR_KEYS.some((k) => k in data) || 'lastPostedAt' in data
}

/** Parses a queue object from your bridge (partial fields default to 0 / now). */
export function parseSettlementQueueSummary(data: unknown): SettlementQueueSummary | null {
  if (!isRecord(data)) return null
  return {
    pendingCount: num(data.pendingCount),
    postedCount: num(data.postedCount),
    voidedCount: num(data.voidedCount),
    expiredCount: num(data.expiredCount),
    correctedCount: num(data.correctedCount),
    oldestPendingAgeSeconds: num(data.oldestPendingAgeSeconds),
    lastPostedAt: str(data.lastPostedAt, new Date().toISOString()),
  }
}

const STATUSES: CorridorExposure['settlementStatus'][] = [
  'settled',
  'pending',
  'stale',
  'exception',
  'correcting',
]

function parseExposureRow(data: unknown): CorridorExposure | null {
  if (!isRecord(data)) return null
  const corridorId = str(data.corridorId)
  if (!corridorId) return null
  const settlementStatus = data.settlementStatus
  const st = STATUSES.includes(settlementStatus as CorridorExposure['settlementStatus'])
    ? (settlementStatus as CorridorExposure['settlementStatus'])
    : 'pending'
  return {
    corridorId,
    source: str(data.source, '—'),
    destination: str(data.destination, '—'),
    assetPath: str(data.assetPath, '—'),
    debitsPending: str(data.debitsPending, '0'),
    debitsPosted: str(data.debitsPosted, '0'),
    creditsPending: str(data.creditsPending, '0'),
    creditsPosted: str(data.creditsPosted, '0'),
    pendingExposure: str(data.pendingExposure, '0'),
    postedExposure: str(data.postedExposure, '0'),
    netExposure: str(data.netExposure, '0'),
    creditUtilizationPct: num(data.creditUtilizationPct, 0),
    exceptionCount: num(data.exceptionCount, 0),
    lastSettlementAt: str(data.lastSettlementAt, new Date().toISOString()),
    settlementStatus: st,
  }
}

export function parseCorridorExposureList(data: unknown): CorridorExposure[] | null {
  if (!Array.isArray(data)) return null
  return data.map(parseExposureRow).filter((r): r is CorridorExposure => r !== null)
}

export type IlpOperatorSnapshot = {
  queue?: SettlementQueueSummary | null
  exposures?: CorridorExposure[] | null
}

/**
 * WebSocket / HTTP bodies:
 * - `{ queue?, exposures? }`
 * - `{ type: "ilp_operator_snapshot", payload: { queue?, exposures? } }`
 * - Top-level queue scalars: `{ pendingCount, ... }`
 */
export function parseIlpOperatorPayload(raw: unknown): IlpOperatorSnapshot {
  if (raw == null) return {}
  if (typeof raw === 'string') {
    try {
      return parseIlpOperatorPayload(JSON.parse(raw) as unknown)
    } catch {
      return {}
    }
  }
  if (!isRecord(raw)) return {}

  if (raw.type === 'ilp_operator_snapshot' && isRecord(raw.payload)) {
    return parseIlpOperatorPayload(raw.payload)
  }

  const out: IlpOperatorSnapshot = {}

  if ('queue' in raw) {
    const q = parseSettlementQueueSummary(raw.queue)
    if (q) out.queue = q
  }

  if ('exposures' in raw && Array.isArray(raw.exposures)) {
    const list = parseCorridorExposureList(raw.exposures)
    if (list !== null) out.exposures = list
  }

  if (!('queue' in raw) && looksLikeQueueTopLevel(raw)) {
    out.queue = parseSettlementQueueSummary(raw) ?? undefined
  }

  return out
}
