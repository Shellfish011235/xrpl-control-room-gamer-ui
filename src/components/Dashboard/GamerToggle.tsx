import { Gamepad2 } from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import clsx from 'clsx';

export function GamerToggle() {
  const gamerMode = useDashboardStore((s) => s.gamerMode);
  const toggleGamerMode = useDashboardStore((s) => s.toggleGamerMode);

  return (
    <button
      type="button"
      onClick={toggleGamerMode}
      className={clsx(
        'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all',
        gamerMode
          ? 'border-cyber-purple/60 bg-cyber-purple/15 text-cyber-purple shadow-[0_0_12px_rgba(168,85,247,0.25)]'
          : 'border-cyber-border bg-cyber-panel/80 text-cyber-muted hover:border-cyber-muted hover:text-cyber-text'
      )}
      title={gamerMode ? 'Turn off Gamer Mode' : 'Turn on Gamer Mode (HUD, neon, quests)'}
    >
      <Gamepad2 size={16} className={gamerMode ? 'text-cyber-purple' : ''} />
      <span className="hidden sm:inline">Gamer</span>
      <span
        className={clsx(
          'h-2 w-5 rounded-full border transition-colors',
          gamerMode ? 'border-cyber-purple bg-cyber-purple' : 'border-cyber-muted bg-cyber-darker'
        )}
        style={gamerMode ? { boxShadow: '0 0 8px rgba(168,85,247,0.6)' } : undefined}
      />
    </button>
  );
}
