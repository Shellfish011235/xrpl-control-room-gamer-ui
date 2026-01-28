// CARV Page - Simplified & Grandma-Friendly Version
// "What does this do?" should be obvious for everyone

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, AlertTriangle, Settings, RefreshCw,
  Activity, Zap, FileText, Send, Eye, EyeOff,
  ToggleLeft, ToggleRight, Download, CheckCircle,
  HelpCircle, ChevronRight, ChevronDown, X,
  DollarSign, Clock, History, Sparkles
} from 'lucide-react';

import { 
  CARVDashboard, 
  PIEViewer, 
  EventLog, 
  TaxLedger,
  SimpleWelcome,
  SimpleFlowExplainer,
  SafetyIndicator,
  SimpleStatusBadge,
  AgentPanel,
} from '../components/carv';
import { useCARVStore } from '../store/carvStore';
import { Bot } from 'lucide-react';

// ==================== SIMPLE MODE PAGE ====================

function SimpleModeView({
  testMode,
  setTestMode,
  dailyVolumeCap,
  currentDailyVolume,
  stats,
  recentPIEs,
  createPIE,
  downloadTaxCSV,
  onSwitchToAdvanced,
}: {
  testMode: boolean;
  setTestMode: (v: boolean) => void;
  dailyVolumeCap: number;
  currentDailyVolume: number;
  stats: any;
  recentPIEs: any[];
  createPIE: (params: any) => Promise<any>;
  downloadTaxCSV: (start: string, end: string) => void;
  onSwitchToAdvanced: () => void;
}) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    recipient: '',
    amount: '',
    note: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendPayment = async () => {
    if (!paymentForm.recipient || !paymentForm.amount) {
      setLastResult({ success: false, message: 'Please fill in the recipient and amount' });
      return;
    }

    setIsSubmitting(true);
    setLastResult(null);

    try {
      const result = await createPIE({
        payee: paymentForm.recipient,
        amount: parseFloat(paymentForm.amount),
        asset: 'XRP',
        task: paymentForm.note || 'Payment via CARV',
      });

      if (result.success) {
        setLastResult({ 
          success: true, 
          message: testMode 
            ? '✅ Practice payment sent successfully! (No real money moved)' 
            : '✅ Payment sent successfully!'
        });
        setPaymentForm({ recipient: '', amount: '', note: '' });
      } else {
        setLastResult({ success: false, message: `❌ ${result.error || 'Payment failed'}` });
      }
    } catch (e) {
      setLastResult({ success: false, message: '❌ Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Big Friendly Header */}
      <div className="text-center py-6">
        <div className="text-5xl mb-4">🛡️</div>
        <h1 className="text-2xl font-cyber text-cyber-text mb-2">Payment Safety System</h1>
        <p className="text-cyber-muted">
          Send payments safely with automatic record-keeping
        </p>
        
        {/* Mode Indicator - Big and Clear */}
        <div className="mt-4 inline-block">
          <button
            onClick={() => setTestMode(!testMode)}
            className={`px-6 py-3 rounded-lg border-2 text-lg flex items-center gap-3 mx-auto ${
              testMode
                ? 'bg-cyber-yellow/20 border-cyber-yellow text-cyber-yellow'
                : 'bg-cyber-red/20 border-cyber-red text-cyber-red'
            }`}
          >
            {testMode ? (
              <>
                <span className="text-2xl">🎮</span>
                <div className="text-left">
                  <div className="font-bold">Practice Mode</div>
                  <div className="text-xs opacity-80">No real money moves</div>
                </div>
              </>
            ) : (
              <>
                <span className="text-2xl">💰</span>
                <div className="text-left">
                  <div className="font-bold">Real Money Mode</div>
                  <div className="text-xs opacity-80">Actual payments!</div>
                </div>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Safety Status - Always Visible */}
      <SafetyIndicator
        dailyUsed={currentDailyVolume}
        dailyLimit={dailyVolumeCap}
        testMode={testMode}
      />

      {/* Main Actions - Big Friendly Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Send Payment */}
        <button
          onClick={() => { setShowPaymentForm(true); setShowHistory(false); }}
          className={`p-6 rounded-xl border-2 transition-all text-center ${
            showPaymentForm
              ? 'bg-cyber-cyan/20 border-cyber-cyan'
              : 'bg-cyber-darker/50 border-cyber-border hover:border-cyber-cyan/50'
          }`}
        >
          <div className="text-4xl mb-3">💸</div>
          <h3 className="text-lg font-medium text-cyber-text mb-1">Send Payment</h3>
          <p className="text-xs text-cyber-muted">
            {testMode ? 'Practice sending (no real money)' : 'Send real XRP'}
          </p>
        </button>

        {/* View History */}
        <button
          onClick={() => { setShowHistory(true); setShowPaymentForm(false); }}
          className={`p-6 rounded-xl border-2 transition-all text-center ${
            showHistory
              ? 'bg-cyber-purple/20 border-cyber-purple'
              : 'bg-cyber-darker/50 border-cyber-border hover:border-cyber-purple/50'
          }`}
        >
          <div className="text-4xl mb-3">📜</div>
          <h3 className="text-lg font-medium text-cyber-text mb-1">Payment History</h3>
          <p className="text-xs text-cyber-muted">
            {recentPIEs.length} transactions recorded
          </p>
        </button>

        {/* Export Taxes */}
        <button
          onClick={() => downloadTaxCSV(
            new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
            new Date().toISOString().split('T')[0]
          )}
          className="p-6 rounded-xl border-2 bg-cyber-darker/50 border-cyber-border hover:border-cyber-green/50 transition-all text-center"
        >
          <div className="text-4xl mb-3">📊</div>
          <h3 className="text-lg font-medium text-cyber-text mb-1">Export for Taxes</h3>
          <p className="text-xs text-cyber-muted">
            Download CSV for tax filing
          </p>
        </button>
      </div>

      {/* Payment Form - Shows when clicked */}
      <AnimatePresence>
        {showPaymentForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="cyber-panel p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-cyber text-cyber-cyan flex items-center gap-2">
                  <Send size={20} />
                  {testMode ? 'Practice Payment' : 'Send Payment'}
                </h3>
                <button 
                  onClick={() => setShowPaymentForm(false)}
                  className="text-cyber-muted hover:text-cyber-text"
                >
                  <X size={20} />
                </button>
              </div>

              {testMode && (
                <div className="mb-4 p-3 rounded-lg bg-cyber-yellow/10 border border-cyber-yellow/30 flex items-start gap-3">
                  <span className="text-xl">🎮</span>
                  <p className="text-xs text-cyber-muted">
                    <span className="text-cyber-yellow font-medium">Practice Mode:</span> This payment 
                    will be simulated. No real money will move. Great for learning how the system works!
                  </p>
                </div>
              )}

              {!testMode && (
                <div className="mb-4 p-3 rounded-lg bg-cyber-red/10 border border-cyber-red/30 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-cyber-red shrink-0" />
                  <p className="text-xs text-cyber-muted">
                    <span className="text-cyber-red font-medium">Real Money Mode:</span> This will send 
                    actual XRP from your wallet. Double-check everything before sending!
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-cyber-muted mb-1">
                    Who are you paying? (Wallet Address)
                  </label>
                  <input
                    type="text"
                    value={paymentForm.recipient}
                    onChange={(e) => setPaymentForm({ ...paymentForm, recipient: e.target.value })}
                    placeholder="rXXXXXXXXX... (paste wallet address)"
                    className="w-full px-4 py-3 bg-cyber-darker border border-cyber-border rounded-lg text-cyber-text placeholder:text-cyber-muted/50"
                  />
                  <p className="text-[10px] text-cyber-muted mt-1">
                    💡 This is the recipient's XRP wallet address
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-cyber-muted mb-1">
                    How much? (in XRP)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-cyber-darker border border-cyber-border rounded-lg text-cyber-text text-xl"
                  />
                  <p className="text-[10px] text-cyber-muted mt-1">
                    💡 Your daily limit is {dailyVolumeCap} XRP
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-cyber-muted mb-1">
                    What's it for? (Optional note)
                  </label>
                  <input
                    type="text"
                    value={paymentForm.note}
                    onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                    placeholder="e.g., Coffee payment, Birthday gift"
                    className="w-full px-4 py-3 bg-cyber-darker border border-cyber-border rounded-lg text-cyber-text"
                  />
                  <p className="text-[10px] text-cyber-muted mt-1">
                    💡 This helps you remember what the payment was for
                  </p>
                </div>

                {/* Result Message */}
                {lastResult && (
                  <div className={`p-3 rounded-lg ${
                    lastResult.success 
                      ? 'bg-cyber-green/10 border border-cyber-green/30' 
                      : 'bg-cyber-red/10 border border-cyber-red/30'
                  }`}>
                    <p className={`text-sm ${lastResult.success ? 'text-cyber-green' : 'text-cyber-red'}`}>
                      {lastResult.message}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleSendPayment}
                  disabled={isSubmitting || !paymentForm.recipient || !paymentForm.amount}
                  className={`w-full py-4 rounded-lg font-medium text-lg flex items-center justify-center gap-2 ${
                    testMode
                      ? 'bg-cyber-cyan/20 border-2 border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/30'
                      : 'bg-cyber-green/20 border-2 border-cyber-green text-cyber-green hover:bg-cyber-green/30'
                  } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={20} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      {testMode ? 'Send Practice Payment' : 'Send Payment'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment History - Shows when clicked */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="cyber-panel p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-cyber text-cyber-purple flex items-center gap-2">
                  <History size={20} />
                  Payment History
                </h3>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="text-cyber-muted hover:text-cyber-text"
                >
                  <X size={20} />
                </button>
              </div>

              {recentPIEs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-cyber-muted">No payments yet</p>
                  <p className="text-xs text-cyber-muted/50 mt-1">
                    Send your first payment to see it here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentPIEs.slice(0, 10).map((pie, i) => (
                    <div 
                      key={pie.intent_id || i}
                      className="flex items-center justify-between p-3 rounded-lg bg-cyber-darker/50 border border-cyber-border"
                    >
                      <div className="flex items-center gap-3">
                        <SimpleStatusBadge status={pie.status} />
                        <div>
                          <p className="text-sm text-cyber-text">
                            {pie.amount} {pie.asset}
                          </p>
                          <p className="text-[10px] text-cyber-muted">
                            To: {pie.payee.slice(0, 10)}...{pie.payee.slice(-6)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-cyber-muted">
                          {new Date(pie.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-[10px] text-cyber-muted">
                          {new Date(pie.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* How It Works - Collapsed by default */}
      <details className="cyber-panel">
        <summary className="p-4 cursor-pointer flex items-center justify-between">
          <span className="flex items-center gap-2 text-cyber-cyan">
            <HelpCircle size={18} />
            <span className="font-cyber text-sm">How does this work?</span>
          </span>
          <ChevronRight size={16} className="text-cyber-muted" />
        </summary>
        <div className="px-4 pb-4 border-t border-cyber-border pt-4">
          <SimpleFlowExplainer />
          <p className="text-xs text-cyber-muted text-center mt-4">
            Every payment is checked, signed, and recorded automatically. 
            You get a full history for your tax records.
          </p>
        </div>
      </details>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="cyber-panel p-4 text-center">
          <div className="text-2xl font-bold text-cyber-cyan">{stats.totalPIEs}</div>
          <div className="text-xs text-cyber-muted">Total Payments</div>
        </div>
        <div className="cyber-panel p-4 text-center">
          <div className="text-2xl font-bold text-cyber-green">{stats.successfulRoutes}</div>
          <div className="text-xs text-cyber-muted">Successful</div>
        </div>
        <div className="cyber-panel p-4 text-center">
          <div className="text-2xl font-bold text-cyber-purple">${stats.totalGainLoss.toFixed(2)}</div>
          <div className="text-xs text-cyber-muted">Gain/Loss</div>
        </div>
      </div>

      {/* Switch to Advanced */}
      <div className="text-center pt-4 border-t border-cyber-border">
        <button
          onClick={onSwitchToAdvanced}
          className="text-xs text-cyber-muted hover:text-cyber-cyan flex items-center gap-1 mx-auto"
        >
          <Eye size={14} />
          Switch to Advanced Mode (for power users)
        </button>
      </div>
    </div>
  );
}

// ==================== MAIN PAGE ====================

export default function CARVPage() {
  const [viewMode, setViewMode] = useState<'simple' | 'agent' | 'advanced'>('simple');
  const [showWelcome, setShowWelcome] = useState(true);
  
  const {
    initialized,
    testMode,
    walletAddress,
    regimeSummary,
    dailyVolumeCap,
    maxSingleAmount,
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
    setDailyVolumeCap,
    setMaxSingleAmount,
    setWalletAddress,
    createPIE,
    forceBatch,
    generateTaxReport,
    downloadTaxCSV,
    clearEvents,
    reset,
  } = useCARVStore();

  // Initialize on mount
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  // Check if first time user (no transactions)
  const isFirstTime = stats.totalPIEs === 0;

  return (
    <div className="min-h-screen pt-20 pb-8 px-4 lg:px-8 max-w-6xl mx-auto">
      {/* View Mode Tabs */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <button
          onClick={() => setViewMode('simple')}
          className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
            viewMode === 'simple'
              ? 'bg-cyber-cyan/20 border border-cyber-cyan/50 text-cyber-cyan'
              : 'bg-cyber-darker border border-cyber-border text-cyber-muted hover:text-cyber-text'
          }`}
        >
          <Sparkles size={16} />
          Simple
        </button>
        <button
          onClick={() => setViewMode('agent')}
          className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
            viewMode === 'agent'
              ? 'bg-cyber-purple/20 border border-cyber-purple/50 text-cyber-purple'
              : 'bg-cyber-darker border border-cyber-border text-cyber-muted hover:text-cyber-text'
          }`}
        >
          <Bot size={16} />
          AI Agent
        </button>
        <button
          onClick={() => setViewMode('advanced')}
          className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
            viewMode === 'advanced'
              ? 'bg-cyber-green/20 border border-cyber-green/50 text-cyber-green'
              : 'bg-cyber-darker border border-cyber-border text-cyber-muted hover:text-cyber-text'
          }`}
        >
          <Settings size={16} />
          Advanced
        </button>
      </div>

      {/* Welcome Screen for First Time */}
      <AnimatePresence>
        {viewMode === 'simple' && showWelcome && isFirstTime && (
          <SimpleWelcome onDismiss={() => setShowWelcome(false)} />
        )}
      </AnimatePresence>

      {/* Main Content */}
      {viewMode === 'simple' && (
        <SimpleModeView
          testMode={testMode}
          setTestMode={setTestMode}
          dailyVolumeCap={dailyVolumeCap}
          currentDailyVolume={currentDailyVolume}
          stats={stats}
          recentPIEs={[...pendingPIEs, ...recentPIEs]}
          createPIE={createPIE}
          downloadTaxCSV={downloadTaxCSV}
          onSwitchToAdvanced={() => setViewMode('advanced')}
        />
      )}

      {viewMode === 'agent' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-[calc(100vh-200px)] min-h-[500px]"
        >
          <AgentPanel />
        </motion.div>
      )}

      {viewMode === 'advanced' && (
        // Advanced Mode - Original Full UI
        <AdvancedModeView
          initialized={initialized}
          testMode={testMode}
          walletAddress={walletAddress}
          regimeSummary={regimeSummary}
          dailyVolumeCap={dailyVolumeCap}
          maxSingleAmount={maxSingleAmount}
          currentDailyVolume={currentDailyVolume}
          pendingPIEs={pendingPIEs}
          recentPIEs={recentPIEs}
          batches={batches}
          ledgerEntries={ledgerEntries}
          taxLots={taxLots}
          venues={venues}
          events={events}
          stats={stats}
          setTestMode={setTestMode}
          setRegimeSummary={setRegimeSummary}
          setDailyVolumeCap={setDailyVolumeCap}
          setMaxSingleAmount={setMaxSingleAmount}
          setWalletAddress={setWalletAddress}
          createPIE={createPIE}
          forceBatch={forceBatch}
          generateTaxReport={generateTaxReport}
          downloadTaxCSV={downloadTaxCSV}
          clearEvents={clearEvents}
          reset={reset}
          onSwitchToSimple={() => setViewMode('simple')}
        />
      )}

      {/* Footer Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 p-3 rounded-lg bg-cyber-darker/30 border border-cyber-border/50"
      >
        <p className="text-[10px] text-cyber-muted text-center">
          ⚠️ This is practice software. Always double-check before sending real money. 
          Not financial advice. Keep your own records for taxes.
        </p>
      </motion.div>
    </div>
  );
}

// ==================== ADVANCED MODE VIEW ====================

function AdvancedModeView({
  initialized,
  testMode,
  walletAddress,
  regimeSummary,
  dailyVolumeCap,
  maxSingleAmount,
  currentDailyVolume,
  pendingPIEs,
  recentPIEs,
  batches,
  ledgerEntries,
  taxLots,
  venues,
  events,
  stats,
  setTestMode,
  setRegimeSummary,
  setDailyVolumeCap,
  setMaxSingleAmount,
  setWalletAddress,
  createPIE,
  forceBatch,
  generateTaxReport,
  downloadTaxCSV,
  clearEvents,
  reset,
  onSwitchToSimple,
}: any) {
  return (
    <div className="space-y-6">
      {/* Advanced Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            testMode ? 'bg-cyber-yellow/20' : 'bg-cyber-green/20'
          }`}>
            <Shield className={`w-6 h-6 ${testMode ? 'text-cyber-yellow' : 'text-cyber-green'}`} />
          </div>
          <div>
            <h1 className="font-cyber text-xl text-cyber-text flex items-center gap-2">
              CARV CO-PROCESSOR
              <span className={`px-2 py-0.5 rounded text-xs border ${
                testMode 
                  ? 'bg-cyber-yellow/20 text-cyber-yellow border-cyber-yellow/30' 
                  : 'bg-cyber-green/20 text-cyber-green border-cyber-green/30'
              }`}>
                {testMode ? 'TEST' : 'LIVE'}
              </span>
            </h1>
            <p className="text-xs text-cyber-muted">
              Compute → Validate → Attest → Route → Account
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSwitchToSimple}
            className="px-3 py-1.5 rounded border border-cyber-cyan/50 text-cyber-cyan text-xs hover:bg-cyber-cyan/10 flex items-center gap-1"
          >
            <EyeOff size={14} />
            Simple Mode
          </button>
          <button
            onClick={() => setTestMode(!testMode)}
            className={`px-3 py-1.5 rounded border text-xs flex items-center gap-2 ${
              testMode 
                ? 'border-cyber-yellow/50 text-cyber-yellow hover:bg-cyber-yellow/10' 
                : 'border-cyber-green/50 text-cyber-green hover:bg-cyber-green/10'
            }`}
          >
            {testMode ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
            {testMode ? 'Test' : 'Live'}
          </button>
        </div>
      </div>

      {/* Live Mode Warning */}
      {!testMode && (
        <div className="p-3 rounded bg-cyber-red/10 border border-cyber-red/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-cyber-red shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-cyber-red font-medium">LIVE MODE - Real Money!</p>
            <p className="text-xs text-cyber-muted mt-1">
              Transactions will use real funds. Be careful!
            </p>
          </div>
        </div>
      )}

      {/* Main Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8">
          <CARVDashboard />
        </div>

        <div className="lg:col-span-4 space-y-4">
          {/* Config Panel */}
          <div className="cyber-panel p-4">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-cyber-border">
              <Settings size={16} className="text-cyber-cyan" />
              <span className="font-cyber text-sm text-cyber-cyan">SETTINGS</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-cyber-muted">Wallet Address</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 bg-cyber-darker border border-cyber-border rounded text-xs text-cyber-text font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-cyber-muted">Daily Limit</label>
                  <input
                    type="number"
                    step="0.1"
                    value={dailyVolumeCap}
                    onChange={(e) => setDailyVolumeCap(parseFloat(e.target.value))}
                    className="w-full mt-1 px-2 py-1.5 bg-cyber-darker border border-cyber-border rounded text-xs text-cyber-text"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-cyber-muted">Max Per Payment</label>
                  <input
                    type="number"
                    step="0.01"
                    value={maxSingleAmount}
                    onChange={(e) => setMaxSingleAmount(parseFloat(e.target.value))}
                    className="w-full mt-1 px-2 py-1.5 bg-cyber-darker border border-cyber-border rounded text-xs text-cyber-text"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={clearEvents}
                  className="flex-1 px-2 py-1.5 rounded border border-cyber-border text-cyber-muted hover:text-cyber-text text-xs"
                >
                  Clear Log
                </button>
                <button
                  onClick={reset}
                  className="flex-1 px-2 py-1.5 rounded border border-cyber-red/50 text-cyber-red hover:bg-cyber-red/10 text-xs"
                >
                  Reset All
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="cyber-panel p-4">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-cyber-border">
              <Activity size={16} className="text-cyber-purple" />
              <span className="font-cyber text-sm text-cyber-purple">STATS</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-cyber-muted">Total Payments</span>
                <span className="text-cyber-text">{stats.totalPIEs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyber-muted">Successful</span>
                <span className="text-cyber-green">{stats.successfulRoutes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyber-muted">Failed</span>
                <span className="text-cyber-red">{stats.failedRoutes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyber-muted">Gain/Loss</span>
                <span className={stats.totalGainLoss >= 0 ? 'text-cyber-green' : 'text-cyber-red'}>
                  ${stats.totalGainLoss.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyber-muted">Daily Used</span>
                <span className="text-cyber-text">{currentDailyVolume.toFixed(4)} / {dailyVolumeCap}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={forceBatch}
              disabled={pendingPIEs.length === 0}
              className="px-3 py-2 rounded bg-cyber-purple/20 border border-cyber-purple/50 text-cyber-purple text-xs hover:bg-cyber-purple/30 disabled:opacity-50"
            >
              Force Batch
            </button>
            <button
              onClick={() => downloadTaxCSV(
                new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
                new Date().toISOString().split('T')[0]
              )}
              className="px-3 py-2 rounded bg-cyber-green/20 border border-cyber-green/50 text-cyber-green text-xs hover:bg-cyber-green/30"
            >
              Export Tax CSV
            </button>
          </div>
        </div>
      </div>

      {/* Event Log */}
      <div className="cyber-panel p-4">
        <EventLog events={events} maxDisplay={15} />
      </div>
    </div>
  );
}
