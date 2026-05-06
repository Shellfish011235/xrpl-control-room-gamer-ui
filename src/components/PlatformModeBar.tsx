/**
 * Platform: live only. Network (Testnet/Mainnet) + Premium gate + Safety Kernel badge.
 * Hidden on Control Room page so that page’s top bar is the single source for network.
 */

import { useLocation } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore';
import { SafetyModeBadge } from './safety/SafetyModeBadge';

const MAINNET_CONFIRM =
  'Mainnet uses real XRP. Continue only if you understand all signing happens externally in Xaman and no transaction should be approved without review.';

export function PlatformModeBar() {
  const location = useLocation();
  const isControlRoom = location.pathname.startsWith('/tools/control-room');
  const network = useSettingsStore((s) => s.network);
  const setNetwork = useSettingsStore((s) => s.setNetwork);
  const premium = useSettingsStore((s) => s.premium);
  const confirmMainnetForSession = useSettingsStore((s) => s.confirmMainnetForSession);
  const clearMainnetConfirmation = useSettingsStore((s) => s.clearMainnetConfirmation);

  const isMainnet = network === 'mainnet';

  if (isControlRoom) return null;

  return (
    <div className="sticky top-0 z-40 w-full border-b border-cyber-border/50 bg-cyber-darker/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[10px] text-cyber-muted uppercase tracking-wider font-cyber">
            Platform
          </span>
          <SafetyModeBadge compact />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                clearMainnetConfirmation();
                setNetwork('testnet');
              }}
              className={`px-2 py-1 rounded text-[10px] font-cyber border ${
                !isMainnet ? 'border-cyber-cyan/50 text-cyber-cyan bg-cyber-cyan/10' : 'border-cyber-muted/50 text-cyber-muted hover:text-cyber-text'
              }`}
            >
              Testnet
            </button>
            <button
              type="button"
              onClick={() => {
                const ok = typeof window !== 'undefined' && window.confirm(MAINNET_CONFIRM);
                if (!ok) return;
                confirmMainnetForSession();
                setNetwork('mainnet');
              }}
              title="Mainnet spends real XRP. Use with caution."
              className={`px-2 py-1 rounded text-[10px] font-cyber border ${
                isMainnet ? 'border-cyber-red/50 text-cyber-red bg-cyber-red/10' : 'border-cyber-muted/50 text-cyber-muted hover:text-cyber-text'
              }`}
            >
              Mainnet
            </button>
            {isMainnet && (
              <span className="text-[9px] text-cyber-red font-cyber ml-0.5" title="Real XRP at risk">
                MAINNET: real funds · external wallet only
              </span>
            )}
          </div>
        </div>
        <span
          className={`text-[10px] px-2 py-1 rounded border ${
            premium ? 'border-cyber-glow/50 text-cyber-glow bg-cyber-glow/10' : 'border-cyber-muted/50 text-cyber-muted'
          }`}
          title="Premium Mode: Stripe gate for advanced features (coming soon)"
        >
          {premium ? 'Premium' : 'Free'}
        </span>
      </div>
    </div>
  );
}
