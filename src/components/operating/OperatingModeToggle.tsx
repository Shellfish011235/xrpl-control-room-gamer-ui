import clsx from 'clsx';
import { useOperatingMode, type OperatingUiMode, modeLabels } from '../../systems/modes/modeStore';

const order: OperatingUiMode[] = ['SIMPLE', 'PRO', 'OPERATOR'];

/**
 * Global UI mode — disclosure density, not a security or custody control.
 * Operator shows provenance, policy, and version hints; Simple hides jargon.
 */
export function OperatingModeToggle() {
  const { mode, setMode } = useOperatingMode();
  return (
    <div className="rounded-lg border border-cyber-border/60 bg-cyber-darker/60 p-1.5">
      <div className="text-[8px] font-cyber uppercase tracking-widest text-cyber-muted mb-1.5 pl-0.5">UI mode</div>
      <div className="flex flex-col gap-1">
        {order.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={clsx(
              'w-full text-left text-[10px] font-cyber px-2 py-1.5 rounded border transition-colors',
              mode === m
                ? 'border-cyber-glow text-cyber-glow bg-cyber-glow/10'
                : 'border-transparent text-cyber-muted hover:text-cyber-text hover:border-cyber-border/50'
            )}
            title={modeLabels[m].blurb}
          >
            {modeLabels[m].title}
          </button>
        ))}
      </div>
    </div>
  );
}
