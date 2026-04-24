import { useId } from 'react';
import type { ProvenanceRecord } from '../../types/operating';
import { useOperatingMode } from '../../systems/modes/modeStore';

type Subject = { provenance: ProvenanceRecord; contentKind: 'observation' | 'claim' };

const badgeStyle = (kind: 'observation' | 'claim') =>
  kind === 'observation'
    ? 'border-cyber-cyan/50 text-cyber-cyan bg-cyber-cyan/10'
    : 'border-cyber-purple/50 text-cyber-purple bg-cyber-purple/10';

export function ProvenanceBadge({ subject, onOpenDetail }: { subject: Subject; onOpenDetail?: () => void }) {
  const op = useOperatingMode();
  const kind = subject.contentKind;
  const p = subject.provenance;
  const id = useId();
  if (op.isSimple()) {
    return (
      <span className={`text-[9px] px-1.5 py-0.5 rounded font-cyber border ${badgeStyle(kind)}`}>
        {kind === 'observation' ? 'Data' : 'View'}
      </span>
    );
  }
  return (
    <div className="inline-flex items-center gap-1 flex-wrap">
      <span className={`text-[9px] px-1.5 py-0.5 rounded font-cyber border ${badgeStyle(kind)}`} title={p.label}>
        {kind === 'observation' ? 'Observation' : 'Claim'}
      </span>
      <span className="text-[9px] text-cyber-muted font-cyber truncate max-w-[140px]" id={id}>
        {p.label}
      </span>
      {op.isOperator() && p.confidence != null && (
        <span className="text-[9px] text-cyber-yellow font-cyber">c={p.confidence.toFixed(2)}</span>
      )}
      {onOpenDetail && (op.isPro() || op.isOperator()) && (
        <button type="button" onClick={onOpenDetail} className="text-[9px] text-cyber-glow underline font-cyber" aria-label="Open source detail">
          detail
        </button>
      )}
    </div>
  );
}
