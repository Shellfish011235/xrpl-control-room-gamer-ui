import type { DataSourceMeta } from '../types/dataAccuracy'
import { makeDataSourceMeta } from '../types/dataAccuracy'
import { getAccuracyWarning } from '../types/dataAccuracy'

export type RafikiTelemetryEventType =
  | 'webhook.received'
  | 'quote.created'
  | 'quote.completed'
  | 'incoming_payment.created'
  | 'outgoing_payment.created'
  | 'payment.completed'
  | 'payment.failed'
  | 'connector.error'
  | 'settlement.posted'
  | 'settlement.pending'

export interface RafikiTelemetryEvent {
  id: string
  type: RafikiTelemetryEventType
  createdAt: string
  environment: 'local' | 'testnet' | 'livenet'
  assetCode?: string
  amount?: string
  walletAddress?: string
  routeId?: string
  status?: 'pending' | 'posted' | 'failed' | 'completed'
  message?: string
  dataSource: DataSourceMeta
}

export interface RafikiTelemetrySummary {
  events: RafikiTelemetryEvent[]
  totalEvents: number
  completedPayments: number
  failedPayments: number
  pendingSettlements: number
  lastEventAt?: string
  dataSource: DataSourceMeta
}

const DEMO_META: DataSourceMeta = makeDataSourceMeta({
  accuracy: 'DEMO',
  sourceKind: 'mock_dataset',
  sourceName: 'Demo Rafiki telemetry row',
  confidencePct: 5,
  warning: getAccuracyWarning('DEMO'),
})

export function summarizeRafikiTelemetry(events: RafikiTelemetryEvent[]): RafikiTelemetrySummary {
  const completedPayments = events.filter(
    (e) => e.type === 'payment.completed' || e.status === 'completed'
  ).length
  const failedPayments = events.filter(
    (e) => e.type === 'payment.failed' || e.status === 'failed'
  ).length
  const pendingSettlements = events.filter(
    (e) => e.type === 'settlement.pending' || e.status === 'pending'
  ).length
  const last = events.length
    ? events.reduce((a, b) => (a.createdAt > b.createdAt ? a : b)).createdAt
    : undefined

  const live = events.some((e) => e.dataSource.accuracy === 'LOCAL_TELEMETRY')
  const dataSource: DataSourceMeta = makeDataSourceMeta({
    accuracy: live ? 'LOCAL_TELEMETRY' : events.some((e) => e.dataSource.accuracy === 'DEMO') ? 'DEMO' : 'UNKNOWN',
    sourceKind: live ? 'rafiki_local' : 'unknown',
    sourceName: live ? 'Rafiki webhook / local telemetry' : 'No live Rafiki telemetry',
    isLive: live,
    confidencePct: live ? 75 : 10,
    lastCheckedAt: last,
    warning:
      live ? undefined : 'Local Rafiki telemetry is not configured. Connect a webhook feed to replace demo rows.',
  })

  return {
    events,
    totalEvents: events.length,
    completedPayments,
    failedPayments,
    pendingSettlements,
    lastEventAt: last,
    dataSource,
  }
}

export function createEmptyRafikiTelemetrySummary(): RafikiTelemetrySummary {
  return {
    events: [],
    totalEvents: 0,
    completedPayments: 0,
    failedPayments: 0,
    pendingSettlements: 0,
    dataSource: makeDataSourceMeta({
      accuracy: 'UNKNOWN',
      sourceKind: 'unknown',
      sourceName: 'Rafiki telemetry (not configured)',
      confidencePct: 0,
      warning:
        'No verified Rafiki/Open Payments settlement telemetry configured. Connect a local Rafiki webhook feed to replace demo settlement data.',
    }),
  }
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function pickType(raw: Record<string, unknown>): RafikiTelemetryEventType | null {
  const t = raw.type ?? raw.event
  if (typeof t !== 'string') return null
  const allowed: RafikiTelemetryEventType[] = [
    'webhook.received',
    'quote.created',
    'quote.completed',
    'incoming_payment.created',
    'outgoing_payment.created',
    'payment.completed',
    'payment.failed',
    'connector.error',
    'settlement.posted',
    'settlement.pending',
  ]
  return (allowed as string[]).includes(t) ? (t as RafikiTelemetryEventType) : null
}

/** Normalizes a backend webhook payload; returns null if unrecognized. Never marks as LOCAL_TELEMETRY without an explicit live feed flag. */
export function normalizeRafikiWebhookEvent(raw: unknown): RafikiTelemetryEvent | null {
  if (!isObj(raw)) return null
  const type = pickType(raw)
  if (!type) return null
  const id =
    typeof raw.id === 'string'
      ? raw.id
      : typeof raw.eventId === 'string'
        ? raw.eventId
        : `evt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const createdAt =
    typeof raw.createdAt === 'string'
      ? raw.createdAt
      : typeof raw.timestamp === 'string'
        ? raw.timestamp
        : new Date().toISOString()
  const env = raw.environment
  const environment: RafikiTelemetryEvent['environment'] =
    env === 'local' || env === 'testnet' || env === 'livenet' ? env : 'local'
  const explicitDemo = raw.demo === true || raw.source === 'demo'
  const dataSource = explicitDemo
    ? DEMO_META
    : makeDataSourceMeta({
        accuracy: 'UNKNOWN',
        sourceKind: 'rafiki_local',
        sourceName: 'Unverified webhook payload',
        confidencePct: 35,
        warning: 'Normalize and verify webhook signing server-side before trusting.',
      })

  return {
    id,
    type,
    createdAt,
    environment,
    assetCode: typeof raw.assetCode === 'string' ? raw.assetCode : undefined,
    amount: typeof raw.amount === 'string' ? raw.amount : undefined,
    walletAddress: typeof raw.walletAddress === 'string' ? raw.walletAddress : undefined,
    routeId: typeof raw.routeId === 'string' ? raw.routeId : undefined,
    status:
      raw.status === 'pending' || raw.status === 'posted' || raw.status === 'failed' || raw.status === 'completed'
        ? raw.status
        : undefined,
    message: typeof raw.message === 'string' ? raw.message : undefined,
    dataSource,
  }
}
