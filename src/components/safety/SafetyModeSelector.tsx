/**
 * Global Safety Kernel mode selector — Compliance / Control Room.
 * Does not enable autonomous execution or custody; signing still requires Xaman + user_approved_signing.
 */

import { useEffect } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import type { SafetyMode } from '../../safety/safetyTypes';
import { getSafetyModePolicy } from '../../safety/safetyPolicy';
import { AlertTriangle } from 'lucide-react';

const SELECTABLE_MODES: SafetyMode[] = [
  'read_only',
  'simulation_only',
  'draft_intent',
  'user_approved_signing',
  'disabled',
];

export function SafetyModeSelector() {
  const safetyMode = useSettingsStore((s) => s.safetyMode);
  const setSafetyMode = useSettingsStore((s) => s.setSafetyMode);

  useEffect(() => {
    if (safetyMode === 'restricted_automation') {
      setSafetyMode('read_only');
      return;
    }
    if (!SELECTABLE_MODES.includes(safetyMode)) {
      setSafetyMode('read_only');
    }
  }, [safetyMode, setSafetyMode]);

  return (
    <div className="neon-panel space-y-2 p-4 rounded-xl border border-cyber-cyan/30">
      <h2 className="text-sm font-cyber text-cyber-cyan flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-cyber-yellow" aria-hidden />
        Safety Kernel (v0.2)
      </h2>
      <p className="text-xs text-cyber-muted">
        Read-only is the default. To create Xaman signing requests from Wallet Actions, switch to{' '}
        <strong className="text-cyber-text">User-approved Wallet Signing</strong>. No private keys, custody, or
        autonomous chain execution are ever enabled by this control.
      </p>
      <label className="block space-y-1">
        <span className="text-xs text-cyber-muted">Safety mode</span>
        <select
          className="w-full rounded border border-[var(--cyber-border)] bg-[var(--cyber-darker)] px-2 py-2 text-sm text-cyber-text"
          value={safetyMode}
          onChange={(e) => setSafetyMode(e.target.value as SafetyMode)}
        >
          {SELECTABLE_MODES.map((m) => (
            <option key={m} value={m}>
              {getSafetyModePolicy(m).label}
            </option>
          ))}
          <option value="restricted_automation" disabled>
            Restricted automation (future — not available)
          </option>
        </select>
      </label>
      <p className="text-[10px] text-cyber-muted border-t border-cyber-border/50 pt-2">
        {getSafetyModePolicy(safetyMode).description}
      </p>
    </div>
  );
}
