import type { ShellfishIntegrationResponse } from '../../services/shellfishGateway'
import type { GatewayViewState } from '../../services/shellfishGatewayView'

export interface IntegrationPanelInput {
  health: GatewayViewState
  operation?: GatewayViewState
  response?: ShellfishIntegrationResponse
}

export interface IntegrationPanelModel {
  healthLabel: string
  healthDetail: string
  operationLabel: string | null
  operationDetail: string | null
  receiptId: string | null
  authorizationCopy: string
  showSuccess: boolean
}

export function buildIntegrationPanelModel(
  input: IntegrationPanelInput
): IntegrationPanelModel {
  const authorization = input.response?.authorization_state
  const executionAuthorized = authorization?.execution_authorized

  return {
    healthLabel: input.health.label,
    healthDetail: input.health.detail,
    operationLabel: input.operation?.label ?? null,
    operationDetail: input.operation?.detail ?? null,
    receiptId: input.response?.receipt_id ?? null,
    authorizationCopy:
      executionAuthorized === true
        ? 'Execution authority: reported by backend'
        : executionAuthorized === false
          ? 'Execution authority: not granted'
          : 'Execution authority: not reported',
    showSuccess: input.operation?.state === 'success',
  }
}
