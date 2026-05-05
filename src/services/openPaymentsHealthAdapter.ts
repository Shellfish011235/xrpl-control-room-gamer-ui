import type { DataSourceMeta } from '../types/dataAccuracy'
import { makeDataSourceMeta } from '../types/dataAccuracy'
import { classifyOpenPaymentsEndpoint } from './dataAccuracyClassifier'

export interface OpenPaymentsEndpointConfig {
  id: string
  name: string
  environment: 'local' | 'testnet' | 'livenet' | 'manual'
  walletAddressUrl?: string
  authServerUrl?: string
  resourceServerUrl?: string
  notes?: string
}

export interface OpenPaymentsHealthResult {
  id: string
  name: string
  environment: OpenPaymentsEndpointConfig['environment']
  walletAddressReachable: boolean | null
  authServerReachable: boolean | null
  resourceServerReachable: boolean | null
  status: 'online' | 'degraded' | 'offline' | 'unknown'
  checkedAt: string
  dataSource: DataSourceMeta
  error?: string
}

export async function checkUrl(url?: string): Promise<boolean | null> {
  const u = url?.trim()
  if (!u) return null
  try {
    const head = await fetch(u, {
      method: 'HEAD',
      mode: 'cors',
      cache: 'no-store',
      credentials: 'omit',
    })
    if (head.ok) return true
    if (head.status === 405 || head.status === 501) {
      const get = await fetch(u, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
        credentials: 'omit',
      })
      return get.ok
    }
    const get = await fetch(u, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      credentials: 'omit',
    })
    return get.ok
  } catch {
    return null
  }
}

function aggregateStatus(
  w: boolean | null,
  a: boolean | null,
  r: boolean | null
): OpenPaymentsHealthResult['status'] {
  const vals = [w, a, r].filter((x) => x !== null) as boolean[]
  if (vals.length === 0) return 'unknown'
  const anyOk = vals.some(Boolean)
  const anyFail = vals.some((v) => v === false)
  if (anyOk && !anyFail) return 'online'
  if (anyOk && anyFail) return 'degraded'
  if (!anyOk) return 'offline'
  return 'unknown'
}

export async function checkOpenPaymentsEndpoint(
  config: OpenPaymentsEndpointConfig
): Promise<OpenPaymentsHealthResult> {
  const checkedAt = new Date().toISOString()
  let error: string | undefined

  const [walletAddressReachable, authServerReachable, resourceServerReachable] = await Promise.all([
    checkUrl(config.walletAddressUrl),
    checkUrl(config.authServerUrl),
    checkUrl(config.resourceServerUrl),
  ])

  const status = aggregateStatus(walletAddressReachable, authServerReachable, resourceServerReachable)
  const anyProbed = [walletAddressReachable, authServerReachable, resourceServerReachable].some(
    (x) => x !== null
  )
  if (!anyProbed) {
    error = 'Probe inconclusive (CORS, network, or no URLs configured).'
  }

  const success = status === 'online' || status === 'degraded'
  const isTestnet = config.environment === 'testnet'
  const base = classifyOpenPaymentsEndpoint(success && anyProbed, isTestnet)

  const dataSource: DataSourceMeta = makeDataSourceMeta({
    ...base,
    sourceName: `${base.sourceName} · ${config.name}`,
    lastCheckedAt: checkedAt,
    confidencePct:
      status === 'online' ? Math.min(90, base.confidencePct + 10) : base.confidencePct,
    warning:
      error ?? base.warning,
  })

  return {
    id: config.id,
    name: config.name,
    environment: config.environment,
    walletAddressReachable,
    authServerReachable,
    resourceServerReachable,
    status,
    checkedAt,
    dataSource,
    error,
  }
}

export async function checkOpenPaymentsEndpoints(
  configs: OpenPaymentsEndpointConfig[]
): Promise<OpenPaymentsHealthResult[]> {
  return Promise.all(configs.map((c) => checkOpenPaymentsEndpoint(c)))
}
