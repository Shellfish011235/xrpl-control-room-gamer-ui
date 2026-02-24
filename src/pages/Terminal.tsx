// Terminal Page - Institutional Trading Terminal
// Combines all institutional-grade features into one powerful view

import React, { useState, useEffect, Component, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, Maximize2, Minimize2,
  Bell, Clock, AlertTriangle, Pause, Play, Shield
} from 'lucide-react';

import { useAlertStore, useAlertInitialization } from '../services/alertNotifications';

// Direct imports with error boundaries
import { LiquidationHeatmap } from '../components/institutional/LiquidationHeatmap';
import { RiskDashboard } from '../components/institutional/RiskDashboard';
import { AlertBuilder } from '../components/institutional/AlertBuilder';
import { PositionLiquidationRisk } from '../components/institutional/PositionLiquidationRisk';
import { PaperTradingPanel } from '../components/PaperTradingPanel';
import { LedgerImpactTool } from '../components/LedgerImpactTool';
import { LedgerImpactAnalyzer } from '../components/LedgerImpactAnalyzer';
import { PathfindingTool } from '../components/PathfindingTool';
import { StrategiesPanel } from '../components/strategies';
import { useOrchestra, publishToControlRoom } from '../orchestra';
import { xamanService } from '../services/xaman';
import { useStrategyStore } from '../store/strategyStore';
import { useWalletStore } from '../store/walletStore';
import { useXRPPrice } from '../services/websocketPriceFeeds';

