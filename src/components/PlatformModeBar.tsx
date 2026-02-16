/**
 * Platform Demo/Live + Network (Testnet/Mainnet) + Premium gate.
 * Phase 0: Testnet default; mainnet shows red warning.
 */

import { usePlatformModeStore } from '../store/platformModeStore';
import { useSettingsStore, type NetworkMode } from '../store/settingsStore';

export function PlatformModeBar() {
  const mode = usePlatformModeStore((s) => s.mode);
  const toggleMode = usePlatformModeStore((s) => s.toggleMode);
  const isLive = mode === 'live';
  const network = useSettingsStore((s) => s.network);
  const setNetwork = useSettingsStore((s) => s.setNetwork);
  const premium = useSettingsStore((s) => s.premium);

  const isMainnet = network === 'mainnet';

  return (
    <div className="sticky top-0 z-40 w-full border-b border-cyber-border/50 bg-cyber-darker/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-cyber-muted uppercase tracking-wider font-cyber">
            Platform
          </span>
          <button
            type="button"
            onClick={toggleMode}
            title={isLive ? 'Switch to Demo (platform-wide)' : 'Switch to Live (platform-wide)'}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-cyber transition-colors ${
              isLive
                ? 'border-cyber-green/40 bg-cyber-green/10 text-cyber-green hover:bg-cyber-green/20'
                : 'border-cyber-yellow/40 bg-cyber-yellow/10 text-cyber-yellow hover:bg-cyber-yellow/20'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-cyber-green animate-pulse' : 'bg-cyber-yellow'}`} />
            {isLive ? 'LIVE' : 'DEMO'}
          </button>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setNetwork('testnet')}
              className={`px-2 py-1 rounded text-[10px] font-cyber border ${
                !isMainnet ? 'border-cyber-cyan/50 text-cyber-cyan bg-cyber-cyan/10' : 'border-cyber-muted/50 text-cyber-muted hover:text-cyber-text'
              }`}
            >
              Testnet
            </button>
            <button
              type="button"
              onClick={() => setNetwork('mainnet')}
              title="Mainnet spends real XRP. Use with caution."
              className={`px-2 py-1 rounded text-[10px] font-cyber border ${
                isMainnet ? 'border-cyber-red/50 text-cyber-red bg-cyber-red/10' : 'border-cyber-muted/50 text-cyber-muted hover:text-cyber-text'
              }`}
            >
              Mainnet
            </button>
            {isMainnet && (
              <span className="text-[9px] text-cyber-red font-cyber ml-0.5" title="Real XRP at risk">
                ⚠ Real XRP
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
