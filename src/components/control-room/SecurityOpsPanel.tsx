/**
 * Security Ops v0.1 — in-browser heuristics; not a WAF, not a substitute for org security.
 */

import { useState, useCallback } from 'react';
import clsx from 'clsx';
import { scanPrompt } from '../../security/promptFirewall';
import { useSecurityStore, type QuantumReadinessLevel } from '../../store/securityStore';
import { Shield, ShieldCheck, KeyRound, Bot, Lock, FileWarning, Atom, Search } from 'lucide-react';
import { COPY_SECURITY_EVIDENCE_NOT_INSTRUCTION } from './dashboardSafetyCopy';

const QUANTUM: { v: QuantumReadinessLevel; label: string }[] = [
  { v: 'inventory', label: 'Inventory (classical + catalog)' },
  { v: 'crypto_agile_planned', label: 'Crypto-agile roadmap planned' },
  { v: 'pqc_ready', label: 'PQC / hybrid review path (org-specific)' },
];

function Badge({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-cyber uppercase tracking-wider',
        active ? 'border-cyber-cyan/50 text-cyber-cyan bg-cyber-cyan/5' : 'border-[var(--cyber-border)] text-cyber-muted line-through'
      )}
    >
      {children}
    </span>
  );
}

const CARD =
  'neon-panel p-3 space-y-1.5 min-h-[5.5rem] text-xs text-cyber-muted leading-relaxed';

