import { BoundaryNotice } from '../../components/compliance/BoundaryNotice';
import { MOCK_DATA_LABEL, type SimulationEnvelope } from '../../types/operating';

const MOCK: SimulationEnvelope = {
  id: 'sim-placeholder',
  actionKind: 'path_preview',
  summary: 'Example: hypothetical payment or offer flow — no submission',
  parameters: { note: 'No chain execution from this screen' },
  validUntil: new Date(Date.now() + 3_600_000).toISOString(),
  warnings: ['This is a structural example only. Live preview requires a connected flow and your wallet.'],
  policyResult: { featureId: 'decision_simulation_dex', state: 'simulation_only', ctaEnabled: true, reason: 'Preview only' },
};

/**
 * Reusable “simulation” surface for DEX, routes, or ledger-impacts.
 * Real wiring: feed buildSimulationEnvelope() from your domain when ready; never submit from here.
 */
export function SimulationPlaceholderPanel() {
  return (
    <div className="max-w-2xl rounded-xl border border-cyber-cyan/30 bg-cyber-cyan/5 p-4 space-y-3">
      <p className="text-[9px] font-cyber uppercase tracking-widest text-cyber-cyan/80">Simulation envelope — {MOCK_DATA_LABEL}</p>
      <dl className="text-xs font-cyber text-cyber-text space-y-1">
        <div className="flex flex-wrap gap-2">
          <dt className="text-cyber-muted w-32 shrink-0">Action</dt>
          <dd className="text-cyber-text">{MOCK.actionKind}</dd>
        </div>
        <div>
          <dt className="text-cyber-muted w-32 shrink-0">Summary</dt>
          <dd className="text-cyber-muted">{MOCK.summary}</dd>
        </div>
        <div>
          <dt className="text-cyber-muted">Valid until (ISO)</dt>
          <dd className="font-mono text-[10px]">{MOCK.validUntil}</dd>
        </div>
      </dl>
      {MOCK.warnings.map((w) => (
        <p key={w} className="text-[10px] text-cyber-yellow font-cyber">⚠ {w}</p>
      ))}
      <BoundaryNotice variant="simulation" />
    </div>
  );
}
