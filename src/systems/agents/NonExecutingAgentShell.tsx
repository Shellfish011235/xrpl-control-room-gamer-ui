import { MOCK_DATA_LABEL, type AgentFinding } from '../../types/operating';
import { ProvenanceBadge } from '../../components/provenance/ProvenanceBadge';

const MOCK: AgentFinding[] = [
  {
    id: 'a1',
    agentId: 'validator_v1',
    agentRole: 'Validator health (non-executing)',
    title: 'Uptime and agreement band',
    observationSummary: 'Staked validators report expected participation (MOCK).',
    interpretation: 'Narrative summary of observed metrics — not a trading signal.',
    confidence: 0.4,
    uncertainty: 'Heuristic only; on-chain data may lag.',
    suggestedNextReview: 'Compare to official explorer / UNL sources.',
    nonExecuting: true,
    provenance: { sourceKind: 'derived', label: 'MOCK: representative layout' },
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Read-only “agent” deck — no signing, no routing, no order submission.
 * Replace MOCK with `AgentFinding` from your service when a backend is ready.
 */
export function NonExecutingAgentShell() {
  return (
    <div className="space-y-4 p-1">
      <p className="text-[9px] text-cyber-yellow font-cyber uppercase tracking-widest">Agent analysis — {MOCK_DATA_LABEL}</p>
      {MOCK.map((f) => (
        <article key={f.id} className="rounded-lg border border-cyber-border/50 bg-cyber-panel/40 p-3">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-cyber text-cyber-text">{f.title}</h3>
            <ProvenanceBadge
              subject={{ contentKind: 'claim', provenance: { ...f.provenance, confidence: f.confidence, schemaVersion: 'agf-0.1' } }}
            />
          </div>
          <p className="text-[10px] text-cyber-muted font-cyber">Role: {f.agentRole}</p>
          <p className="text-xs text-cyber-text/90 mt-2">Observed: {f.observationSummary}</p>
          <p className="text-xs text-cyber-muted mt-1">Interpreted: {f.interpretation}</p>
          <p className="text-[9px] text-cyber-muted font-cyber mt-2">Next: {f.suggestedNextReview}</p>
        </article>
      ))}
    </div>
  );
}
