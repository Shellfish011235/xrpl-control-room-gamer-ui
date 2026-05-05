import type { DataSourceMeta } from '../types/dataAccuracy'
import { makeDataSourceMeta } from '../types/dataAccuracy'

export interface IlpRouteSimulationInput {
  id: string
  name: string
  fromAsset: string
  toAsset: string
  xrplLiquidityAvailable?: boolean
  openPaymentsEndpointOnline?: boolean
  rafikiTelemetryAvailable?: boolean
  notes?: string
}

export interface IlpRouteSimulationResult {
  id: string
  name: string
  routeStatus: 'possible' | 'partial' | 'unavailable' | 'unknown'
  confidencePct: number
  reasons: string[]
  dataSource: DataSourceMeta
}

export function simulateIlpRoute(input: IlpRouteSimulationInput): IlpRouteSimulationResult {
  const reasons: string[] = []
  const xrpl = input.xrplLiquidityAvailable === true
  const op = input.openPaymentsEndpointOnline === true
  const raf = input.rafikiTelemetryAvailable === true

  if (input.xrplLiquidityAvailable === undefined && input.openPaymentsEndpointOnline === undefined) {
    reasons.push('Insufficient signals for route feasibility.')
    return {
      id: input.id,
      name: input.name,
      routeStatus: 'unknown',
      confidencePct: 15,
      reasons,
      dataSource: makeDataSourceMeta({
        accuracy: 'SIMULATED',
        sourceKind: 'derived_model',
        sourceName: 'Route simulation (no inputs)',
        confidencePct: 15,
        warning:
          'Route simulation only — not LIVE_VERIFIED. No quote or payment execution from this adapter.',
      }),
    }
  }

  if (xrpl && !op) {
    reasons.push('XRPL liquidity signal present; ILP/Open Payments endpoint not verified.')
  }
  if (op && !xrpl) {
    reasons.push('Open Payments endpoint reachable; XRPL liquidity not confirmed for this pair.')
  }
  if (raf) {
    reasons.push('Local Rafiki telemetry available — still not a live payment test.')
  }
  if (input.notes) reasons.push(input.notes)

  let routeStatus: IlpRouteSimulationResult['routeStatus'] = 'unknown'
  if (xrpl && op) {
    routeStatus = 'possible'
    reasons.push('Combined signals allow a possible route; no quote or payment was executed.')
  } else if (xrpl || op) {
    routeStatus = 'partial'
  } else {
    routeStatus = 'unavailable'
    reasons.push('No positive XRPL or Open Payments signals.')
  }

  const confidencePct =
    routeStatus === 'possible' ? 48 : routeStatus === 'partial' ? 35 : routeStatus === 'unavailable' ? 20 : 25

  const dataSource: DataSourceMeta = makeDataSourceMeta({
    accuracy: 'SIMULATED',
    sourceKind: 'derived_model',
    sourceName: 'ILP route simulation (derived)',
    confidencePct,
    warning:
      'Route simulation only — not LIVE_VERIFIED. No quote or payment execution from this adapter.',
  })

  return {
    id: input.id,
    name: input.name,
    routeStatus,
    confidencePct,
    reasons,
    dataSource,
  }
}
