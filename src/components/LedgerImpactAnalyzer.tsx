/**
 * Ledger Impact Analyzer – gamer-ified agent panel.
 * Fetches live amendments (with cache + retry), invokes orchestrator for impact analysis,
 * shows neon impact score 0–100 and glitchy hologram warning when impact > 70.
 * Skills: @xrpl-expert @real-time-data @workflow-automation @error-handling-master
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, AlertTriangle, RefreshCw, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { fetchXRPLAmendments, type XRPLAmendment } from '../services/freeDataFeeds';
import { useAgent } from '../hooks/useAgent';

const CACHE_MS = 60_000;
const RETRY_DELAY_MS = 3000;
const HIGH_IMPACT_THRESHOLD = 70;

let amendmentsCache: { data: XRPLAmendment[]; ts: number } | null = null;

function computeNeonImpactScore(amendments: XRPLAmendment[]): number {
  if (!amendments.length) return 0;
  const avgSupport = amendments.reduce((s, a) => s + (a.percentSupport ?? 0), 0) / amendments.length;
  const atMajority = amendments.filter((a) => a.status === 'majority').length;
  const score = Math.min(100, Math.round(avgSupport * 0.7 + atMajority * 8));
  return score;
}

export function LedgerImpactAnalyzer() {
  const [amendments, setAmendments] = useState<XRPLAmendment[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [hologramWarning, setHologramWarning] = useState(false);
  const { result, loading: agentLoading, invoke } = useAgent();

  const fetchWithRetry = useCallback(async () => {
    if (amendmentsCache && Date.now() - amendmentsCache.ts < CACHE_MS) {
      setAmendments(amendmentsCache.data);
      setLoading(false);
      setOffline(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchXRPLAmendments();
      if (data.length > 0) {
        amendmentsCache = { data, ts: Date.now() };
        setAmendments(data);
        setOffline(false);
      }
    } catch {
      setOffline(true);
      setAmendments(amendmentsCache?.data ?? []);
      setTimeout(() => fetchWithRetry(), RETRY_DELAY_MS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWithRetry();
  }, [fetchWithRetry]);

  const neonImpactScore = computeNeonImpactScore(amendments);
  const isHighImpact = neonImpactScore >= HIGH_IMPACT_THRESHOLD;

  const runAnalysis = useCallback(() => {
    invoke(
      'Simulate amendment raid: Predict TPS fallout and suggest defensive UI shields.',
      { amendments: amendments.slice(0, 10).map((a) => ({ name: a.name, percentSupport: a.percentSupport })) },
      'ledger'
    ).then((r) => {
      if ((r.neonImpactScore ?? neonImpactScore) >= HIGH_IMPACT_THRESHOLD) {
        setHologramWarning(true);
        // Workflow: trigger UI popup; Discord/alert can be wired here via event bus
        window.dispatchEvent(new CustomEvent('ledger-high-impact', { detail: { score: r.neonImpactScore } }));
      }
    });
  }, [amendments, invoke, neonImpactScore]);

  return (
    <div className="cyber-panel p-4 border border-cyber-cyan/30">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-cyber-border">
        <Zap size={14} className="text-cyber-cyan" />
        <span className="font-cyber text-xs text-cyber-cyan">LEDGER IMPACT ANALYZER</span>
        {offline ? (
          <span className="flex items-center gap-1 text-[9px] text-cyber-yellow">
            <WifiOff size={10} /> OFFLINE (cached)
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[9px] text-cyber-green">
            <Wifi size={10} /> LIVE
          </span>
        )}
      </div>

      {/* Neon impact score 0–100 */}
      <div className="mb-3">
        <p className="text-[10px] text-cyber-muted mb-1">Impact score (game metric)</p>
        <div className="h-4 bg-cyber-darker rounded overflow-hidden border border-cyber-border">
          <motion.div
            className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-green"
            initial={{ width: 0 }}
            animate={{ width: `${neonImpactScore}%` }}
            transition={{ duration: 0.6 }}
            style={{ boxShadow: '0 0 12px rgba(34, 211, 238, 0.5)' }}
          />
        </div>
        <p className="text-xs font-cyber text-cyber-cyan mt-1">{neonImpactScore}/100</p>
      </div>

      <button
        onClick={runAnalysis}
        disabled={agentLoading || loading}
        className="w-full px-3 py-2 rounded bg-cyber-cyan/20 border border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan/30 transition-all font-cyber text-xs flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {agentLoading ? (
          <>
            <Loader2 size={12} className="animate-spin" />
            ANALYZING...
          </>
        ) : (
          <>
            <RefreshCw size={12} />
            RUN AGENT ANALYSIS
          </>
        )}
      </button>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-2 rounded bg-cyber-darker/50 border border-cyber-border/50"
        >
          <p className="text-[10px] text-cyber-muted mb-1">Agent analysis</p>
          <p className="text-xs text-cyber-text">{result.analysis}</p>
          {result.neonImpactScore != null && (
            <p className="text-[10px] text-cyber-cyan mt-1">Neon score: {result.neonImpactScore}</p>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {hologramWarning && isHighImpact && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 p-3 rounded border-2 border-cyber-yellow/60 bg-cyber-yellow/10"
            style={{ boxShadow: '0 0 20px rgba(250, 204, 21, 0.3)' }}
          >
            <div className="flex items-center gap-2 text-cyber-yellow">
              <AlertTriangle size={16} />
              <span className="font-cyber text-xs">HIGH IMPACT — DEFENSIVE SHIELDS SUGGESTED</span>
            </div>
            <p className="text-[10px] text-cyber-muted mt-1">
              Amendment raid scenario: TPS fallout possible. Check agent analysis above.
            </p>
            <button
              onClick={() => setHologramWarning(false)}
              className="mt-2 text-[10px] text-cyber-cyan hover:underline"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
