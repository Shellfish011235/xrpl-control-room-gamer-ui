/**
 * Shared settlement / operator accounting types (TigerBeetle-inspired mental model).
 * Balances change via immutable transfers; corrections are new transfers, not edits.
 */

export type TransferState = 'pending' | 'posted' | 'voided' | 'expired' | 'corrected'

export type IlpPacketEventType = 'prepare' | 'fulfill' | 'reject'

export type IlpSettlementEventType = 'settle_request' | 'settle_success' | 'settle_fail'

export type TigerBeetleTransferState = 'pending' | 'posted' | 'voided' | 'expired' | 'corrected'

export type OperatorSettlementStatus =
  | 'settled'
  | 'pending'
  | 'stale'
  | 'exception'
  | 'correcting'

export interface SettlementAccountSnapshot {
  id: string
  name: string
  ledger: string
  debitsPending: string
  debitsPosted: string
  creditsPending: string
  creditsPosted: string
  lastUpdated: string
}

export interface SettlementTransferRecord {
  id: string
  corridorId: string
  fromAccountId: string
  toAccountId: string
  amount: string
  state: TransferState
  createdAt: string
  settledAt?: string
  correctionOf?: string
  metadata?: Record<string, string>
}

export interface CorridorExposure {
  corridorId: string
  source: string
  destination: string
  assetPath: string
  debitsPending: string
  debitsPosted: string
  creditsPending: string
  creditsPosted: string
  pendingExposure: string
  postedExposure: string
  netExposure: string
  creditUtilizationPct: number
  exceptionCount: number
  lastSettlementAt: string
  settlementStatus: OperatorSettlementStatus
}

export interface SettlementQueueSummary {
  pendingCount: number
  postedCount: number
  voidedCount: number
  expiredCount: number
  correctedCount: number
  oldestPendingAgeSeconds: number
  lastPostedAt: string
}

export interface IlpPacketEvent {
  id: string
  corridorId: string
  sourcePeer: string
  destinationPeer: string
  assetPath: string
  eventType: IlpPacketEventType
  amount: string
  latencyMs: number
  timestamp: string
  routeId: string
}

export interface IlpSettlementEvent {
  id: string
  corridorId: string
  eventType: IlpSettlementEventType
  amount: string
  timestamp: string
  sourcePeer: string
  destinationPeer: string
}

export interface TigerBeetleTransferEvent {
  id: string
  corridorId: string
  ledger: string
  state: TigerBeetleTransferState
  debitAccountId: string
  creditAccountId: string
  amount: string
  debitsPending: string
  debitsPosted: string
  creditsPending: string
  creditsPosted: string
  timestamp: string
}

export interface IlpCorridorInspectorSettlement {
  pendingBalance: string
  postedBalance: string
  netOwed: string
  feeAccrual: string | null
  settlementLag: string
  exceptionOrCorrection: 'none' | 'correction' | 'exception' | 'pending'
  lastSettlementAt: string
  notes?: string
}
