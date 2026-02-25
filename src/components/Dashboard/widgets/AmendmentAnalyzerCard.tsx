import { Link } from 'react-router-dom';
import { BarChart3, ChevronRight, CheckCircle, Clock, Vote } from 'lucide-react';
import { amendmentSummaryMock } from '../../../data/dashboardMockData';
import clsx from 'clsx';

const statusStyle = {
  enabled: 'text-cyber-green border-cyber-green/40 bg-cyber-green/10',
  pending: 'text-cyber-yellow border-cyber-yellow/40 bg-cyber-yellow/10',
  voting: 'text-cyber-cyan border-cyber-cyan/40 bg-cyber-cyan/10',
};

export function AmendmentAnalyzerCard() {
  return (
    <div className="cyber-panel rounded-xl border border-cyber-border h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyber-border">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-cyber-glow" />
          <span className="font-cyber text-sm text-cyber-glow">Ledger Impact</span>
        </div>
        <Link
          to="/network"
          className="text-[10px] text-cyber-muted hover:text-cyber-glow flex items-center gap-1 transition-colors"
        >
          Full analyzer <ChevronRight size={12} />
        </Link>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {amendmentSummaryMock.map((a) => (
          <div
            key={a.id}
            className={clsx(
              'rounded-lg border px-3 py-2 text-xs',
              statusStyle[a.status]
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono truncate">{a.name.length > 24 ? a.name.slice(0, 24) + '…' : a.name}</span>
              <span>{a.supportPct}%</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-[10px] opacity-90">
              {a.status === 'enabled' && <CheckCircle size={10} />}
              {a.status === 'pending' && <Clock size={10} />}
              {a.status === 'voting' && <Vote size={10} />}
              <span>{a.status}</span>
              {a.eta && <span>· {a.eta}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
