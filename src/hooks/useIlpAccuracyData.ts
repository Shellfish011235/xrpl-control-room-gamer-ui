import { useCallback, useEffect, useMemo, useState } from 'react'
import { ilpCorridors } from '../data/ilpData'
import { checkOpenPaymentsEndpoints } from '../services/openPaymentsHealthAdapter'
import type { OpenPaymentsEndpointConfig, OpenPaymentsHealthResult } from '../services/openPaymentsHealthAdapter'
import { simulateIlpRoute, type IlpRouteSimulationResult } from '../services/ilpRouteSimulationAdapter'
import { createEmptyRafikiTelemetrySummary, type RafikiTelemetrySummary } from '../services/rafikiTelemetryAdapter'

export interface UseIlpAccuracyDataResult {
  endpointHealth: OpenPaymentsHealthResult[]
  telemetrySummary: RafikiTelemetrySummary
  routeSimulations: IlpRouteSimulationResult[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  lastUpdatedAt?: string
}

function getDefaultOpenPaymentsConfigs(): OpenPaymentsEndpointConfig[] {
  const local = import.meta.env.VITE_RAFIKI_LOCAL_URL as string | undefined
  const wa = import.meta.env.VITE_OPEN_PAYMENTS_WALLET_ADDRESS_URL as string | undefined
  const auth = import.meta.env.VITE_OPEN_PAYMENTS_AUTH_SERVER_URL as string | undefined
  const rs = import.meta.env.VITE_OPEN_PAYMENTS_RESOURCE_SERVER_URL as string | undefined

  const list: OpenPaymentsEndpointConfig[] = []

  if (local?.trim()) {
    list.push({
      id: 'rafiki-local',
      name: 'Rafiki (VITE_RAFIKI_LOCAL_URL)',
      environment: 'local',
      resourceServerUrl: local.trim(),
      notes: 'Configured local base URL — browser probe only; CORS may block.',
    })
  }

  if (wa?.trim() || auth?.trim() || rs?.trim()) {
    list.push({
      id: 'open-payments-env',
      name: 'Open Payments (env)',
      environment: 'manual',
      walletAddressUrl: wa?.trim(),
      authServerUrl: auth?.trim(),
      resourceServerUrl: rs?.trim(),
    })
  }

  list.push({
    id: 'rafiki-docs',
    name: 'rafiki.dev (public docs)',
    environment: 'testnet',
    resourceServerUrl: 'https://rafiki.dev',
    notes: 'Public site reachability — not a production wallet endpoint.',
  })

  return list
}

export function useIlpAccuracyData(enabled: boolean): UseIlpAccuracyDataResult {
  const [endpointHealth, setEndpointHealth] = useState<OpenPaymentsHealthResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | undefined>(undefined)

  const configs = useMemo(() => getDefaultOpenPaymentsConfigs(), [])

  const run = useCallback(async () => {
    if (!enabled) return
    setIsLoading(true)
    setError(null)
    try {
      const results = await checkOpenPaymentsEndpoints(configs)
      setEndpointHealth(results)
      setLastUpdatedAt(new Date().toISOString())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ILP accuracy fetch failed')
    } finally {
      setIsLoading(false)
    }
  }, [enabled, configs])

  useEffect(() => {
    if (!enabled) return
    void run()
  }, [enabled, run])

  const telemetrySummary = useMemo(() => createEmptyRafikiTelemetrySummary(), [])

  const routeSimulations = useMemo(() => {
    const anyOnline = endpointHealth.some((h) => h.status === 'online' || h.status === 'degraded')
    return ilpCorridors.slice(0, 6).map((c) =>
      simulateIlpRoute({
        id: `sim-${c.id}`,
        name: c.name,
        fromAsset: c.from.countryCode,
        toAsset: c.to.countryCode,
        xrplLiquidityAvailable: c.xrplBacked,
        openPaymentsEndpointOnline: anyOnline,
        notes: `Static corridor record · type ${c.type}`,
      })
    )
  }, [endpointHealth])

  return {
    endpointHealth,
    telemetrySummary,
    routeSimulations,
    isLoading,
    error,
    refetch: run,
    lastUpdatedAt,
  }
}
