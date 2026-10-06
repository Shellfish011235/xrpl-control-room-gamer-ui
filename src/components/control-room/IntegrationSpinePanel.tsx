import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getShellfishHealth,
  getShellfishReceipt,
  requestShellfishQuote,
  submitShellfishJob,
  type GatewayResult,
  type ShellfishHealthResponse,
  type ShellfishIntegrationResponse,
} from '../../services/shellfishGateway'
import { toGatewayViewState } from '../../services/shellfishGatewayView'
import { buildIntegrationPanelModel } from './integrationSpinePresenter'

function makeCorrelationId(prefix: string): string {
  const suffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  return `${prefix}_${suffix}`
}

export function IntegrationSpinePanel() {
  const [objective, setObjective] = useState('Inspect an XRPL infrastructure capability route.')
  const [healthPending, setHealthPending] = useState(false)
  const [operationPending, setOperationPending] = useState(false)
  const [healthResult, setHealthResult] = useState<GatewayResult<ShellfishHealthResponse>>()
  const [operationResult, setOperationResult] = useState<GatewayResult<ShellfishIntegrationResponse>>()
  const [receiptResult, setReceiptResult] = useState<GatewayResult<ShellfishIntegrationResponse>>()

  const refreshHealth = useCallback(async () => {
    setHealthPending(true)
    const result = await getShellfishHealth()
    setHealthResult(result)
    setHealthPending(false)
  }, [])

  useEffect(() => {
    void refreshHealth()
  }, [refreshHealth])

  const healthView = useMemo(
    () => toGatewayViewState({ pending: healthPending, result: healthResult }),
    [healthPending, healthResult]
  )
  const operationView = useMemo(
    () =>
      operationPending || operationResult
        ? toGatewayViewState({ pending: operationPending, result: operationResult })
        : undefined,
    [operationPending, operationResult]
  )
  const response = operationResult?.ok ? operationResult.data : undefined
  const model = buildIntegrationPanelModel({ health: healthView, operation: operationView, response })

  const buildTask = useCallback(() => {
    const taskId = makeCorrelationId('TASK_UI')
    return {
      request_id: makeCorrelationId('REQ_UI'),
      task_id: taskId,
      job_id: makeCorrelationId('JOB_UI'),
      task_type: 'TARGETED_RESEARCH',
      objective: objective.trim(),
      capability_required: 'EXTERNAL_RESEARCH',
      max_cost_microunits: 0,
      max_latency_ms: 30_000,
      minimum_quality: 0.8,
      privacy: 'no-retention',
    }
  }, [objective])

  const runQuote = useCallback(async () => {
    if (!objective.trim()) return
    setOperationPending(true)
    setReceiptResult(undefined)
    const result = await requestShellfishQuote(buildTask())
    setOperationResult(result)
    setOperationPending(false)

    if (result.ok && result.data.receipt_id) {
      setReceiptResult(await getShellfishReceipt(result.data.receipt_id))
    }
  }, [buildTask, objective])

  const queueJob = useCallback(async () => {
    if (!objective.trim()) return
    setOperationPending(true)
    setReceiptResult(undefined)
    const result = await submitShellfishJob(buildTask())
    setOperationResult(result)
    setOperationPending(false)
  }, [buildTask, objective])

  return (
    <section className="neon-panel space-y-4" aria-label="Shellfish integration status">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-cyber uppercase tracking-wider text-cyber-muted">Local integration spine</p>
          <h2 className="font-cyber text-cyber-glow">Shellfish Gateway</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-cyber-muted">
            Control Room → Shellfish → Wave Router. This surface exposes existing local routing and queue state only;
            it does not grant signing, payment, custody, or autonomous execution authority.
          </p>
        </div>
        <button type="button" className="neon-button text-xs" onClick={() => void refreshHealth()}>
          Refresh health
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--cyber-border)] p-3">
          <p className="text-[10px] uppercase tracking-wider text-cyber-muted">Backend</p>
          <p className="mt-1 font-cyber text-cyber-cyan">{model.healthLabel}</p>
          <p className="mt-1 text-xs text-cyber-muted">{model.healthDetail}</p>
        </div>
        <div className="rounded-lg border border-[var(--cyber-border)] p-3">
          <p className="text-[10px] uppercase tracking-wider text-cyber-muted">Current operation</p>
          <p className="mt-1 font-cyber text-cyber-cyan">{model.operationLabel ?? 'Idle'}</p>
          <p className="mt-1 text-xs text-cyber-muted">
            {model.operationDetail ?? 'No quote or queue request has been submitted.'}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="integration-objective" className="text-xs font-cyber text-cyber-cyan">
          Generic objective
        </label>
        <textarea
          id="integration-objective"
          value={objective}
          onChange={(event) => setObjective(event.target.value)}
          className="min-h-20 w-full rounded-lg border border-[var(--cyber-border)] bg-[var(--cyber-darker)] p-3 text-sm text-cyber-text outline-none focus:border-cyber-cyan"
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="neon-button text-sm" disabled={operationPending} onClick={() => void runQuote()}>
            Request generic quote
          </button>
          <button
            type="button"
            className="rounded-lg border border-cyber-cyan/40 px-3 py-1.5 text-sm text-cyber-cyan hover:bg-cyber-cyan/10 disabled:opacity-50"
            disabled={operationPending}
            onClick={() => void queueJob()}
          >
            Queue generic job
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-amber-500/30 p-3 text-xs">
        <p className="font-cyber text-amber-200/90">Authority boundary</p>
        <p className="mt-1 text-cyber-muted">{model.authorizationCopy}</p>
        {model.receiptId && (
          <p className="mt-1 break-all font-mono text-cyber-cyan">receipt: {model.receiptId}</p>
        )}
      </div>

      {receiptResult?.ok && (
        <details className="rounded-lg border border-[var(--cyber-border)] p-3 text-xs">
          <summary className="cursor-pointer font-cyber text-cyber-cyan">Receipt details</summary>
          <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-all text-[10px] text-cyber-muted">
            {JSON.stringify(receiptResult.data, null, 2)}
          </pre>
        </details>
      )}
    </section>
  )
}
