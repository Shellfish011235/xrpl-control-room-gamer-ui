import { OperatingModelNavList } from './OperatingModelNavList';
import { OperatingModeToggle } from './OperatingModeToggle';
import { ProvenanceBadge } from '../provenance/ProvenanceBadge';

const demoProv = {
  contentKind: 'observation' as const,
  provenance: {
    sourceKind: 'static' as const,
    label: 'Operating model config (v1)',
    schemaVersion: '1.0.0',
  },
};

/** Left column — 4+ layer operating model. Does not change custody or API behavior. */
export function OperatingModelSidebar() {
  return (
    <div className="h-full w-full min-h-0 min-w-0 border-r border-cyber-border/50 bg-cyber-darker/80 backdrop-blur flex flex-col">
      <div className="p-3 border-b border-cyber-border/40">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-[10px] font-cyber uppercase tracking-[0.2em] text-cyber-glow/90">Ops terminal</h2>
            <p className="text-[9px] text-cyber-muted font-cyber leading-snug mt-1">Observe → interpret → decide → act. Read-first by design.</p>
          </div>
        </div>
        <div className="mt-2">
          <ProvenanceBadge subject={demoProv} />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-2 py-3">
        <OperatingModelNavList />
      </div>
      <div className="p-2 border-t border-cyber-border/40">
        <OperatingModeToggle />
      </div>
    </div>
  );
}
