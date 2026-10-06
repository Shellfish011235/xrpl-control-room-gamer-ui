export interface ShellfishGatewayEnv {
  DEV?: boolean
  VITE_SHELLFISH_GATEWAY_URL?: string
}

export interface GatewayErrorInfo {
  kind: 'http' | 'network' | 'timeout' | 'malformed' | 'configuration'
  code?: string
  message: string
  httpStatus?: number
}

export type GatewayResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: GatewayErrorInfo }

export interface ShellfishDependencyState {
  status: string
  service?: string | null
}

export interface ShellfishHealthResponse {
  status: string
  service?: string
  dependencies?: {
    wave_router: ShellfishDependencyState
  }
}

export interface ShellfishIntegrationError {
  code: string
  message: string
}

export interface ShellfishIntegrationResponse {
  request_id?: string
  job_id?: string
  status: string
  source?: string
  created_at?: string
  route?: unknown
  evidence_refs?: unknown
  authorization_state?: Record<string, unknown>
  result?: unknown
  receipt_id?: string
  errors?: ShellfishIntegrationError[]
}

export interface GatewayRequestOptions {
  baseUrl?: string
  timeoutMs?: number
}

const DEFAULT_LOCAL_GATEWAY_URL = 'http://127.0.0.1:8787'
const DEFAULT_TIMEOUT_MS = 5_000

const metaEnv = (import.meta as ImportMeta & { env?: ShellfishGatewayEnv }).env

export function resolveShellfishGatewayBaseUrl(
  env: ShellfishGatewayEnv | undefined = metaEnv
): string | null {
  const configured = env?.VITE_SHELLFISH_GATEWAY_URL?.trim()
  if (configured) return configured.replace(/\/+$/, '')
  if (env?.DEV === true || env === undefined) return DEFAULT_LOCAL_GATEWAY_URL
  return null
}

function resolveRequestBaseUrl(options: GatewayRequestOptions): string | null {
  const explicit = options.baseUrl?.trim()
  return explicit ? explicit.replace(/\/+$/, '') : resolveShellfishGatewayBaseUrl()
}

function malformed(message = 'Shellfish Gateway returned malformed JSON.'): GatewayResult<never> {
  return { ok: false, error: { kind: 'malformed', message } }
}

async function requestGateway<T extends { status: string }>(
  path: string,
  method: 'GET' | 'POST',
  body: unknown,
  options: GatewayRequestOptions
): Promise<GatewayResult<T>> {
  const baseUrl = resolveRequestBaseUrl(options)
  if (!baseUrl) {
    return {
      ok: false,
      error: {
        kind: 'configuration',
        message: 'Shellfish Gateway is not configured for this build.',
      },
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS)

  try {
    const response = await fetch(baseUrl + path, {
      method,
      headers: method === 'POST' ? { 'content-type': 'application/json' } : undefined,
      body: method === 'POST' ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    const text = await response.text()
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      return malformed()
    }

    if (!parsed || typeof parsed !== 'object' || typeof (parsed as { status?: unknown }).status !== 'string') {
      return malformed('Shellfish Gateway returned an invalid response shape.')
    }

    const payload = parsed as T & { errors?: ShellfishIntegrationError[] }

    if (!response.ok) {
      const first = payload.errors?.[0]
      return {
        ok: false,
        error: {
          kind: 'http',
          code: first?.code,
          message: first?.message ?? 'Shellfish Gateway rejected the request.',
          httpStatus: response.status,
        },
      }
    }

    return { ok: true, data: payload }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        ok: false,
        error: { kind: 'timeout', message: 'Shellfish Gateway timed out.' },
      }
    }
    return {
      ok: false,
      error: { kind: 'network', message: 'Shellfish Gateway is unavailable.' },
    }
  } finally {
    clearTimeout(timeout)
  }
}

export function getShellfishHealth(
  options: GatewayRequestOptions = {}
): Promise<GatewayResult<ShellfishHealthResponse>> {
  return requestGateway('/health', 'GET', undefined, options)
}

export function requestShellfishQuote(
  task: Record<string, unknown>,
  options: GatewayRequestOptions = {}
): Promise<GatewayResult<ShellfishIntegrationResponse>> {
  return requestGateway('/quotes', 'POST', task, options)
}

export function submitShellfishJob(
  task: Record<string, unknown>,
  options: GatewayRequestOptions = {}
): Promise<GatewayResult<ShellfishIntegrationResponse>> {
  return requestGateway('/jobs', 'POST', task, options)
}

export function getShellfishJob(
  id: string,
  options: GatewayRequestOptions = {}
): Promise<GatewayResult<ShellfishIntegrationResponse>> {
  return requestGateway(`/jobs/${encodeURIComponent(id)}`, 'GET', undefined, options)
}

export function getShellfishReceipt(
  id: string,
  options: GatewayRequestOptions = {}
): Promise<GatewayResult<ShellfishIntegrationResponse>> {
  return requestGateway(`/receipts/${encodeURIComponent(id)}`, 'GET', undefined, options)
}
