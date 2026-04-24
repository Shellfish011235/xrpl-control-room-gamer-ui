/**
 * Private Quant Lab v0.1 — client-side simulation only. No keys, no submission, no custody.
 */

import { useState } from 'react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { usePrivateQuantStore } from '../../store/privateQuantStore';
import { useOptimizerStore } from '../../store/optimizerStore';
import { FlaskConical, Shield, Lock, Ban, AlertCircle, LineChart, ExternalLink, FileBarChart } from 'lucide-react';
import {
  COPY_KILL_SWITCH,
  COPY_PAPER_TRADING_LOCAL,
  COPY_PRIVATE_QUANT_SIMULATION_ONLY,
  COPY_SIMULATED_ACCOUNTING,
  importOptimizerDisabledReason,
  openPaperTradeDisabledReason,
  runSampleDisabledReason,
} from './dashboardSafetyCopy';

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-cyber uppercase tracking-wide',
        className
      )}
    >
      {children}
    </span>
  );
}

export function PrivateQuantLabPanel() {
  const privateQuantEnabled = usePrivateQuantStore((s) => s.privateQuantEnabled);
  const mode = usePrivateQuantStore((s) => s.mode);
  const killSwitch = usePrivateQuantStore((s) => s.killSwitch);
  const riskBudgetXRP = usePrivateQuantStore((s) => s.riskBudgetXRP);
  const maxSimulatedExposureXRP = usePrivateQuantStore((s) => s.maxSimulatedExposureXRP);
  const opportunities = usePrivateQuantStore((s) => s.opportunities);
  const receipts = usePrivateQuantStore((s) => s.receipts);
  const accountingSnapshot = usePrivateQuantStore((s) => s.accountingSnapshot);
  const paperTrades = usePrivateQuantStore((s) => s.paperTrades);
  const paperStats = usePrivateQuantStore((s) => s.paperStats);

  const setPrivateQuantEnabled = usePrivateQuantStore((s) => s.setPrivateQuantEnabled);
  const setKillSwitch = usePrivateQuantStore((s) => s.setKillSwitch);
  const setRiskBudgetXRP = usePrivateQuantStore((s) => s.setRiskBudgetXRP);
  const setMaxSimulatedExposureXRP = usePrivateQuantStore((s) => s.setMaxSimulatedExposureXRP);
  const runSampleSimulation = usePrivateQuantStore((s) => s.runSampleSimulation);
  const importOptimizerPath = usePrivateQuantStore((s) => s.importOptimizerPath);
  const clearOpportunities = usePrivateQuantStore((s) => s.clearOpportunities);
  const clearReceipts = usePrivateQuantStore((s) => s.clearReceipts);
  const openPaperTrade = usePrivateQuantStore((s) => s.openPaperTrade);
  const closePaperTrade = usePrivateQuantStore((s) => s.closePaperTrade);
  const clearPaperTrades = usePrivateQuantStore((s) => s.clearPaperTrades);
  const rankedPaths = useOptimizerStore((s) => s.rankedPaths);
  const bestPath = rankedPaths[0];

  const [paperSizeXRP, setPaperSizeXRP] = useState(50);

  const canRun = privateQuantEnabled && !killSwitch;
  const canImportOptimizer = canRun && rankedPaths.length > 0;
  const runSampleWhyDisabled = runSampleDisabledReason(privateQuantEnabled, killSwitch);
  const importWhyDisabled = importOptimizerDisabledReason(privateQuantEnabled, killSwitch, rankedPaths.length);

  return (
    <div className="max-w-5xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-cyber text-cyber-glow">Private Quant Lab</h1>
        <p className="text-xs text-cyber-muted">
          Mode: {mode} · {COPY_PRIVATE_QUANT_SIMULATION_ONLY} Not a product offering or financial advice.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge className="border-cyber-cyan/50 text-cyber-cyan">Private Mode</Badge>
        <Badge className="border-emerald-500/50 text-emerald-300">Simulation Only</Badge>
        <Badge className="border-amber-500/50 text-amber-200">Mainnet Execution Disabled</Badge>
        <Badge className="border-violet-500/50 text-violet-200">No Custody</Badge>
      </div>

      <div
        className="rounded-lg border border-[var(--cyber-border)] bg-[var(--cyber-dark)]/50 p-3 text-sm text-cyber-muted leading-relaxed"
        role="note"
      >
        <p className="font-cyber text-xs text-cyber-text mb-1">Safety</p>
        <p>
          {COPY_PAPER_TRADING_LOCAL} This module does not custody funds, collect private keys, or submit transactions. Any
          real mainnet action would require your external wallet and legal/compliance review.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="neon-panel flex items-center justify-between gap-3 cursor-pointer">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 text-cyber-cyan shrink-0" />
            <span className="text-sm font-cyber">Enable Private Quant Lab</span>
          </div>
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-cyber-border"
            checked={privateQuantEnabled}
            onChange={(e) => setPrivateQuantEnabled(e.target.checked)}
          />
        </label>
        <div className="neon-panel space-y-1.5">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div className="flex items-center gap-2 min-w-0">
              <Ban className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-sm font-cyber">Kill switch (stops new simulations and paper)</span>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-cyber-border"
              checked={killSwitch}
              onChange={(e) => setKillSwitch(e.target.checked)}
              title={COPY_KILL_SWITCH}
            />
          </label>
          <p className="text-[10px] text-amber-200/80 pl-0.5 leading-relaxed">{COPY_KILL_SWITCH}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="neon-panel space-y-2">
          <h3 className="text-sm font-cyber text-cyber-glow">Risk budget (simulation cap)</h3>
          <label className="text-xs text-cyber-muted block">Risk budget (XRP, not on-chain)</label>
          <input
            type="number"
            min={0}
            className="w-full rounded border border-[var(--cyber-border)] bg-[var(--cyber-darker)] px-2 py-1.5 text-sm font-mono text-cyber-text"
            value={riskBudgetXRP}
            onChange={(e) => setRiskBudgetXRP(Number(e.target.value))}
          />
        </div>
        <div className="neon-panel space-y-2">
          <h3 className="text-sm font-cyber text-cyber-glow">Max simulated exposure (XRP)</h3>
          <label className="text-xs text-cyber-muted block">Not a wallet balance — local limit only</label>
          <input
            type="number"
            min={0}
            className="w-full rounded border border-[var(--cyber-border)] bg-[var(--cyber-darker)] px-2 py-1.5 text-sm font-mono text-cyber-text"
            value={maxSimulatedExposureXRP}
            onChange={(e) => setMaxSimulatedExposureXRP(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="neon-panel space-y-3">
        <h3 className="text-sm font-cyber text-cyber-glow flex items-center gap-2">
          <LineChart className="w-4 h-4 text-cyber-cyan" />
          Optimizer import
        </h3>
        <p className="text-xs text-cyber-muted">
          Connect ranked paths from <strong className="text-cyber-text">Liquidity Nexus</strong> (Path Optimizer) for local
          only simulation. Run Liquidity Nexus first, then import the best ranked path for simulation.
        </p>
        <p className="text-xs text-cyber-cyan/90">
          Paths in store: <span className="font-mono text-cyber-text">{rankedPaths.length}</span>
        </p>
        {bestPath && (
          <div className="text-xs text-cyber-text space-y-0.5 rounded border border-[var(--cyber-border)] bg-[var(--cyber-darker)]/50 p-2">
            <p>
              <span className="text-cyber-muted">Best path: </span>
              {bestPath.label}
            </p>
            <p className="font-mono text-[11px]">
              cost {bestPath.costScore} · speed {bestPath.speedScore} · risk {bestPath.riskScore} · {bestPath.source} →{' '}
              {bestPath.dest} ({bestPath.type})
            </p>
          </div>
        )}
        {!bestPath && (
          <p className="text-xs text-amber-200/90">
            No ranked paths in memory. Open Liquidity Nexus, run a path search, then return here to import.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!canImportOptimizer}
            onClick={() => bestPath && importOptimizerPath(bestPath)}
            title={importWhyDisabled ?? 'Import the top-ranked path from memory into this simulation (no on-chain effect).'}
            className="neon-button text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import best optimizer path
          </button>
          <Link
            to="/tools/optimizer"
            className="inline-flex items-center gap-1.5 text-xs text-cyber-cyan border border-cyber-cyan/50 rounded-lg px-3 py-1.5 hover:bg-cyber-cyan/10"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Liquidity Nexus
          </Link>
        </div>
        {importWhyDisabled && (
          <p className="text-[10px] text-cyber-yellow" role="status">
            {importWhyDisabled}
          </p>
        )}
      </div>

      <div className="neon-panel space-y-2">
        <h3 className="text-sm font-cyber text-cyber-glow flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-cyber-cyan" />
          Simulated accounting (mock ledger — not TigerBeetle, not ILP, not a bank)
        </h3>
        <p className="text-[10px] text-cyber-muted leading-relaxed">{COPY_SIMULATED_ACCOUNTING}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-cyber-muted">Simulated balance (XRP)</span>
            <p className="font-mono text-cyber-text">{accountingSnapshot.simulatedBalanceXRP}</p>
          </div>
          <div>
            <span className="text-cyber-muted">Reserved (XRP)</span>
            <p className="font-mono text-cyber-text">{accountingSnapshot.reservedCapitalXRP}</p>
          </div>
          <div>
            <span className="text-cyber-muted">Paper PnL (XRP)</span>
            <p className="font-mono text-cyber-text">{accountingSnapshot.paperPnlXRP}</p>
          </div>
          <div>
            <span className="text-cyber-muted">Fees (sim, XRP)</span>
            <p className="font-mono text-cyber-text">{accountingSnapshot.feesPaidXRP}</p>
          </div>
          <div>
            <span className="text-cyber-muted">Failed routes (sim)</span>
            <p className="font-mono text-cyber-text">{accountingSnapshot.failedRoutes}</p>
          </div>
          <div>
            <span className="text-cyber-muted">Winning routes (sim)</span>
            <p className="font-mono text-cyber-text">{accountingSnapshot.winningRoutes}</p>
          </div>
          <div className="col-span-2 sm:col-span-3">
            <span className="text-cyber-muted">Risk budget used (mock %)</span>
            <p className="font-mono text-cyber-text">{accountingSnapshot.riskBudgetUsedPct}%</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => runSampleSimulation()}
          disabled={!canRun}
          title={runSampleWhyDisabled ?? 'Generate a local sample opportunity and accounting row (simulation only).'}
          className="neon-button text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Run sample simulation
        </button>
        {runSampleWhyDisabled && (
          <span className="text-xs text-cyber-yellow" title={runSampleWhyDisabled}>
            {runSampleWhyDisabled}
          </span>
        )}
        <button
          type="button"
          onClick={() => {
            clearOpportunities();
            clearReceipts();
          }}
          className="text-xs text-cyber-muted hover:text-cyber-cyan"
        >
          Clear tables
        </button>
      </div>
      <div className="flex items-start gap-2 text-[10px] text-cyber-muted">
        <Lock className="w-3.5 h-3.5 text-cyber-cyan mt-0.5 shrink-0" />
        <span>No private keys, seeds, or transaction signing in this module. Sample data is generated in-browser only.</span>
      </div>

      <div className="neon-panel space-y-3">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <h3 className="text-sm font-cyber text-cyber-glow flex items-center gap-2">
            <FileBarChart className="w-4 h-4 text-cyber-cyan" />
            Paper Trading / Backtest v0.1
          </h3>
          <Badge className="border-amber-500/50 text-amber-200">Local simulation only</Badge>
        </div>
        <p className="text-[11px] text-cyber-muted">
          In-browser backtest of opportunities only. No wallet, signing, or chain submission.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="rounded border border-[var(--cyber-border)] bg-[var(--cyber-darker)]/50 p-2">
            <span className="text-cyber-muted block">Total trades</span>
            <p className="font-mono text-cyber-glow text-sm">{paperStats.totalTrades}</p>
          </div>
          <div className="rounded border border-[var(--cyber-border)] bg-[var(--cyber-darker)]/50 p-2">
            <span className="text-cyber-muted block">Win rate</span>
            <p className="font-mono text-cyber-glow text-sm">
              {paperStats.winRatePct.toFixed(1)}% <span className="text-cyber-muted text-[10px]">(W/L only)</span>
            </p>
          </div>
          <div className="rounded border border-[var(--cyber-border)] bg-[var(--cyber-darker)]/50 p-2">
            <span className="text-cyber-muted block">Total paper PnL (XRP)</span>
            <p className="font-mono text-cyber-glow text-sm">{paperStats.totalPnlXRP.toFixed(4)}</p>
          </div>
          <div className="rounded border border-[var(--cyber-border)] bg-[var(--cyber-darker)]/50 p-2">
            <span className="text-cyber-muted block">Max drawdown (XRP)</span>
            <p className="font-mono text-cyber-glow text-sm">{paperStats.maxDrawdownXRP.toFixed(4)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-cyber-muted block space-y-1">
            <span>Default notional (XRP, local cap)</span>
            <input
              type="number"
              min={0.000001}
              step="any"
              className="block w-40 rounded border border-[var(--cyber-border)] bg-[var(--cyber-darker)] px-2 py-1.5 text-sm font-mono text-cyber-text"
              value={paperSizeXRP}
              onChange={(e) => setPaperSizeXRP(Number(e.target.value))}
              title="Used for new paper rows only. Enter a value greater than 0 or Open paper trade stays disabled."
            />
          </label>
        </div>
        {paperSizeXRP <= 0 && (
          <p className="text-[10px] text-amber-200/90" role="status">
            Notional must be greater than 0 XRP to open a paper position (local simulation cap still applies).
          </p>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-cyber text-cyber-cyan flex items-center gap-2">Opportunities (simulation)</h3>
        <div className="overflow-x-auto rounded border border-[var(--cyber-border)]">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--cyber-border)] bg-[var(--cyber-darker)]/80 text-cyber-muted uppercase tracking-wider">
                <th className="p-2">Pair / route</th>
                <th className="p-2">Venues</th>
                <th className="p-2">Edge bps</th>
                <th className="p-2">Rec</th>
                <th className="p-2">Exec</th>
                <th className="p-2">Paper</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-cyber-muted">
                    No rows yet. Run a sample, or import the best path from Optimizer (Liquidity Nexus) when paths exist.
                  </td>
                </tr>
              )}
              {opportunities.map((o) => {
                const paperWhy = openPaperTradeDisabledReason(
                  privateQuantEnabled,
                  killSwitch,
                  opportunities.length > 0,
                  paperSizeXRP,
                  o.recommendation
                );
                const canOpenThis = paperWhy === null;
                return (
                <tr key={o.id} className="border-b border-[var(--cyber-border)]/50 hover:bg-white/[0.02]">
                  <td className="p-2 font-mono text-cyber-text">
                    {o.pair}
                    <span className="text-cyber-muted block text-[10px]">{o.routeType}</span>
                  </td>
                  <td className="p-2 text-cyber-muted">
                    {o.sourceVenue} → {o.targetVenue}
                  </td>
                  <td className="p-2 font-mono text-cyber-glow">{o.effectiveEdgeBps.toFixed(1)}</td>
                  <td className="p-2">{o.recommendation}</td>
                  <td className="p-2 text-cyber-red/90">{o.executionEnabled ? 'true' : 'false'}</td>
                  <td className="p-2">
                    <button
                      type="button"
                      disabled={!canOpenThis}
                      onClick={() => openPaperTrade(o.id, paperSizeXRP)}
                      title={paperWhy ?? 'Add a local-only paper position for this row (not on-chain).'}
                      className="whitespace-nowrap text-[11px] rounded border border-cyber-cyan/40 px-2 py-1 text-cyber-cyan hover:bg-cyber-cyan/10 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Open paper trade
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!canRun && (
          <p className="text-[10px] text-cyber-yellow">Enable the lab and release the kill switch to open paper trades (still simulation-only).</p>
        )}
        {canRun && opportunities.length === 0 && (
          <p className="text-[10px] text-cyber-muted">Add opportunities to open paper positions.</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-cyber text-cyber-cyan">Paper trades (local)</h3>
          <button
            type="button"
            onClick={() => clearPaperTrades()}
            className="text-xs text-amber-200/90 border border-amber-500/40 rounded px-2 py-1 hover:bg-amber-500/10"
          >
            Clear paper trades
          </button>
        </div>
        <div className="overflow-x-auto rounded border border-[var(--cyber-border)]">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--cyber-border)] bg-[var(--cyber-darker)]/80 text-cyber-muted uppercase tracking-wider">
                <th className="p-2">Pair</th>
                <th className="p-2">Size (XRP)</th>
                <th className="p-2">Entry edge (bps)</th>
                <th className="p-2">Status</th>
                <th className="p-2">Paper PnL (XRP)</th>
                <th className="p-2">Close</th>
              </tr>
            </thead>
            <tbody>
              {paperTrades.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-cyber-muted">
                    No paper positions yet. Open a trade from an opportunity row above.
                  </td>
                </tr>
              )}
              {paperTrades.map((t) => (
                <tr key={t.id} className="border-b border-[var(--cyber-border)]/50 hover:bg-white/[0.02]">
                  <td className="p-2 font-mono text-cyber-text">{t.pair}</td>
                  <td className="p-2 font-mono">{t.simulatedSizeXRP.toFixed(4)}</td>
                  <td className="p-2 font-mono">{t.entryEdgeBps.toFixed(1)}</td>
                  <td className="p-2 uppercase">{t.status}</td>
                  <td className="p-2 font-mono text-cyber-glow">
                    {t.status === 'open' ? '—' : t.simulatedPnlXRP.toFixed(6)}
                  </td>
                  <td className="p-2">
                    {t.status === 'open' ? (
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => closePaperTrade(t.id, 'won')}
                          className="text-[10px] rounded border border-emerald-500/50 px-1.5 py-0.5 text-emerald-200 hover:bg-emerald-500/10"
                        >
                          Mark won
                        </button>
                        <button
                          type="button"
                          onClick={() => closePaperTrade(t.id, 'lost')}
                          className="text-[10px] rounded border border-rose-500/50 px-1.5 py-0.5 text-rose-200 hover:bg-rose-500/10"
                        >
                          Mark lost
                        </button>
                        <button
                          type="button"
                          onClick={() => closePaperTrade(t.id, 'expired')}
                          className="text-[10px] rounded border border-amber-500/50 px-1.5 py-0.5 text-amber-200 hover:bg-amber-500/10"
                        >
                          Expire
                        </button>
                        <button
                          type="button"
                          onClick={() => closePaperTrade(t.id, 'cancelled')}
                          className="text-[10px] rounded border border-cyber-muted/50 px-1.5 py-0.5 text-cyber-muted hover:bg-white/5"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span className="text-cyber-muted text-[10px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-cyber text-cyber-cyan flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Strategy receipts (local audit log)
        </h3>
        <ul className="space-y-2 max-h-80 overflow-y-auto">
          {receipts.length === 0 && <li className="text-cyber-muted text-xs">No receipts yet.</li>}
          {receipts.map((r) => (
            <li key={r.id} className="neon-panel text-xs space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-cyber-muted">{new Date(r.timestamp).toLocaleString()}</span>
                <span className="text-[10px] text-cyber-cyan">
                  {r.mode} · exec: {String(r.executionEnabled)} · no custody: {String(r.noCustody)}
                </span>
              </div>
              <p className="text-cyber-text">{r.summary}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
