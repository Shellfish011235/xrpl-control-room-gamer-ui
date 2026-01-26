// CARV Dashboard Component
// Main control panel for the Verifiable AI Payment Rail Co-Processor

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Cpu, Shield, Play, Pause, Settings, RefreshCw,
  AlertTriangle, CheckCircle, Zap, Activity,
  ToggleLeft, ToggleRight, Send
} from 'lucide-react';

import { PIEViewer } from './PIEViewer';
import { EventLog } from './EventLog';
import { VenuePanel } from './VenuePanel';
import { TaxLedger } from './TaxLedger';

import { useCARVStore } from '../../store/carvStore';

interface CARVDashboardProps {
  compact?: boolean;
}

export function CARVDashboard({ compact = false }: CARVDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'pies' | 'routing' | 'ledger'>('overview');
  const [showQuickTrade, setShowQuickTrade] = useState(false);
  const [quickTradeForm, setQuickTradeForm] = useState({
    payee: 'rTestPayee123456789',
    amount: '0.1',
    asset: 'XRP',
    task: 'Quick trade via CARV',
  });
  const [isTrading, setIsTrading] = useState(false);

  const {
    initialized,
    testMode,
    regimeSummary,
    dailyVolumeCap,
    currentDailyVolume,
    pendingPIEs,
    recentPIEs,
    batches,
    ledgerEntries,
    taxLots,
    venues,
    events,
    stats,
    initialize,
    setTestMode,
    setRegimeSummary,
    createPIE,
    forceBatch,
    generateTaxReport,
    downloadTaxCSV,
  } = useCARVStore();

  // Initialize on mount
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  const handleQuickTrade = async () => {
    setIsTrading(true);
    try {
      await createPIE({
        payee: quickTradeForm.payee,
        amount: parseFloat(quickTradeForm.amount),
        asset: quickTradeForm.asset,
        task: quickTradeForm.task,
      });
    } finally {
      setIsTrading(false);
    }
  };

  const volumeUtilization = dailyVolumeCap > 0 
    ? (currentDailyVolume / dailyVolumeCap) * 100 
    : 0;

  return (
    <div className={`cyber-panel ${compact ? 'p-3' : 'p-4'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-cyber-border">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${testMode ? 'bg-cyber-yellow/20' : 'bg-cyber-green/20'}`}>
            <Cpu className={`w-5 h-5 ${testMode ? 'text-cyber-yellow' : 'text-cyber-green'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-cyber text-sm text-cyber-text">CARV CO-PROCESSOR</span>
              <span className={`px-2 py-0.5 rounded text-[9px] border ${
                testMode 
                  ? 'bg-cyber-yellow/20 text-cyber-yellow border-cyber-yellow/30' 
                  : 'bg-cyber-green/20 text-cyber-green border-cyber-green/30'
              }`}>
                {testMode ? 'TEST MODE' : 'LIVE MODE'}
              </span>
            </div>
            <p className="text-[10px] text-cyber-muted">
              Compute → Validate → Attest → Route → Account
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Toggle */}
          <button
            onClick={() => setTestMode(!testMode)}
            className={`flex items-center gap-1 px-2 py-1 rounded border text-xs ${
              testMode 
                ? 'border-cyber-yellow/50 text-cyber-yellow hover:bg-cyber-yellow/10' 
                : 'border-cyber-green/50 text-cyber-green hover:bg-cyber-green/10'
            }`}
          >
            {testMode ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
            {testMode ? 'Test' : 'Live'}
          </button>

          {/* Tab Buttons */}
          {['overview', 'pies', 'routing', 'ledger'].map((tab) => (
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

      {/* Stats Bar */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        <StatCard 
          label="PIEs" 
          value={stats.totalPIEs} 
          icon={<Activity size={12} />}
          color="cyan"
        />
        <StatCard 
          label="Success" 
          value={stats.successfulRoutes} 
          icon={<CheckCircle size={12} />}
          color="green"
        />
        <StatCard 
          label="Failed" 
          value={stats.failedRoutes} 
          icon={<AlertTriangle size={12} />}
          color="red"
        />
        <StatCard 
          label="Gain/Loss" 
          value={`$${stats.totalGainLoss.toFixed(2)}`} 
          icon={<Zap size={12} />}
          color={stats.totalGainLoss >= 0 ? 'green' : 'red'}
        />
        <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-cyber-muted">Daily Volume</span>
            <span className="text-cyber-text">{volumeUtilization.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-cyber-darker overflow-hidden">
            <div 
              className={`h-full transition-all ${
                volumeUtilization > 80 ? 'bg-cyber-red' :
                volumeUtilization > 50 ? 'bg-cyber-yellow' : 'bg-cyber-green'
              }`}
              style={{ width: `${Math.min(100, volumeUtilization)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-cyber-muted mt-1">
            <span>{currentDailyVolume.toFixed(4)}</span>
            <span>{dailyVolumeCap}</span>
          </div>
        </div>
      </div>

      {/* Quick Trade Panel */}
      {showQuickTrade && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4 p-3 rounded bg-cyber-purple/10 border border-cyber-purple/30"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-cyber-purple font-cyber">QUICK TRADE</span>
            <button 
              onClick={() => setShowQuickTrade(false)}
              className="text-cyber-muted hover:text-cyber-text text-xs"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div>
              <label className="text-[10px] text-cyber-muted">Payee</label>
              <input
                type="text"
                value={quickTradeForm.payee}
                onChange={(e) => setQuickTradeForm({ ...quickTradeForm, payee: e.target.value })}
                className="w-full mt-1 px-2 py-1 bg-cyber-darker border border-cyber-border rounded text-xs text-cyber-text"
              />
            </div>
            <div>
              <label className="text-[10px] text-cyber-muted">Amount</label>
              <input
                type="number"
                step="0.0001"
                value={quickTradeForm.amount}
                onChange={(e) => setQuickTradeForm({ ...quickTradeForm, amount: e.target.value })}
                className="w-full mt-1 px-2 py-1 bg-cyber-darker border border-cyber-border rounded text-xs text-cyber-text"
              />
            </div>
            <div>
              <label className="text-[10px] text-cyber-muted">Asset</label>
              <select
                value={quickTradeForm.asset}
                onChange={(e) => setQuickTradeForm({ ...quickTradeForm, asset: e.target.value })}
                className="w-full mt-1 px-2 py-1 bg-cyber-darker border border-cyber-border rounded text-xs text-cyber-text"
              >
                <option value="XRP">XRP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleQuickTrade}
                disabled={isTrading}
                className="w-full px-3 py-1 rounded bg-cyber-purple/20 border border-cyber-purple/50 text-cyber-purple text-xs hover:bg-cyber-purple/30 disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {isTrading ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <Send size={12} />
                )}
                Execute
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Recent PIEs + Quick Trade */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-cyber-cyan font-cyber">RECENT ACTIVITY</span>
              <button
                onClick={() => setShowQuickTrade(!showQuickTrade)}
                className="px-2 py-1 text-xs rounded bg-cyber-purple/20 text-cyber-purple hover:bg-cyber-purple/30"
              >
                + Quick Trade
              </button>
            </div>
            <PIEViewer pies={[...pendingPIEs, ...recentPIEs]} maxDisplay={5} showDetails={false} />
          </div>

          {/* Right: Event Log */}
          <EventLog events={events} maxDisplay={10} />
        </div>
      )}

      {activeTab === 'pies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-cyber-muted">
              {pendingPIEs.length} pending • {recentPIEs.length} processed
            </span>
            <button
              onClick={forceBatch}
              disabled={pendingPIEs.length === 0}
              className="px-2 py-1 text-xs rounded bg-cyber-cyan/20 text-cyber-cyan hover:bg-cyber-cyan/30 disabled:opacity-50"
            >
              Force Batch
            </button>
          </div>
          <PIEViewer pies={[...pendingPIEs, ...recentPIEs]} maxDisplay={20} />
        </div>
      )}

      {activeTab === 'routing' && (
        <VenuePanel 
          venues={venues} 
          stats={{
            total: stats.totalPIEs,
            success: stats.successfulRoutes,
            failed: stats.failedRoutes,
            byVenue: {} as any, // Would need to track this in store
          }}
        />
      )}

      {activeTab === 'ledger' && (
        <TaxLedger 
          entries={ledgerEntries}
          taxLots={taxLots}
          onGenerateReport={generateTaxReport}
          onDownloadCSV={downloadTaxCSV}
        />
      )}

      {/* Regime Summary */}
      {!compact && (
        <div className="mt-4 pt-4 border-t border-cyber-border">
          <div className="flex items-start gap-2">
            <Shield size={14} className="text-cyber-purple mt-0.5" />
            <div className="flex-1">
              <p className="text-[10px] text-cyber-purple font-cyber mb-1">REGIME CONTEXT (SALIENCE ANCHOR)</p>
              <textarea
                value={regimeSummary}
                onChange={(e) => setRegimeSummary(e.target.value)}
                rows={2}
                className="w-full px-2 py-1 bg-cyber-darker border border-cyber-border rounded text-[10px] text-cyber-text resize-none"
                placeholder="Define trading regime context for LLM anchoring..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Component
function StatCard({ 
  label, 
  value, 
  icon, 
  color 
}: { 
  label: string; 
  value: number | string; 
  icon: React.ReactNode; 
  color: 'cyan' | 'green' | 'red' | 'yellow' | 'purple';
}) {
  const colors = {
    cyan: 'text-cyber-cyan border-cyber-cyan/30',
    green: 'text-cyber-green border-cyber-green/30',
    red: 'text-cyber-red border-cyber-red/30',
    yellow: 'text-cyber-yellow border-cyber-yellow/30',
    purple: 'text-cyber-purple border-cyber-purple/30',
  };

  return (
    <div className={`p-2 rounded bg-cyber-darker/50 border ${colors[color]}`}>
      <div className="flex items-center gap-1 text-[10px] text-cyber-muted mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <p className={`font-cyber text-sm ${colors[color].split(' ')[0]}`}>{value}</p>
    </div>
  );
}

export default CARVDashboard;
