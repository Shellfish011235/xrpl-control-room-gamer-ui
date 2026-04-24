/**
 * Task Receipts (v0.1) — local log only. No XRPL memos, no automatic transaction submission.
 */

import { useMemo } from 'react';
import { useTaskReceiptStore } from '../../store/taskReceiptStore';
import { getCompliancePermissionSet } from '../../compliance/jurisdictionRules';
import { useComplianceStore } from '../../store/complianceStore';
import { useSecurityStore } from '../../store/securityStore';
import {
  createTaskReceipt,
  getAllowedActionsFromPermissionSet,
  getBlockedActionsFromPermissionSet,
} from '../../receipts/taskReceiptEngine';
import { FileCheck, Link2, Shield } from 'lucide-react';
import { COPY_TASK_RECEIPTS_LOCAL } from './dashboardSafetyCopy';

function buildSampleReceiptInput() {
  const p = useComplianceStore.getState().profile;
  const perm = getCompliancePermissionSet(p);
  const sec = useSecurityStore.getState();
  return {
    source: 'manual' as const,
    title: 'Sample task receipt (v0.1)',
    summary:
      'Demonstration entry: records policy and security snapshot at create time. No on-chain or memo write; execution remains disabled in policy defaults.',
    mode: 'read_only' as const,
    moduleId: 'task_receipts_panel',
    jurisdiction: {
      country: p.country,
      region: p.region,
      userType: p.userType,
      intendedUse: p.intendedUse,
      botMode: p.botMode,
    },
    compliance: {
      riskLevel: perm.riskLevel,
      requiresHumanApproval: perm.requiresHumanApproval,
      requiresLegalReview: perm.requiresLegalReview,
      allowedActions: getAllowedActionsFromPermissionSet(perm),
      blockedActions: getBlockedActionsFromPermissionSet(perm),
    },
    security: {
      promptScanStatus: undefined,
      promptScanSeverity: undefined,
      poisoningFlags: [],
      mainnetLocked: sec.mainnetLocked,
      privateKeyAccessAllowed: sec.privateKeyAccessAllowed,
      autonomousExecutionAllowed: sec.autonomousExecutionAllowed,
      humanApprovalRequired: sec.humanApprovalRequired,
    },
    execution: { executionEnabled: false, mainnetExecution: false, transactionSubmitted: false, custody: false, privateKeyAccess: false },
  };
}

