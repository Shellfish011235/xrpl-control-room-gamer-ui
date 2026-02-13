/**
 * Platform Demo/Live toggle at the top of every page.
 * One control for the entire app; applies everywhere.
 */

import { usePlatformModeStore } from '../store/platformModeStore';

export function PlatformModeBar() {
  const mode = usePlatformModeStore((s) => s.mode);
  const toggleMode = usePlatformModeStore((s) => s.toggleMode);
  const isLive = mode === 'live';

  return (
    <div className="sticky top-0 z-40 w-full border-b border-cyber-border/50 bg-cyber-darker/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-2 flex items-center justify-between gap-4">
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
      </div>
    </div>
  );
}
