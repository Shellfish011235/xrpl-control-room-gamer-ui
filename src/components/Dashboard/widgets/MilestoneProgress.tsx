import { Trophy } from 'lucide-react';
import { milestonesMock } from '../../../data/dashboardMockData';
import { useDashboardStore } from '../../../store/dashboardStore';

function formatProgress(n: number, unit: string) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return String(n);
}

export function MilestoneProgress() {
  const gamerMode = useDashboardStore((s) => s.gamerMode);

  return (
    <div
      className={`
        rounded-xl border h-full flex flex-col overflow-hidden
        ${gamerMode ? 'border-cyber-yellow/40 bg-cyber-panel/90' : 'cyber-panel border-cyber-border'}
      `}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-cyber-border">
        <Trophy size={16} className="text-cyber-yellow" />
        <span className="font-cyber text-sm text-cyber-yellow">Milestones</span>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {milestonesMock.map((m) => (
          <div key={m.id}>
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-cyber-text">{m.label}</span>
              <span className="text-cyber-yellow">{m.progressPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-cyber-darker overflow-hidden">
              <div
                className="h-full rounded-full bg-cyber-yellow transition-[width]"
                style={{ width: `${Math.min(100, m.progressPct)}%` }}
              />
            </div>
            <p className="text-[9px] text-cyber-muted mt-0.5">
              {formatProgress(m.current, m.unit)} / {formatProgress(m.target, m.unit)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