export function TaskReceiptsPanel() {
  const receipts = useTaskReceiptStore((s) => s.receipts);
  const selectedReceiptId = useTaskReceiptStore((s) => s.selectedReceiptId);
  const addReceipt = useTaskReceiptStore((s) => s.addReceipt);
  const clearReceipts = useTaskReceiptStore((s) => s.clearReceipts);
  const selectReceipt = useTaskReceiptStore((s) => s.selectReceipt);

  const selected = useMemo(
    () => (selectedReceiptId ? (receipts.find((r) => r.id === selectedReceiptId) ?? null) : null),
    [receipts, selectedReceiptId]
  );

  const onSample = () => {
    const tr = createTaskReceipt(buildSampleReceiptInput());
    addReceipt(tr);
    selectReceipt(tr.id);
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-cyber text-cyber-glow">Task Receipts</h1>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="inline-flex items-center gap-1 rounded border border-cyber-cyan/40 bg-cyber-cyan/10 px-2 py-0.5 text-[10px] font-cyber uppercase text-cyber-cyan">
            <FileCheck className="w-3.5 h-3.5" />
            Local-only v0.1
          </span>
          <span className="inline-flex items-center gap-1 rounded border border-amber-500/50 px-2 py-0.5 text-[10px] font-cyber uppercase text-amber-200/90">
            No XRPL memo writes yet
          </span>
          <span className="inline-flex items-center gap-1 rounded border border-emerald-500/40 px-2 py-0.5 text-[10px] font-cyber uppercase text-emerald-200/80">
            Execution disabled by default
          </span>
        </div>
        <p className="text-sm text-cyber-muted mt-3 max-w-3xl leading-relaxed">{COPY_TASK_RECEIPTS_LOCAL}</p>
        <p className="text-xs text-cyber-muted mt-2 max-w-3xl leading-relaxed">
          Receipts record what a module did in policy terms and which compliance/security snapshot applied. They are for
          operator review, not for proving an on-ledger event.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onSample} className="neon-button text-sm">
          Create sample receipt
        </button>
        <button
          type="button"
          onClick={() => {
            clearReceipts();
          }}
          className="text-sm text-cyber-muted border border-[var(--cyber-border)] rounded-lg px-3 py-1.5 hover:text-cyber-cyan"
        >
          Clear receipts
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-2">
          <h2 className="text-xs font-cyber text-cyber-cyan">Receipts</h2>
          <div className="border border-[var(--cyber-border)] rounded-lg overflow-hidden max-h-72 overflow-y-auto text-xs">
            {receipts.length === 0 && <p className="p-3 text-cyber-muted">No entries yet — create a sample or run the Private Quant Lab (links a task receipt if enabled).</p>}
            {receipts.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => selectReceipt(r.id)}
                className={
                  (selectedReceiptId === r.id
                    ? 'bg-cyber-cyan/10 border-l-2 border-l-cyber-cyan '
                    : 'border-l-2 border-l-transparent hover:bg-white/[0.04] ') + 'w-full text-left p-2 border-b border-[var(--cyber-border)]/50'
                }
              >
                <p className="text-[10px] text-cyber-muted font-mono">{new Date(r.timestamp).toLocaleString()}</p>
                <p className="text-cyber-glow font-cyber line-clamp-1">{r.title}</p>
                <p className="text-cyber-muted line-clamp-1">
                  {r.source} · {r.mode} · {r.status} · {r.compliance.riskLevel}
                </p>
                <p className="text-[10px] font-mono text-cyber-cyan/80 mt-0.5 truncate" title="Local display fingerprint only — not an on-ledger or HSM attestation.">
                  hash: {r.hashes.receiptHash}
                </p>
              </button>
            ))}
          </div>
        </div>
        <div className="lg:col-span-3 space-y-2">
          <h2 className="text-xs font-cyber text-cyber-cyan">Selected receipt</h2>
          {!selected && <p className="text-cyber-muted text-sm">Select a row to inspect compliance, security, and execution.</p>}
          {selected && (
            <div className="space-y-3 text-xs text-cyber-text border border-[var(--cyber-border)] rounded-lg p-3">
              <p className="text-sm text-cyber-glow font-cyber">{selected.title}</p>
              <p className="text-cyber-muted leading-relaxed">{selected.summary}</p>
              <div className="grid sm:grid-cols-2 gap-2 text-[11px]">
                <p>
                  <span className="text-cyber-muted">Jurisdiction: </span>
                  {selected.jurisdiction.country} / {selected.jurisdiction.region}
                </p>
                <p>
                  <span className="text-cyber-muted">Use: </span>
                  {selected.jurisdiction.intendedUse} · {selected.jurisdiction.botMode}
                </p>
              </div>
              <div className="space-y-1 p-2 rounded bg-[var(--cyber-darker)]/50">
                <p className="text-cyber-cyan flex items-center gap-1 font-cyber">
                  <Link2 className="w-3.5 h-3.5" />
                  Compliance
                </p>
                <p>Risk: {selected.compliance.riskLevel} · human approval: {String(selected.compliance.requiresHumanApproval)} · legal
                  review: {String(selected.compliance.requiresLegalReview)}</p>
                <p className="text-cyber-muted">Allowed: {selected.compliance.allowedActions.join(', ') || '—'}</p>
                <p className="text-cyber-muted">Blocked: {selected.compliance.blockedActions.join(', ') || '—'}</p>
              </div>
              <div className="space-y-1 p-2 rounded bg-[var(--cyber-darker)]/50">
                <p className="text-cyber-cyan flex items-center gap-1 font-cyber">
                  <Shield className="w-3.5 h-3.5" />
                  Security
                </p>
                <p>
                  mainnet lock: {String(selected.security.mainnetLocked)} · PK access: {String(selected.security.privateKeyAccessAllowed)}
                  · autonomous: {String(selected.security.autonomousExecutionAllowed)} · human approval:{' '}
                  {String(selected.security.humanApprovalRequired)}
                </p>
                {selected.security.promptScanStatus && (
                  <p>
                    prompt scan: {selected.security.promptScanStatus} / {selected.security.promptScanSeverity ?? '—'}
                  </p>
                )}
                {selected.security.poisoningFlags.length > 0 && <p>flags: {selected.security.poisoningFlags.join(', ')}</p>}
              </div>
              <div
                className="p-2 rounded border border-amber-500/30 space-y-1"
                title="Policy snapshot fields. v0.1: remain false in normal use — this app does not auto-submit transactions."
              >
                <p className="text-amber-200/90 font-cyber">Execution (policy field)</p>
                <p className="text-[10px] text-cyber-muted">
                  v0.1 default: all off — no in-app transaction submission; signing stays in your wallet when used elsewhere.
                </p>
                <p>executionEnabled: {String(selected.execution.executionEnabled)}</p>
                <p>mainnetExecution: {String(selected.execution.mainnetExecution)}</p>
                <p>custody: {String(selected.execution.custody)}</p>
                <p>privateKeyAccess: {String(selected.execution.privateKeyAccess)}</p>
                <p>transactionSubmitted: {String(selected.execution.transactionSubmitted)}</p>
              </div>
              <div className="text-[10px] font-mono text-cyber-muted space-y-0.5 break-all">
                <p>inputHash: {selected.hashes.inputHash}</p>
                <p>outputHash: {selected.hashes.outputHash}</p>
                <p>policyHash: {selected.hashes.policyHash}</p>
                <p>receiptHash: {selected.hashes.receiptHash}</p>
              </div>
              {selected.notes && selected.notes.length > 0 && (
                <ul className="list-disc pl-4 text-cyber-muted">
                  {selected.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
