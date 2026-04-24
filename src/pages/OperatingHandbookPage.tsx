import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ProvenanceBadge } from '../components/provenance/ProvenanceBadge';
import { modeLabels, useOperatingMode } from '../systems/modes/modeStore';
import { resolvePolicy, getBuildPolicyContext } from '../systems/policy';
import type { PolicyFeatureId } from '../systems/policy/types';
import { allFeatureDefaults } from '../config/operatingPolicy';
import { SimulationPlaceholderPanel } from '../systems/decide/SimulationPlaceholderPanel';
import { NonExecutingAgentShell } from '../systems/agents/NonExecutingAgentShell';
import { BoundaryNotice } from '../components/compliance/BoundaryNotice';

function scrollToHash(hash: string) {
  if (!hash || hash.length < 2) return;
  const id = hash.slice(1);
  const el = document.getElementById(id);
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function OperatingHandbookPage() {
  const { hash } = useLocation();
  const { mode, setMode, isOperator, isPro } = useOperatingMode();
  const ctx = getBuildPolicyContext();

  useEffect(() => {
    scrollToHash(hash);
  }, [hash]);

  return (
    <div className="min-h-screen px-4 lg:px-8 py-6 max-w-4xl mx-auto space-y-8 pb-16">
      <header>
        <p className="text-[9px] font-cyber uppercase tracking-widest text-cyber-glow/80">System</p>
        <h1 className="text-2xl font-cyber text-cyber-text">Operating model & provenance</h1>
        <p className="text-sm text-cyber-muted font-cyber mt-1">
          This page documents how the app is structured. It is not a legal opinion or a guarantee of any regulatory
          status.
        </p>
        <p className="text-[9px] text-cyber-muted/80 font-cyber mt-2">
          <ProvenanceBadge
            subject={{ contentKind: 'claim', provenance: { sourceKind: 'static', label: 'in-app copy v1' } }}
          />
        </p>
      </header>

      <section className="rounded-xl border border-cyber-border/50 bg-cyber-panel/30 p-4 space-y-2">
        <h2 className="text-sm font-cyber text-cyber-glow">Layer model (observe → act)</h2>
        <ul className="text-sm text-cyber-muted list-disc pl-5 space-y-1">
          <li>Observe: streams, health, public metrics — source-attributable</li>
          <li>Interpret: summaries, heuristics, agents — not execution</li>
          <li>Decide: simulations, route previews, policy check — your constraints</li>
          <li>Act: your wallet, explicit approval (no background signing in this app)</li>
        </ul>
        <ProvenanceBadge
          subject={{ contentKind: 'claim', provenance: { sourceKind: 'static', label: 'in-app product definition' } }}
        />
      </section>

      <section id="modes" className="space-y-3">
        <h2 className="text-sm font-cyber text-cyber-cyan">UI modes (presentation only)</h2>
        <p className="text-sm text-cyber-muted">Switch density with the left sidebar. Does not change chain behavior.</p>
        <div className="flex flex-wrap gap-2">
          {(['SIMPLE', 'PRO', 'OPERATOR'] as const).map((m) => (
            <button
              type="button"
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 text-xs font-cyber rounded border ${
                mode === m ? 'border-cyber-glow text-cyber-glow' : 'border-cyber-border text-cyber-muted'
              }`}
            >
              {modeLabels[m].title} — {modeLabels[m].blurb}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-cyber-muted">Current: {mode} {isPro() && '(pro metrics)'} {isOperator() && '(provenance on)'}</p>
      </section>

      <section id="boundaries" className="space-y-2">
        <h2 className="text-sm font-cyber text-cyber-yellow">Product boundaries</h2>
        <div className="space-y-2 max-w-2xl">
          <BoundaryNotice variant="action" />
          <BoundaryNotice variant="interpretation" />
          <BoundaryNotice variant="simulation" />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-cyber text-cyber-text">Policy table (scaffold)</h2>
        <p className="text-xs text-cyber-muted">Default decisions per feature id — central engine; extend with env/region later.</p>
        {isOperator() && (
          <ul className="text-[10px] font-mono text-cyber-muted/90 space-y-0.5 border border-cyber-border/30 rounded p-2 max-h-48 overflow-y-auto">
            {Object.entries(allFeatureDefaults()).map(([k, d]) => (
              <li key={k} className="break-all">
                {k} → {resolvePolicy(k as PolicyFeatureId, ctx).state} · {d.reason || '—'}
              </li>
            ))}
          </ul>
        )}
        {isPro() && !isOperator() && <p className="text-xs text-cyber-muted">Switch to Operator to view policy rows.</p>}
        {!isPro() && <p className="text-xs text-cyber-muted">Switch to Pro/Operator to view the policy list.</p>}
      </section>

      <section className="space-y-3" id="sim">
        <h2 className="text-sm font-cyber">Simulation — placeholder (decide layer)</h2>
        <SimulationPlaceholderPanel />
      </section>

      <section>
        <h2 className="text-sm font-cyber">Agents (non-executing)</h2>
        <NonExecutingAgentShell />
      </section>

      <p className="text-[10px] text-cyber-muted font-cyber">
        <Link to="/" className="text-cyber-cyan hover:underline">
          ← Profile
        </Link>
        <span className="mx-2">·</span>
        <Link to="/system/flags" className="text-cyber-cyan hover:underline">
          Policy &amp; feature flags
        </Link>
      </p>
    </div>
  );
}
