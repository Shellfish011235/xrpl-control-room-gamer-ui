/**
 * Compliance Guard v0.1 — technical policy display only, not legal advice. No execution or keys.
 */

import { Check, X, Scale, AlertCircle } from 'lucide-react';
import { useComplianceStore } from '../../store/complianceStore';
import { COPY_COMPLIANCE_NOT_LEGAL } from './dashboardSafetyCopy';
import type { BotMode, IntendedUse, UserType } from '../../compliance/jurisdictionRules';

const USER_TYPES: { value: UserType; label: string }[] = [
  { value: 'individual', label: 'Individual' },
  { value: 'developer', label: 'Developer' },
  { value: 'business', label: 'Business' },
  { value: 'institution', label: 'Institution' },
];

const INTENDED: { value: IntendedUse; label: string }[] = [
  { value: 'education', label: 'Education' },
  { value: 'research', label: 'Research' },
  { value: 'wallet_monitoring', label: 'Wallet monitoring' },
  { value: 'payment_routing', label: 'Payment routing' },
  { value: 'trading', label: 'Trading' },
  { value: 'commercial_service', label: 'Commercial / service' },
];

const BOT_MODES: { value: BotMode; label: string }[] = [
  { value: 'read_only', label: 'Read-only' },
  { value: 'simulation', label: 'Simulation' },
  { value: 'user_approved_signing', label: 'User-approved signing (Xaman, etc.)' },
  { value: 'restricted_professional', label: 'Restricted / professional' },
];