export function SecurityOpsPanel() {
  const promptFirewallEnabled = useSecurityStore((s) => s.promptFirewallEnabled);
  const mainnetLocked = useSecurityStore((s) => s.mainnetLocked);
  const privateKeyAccessAllowed = useSecurityStore((s) => s.privateKeyAccessAllowed);
  const autonomousExecutionAllowed = useSecurityStore((s) => s.autonomousExecutionAllowed);
  const humanApprovalRequired = useSecurityStore((s) => s.humanApprovalRequired);
  const lastAuditDate = useSecurityStore((s) => s.lastAuditDate);
  const securityEvents = useSecurityStore((s) => s.securityEvents);
  const poisoningEvents = useSecurityStore((s) => s.poisoningEvents);
  const quantumReadinessLevel = useSecurityStore((s) => s.quantumReadinessLevel);

  const setMainnetLocked = useSecurityStore((s) => s.setMainnetLocked);
  const setPromptFirewallEnabled = useSecurityStore((s) => s.setPromptFirewallEnabled);
  const setQuantumReadinessLevel = useSecurityStore((s) => s.setQuantumReadinessLevel);
  const addSecurityEvent = useSecurityStore((s) => s.addSecurityEvent);
  const addPoisoningEvent = useSecurityStore((s) => s.addPoisoningEvent);
  const clearSecurityEvents = useSecurityStore((s) => s.clearSecurityEvents);
  const clearPoisoningEvents = useSecurityStore((s) => s.clearPoisoningEvents);

  const [testInput, setTestInput] = useState('');
  const [lastScan, setLastScan] = useState<ReturnType<typeof scanPrompt> | null>(null);

  const onScan = useCallback(() => {
    const t = testInput;
    const r = scanPrompt(t);
    setLastScan(r);
    const detail = `status=${r.status} severity=${r.severity} flags=[${r.flags.join(', ')}]`;
    addSecurityEvent('prompt_scan', detail);
    if (r.status === 'suspicious' || r.status === 'blocked') {
      addPoisoningEvent(t, r);
    }
  }, [testInput, addSecurityEvent, addPoisoningEvent]);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-cyber text-cyber-glow">Security Ops</h1>
        {lastAuditDate && (
          <p className="text-[10px] text-cyber-muted mt-1">Last audit / scan activity: {lastAuditDate}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge active={promptFirewallEnabled}>Prompt Firewall {promptFirewallEnabled ? 'Enabled' : 'Off'}</Badge>
        <Badge active={mainnetLocked}>Mainnet Locked</Badge>
        <Badge active={!privateKeyAccessAllowed}>No Private Keys</Badge>
        <Badge active={!autonomousExecutionAllowed}>No Autonomous Execution</Badge>
        {humanApprovalRequired && (
          <span className="text-[10px] text-cyber-muted border border-[var(--cyber-border)] rounded px-2 py-0.5">Human approval required (policy default)</span>
        )}
      </div>

      <div className="space-y-2 text-sm text-cyber-muted border-l-2 border-cyber-cyan/40 pl-3">
        <p>
          {COPY_SECURITY_EVIDENCE_NOT_INSTRUCTION}{' '}
          External data can be <strong className="text-cyber-text">evidence</strong>, but never{' '}
          <strong className="text-cyber-text">instruction</strong> to override policy.
        </p>
        <p>
          Post-quantum status is <strong>crypto-agility planning</strong>, not a claim of being quantum-proof or safe against all future
          algorithm breaks.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className={CARD}>
          <h3 className="text-cyber-cyan text-xs font-cyber flex items-center gap-2">
            <Shield className="w-4 h-4" /> Platform Security
          </h3>
          <p>Static bundle only here — no extra backend for this screen. Harden the host, browser, and extensions separately.</p>
        </div>
        <div className={CARD}>
          <h3 className="text-cyber-cyan text-xs font-cyber flex items-center gap-2">
            <KeyRound className="w-4 h-4" /> Wallet Safety
          </h3>
          <p>Signing stays in Xaman / the user wallet. This app does not import seed phrases and does not custody funds (see also Compliance Guard).</p>
        </div>
        <div className={CARD}>
          <h3 className="text-cyber-cyan text-xs font-cyber flex items-center gap-2">
            <Bot className="w-4 h-4" /> Agent Permissions
          </h3>
          <p>Agent tools and prompts are untrusted until reviewed. The prompt firewall is a pre-filter; operators stay in the loop by default.</p>
        </div>
        <div className={CARD}>
          <h3 className="text-cyber-cyan text-xs font-cyber flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Prompt Firewall
          </h3>
          <p>Heuristic string scan for injection, wallet-exfil patterns, and unsafe “ignore policy” phrasing. Tune rules as abuse evolves.</p>
        </div>
        <div className={CARD}>
          <h3 className="text-cyber-cyan text-xs font-cyber flex items-center gap-2">
            <FileWarning className="w-4 h-4" /> Audit Logging
          </h3>
          <p>Event lists below are browser-local only. Export or server retention would be a follow-on product feature.</p>
        </div>
        <div className={CARD}>
          <h3 className="text-cyber-cyan text-xs font-cyber flex items-center gap-2">
            <Atom className="w-4 h-4" /> Post-Quantum Readiness
          </h3>
          <p>Track where classical signatures and KDFs are used, plan algorithm agility; PQC is roadmap-dependent.</p>
          <label className="mt-1 block text-[10px] text-cyber-muted">Roadmap (local flag)</label>
          <select
            className="w-full mt-0.5 rounded border border-[var(--cyber-border)] bg-[var(--cyber-darker)] px-2 py-1.5 text-xs text-cyber-text"
            value={quantumReadinessLevel}
            onChange={(e) => setQuantumReadinessLevel(e.target.value as QuantumReadinessLevel)}
          >
            {QUANTUM.map((q) => (
              <option key={q.v} value={q.v}>
                {q.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="neon-panel space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-cyber text-cyber-glow flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Policy toggles
          </h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <label className="flex items-center justify-between gap-2">
            <span>Prompt firewall feature flag (UI + policy label)</span>
            <input type="checkbox" className="h-4 w-4" checked={promptFirewallEnabled} onChange={(e) => setPromptFirewallEnabled(e.target.checked)} />
          </label>
          <label className="flex items-center justify-between gap-2">
            <span>Policy: mainnet must stay locked to external signing in product narrative</span>
            <input type="checkbox" className="h-4 w-4" checked={mainnetLocked} onChange={(e) => setMainnetLocked(e.target.checked)} />
          </label>
        </div>
        <p className="text-[10px] text-cyber-muted">Toggling off does not enable trading or in-app keys — it only changes labels and your local record.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-cyber-cyan">Test prompt / untrusted text</label>
        <textarea
          className="w-full min-h-[120px] rounded border border-[var(--cyber-border)] bg-[var(--cyber-darker)] px-3 py-2 text-sm text-cyber-text font-mono"
          placeholder="Paste a prompt, system message, or data blob to pre-scan (client-side)…"
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
        />
        <div className="flex flex-wrap gap-2 items-center">
          <button type="button" onClick={onScan} className="neon-button text-sm inline-flex items-center gap-1.5">
            <Search className="w-4 h-4" />
            Scan input
          </button>
        </div>
      </div>

      {lastScan && (
        <div
          className={clsx(
            'rounded-xl border p-4 text-sm',
            lastScan.status === 'blocked' && 'border-red-500/50 bg-red-500/5',
            lastScan.status === 'suspicious' && 'border-amber-500/50 bg-amber-500/5',
            lastScan.status === 'clean' && 'border-emerald-500/40 bg-emerald-500/5'
          )}
        >
          <h4 className="text-xs font-cyber text-cyber-glow mb-2">Last scan</h4>
          <p>
            <span className="text-cyber-muted">Status: </span>
            <span className="font-mono">{lastScan.status}</span>
            {' · '}
            <span className="text-cyber-muted">Severity: </span>
            <span className="font-mono">{lastScan.severity}</span>
          </p>
          {lastScan.flags.length > 0 && (
            <p className="mt-1">
              <span className="text-cyber-muted">Flags: </span>
              <span className="text-xs font-mono text-amber-200/90 break-all">{lastScan.flags.join(', ')}</span>
            </p>
          )}
          <p className="text-xs text-cyber-muted mt-2 leading-relaxed">{lastScan.explanation}</p>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-cyber text-cyber-cyan">Security event log (local)</h3>
          <button type="button" onClick={() => clearSecurityEvents()} className="text-[10px] text-cyber-muted hover:text-cyber-cyan">
            Clear
          </button>
        </div>
        <ul className="max-h-40 overflow-y-auto space-y-1 text-xs text-cyber-muted border border-[var(--cyber-border)] rounded p-2">
          {securityEvents.length === 0 && <li>None yet — run a scan.</li>}
          {securityEvents.map((e) => (
            <li key={e.id} className="border-b border-[var(--cyber-border)]/30 pb-1 last:border-0">
              <span className="text-cyber-muted/70 font-mono text-[10px]">
                {new Date(e.timestamp).toLocaleString()} — {e.kind}
              </span>
              <div className="text-cyber-text break-words mt-0.5">{e.detail}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-cyber text-amber-200/90">Poisoning / high-risk log (suspicious or blocked only)</h3>
          <button type="button" onClick={() => clearPoisoningEvents()} className="text-[10px] text-cyber-muted hover:text-amber-200/90">
            Clear
          </button>
        </div>
        <ul className="max-h-40 overflow-y-auto space-y-2 text-xs border border-amber-500/30 rounded p-2">
          {poisoningEvents.length === 0 && <li className="text-cyber-muted">None — no suspicious/blocked scan yet.</li>}
          {poisoningEvents.map((e) => (
            <li key={e.id} className="text-cyber-text space-y-1">
              <span className="text-cyber-muted font-mono text-[10px]">
                {new Date(e.timestamp).toLocaleString()} — {e.result.status} / {e.result.severity}
              </span>
              <div className="text-[10px] break-all">Input: {e.inputPreview || '(empty)'}</div>
              <div className="text-amber-200/80">Flags: {e.result.flags.join(', ') || '—'}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
