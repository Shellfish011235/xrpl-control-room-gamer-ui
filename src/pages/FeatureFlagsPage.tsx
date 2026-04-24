import { Link } from 'react-router-dom';
import { getBuildPolicyContext, resolvePolicy } from '../systems/policy';
import type { PolicyFeatureId } from '../systems/policy/types';
import { allFeatureDefaults } from '../config/operatingPolicy';
import { BoundaryNotice } from '../components/compliance/BoundaryNotice';
import { useOperatingMode } from '../systems/modes/modeStore';

const envKeys: { key: string; label: string }[] = [
  { key: 'MODE', label: 'Vite mode' },
  { key: 'VITE_REGION_HINT', label: 'Region hint' },
  { key: 'DEV', label: 'Dev' },
];

/**
 * Public build metadata + resolved policy. No server secrets. Operator-oriented.
 */
export default function FeatureFlagsPage() {
  const { isPro, isOperator } = useOperatingMode();
  const ctx = getBuildPolicyContext();

  return (
    <div className="min-h-screen px-4 lg:px-8 py-6 max-w-3xl mx-auto space-y-6">
      <header>
        <p className="text-[9px] font-cyber text-cyber-glow/80">System</p>
        <h1 className="text-2xl font-cyber text-cyber-text">Feature &amp; build surface</h1>
        <p className="text-sm text-cyber-muted">Non-secret environment labels and the central policy view.</p>
      </header>

      <BoundaryNotice variant="compact" />

      {isPro() && (
        <div className="rounded-lg border border-cyber-border/50 p-3">
          <h2 className="text-xs font-cyber text-cyber-cyan mb-2">Build</h2>
          <dl className="text-xs font-cyber text-cyber-muted space-y-1">
            {envKeys.map(({ key, label }) => (
              <div key={key} className="flex justify-between gap-2">
                <dt className="text-cyber-muted/80">{label}</dt>
                <dd className="font-mono text-[10px] text-cyber-text/90 break-all text-right max-w-[60%]">
                  {String((import.meta.env as Record<string, string>)[key] ?? '—')}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {isPro() && (
        <div className="rounded-lg border border-cyber-border/50 p-3 overflow-x-auto">
          <h2 className="text-xs font-cyber text-cyber-cyan mb-2">Resolved policy</h2>
          <table className="w-full text-left text-[10px] font-cyber">
            <thead>
              <tr className="text-cyber-muted border-b border-cyber-border/40">
                <th className="py-1 pr-2">Feature</th>
                <th className="py-1 pr-2">State</th>
                <th className="py-1">Note</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(allFeatureDefaults()).map(([k]) => {
                const r = resolvePolicy(k as PolicyFeatureId, ctx);
                return (
                  <tr key={k} className="border-b border-cyber-border/20">
                    <td className="py-1 pr-2 font-mono break-all text-cyber-text/90">{k}</td>
                    <td className="py-1 pr-2 text-cyber-cyan">{r.state}</td>
                    <td className="py-1 text-cyber-muted/90">{r.reason || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!isPro() && <p className="text-sm text-cyber-muted">Switch to Pro to view build and policy table.</p>}

      {isOperator() && (
        <p className="text-[9px] font-cyber text-cyber-muted/70">
          Operator mode: prefer reviewing provenance in panels, policy rows above, and raw build keys before relying on
          a single number.
        </p>
      )}

      <p className="text-sm font-cyber">
        <Link to="/system" className="text-cyber-cyan hover:underline">
          ← Operating handbook
        </Link>
      </p>
    </div>
  );
}
