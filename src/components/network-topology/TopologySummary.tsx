import type { TopologyVisibilitySummary } from '../../types/networkTopology'

export function TopologySummary({ summary }: { summary: TopologyVisibilitySummary }) {
  const cards = [
    { label: 'Network transparency', value: `${summary.score}%`, detail: `${summary.observedFacts}/${summary.possibleFacts} observable facts` },
    { label: 'Trusted validators', value: summary.totalValidators.toString(), detail: 'Current live dataset' },
    { label: 'Publicly attributable', value: summary.attributableOperators.toString(), detail: 'Domain/operator present' },
    { label: 'Opaque / unknown endpoint', value: summary.opaqueEndpoints.toString(), detail: 'Not evidence of hidden ownership' },
  ]

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-cyber-border/60 bg-cyber-darker/70 p-4">
            <p className="text-[10px] font-cyber uppercase tracking-[0.16em] text-cyber-muted">{card.label}</p>
            <p className="mt-2 text-3xl font-cyber text-cyber-glow">{card.value}</p>
            <p className="mt-1 text-xs text-cyber-muted">{card.detail}</p>
          </div>
        ))}
      </div>
      <details className="mt-2 rounded-xl border border-cyber-border/40 bg-cyber-darker/40 px-3 py-2 text-[11px] text-cyber-muted">
        <summary className="cursor-pointer select-none text-cyber-text">How the visibility score is calculated</summary>
        <p className="mt-2 leading-relaxed">
          Each validator can contribute one point for known operator/domain attribution, known UNL state, available agreement data, and a known endpoint-visibility state. Unknown fields lower observability only; this is not a decentralization, trust, or misconduct score.
        </p>
      </details>
    </div>
  )
}