function boolCell(allowed: boolean) {
  return (
    <span
      className={
        allowed
          ? 'inline-flex items-center gap-1 text-cyber-green'
          : 'inline-flex items-center gap-1 text-cyber-red/90'
      }
    >
      {allowed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
      {allowed ? 'Allowed' : 'Blocked'}
    </span>
  );
}

export function ComplianceGuardPanel() {
  const profile = useComplianceStore((s) => s.profile);
  const permissionSet = useComplianceStore((s) => s.permissionSet);
  const setCountry = useComplianceStore((s) => s.setCountry);
  const setRegion = useComplianceStore((s) => s.setRegion);
  const setUserType = useComplianceStore((s) => s.setUserType);
  const setIntendedUse = useComplianceStore((s) => s.setIntendedUse);
  const setBotMode = useComplianceStore((s) => s.setBotMode);
  const resetToFloridaDefault = useComplianceStore((s) => s.resetToFloridaDefault);

  const riskBorder =
    permissionSet.riskLevel === 'green'
      ? 'border-emerald-500/50 bg-emerald-500/5'
      : permissionSet.riskLevel === 'yellow'
        ? 'border-amber-500/50 bg-amber-500/5'
        : 'border-red-500/50 bg-red-500/5';

  return (
    <div className="max-w-4xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-cyber text-cyber-glow">Compliance Guard</h1>
        <span className="inline-flex items-center gap-1 rounded border border-cyber-cyan/40 bg-cyber-cyan/10 px-2 py-0.5 text-[10px] font-cyber uppercase tracking-wider text-cyber-cyan">
          <Scale className="w-3.5 h-3.5" />
          Florida / U.S. Safe Default
        </span>
        <p className="text-sm text-cyber-muted flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400/90 shrink-0 mt-0.5" />
          <span>{COPY_COMPLIANCE_NOT_LEGAL}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="neon-panel space-y-1 block">
          <span className="text-xs text-cyber-muted">Country</span>
          <input
            type="text"
            className="w-full rounded border border-[var(--cyber-border)] bg-[var(--cyber-darker)] px-2 py-2 text-sm text-cyber-text"
            value={profile.country}
            onChange={(e) => setCountry(e.target.value)}
            list="compliance-countries"
          />
          <datalist id="compliance-countries">
            <option value="United States" />
            <option value="Canada" />
            <option value="United Kingdom" />
            <option value="Germany" />
            <option value="Australia" />
          </datalist>
        </label>

        <label className="neon-panel space-y-1 block">
          <span className="text-xs text-cyber-muted">Region / state</span>
          <input
            type="text"
            className="w-full rounded border border-[var(--cyber-border)] bg-[var(--cyber-darker)] px-2 py-2 text-sm text-cyber-text"
            value={profile.region}
            onChange={(e) => setRegion(e.target.value)}
            list="compliance-states"
          />
          <datalist id="compliance-states">
            <option value="Florida" />
            <option value="California" />
            <option value="New York" />
            <option value="Texas" />
          </datalist>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="neon-panel space-y-1 block sm:col-span-1">
          <span className="text-xs text-cyber-muted">User type</span>
          <select
            className="w-full rounded border border-[var(--cyber-border)] bg-[var(--cyber-darker)] px-2 py-2 text-sm text-cyber-text"
            value={profile.userType}
            onChange={(e) => setUserType(e.target.value as UserType)}
          >
            {USER_TYPES.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </label>
        <label className="neon-panel space-y-1 block sm:col-span-2">
          <span className="text-xs text-cyber-muted">Intended use</span>
          <select
            className="w-full rounded border border-[var(--cyber-border)] bg-[var(--cyber-darker)] px-2 py-2 text-sm text-cyber-text"
            value={profile.intendedUse}
            onChange={(e) => setIntendedUse(e.target.value as IntendedUse)}
          >
            {INTENDED.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>
        </label>
        <label className="neon-panel space-y-1 block sm:col-span-3">
          <span className="text-xs text-cyber-muted">Bot mode (policy scope)</span>
          <select
            className="w-full rounded border border-[var(--cyber-border)] bg-[var(--cyber-darker)] px-2 py-2 text-sm text-cyber-text"
            value={profile.botMode}
            onChange={(e) => setBotMode(e.target.value as BotMode)}
          >
            {BOT_MODES.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={`rounded-xl border p-4 space-y-2 ${riskBorder}`}>
        <p className="text-xs font-cyber uppercase tracking-widest text-cyber-muted">Policy risk (derived)</p>
        <p className="text-lg font-mono text-cyber-glow">Risk level: {permissionSet.riskLevel.toUpperCase()}</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span
            className={
              permissionSet.requiresHumanApproval
                ? 'text-amber-200 border border-amber-500/40 rounded px-2 py-0.5'
                : 'text-cyber-muted'
            }
          >
            Human approval: {permissionSet.requiresHumanApproval ? 'required' : 'not required (read-only scope)'}
          </span>
          <span
            className={
              permissionSet.requiresLegalReview
                ? 'text-red-200/90 border border-red-500/40 rounded px-2 py-0.5'
                : 'text-cyber-muted'
            }
          >
            Legal / compliance review: {permissionSet.requiresLegalReview ? 'flagged' : 'not required by policy v0.1'}
          </span>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-cyber text-cyber-cyan mb-2">Permission matrix (v0.1)</h2>
        <div className="overflow-x-auto rounded border border-[var(--cyber-border)] text-xs">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-[var(--cyber-border)] bg-[var(--cyber-darker)]/80 text-left text-cyber-muted">
                <th className="p-2.5">Capability</th>
                <th className="p-2.5 w-32">State</th>
              </tr>
            </thead>
            <tbody className="text-cyber-text">
              {(
                [
                  ['Observe ledger', permissionSet.canReadLedger],
                  ['Analyze wallets', permissionSet.canAnalyzeWallets],
                  ['Generate reports', permissionSet.canGenerateReports],
                  ['Prepare transactions', permissionSet.canPrepareTransactions],
                  ['Request wallet signature', permissionSet.canRequestWalletSignature],
                  ['Broadcast transactions', permissionSet.canBroadcastTransactions],
                  ['Autonomous trading', permissionSet.canAutonomouslyTrade],
                  ['Custody funds', permissionSet.canCustodyFunds],
                  ['Store private keys', permissionSet.canStorePrivateKeys],
                  ['Route third-party payments', permissionSet.canRouteThirdPartyPayments],
                  ['Change destination address', permissionSet.canChangeDestinationAddress],
                ] as const
              ).map(([label, allowed]) => (
                <tr key={label} className="border-b border-[var(--cyber-border)]/50">
                  <td className="p-2.5">{label}</td>
                  <td className="p-2.5">{boolCell(!!allowed)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-cyber text-cyber-cyan">Warnings &amp; disclosures</h2>
        <ul className="list-disc pl-4 space-y-1.5 text-sm text-cyber-muted max-h-64 overflow-y-auto">
          {permissionSet.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </div>

      <div>
        <button type="button" onClick={() => resetToFloridaDefault()} className="neon-button text-sm">
          Reset to Florida / U.S. default
        </button>
        <p className="text-[10px] text-cyber-muted mt-2">
          Restores: United States, Florida, individual, education, read-only bot — conservative defaults.
        </p>
      </div>
    </div>
  );
}
