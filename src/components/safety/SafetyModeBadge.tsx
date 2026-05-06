/**
 * HUD-style safety mode indicator — reads global Safety Kernel mode + network.
 */

import { useSettingsStore } from '../../store/settingsStore';
import { getSafetyModePolicy } from '../../safety/safetyPolicy';
import type { SafetyMode } from '../../safety/safetyTypes';
import { Shield } from 'lucide-react';

function modeAccent(mode: SafetyMode): string {
  switch (mode) {
    case 'disabled':
      return 'border-cyber-red/60 text-cyber-red bg-cyber-red/10';
    case 'read_only':
    case 'simulation_only':
      return 'border-cyber-cyan/50 text-cyber-cyan bg-cyber-cyan/10';
    case 'draft_intent':
      return 'border-cyber-yellow/50 text-cyber-yellow bg-cyber-yellow/10';
    case 'user_approved_signing':
      return 'border-amber-500/50 text-amber-300 bg-amber-500/10';
    case 'restricted_automation':
      return 'border-cyber-purple/50 text-cyber-purple bg-cyber-purple/10';
    default:
      return 'border-cyber-border text-cyber-muted';
  }
}

interface SafetyModeBadgeProps {
  /** Single-line compact row for PlatformModeBar */
  compact?: boolean;
}

export function SafetyModeBadge({ compact = false }: SafetyModeBadgeProps) {
  const safetyMode = useSettingsStore((s) => s.safetyMode);
  const network = useSettingsStore((s) => s.network);
  const policy = getSafetyModePolicy(safetyMode);
  const allowedN = policy.allowedCapabilities.length;

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 px-2 py-1 rounded-lg border text-[10px] font-cyber uppercase tracking-wider ${modeAccent(safetyMode)}`}
        title={policy.description}
      >
        <Shield className="w-3.5 h-3.5 shrink-0" aria-hidden />
        <span className="truncate max-w-[10rem]">{policy.label}</span>
        <span className="text-cyber-muted normal-case">·</span>
        <span className="text-cyber-muted normal-case">{network}</span>
        {network === 'mainnet' && (
          <span className="text-cyber-red normal-case font-cyber">MAINNET</span>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-2 space-y-1 ${modeAccent(safetyMode)}`}>
      <div className="flex items-center gap-2 text-[10px] font-cyber uppercase tracking-wider text-cyber-muted">
        <Shield className="w-4 h-4" aria-hidden />
        Safety mode
      </div>
      <p className="text-xs font-cyber text-cyber-text leading-tight">{policy.label}</p>
      <p className="text-[10px] text-cyber-muted leading-snug">{policy.description}</p>
      <div className="flex flex-wrap gap-2 text-[9px] font-cyber pt-1">
        <span>
          Net: <span className="text-cyber-text">{network}</span>
        </span>
        <span>·</span>
        <span>Caps allowed: {allowedN}</span>
      </div>
      <p className="text-[9px] text-cyber-green/90 font-cyber pt-0.5">
        No keys · No custody · No autonomous execution
      </p>
      {network === 'mainnet' && (
        <p className="text-[9px] text-cyber-red font-cyber border-t border-cyber-red/30 pt-1 mt-1">
          MAINNET: real funds. External wallet approval only.
        </p>
      )}
    </div>
  );
}
