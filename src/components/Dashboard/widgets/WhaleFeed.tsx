import { Activity, ExternalLink } from 'lucide-react';
import { whaleFeedMock } from '../../../data/dashboardMockData';

function formatXrp(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return n.toFixed(0);
}

export function WhaleFeed() {
  return (
    <div className="cyber-panel rounded-xl border border-cyber-border h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-cyber-border">
        <Activity size={16} className="text-cyber-magenta" />
        <span className="font-cyber text-sm text-cyber-magenta">Whale activity</span>
      </div>
      <div className="flex-1 overflow-auto p-2 space-y-1.5">
        {whaleFeedMock.map((w) => (
          <div
            key={w.id}
            className="flex items-center justify-between rounded-lg border border-cyber-border/60 bg-cyber-darker/50 px-2 py-1.5 text-[10px]"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-cyber-muted truncate">{w.from}</span>
              <span className="text-cyber-muted shrink-0">→</span>
              <span className="text-cyber-muted truncate">{w.to}</span>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="text-cyber-green font-mono">{formatXrp(w.amountXrp)} XRP</span>
              <span className="text-cyber-muted">{w.timeAgo}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
