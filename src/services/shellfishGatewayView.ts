import type {
  GatewayResult,
  ShellfishHealthResponse,
  ShellfishIntegrationResponse,
} from './shellfishGateway'

export type GatewayViewStateName =
  | 'healthy'
  | 'pending'
  | 'success'
  | 'blocked'
  | 'dependency_down'
  | 'malformed'

export interface GatewayViewState {
  state: GatewayViewStateName
  label: string
  detail: string
}

export interface GatewayViewInput {
  pending?: boolean
  result?: GatewayResult<ShellfishHealthResponse | ShellfishIntegrationResponse>
}

const successStatuses = new Set([
  'QUOTED',
  'QUEUED',
  'FOUND',
  'COMPLETED',
  'EXECUTED',
])

export function toGatewayViewState(input: GatewayViewInput): GatewayViewState {
  if (input.pending) {
    return {
      state: 'pending',
      label: 'Working',
      detail: 'Waiting for Shellfish Gateway.',
    }
  }

  const result = input.result
  if (!result) {
    return {
      state: 'malformed',
      label: 'No state',
      detail: 'No Shellfish Gateway state is available yet.',
    }
  }

  if (!result.ok) {
    if (result.error.kind === 'network' || result.error.kind === 'timeout') {
      return {
        state: 'dependency_down',
        label: 'Backend unavailable',
        detail: result.error.message,
      }
    }
    if (result.error.kind === 'malformed') {
      return {
        state: 'malformed',
        label: 'Malformed response',
        detail: result.error.message,
      }
    }
    if (
      result.error.code === 'DEPENDENCY_UNAVAILABLE' ||
      result.error.code === 'TIMEOUT' ||
      result.error.httpStatus === 503 ||
      result.error.httpStatus === 504
    ) {
      return {
        state: 'dependency_down',
        label: 'Dependency unavailable',
        detail: result.error.message,
      }
    }
    return {
      state: 'blocked',
      label: 'Request blocked',
      detail: result.error.message,
    }
  }

  const data = result.data
  if (data.status === 'HEALTHY') {
    const dependency =
      'dependencies' in data
        ? data.dependencies?.wave_router.status ?? 'UNKNOWN'
        : 'UNKNOWN'
    return {
      state: 'healthy',
      label: 'Shellfish healthy',
      detail: `Wave Router: ${dependency}`,
    }
  }

  if (data.status === 'DEGRADED') {
    return {
      state: 'dependency_down',
      label: 'Backend degraded',
      detail: 'Shellfish is reachable but a dependency is unavailable.',
    }
  }

  if (successStatuses.has(data.status)) {
    const receiptId =
      'receipt_id' in data && data.receipt_id
        ? ` Receipt: ${data.receipt_id}.`
        : ''
    return {
      state: 'success',
      label: data.status,
      detail: `Shellfish completed the requested integration step.${receiptId}`,
    }
  }

  if (data.status === 'ERROR') {
    const first = 'errors' in data ? data.errors?.[0] : undefined
    return {
      state: 'blocked',
      label: 'Request blocked',
      detail: first?.message ?? 'Shellfish rejected the request.',
    }
  }

  return {
    state: 'malformed',
    label: 'Unknown state',
    detail: 'Shellfish Gateway returned an unsupported response state.',
  }
}
