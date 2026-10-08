import type { ShellfishIntegrationResponse } from '../../services/shellfishGateway'
import type { GatewayViewState } from '../../services/shellfishGatewayView'

export interface IntegrationPanelInput {
  health: GatewayViewState
  operation?: GatewayViewState
  response?: ShellfishIntegrationResponse
  receipt?: GatewayViewState
}

export interface IntegrationPanelModel {
  healthLabel: string
  healthDetail: string
  operationLabel: string | null
  operationDetail: string | null
  receiptId: string | null
  receiptError: string | null
  showReceiptDetails: boolean
  authorizationCopy: string
  showSuccess: boolean
}

export function buildIntegrationPanelModel(input: IntegrationPanelInput): IntegrationPanelModel {
  const healthConfirmed = input.health.state === 'healthy'
  const operation = !healthConfirmed && input.operation?.state === 'success'
    ? input.health
    : input.operation
  const response = healthConfirmed ? input.response : undefined
  const executionAuthorized = response?.authorization_state?.execution_authorized
  const receiptError = input.receipt && input.receipt.state !== 'success' && input.receipt.state !== 'pending'
    ? `${input.receipt.label}: ${input.receipt.detail}`
    : null

  return {
    healthLabel: input.health.label,
    healthDetail: input.health.detail,
    operationLabel: operation?.label ?? null,
    operationDetail: operation?.detail ?? null,
    receiptId: response?.receipt_id ?? null,
    receiptError,
    showReceiptDetails: healthConfirmed && operation?.state === 'success' && input.receipt?.state === 'success',
    authorizationCopy:
      executionAuthorized === true
        ? 'Execution authority: reported by backend'
        : executionAuthorized === false
          ? 'Execution authority: not granted'
          : 'Execution authority: not reported',
    showSuccess: healthConfirmed && operation?.state === 'success',
  }
}
