import { Database } from 'lucide-react';
import { ledgerSummaryMock } from '../../../data/dashboardMockData';

export function LedgerSummaryWidget() {
  return (
    <div className="cyber-panel rounded-xl border border-cyber-border h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-cyber-border">
        <Database size={16} className="text-cyber-glow" />
        <span className="font-cyber text-sm text-cyber-glow">Ledger</span>
      </div>
      <div className="flex-1 p-3 flex flex-col justify-center text-[10px] space-y-2">
        <div className="flex justify-between">
          <span className="text-cyber-muted">Index</span>
          <span className="font-mono text-cyber-text">#{ledgerSummaryMock.ledgerIndex.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-cyber-muted">Last close txns</span>
          <span className="text-cyber-text">{ledgerSummaryMock.txnCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-cyber-muted">Fee range</span>
          <span className="font-mono text-cyber-text">{ledgerSummaryMock.feeMin} – {ledgerSummaryMock.feeMax} XRP</span>
        </div>
      </div>
    </div>
  );
}