// Error Boundary to catch component crashes
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Terminal] Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="cyber-panel p-4 flex flex-col items-center justify-center min-h-[200px] text-center">
          <AlertTriangle className="w-8 h-8 text-cyber-yellow mb-2" />
          <p className="text-cyber-yellow text-sm">Component failed to load</p>
          <p className="text-cyber-muted text-xs mt-1">Please refresh the page</p>
          {this.state.error && (
            <p className="text-cyber-muted text-[10px] mt-2 max-w-full truncate px-2" title={this.state.error.message}>
              {this.state.error.message}
            </p>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Terminal() {
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { price: xrpPrice, source: priceSource, loading: priceLoading, error: priceError } = useXRPPrice();

  useAlertInitialization();
  const { killSwitch, setKillSwitch, mode, setMode, lastPlanReadyForSign, dismissPlanReady } = useOrchestra({
    includeStrategyAgents: true,
    startImmediately: true,
  });
  const walletAddress = useStrategyStore((s) => s.walletAddress);
  const activeWallet = useWalletStore((s) => {
    const id = s.activeWalletId;
    return id ? s.wallets.find((w) => w.id === id) : null;
  });
  // Sync connected wallet to strategy store so Grid/DCA/MM/Arb use it for real XRP
  useEffect(() => {
    if (activeWallet?.address) useStrategyStore.getState().setWalletAddress(activeWallet.address);
  }, [activeWallet?.address]);
  const [planSigning, setPlanSigning] = useState(false);
  const [planSignError, setPlanSignError] = useState<string | null>(null);
  const [reconciledSuccess, setReconciledSuccess] = useState(false);
  const unreadAlerts = useAlertStore(state => state.getUnreadCount());

  // Clear "Verified on ledger" after 4s
  useEffect(() => {
    if (!reconciledSuccess) return;
    const t = setTimeout(() => setReconciledSuccess(false), 4000);
    return () => clearTimeout(t);
  }, [reconciledSuccess]);

  const priceSourceLabel =
    priceLoading
      ? 'Loading…'
      : priceSource === 'binance-ws'
        ? 'Binance (WebSocket)'
        : priceSource === 'coingecko'
          ? 'CoinGecko (live)'
          : priceSource === 'binance'
            ? 'Binance (live)'
            : priceSource === 'fallback'
              ? 'Fallback (APIs unavailable)'
              : '—';
  
  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="min-h-screen pt-20 pb-8 px-4 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyber-cyan/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-cyber-cyan" />
            </div>
            <div>
              <h1 className="font-cyber text-xl text-cyber-text">TRADING TERMINAL</h1>
              <p className="text-xs text-cyber-muted">Institutional-Grade Analytics</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Alert Badge */}
            {unreadAlerts > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-cyber-yellow/10 border border-cyber-yellow/30">
                <Bell className="w-4 h-4 text-cyber-yellow" />
                <span className="text-xs text-cyber-yellow">{unreadAlerts} alerts</span>
              </div>
            )}
            
            {/* Price source badge */}
            {!priceLoading && priceSource && (
              <span className="text-[10px] text-cyber-muted px-2 py-0.5 rounded bg-cyber-darker/80" title="Price feed source">
                Price: {priceSource === 'binance-ws' ? 'Binance (WS)' : priceSource === 'coingecko' ? 'CoinGecko' : priceSource === 'binance' ? 'Binance' : 'Fallback'}
              </span>
            )}
            {priceError && (
              <span className="text-[10px] text-cyber-yellow px-2 py-0.5 rounded bg-cyber-darker/80" title="Price feed error">
                {priceError}
              </span>
            )}
            {/* Time */}
            <div className="flex items-center gap-2 text-cyber-muted">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-mono">
                {currentTime.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mode + Orchestra: Simulate (no sign) vs Live (real XRP via Xaman) */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-cyber-border bg-cyber-darker"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-cyber-muted uppercase tracking-wider">Strategy mode</span>
            <div className="flex rounded-lg border border-cyber-border overflow-hidden">
              <button
                type="button"
                onClick={() => setMode('SIMULATE')}
                className={`px-3 py-1.5 text-xs font-cyber transition-colors ${mode === 'SIMULATE' ? 'bg-cyber-cyan/20 text-cyber-cyan border-r border-cyber-border' : 'text-cyber-muted hover:text-cyber-text'}`}
                title="Agents suggest trades; no real signing"
              >
                Simulate
              </button>
              <button
                type="button"
                onClick={() => setMode('LIVE')}
                className={`px-3 py-1.5 text-xs font-cyber transition-colors ${mode === 'LIVE' ? 'bg-cyber-green/20 text-cyber-green' : 'text-cyber-muted hover:text-cyber-text'}`}
                title="Plans require your sign in Xaman (real XRP)"
              >
                Live (real XRP)
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield className={`w-4 h-4 ${killSwitch ? 'text-cyber-yellow' : 'text-cyber-green'}`} />
            <span className="text-xs font-cyber text-cyber-text">
              Agents: {killSwitch ? 'Paused' : 'Running'}
            </span>
            <button
              type="button"
              onClick={() => setKillSwitch(!killSwitch)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-cyber transition-colors ${
                killSwitch ? 'border-cyber-green/50 text-cyber-green bg-cyber-green/10' : 'border-cyber-yellow/50 text-cyber-yellow bg-cyber-yellow/10'
              }`}
            >
              {killSwitch ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              {killSwitch ? 'Resume' : 'Pause'}
            </button>
          </div>
        </div>
        {mode === 'LIVE' && (
          <p className="text-[10px] text-cyber-muted w-full lg:w-auto">
            {walletAddress
              ? `Wallet: ${walletAddress.slice(0, 8)}…${walletAddress.slice(-4)} — sign in Xaman when a plan appears.`
              : 'Connect a wallet (Profile or header) to use Grid/DCA/MM with real XRP.'}
          </p>
        )}
      </motion.div>

      {/* LIVE: Plan ready for sign – show Sign in Xaman and publish EXECUTION_RESULT on success */}
      {mode === 'LIVE' && lastPlanReadyForSign && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-cyber-cyan/40 bg-cyber-darker"
        >
          <span className="text-xs font-cyber text-cyber-text">
            Plan ready ({lastPlanReadyForSign.xrplTxs.length} tx) – sign in Xaman to submit
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={planSigning || !walletAddress || !lastPlanReadyForSign.xrplTxs.length}
              onClick={async () => {
                const plan = lastPlanReadyForSign;
                if (!plan?.xrplTxs.length || !walletAddress) return;
                setPlanSigning(true);
                setPlanSignError(null);
                const onSigned = async (req: { txHash?: string }) => {
                  const txHashes = req.txHash ? [req.txHash] : undefined;
                  publishToControlRoom({
                    type: 'EXECUTION_RESULT',
                    planId: plan.id,
                    ok: true,
                    txHashes,
                    plan,
                  });
                  dismissPlanReady(plan.id);
                  setPlanSigning(false);
                  setPlanSignError(null);
                  xamanService.off('signingSigned', onSigned);
                  xamanService.off('signingRejected', onRejected);
                  xamanService.off('signingExpired', onExpired);
                  if (txHashes?.length) {
                    try {
                      const { reconcileAfterExecute } = await import('../orchestra/execution');
                      const result = await reconcileAfterExecute(plan, txHashes);
                      if (result.ok) setReconciledSuccess(true);
                    } catch (_) {
                      // Verification best-effort; plan already recorded
                    }
                  }
                };
                const onRejected = () => {
                  setPlanSigning(false);
                  setPlanSignError('Signing rejected or expired.');
                  xamanService.off('signingSigned', onSigned);
                  xamanService.off('signingRejected', onRejected);
                  xamanService.off('signingExpired', onExpired);
                };
                const onExpired = () => {
                  setPlanSigning(false);
                  setPlanSignError('Signing request expired.');
                  xamanService.off('signingSigned', onSigned);
                  xamanService.off('signingRejected', onRejected);
                  xamanService.off('signingExpired', onExpired);
                };
                xamanService.on('signingSigned', onSigned);
                xamanService.on('signingRejected', onRejected);
                xamanService.on('signingExpired', onExpired);
                try {
                  await xamanService.requestCustomTransactionSignature(
                    plan.xrplTxs[0].payload as any,
                    walletAddress
                  );
                } catch (e) {
                  console.error('[Terminal] Plan sign request failed:', e);
                  setPlanSigning(false);
                  setPlanSignError(e instanceof Error ? e.message : 'Failed to start signing');
                  xamanService.off('signingSigned', onSigned);
                  xamanService.off('signingRejected', onRejected);
                  xamanService.off('signingExpired', onExpired);
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-cyber-cyan/50 text-cyber-cyan bg-cyber-cyan/10 hover:bg-cyber-cyan/20 disabled:opacity-50 text-xs font-cyber"
            >
              {planSigning ? 'Opening Xaman…' : 'Sign in Xaman'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (lastPlanReadyForSign) {
                  dismissPlanReady(lastPlanReadyForSign.id);
                  setPlanSignError(null);
                }
              }}
              className="px-3 py-1.5 rounded-lg border border-cyber-muted/50 text-cyber-muted hover:bg-cyber-muted/10 text-xs font-cyber"
            >
              Dismiss
            </button>
          </div>
          {planSignError && (
            <p className="mt-2 text-xs text-cyber-yellow" role="alert">
              {planSignError}
            </p>
          )}
        </motion.div>
      )}

      {/* LIVE: brief success after reconcile */}
      {reconciledSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mb-4 px-4 py-2 rounded-lg border border-cyber-green/50 bg-cyber-green/10 text-cyber-green text-xs font-cyber"
          role="status"
        >
          Verified on ledger. Strategy PnL and exposure updated.
        </motion.div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column - Liquidation Heatmap */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className={`${expandedPanel === 'heatmap' ? 'lg:col-span-12' : 'lg:col-span-4'}`}
        >
          <div className="relative">
            <button
              onClick={() => setExpandedPanel(expandedPanel === 'heatmap' ? null : 'heatmap')}
              className="absolute top-3 right-3 z-10 p-1 rounded bg-cyber-darker/80 text-cyber-muted hover:text-cyber-cyan"
            >
              {expandedPanel === 'heatmap' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            {priceLoading ? (
              <div className="cyber-panel p-4 flex items-center justify-center min-h-[300px]">
                <Activity className="w-6 h-6 text-cyber-cyan animate-spin" />
                <span className="ml-2 text-cyber-muted">Loading live price...</span>
              </div>
            ) : (
              <ErrorBoundary>
                <div>
                  <LiquidationHeatmap 
                    symbol="XRP" 
                    currentPrice={xrpPrice}
                    compact={expandedPanel !== 'heatmap'}
                  />
                  <div className="text-[9px] text-cyber-muted text-right mt-1 pr-2" aria-label="Liquidation heatmap price source">
                    Price: {priceSourceLabel}
                  </div>
                </div>
              </ErrorBoundary>
            )}
          </div>
        </motion.div>
        
        {/* Center Column - XRPL Pathfinding */}
        {expandedPanel !== 'heatmap' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`${expandedPanel === 'pathfinding' ? 'lg:col-span-12' : 'lg:col-span-4'}`}
          >
            <div className="relative">
              <button
                onClick={() => setExpandedPanel(expandedPanel === 'pathfinding' ? null : 'pathfinding')}
                className="absolute top-3 right-3 z-10 p-1 rounded bg-cyber-darker/80 text-cyber-muted hover:text-cyber-cyan"
              >
                {expandedPanel === 'pathfinding' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <ErrorBoundary>
                <PathfindingTool compact={expandedPanel !== 'pathfinding'} />
              </ErrorBoundary>
            </div>
          </motion.div>
        )}
        
        {/* Right Column - Risk Dashboard */}
        {expandedPanel !== 'heatmap' && expandedPanel !== 'pathfinding' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={`${expandedPanel === 'risk' ? 'lg:col-span-12' : 'lg:col-span-4'}`}
          >
            <div className="relative">
              <button
                onClick={() => setExpandedPanel(expandedPanel === 'risk' ? null : 'risk')}
                className="absolute top-3 right-3 z-10 p-1 rounded bg-cyber-darker/80 text-cyber-muted hover:text-cyber-cyan"
              >
                {expandedPanel === 'risk' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <ErrorBoundary>
                <RiskDashboard compact={expandedPanel !== 'risk'} />
              </ErrorBoundary>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Position Liquidation Risk Monitor - Full Width */}
      {!priceLoading && xrpPrice > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-4"
        >
          <ErrorBoundary>
            <PositionLiquidationRisk
              currentPrice={xrpPrice}
              priceSourceLabel={priceSourceLabel}
            />
          </ErrorBoundary>
        </motion.div>
      )}

      {/* Strategies: DCA / MM / Arb toggles, PnL gauge, DCA chart, arb heatmap, ladder */}
      {!priceLoading && xrpPrice > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="mt-4"
        >
          <ErrorBoundary>
            <StrategiesPanel
              currentPrice={xrpPrice}
              killSwitch={killSwitch}
              setKillSwitch={setKillSwitch}
            />
          </ErrorBoundary>
        </motion.div>
      )}
      
      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ErrorBoundary>
            <AlertBuilder compact />
          </ErrorBoundary>
        </motion.div>
        
        {/* Ledger Impact Tool with Amendment Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <ErrorBoundary>
            <LedgerImpactTool />
          </ErrorBoundary>
        </motion.div>

        {/* Ledger Impact Analyzer — agent-powered neon impact score + high-impact warning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.46 }}
        >
          <ErrorBoundary>
            <LedgerImpactAnalyzer />
          </ErrorBoundary>
        </motion.div>
        
        {/* Paper Trading — Orchestra suggestion is in the Auto tab; Apply sends payments to Micropayments → AI Agents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <ErrorBoundary fallback={<PaperTradingPanel useLiveFeeds={false} />}>
            <PaperTradingPanel currentPrices={xrpPrice > 0 ? { XRP: xrpPrice } : undefined} />
          </ErrorBoundary>
        </motion.div>
      </div>
      
    </div>
  );
}
