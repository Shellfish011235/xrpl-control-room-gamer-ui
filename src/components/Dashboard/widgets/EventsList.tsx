import { Calendar, ExternalLink } from 'lucide-react';
import { eventsMock } from '../../../data/dashboardMockData';
import { classifyDashboardEventsMock } from '../../../services/dataAccuracyClassifier';
import { DataAccuracyBadge } from '../../common/DataAccuracyBadge';

export function EventsList() {
  const eventsSource = classifyDashboardEventsMock();
  return (
    <div className="cyber-panel rounded-xl border border-cyber-border h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-cyber-border">
        <div className="flex items-center gap-2 min-w-0">
          <Calendar size={16} className="text-cyber-blue shrink-0" />
          <span className="font-cyber text-sm text-cyber-blue truncate">Upcoming events</span>
        </div>
        <DataAccuracyBadge meta={eventsSource} compact />
      </div>
      <div className="flex-1 overflow-auto p-2 space-y-1.5">
        {eventsMock.map((e) => (
          <a
            key={e.id}
            href={e.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg border border-cyber-border/60 bg-cyber-darker/50 px-2 py-1.5 text-[10px] hover:border-cyber-blue/50 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-cyber-muted">{e.date}</span>
              <ExternalLink size={10} className="text-cyber-muted shrink-0" />
            </div>
            <p className="text-cyber-text truncate mt-0.5">{e.title}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
