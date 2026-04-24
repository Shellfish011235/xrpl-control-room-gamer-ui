/**
 * Mission Control v0.1 — organizing layer: thesis, status surface, non-executing safety.
 */

import { Bot, LineChart, Shield, FileCheck, ShieldAlert, Scale, Zap, Brain } from 'lucide-react';
import {
  COPY_PAPER_TRADING_LOCAL,
  COPY_PRIVATE_QUANT_SIMULATION_ONLY,
  COPY_TASK_RECEIPTS_LOCAL,
} from './dashboardSafetyCopy';

const STATUS = [
  { id: 'fleet', label: 'Agent Fleet', value: 'Ready', Icon: Bot },
  { id: 'quant', label: 'Private Quant Lab', value: 'Planned / Simulation Only', Icon: LineChart },
  { id: 'policy', label: 'Policy Firewall', value: 'Planned', Icon: Shield },
  { id: 'receipts', label: 'Task Receipts', value: 'Local receipt engine available', Icon: FileCheck },
  { id: 'sec', label: 'Security Ops', value: 'Prompt firewall available', Icon: ShieldAlert },
  { id: 'comp', label: 'Compliance Guard', value: 'Florida / U.S. default available', Icon: Scale },
  { id: 'pay', label: 'Payment Rails', value: 'ILP / Open Payments panel available', Icon: Zap },
  { id: 'ledger', label: 'Ledger Intel', value: 'Hidden analytics / intelligence available', Icon: Brain },
] as const;

const STRIP = [
  'No custody',
  'No private keys',
  'No seed phrases',
  'No autonomous mainnet execution',
  'Xaman / user wallet approval required for any future signing',
] as const;

export function MissionControlPanel() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-cyber text-cyber-glow tracking-tight">XRPL Mission Control</h1>
        <p className="text-sm sm:text-base text-cyber-muted max-w-3xl leading-relaxed">
          Private non-custodial AI-agent command layer for XRPL intelligence, payment rails, security, compliance, and
          quant simulation.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {STATUS.map(({ id, label, value, Icon }) => (
          <div
            key={id}
            className="rounded-xl border border-[var(--cyber-border)] bg-[var(--cyber-darker)]/60 p-4 flex gap-3"
          >
            <div className="shrink-0 w-10 h-10 rounded-lg bg-[var(--cyber-cyan)]/10 border border-cyber-cyan/30 flex items-center justify-center">
              <Icon className="w-5 h-5 text-cyber-cyan" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-cyber-muted uppercase tracking-wider">{label}</p>
              <p className="text-sm text-cyber-text mt-0.5 leading-snug">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-3">
        <p className="text-[10px] uppercase tracking-widest text-amber-200/80 mb-2">Safety</p>
        <ul className="grid sm:grid-cols-1 gap-1.5 text-xs text-cyber-text/90 list-disc pl-4">
          {STRIP.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <ul className="mt-3 space-y-1.5 text-[11px] text-cyber-muted border-t border-amber-500/20 pt-3 list-disc pl-4 leading-relaxed">
          <li>{COPY_PRIVATE_QUANT_SIMULATION_ONLY}</li>
          <li>{COPY_PAPER_TRADING_LOCAL}</li>
          <li>{COPY_TASK_RECEIPTS_LOCAL}</li>
        </ul>
      </div>
    </div>
  );
}
