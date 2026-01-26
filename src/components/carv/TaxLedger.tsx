// Tax Ledger Component
// Displays ledger entries, tax lots, and export functionality

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, DollarSign, TrendingUp, TrendingDown,
  Calendar, Package, ChevronDown, ChevronRight
} from 'lucide-react';
import { LedgerEntry, TaxLot, TaxReport } from '../../services/carv/types';

interface TaxLedgerProps {
  entries: LedgerEntry[];
  taxLots: TaxLot[];
  onGenerateReport?: (startDate: string, endDate: string) => TaxReport | null;
  onDownloadCSV?: (startDate: string, endDate: string) => void;
}

export function TaxLedger({ entries, taxLots, onGenerateReport, onDownloadCSV }: TaxLedgerProps) {
  const [activeTab, setActiveTab] = useState<'entries' | 'lots' | 'report'>('entries');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [reportDates, setReportDates] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [report, setReport] = useState<TaxReport | null>(null);

  // Calculate totals
  const totalGainLoss = entries.reduce((sum, e) => sum + e.realized_gain_loss, 0);
  const totalFees = entries.reduce((sum, e) => sum + e.fee, 0);
  const openLots = taxLots.filter(l => l.quantity - l.disposed_quantity > 0);

  const handleGenerateReport = () => {
    if (onGenerateReport) {
      const generated = onGenerateReport(reportDates.start, reportDates.end);
      setReport(generated);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-cyber-cyan font-cyber flex items-center gap-2">
          <FileText size={14} />
          TAX LEDGER
        </span>
        <div className="flex items-center gap-1">
          {['entries', 'lots', 'report'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-2 py-1 text-xs rounded capitalize ${
                activeTab === tab 
                  ? 'bg-cyber-cyan/20 text-cyber-cyan' 
                  : 'bg-cyber-darker text-cyber-muted hover:text-cyber-text'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border text-center">
          <p className="text-[10px] text-cyber-muted">Entries</p>
          <p className="font-cyber text-sm text-cyber-text">{entries.length}</p>
        </div>
        <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border text-center">
          <p className="text-[10px] text-cyber-muted">Open Lots</p>
          <p className="font-cyber text-sm text-cyber-text">{openLots.length}</p>
        </div>
        <div className={`p-2 rounded border text-center ${
          totalGainLoss >= 0 
            ? 'bg-cyber-green/10 border-cyber-green/30' 
            : 'bg-cyber-red/10 border-cyber-red/30'
        }`}>
          <p className="text-[10px] text-cyber-muted">Gain/Loss</p>
          <p className={`font-cyber text-sm ${totalGainLoss >= 0 ? 'text-cyber-green' : 'text-cyber-red'}`}>
            ${totalGainLoss.toFixed(2)}
          </p>
        </div>
        <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border text-center">
          <p className="text-[10px] text-cyber-muted">Fees</p>
          <p className="font-cyber text-sm text-cyber-yellow">${totalFees.toFixed(4)}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Entries Tab */}
        {activeTab === 'entries' && (
          <motion.div
            key="entries"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar"
          >
            {entries.length === 0 ? (
              <div className="text-center py-6 text-cyber-muted">
                <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No ledger entries</p>
              </div>
            ) : (
              entries.slice().reverse().map((entry) => (
                <div
                  key={entry.entry_id}
                  className="p-2 rounded bg-cyber-darker/50 border border-cyber-border"
                >
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedEntry(
                      expandedEntry === entry.entry_id ? null : entry.entry_id
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {entry.type === 'debit' ? (
                        <TrendingDown size={14} className="text-cyber-red" />
                      ) : (
                        <TrendingUp size={14} className="text-cyber-green" />
                      )}
                      <div>
                        <p className="text-xs text-cyber-text">
                          {entry.amount.toFixed(4)} {entry.asset}
                        </p>
                        <p className="text-[10px] text-cyber-muted">
                          {entry.venue} • {new Date(entry.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-xs ${
                          entry.realized_gain_loss >= 0 ? 'text-cyber-green' : 'text-cyber-red'
                        }`}>
                          {entry.realized_gain_loss >= 0 ? '+' : ''}${entry.realized_gain_loss.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-cyber-muted">G/L</p>
                      </div>
                      {expandedEntry === entry.entry_id 
                        ? <ChevronDown size={12} className="text-cyber-muted" />
                        : <ChevronRight size={12} className="text-cyber-muted" />
                      }
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedEntry === entry.entry_id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 pt-2 border-t border-cyber-border/50 grid grid-cols-3 gap-2 text-[10px]"
                      >
                        <div>
                          <span className="text-cyber-muted">Cost Basis</span>
                          <p className="text-cyber-text">${entry.cost_basis.toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-cyber-muted">FMV</span>
                          <p className="text-cyber-text">${entry.fmv_at_time.toFixed(4)}</p>
                        </div>
                        <div>
                          <span className="text-cyber-muted">Fee</span>
                          <p className="text-cyber-text">${entry.fee.toFixed(6)}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* Tax Lots Tab */}
        {activeTab === 'lots' && (
          <motion.div
            key="lots"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar"
          >
            {taxLots.length === 0 ? (
              <div className="text-center py-6 text-cyber-muted">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tax lots</p>
              </div>
            ) : (
              taxLots.map((lot) => {
                const remaining = lot.quantity - lot.disposed_quantity;
                const isOpen = remaining > 0;
                
                return (
                  <div
                    key={lot.lot_id}
                    className={`p-2 rounded border ${
                      isOpen 
                        ? 'bg-cyber-green/10 border-cyber-green/30' 
                        : 'bg-cyber-darker/30 border-cyber-border/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-cyber-text">
                          {lot.quantity.toFixed(4)} {lot.asset}
                        </p>
                        <p className="text-[10px] text-cyber-muted">
                          {lot.acquisition_type} • {new Date(lot.acquired_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-cyber-text">
                          ${(lot.cost_basis / lot.quantity).toFixed(4)}/unit
                        </p>
                        <p className="text-[10px] text-cyber-muted">
                          {isOpen ? `${remaining.toFixed(4)} remaining` : 'Closed'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="mt-2 h-1 rounded-full bg-cyber-darker overflow-hidden">
                      <div 
                        className={`h-full ${isOpen ? 'bg-cyber-green' : 'bg-cyber-muted'}`}
                        style={{ width: `${(remaining / lot.quantity) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </motion.div>
        )}

        {/* Report Tab */}
        {activeTab === 'report' && (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-cyber-muted">Start Date</label>
                <input
                  type="date"
                  value={reportDates.start}
                  onChange={(e) => setReportDates({ ...reportDates, start: e.target.value })}
                  className="w-full mt-1 px-2 py-1 bg-cyber-darker border border-cyber-border rounded text-xs text-cyber-text"
                />
              </div>
              <div>
                <label className="text-[10px] text-cyber-muted">End Date</label>
                <input
                  type="date"
                  value={reportDates.end}
                  onChange={(e) => setReportDates({ ...reportDates, end: e.target.value })}
                  className="w-full mt-1 px-2 py-1 bg-cyber-darker border border-cyber-border rounded text-xs text-cyber-text"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleGenerateReport}
                className="flex-1 px-3 py-2 rounded bg-cyber-cyan/20 border border-cyber-cyan/50 text-cyber-cyan text-xs hover:bg-cyber-cyan/30 flex items-center justify-center gap-2"
              >
                <Calendar size={14} />
                Generate Report
              </button>
              {onDownloadCSV && (
                <button
                  onClick={() => onDownloadCSV(reportDates.start, reportDates.end)}
                  className="px-3 py-2 rounded bg-cyber-green/20 border border-cyber-green/50 text-cyber-green text-xs hover:bg-cyber-green/30 flex items-center justify-center gap-2"
                >
                  <Download size={14} />
                  CSV
                </button>
              )}
            </div>

            {/* Report Results */}
            {report && (
              <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-border space-y-3">
                <p className="text-xs text-cyber-cyan font-cyber">
                  FORM 8949 SUMMARY
                </p>
                
                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div className="p-2 rounded bg-cyber-darker">
                    <p className="text-cyber-muted">Short-Term Gains</p>
                    <p className="text-cyber-green font-cyber">${report.short_term_gains.toFixed(2)}</p>
                  </div>
                  <div className="p-2 rounded bg-cyber-darker">
                    <p className="text-cyber-muted">Short-Term Losses</p>
                    <p className="text-cyber-red font-cyber">${report.short_term_losses.toFixed(2)}</p>
                  </div>
                  <div className="p-2 rounded bg-cyber-darker">
                    <p className="text-cyber-muted">Long-Term Gains</p>
                    <p className="text-cyber-green font-cyber">${report.long_term_gains.toFixed(2)}</p>
                  </div>
                  <div className="p-2 rounded bg-cyber-darker">
                    <p className="text-cyber-muted">Long-Term Losses</p>
                    <p className="text-cyber-red font-cyber">${report.long_term_losses.toFixed(2)}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-cyber-border/50">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-cyber-muted">Total Proceeds</span>
                    <span className="text-cyber-text">${report.total_proceeds.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-cyber-muted">Total Cost Basis</span>
                    <span className="text-cyber-text">${report.total_cost_basis.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1 pt-1 border-t border-cyber-border/50">
                    <span className="text-cyber-muted">Net Gain/Loss</span>
                    <span className={
                      (report.total_proceeds - report.total_cost_basis) >= 0 
                        ? 'text-cyber-green' 
                        : 'text-cyber-red'
                    }>
                      ${(report.total_proceeds - report.total_cost_basis).toFixed(2)}
                    </span>
                  </div>
                </div>

                <p className="text-[9px] text-cyber-muted">
                  {report.transactions.length} transactions in period
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TaxLedger;
