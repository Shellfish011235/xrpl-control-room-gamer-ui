import { Link } from 'react-router-dom';
import { Terminal, ChevronRight, Play, Pause } from 'lucide-react';
import { useStrategyStore, type StrategyId } from '../../../store/strategyStore';
import { strategyStatusMock } from '../../../data/dashboardMockData';

const mockIdToStoreId: Record<string, StrategyId> = { grid: 'grid', dca: 'dca', mm: 'mm', arb: 'arbitrage' };

export function StrategiesWidget() {
  const enabled = useStrategyStore((s) => s.enabled);
  const exposureXRP = useStrategyStore((s) => s.exposureXRP);
  const maxExposureXRP = useStrategyStore((s) => s.maxExposureXRP);

  const strategies = strategyStatusMock.map((s) => ({
    ...s,
    enabled: enabled[mockIdToStoreId[s.id] ?? s.id] ?? s.enabled,
  }));

  return (
    <div className="cyber-panel rounded-xl border border-cyber-border h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyber-border">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-cyber-cyan" />
          <span className="font-cyber text-sm text-cyber-cyan">Strategies</span>
        </div>
        <Link
          to="/terminal"
          className="text-[10px] text-cyber-muted hover:text-cyber-glow flex items-center gap-1 transition-colors"
        >
          Terminal <ChevronRight size={12} />
        </Link>
      </div>
      <div className="flex-1 overflow-auto p-3">
        <div className="flex items-center justify-between text-[10px] text-cyber-muted mb-2">
          <span>Exposure</span>
          <span>{exposureXRP.toFixed(0)} / {maxExposureXRP} XRP</span>
        </div>
        <div className="space-y-1.5">
          {strategies.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-cyber-border/60 px-2 py-1.5 text-[10px]"
            >
              <div className="flex items-center gap-2">
                {s.enabled ? <Play size={10} className="text-cyber-green" /> : <Pause size={10} className="text-cyber-muted" />}
                <span className="text-cyber-text">{s.name}</span>
              </div>
              <span className={s.enabled ? 'text-cyber-cyan' : 'text-cyber-muted'}>
                {s.enabled ? `${s.exposureXrp} XRP` : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
