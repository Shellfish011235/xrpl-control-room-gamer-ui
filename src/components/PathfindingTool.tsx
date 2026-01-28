import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Route, ArrowRight, Search, Loader2, AlertCircle,
  CheckCircle, TrendingUp, Layers, Zap, RefreshCw,
  ChevronDown, ExternalLink, Wallet, DollarSign, Play
} from 'lucide-react';
import {
  findPaymentPaths,
  analyzeLiquidity,
  isConnected,
  formatCurrency,
  formatRate,
  POPULAR_PAIRS,
  KNOWN_ISSUERS,
  type PathfindingResult,
  type LiquidityAnalysis,
  type PaymentPath
} from '../services/xrplPathfinding';

// Demo accounts - known active accounts on XRPL mainnet for testing pathfinding
// These accounts have trustlines and are known to work with pathfinding
const DEMO_ACCOUNTS = {
  // Bitstamp hot wallet - very active, has many trustlines
  bitstamp: {
    address: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
    label: 'Bitstamp',
  },
  // GateHub hot wallet - major issuer with many trustlines
  gatehub: {
    address: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq',
    label: 'GateHub',
  },
  // A known active account for testing
  testAccount: {
    address: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
    label: 'Test Account',
  },
};

interface PathfindingToolProps {
  compact?: boolean;
}

export function PathfindingTool({ compact = false }: PathfindingToolProps) {
  // Form state
  const [sourceAccount, setSourceAccount] = useState('');
  const [destAccount, setDestAccount] = useState('');
  const [destCurrency, setDestCurrency] = useState('USD');
  const [destIssuer, setDestIssuer] = useState('rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq');
  const [destAmount, setDestAmount] = useState('100');
  
  // Demo mode - auto-fill with known working accounts for pathfinding
  const loadDemoAccounts = useCallback(() => {
    // Use Bitstamp and GateHub - both have trustlines for USD, good for pathfinding demo
    setSourceAccount(DEMO_ACCOUNTS.bitstamp.address);
    setDestAccount(DEMO_ACCOUNTS.gatehub.address);
    setDestCurrency('USD');
    setDestIssuer(DEMO_ACCOUNTS.gatehub.address);
    setDestAmount('10'); // Smaller amount for demo
    console.log('[PathfindingTool] Demo accounts loaded:', {
      source: DEMO_ACCOUNTS.bitstamp,
      dest: DEMO_ACCOUNTS.gatehub
    });
  }, []);
  
  // Results state
  const [result, setResult] = useState<PathfindingResult | null>(null);
  const [liquidity, setLiquidity] = useState<LiquidityAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pathfind' | 'liquidity'>('pathfind');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedPath, setSelectedPath] = useState<PaymentPath | null>(null);

  // Quick pair selection
  const handleQuickPair = useCallback((pairIndex: number) => {
    const pair = POPULAR_PAIRS[pairIndex];
    if (pair) {
      setDestCurrency(pair.destination.currency);
      setDestIssuer(pair.destination.issuer || '');
    }
  }, []);

  // Connection error state
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Find paths
  const handleFindPaths = useCallback(async () => {
    if (!sourceAccount || !destAccount || !destAmount) {
      return;
    }

    setIsLoading(true);
    setResult(null);
    setSelectedPath(null);
    setConnectionError(null);

    console.log('[PathfindingTool] Finding paths:', {
      source: sourceAccount,
      dest: destAccount,
      currency: destCurrency,
      issuer: destIssuer,
      amount: destAmount
    });

    try {
      const pathResult = await findPaymentPaths(
        sourceAccount,
        destAccount,
        {
          currency: destCurrency,
          issuer: destCurrency !== 'XRP' ? destIssuer : undefined,
          value: destAmount
        }
      );
      
      console.log('[PathfindingTool] Result:', pathResult);
      setResult(pathResult);
      
      if (pathResult.alternatives.length > 0) {
        setSelectedPath(pathResult.alternatives[0]);
      }
    } catch (error: any) {
      console.error('[PathfindingTool] Error:', error);
      setConnectionError(error.message || 'Failed to connect to XRPL servers');
    } finally {
      setIsLoading(false);
    }
  }, [sourceAccount, destAccount, destCurrency, destIssuer, destAmount]);

  // Analyze liquidity
  const handleAnalyzeLiquidity = useCallback(async () => {
    setIsLoading(true);
    setLiquidity(null);
    setConnectionError(null);

    try {
      const analysis = await analyzeLiquidity(
        { currency: 'XRP' },
        {
          currency: destCurrency,
          issuer: destCurrency !== 'XRP' ? destIssuer : undefined
        }
      );
      setLiquidity(analysis);
    } catch (error: any) {
      console.error('[PathfindingTool] Liquidity error:', error);
      setConnectionError(error.message || 'Failed to analyze liquidity');
    } finally {
      setIsLoading(false);
    }
  }, [destCurrency, destIssuer]);

  // Get issuer display name
  const getIssuerName = (issuer: string) => KNOWN_ISSUERS[issuer] || issuer.slice(0, 8) + '...';

  return (
    <div className={`cyber-panel ${compact ? 'p-3' : 'p-4'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-cyber-border">
        <div className="flex items-center gap-2">
          <Route size={16} className="text-cyber-cyan" />
          <span className="font-cyber text-sm text-cyber-cyan tracking-wider">XRPL PATHFINDING</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyber-green/20 text-cyber-green border border-cyber-green/30">
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadDemoAccounts}
            className="flex items-center gap-1 px-2 py-1 rounded text-[9px] bg-cyber-purple/20 border border-cyber-purple/30 text-cyber-purple hover:bg-cyber-purple/30 transition-all"
            title="Load demo accounts to test"
          >
            <Play size={10} />
            DEMO
          </button>
          <a
            href="https://xrpl.org/docs/concepts/tokens/fungible-tokens/paths"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyber-muted hover:text-cyber-cyan transition-colors"
            title="XRPL Paths Documentation"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setActiveTab('pathfind')}
          className={`flex-1 px-3 py-2 rounded text-xs font-cyber transition-all ${
            activeTab === 'pathfind'
              ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30'
              : 'bg-cyber-darker text-cyber-muted hover:text-cyber-text border border-cyber-border'
          }`}
        >
          <Route size={12} className="inline mr-1" />
          Path Finder
        </button>
        <button
          onClick={() => setActiveTab('liquidity')}
          className={`flex-1 px-3 py-2 rounded text-xs font-cyber transition-all ${
            activeTab === 'liquidity'
              ? 'bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/30'
              : 'bg-cyber-darker text-cyber-muted hover:text-cyber-text border border-cyber-border'
          }`}
        >
          <TrendingUp size={12} className="inline mr-1" />
          Liquidity
        </button>
      </div>

      {activeTab === 'pathfind' && (
        <>
          {/* Quick Pairs */}
          <div className="mb-4">
            <p className="text-[10px] text-cyber-muted mb-2">QUICK PAIRS</p>
            <div className="flex flex-wrap gap-1">
              {POPULAR_PAIRS.slice(0, 6).map((pair, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickPair(i)}
                  className="px-2 py-1 rounded text-[9px] bg-cyber-darker border border-cyber-border hover:border-cyber-cyan/50 text-cyber-muted hover:text-cyber-cyan transition-all"
                  title={pair.description}
                >
                  {pair.name}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="space-y-3 mb-4">
            {/* Source Account */}
            <div>
              <label className="text-[10px] text-cyber-muted mb-1 block">SOURCE ACCOUNT</label>
              <div className="relative">
                <Wallet size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
                <input
                  type="text"
                  value={sourceAccount}
                  onChange={(e) => setSourceAccount(e.target.value)}
                  placeholder="rXXXXXXXXXXXXX..."
                  className="w-full bg-cyber-darker border border-cyber-border rounded pl-9 pr-3 py-2 text-xs text-cyber-text placeholder:text-cyber-muted/50 focus:border-cyber-cyan focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Destination Account */}
            <div>
              <label className="text-[10px] text-cyber-muted mb-1 block">DESTINATION ACCOUNT</label>
              <div className="relative">
                <Wallet size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
                <input
                  type="text"
                  value={destAccount}
                  onChange={(e) => setDestAccount(e.target.value)}
                  placeholder="rXXXXXXXXXXXXX..."
                  className="w-full bg-cyber-darker border border-cyber-border rounded pl-9 pr-3 py-2 text-xs text-cyber-text placeholder:text-cyber-muted/50 focus:border-cyber-cyan focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Destination Amount & Currency */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-cyber-muted mb-1 block">AMOUNT</label>
                <input
                  type="number"
                  value={destAmount}
                  onChange={(e) => setDestAmount(e.target.value)}
                  placeholder="100"
                  className="w-full bg-cyber-darker border border-cyber-border rounded px-3 py-2 text-xs text-cyber-text focus:border-cyber-cyan focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-cyber-muted mb-1 block">CURRENCY</label>
                <select
                  value={destCurrency}
                  onChange={(e) => {
                    setDestCurrency(e.target.value);
                    if (e.target.value === 'XRP') setDestIssuer('');
                  }}
                  className="w-full bg-cyber-darker border border-cyber-border rounded px-3 py-2 text-xs text-cyber-text focus:border-cyber-cyan focus:outline-none"
                >
                  <option value="XRP">XRP</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                  <option value="CNY">CNY</option>
                  <option value="JPY">JPY</option>
                </select>
              </div>
            </div>

            {/* Advanced - Issuer */}
            {destCurrency !== 'XRP' && (
              <div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-1 text-[10px] text-cyber-muted hover:text-cyber-cyan transition-colors"
                >
                  <ChevronDown size={12} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                  Advanced Options
                </button>
                
                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2">
                        <label className="text-[10px] text-cyber-muted mb-1 block">ISSUER ADDRESS</label>
                        <input
                          type="text"
                          value={destIssuer}
                          onChange={(e) => setDestIssuer(e.target.value)}
                          placeholder="rXXXXXXXXXXXXX..."
                          className="w-full bg-cyber-darker border border-cyber-border rounded px-3 py-2 text-xs text-cyber-text placeholder:text-cyber-muted/50 focus:border-cyber-cyan focus:outline-none font-mono"
                        />
                        <p className="text-[9px] text-cyber-muted mt-1">
                          Current: {destIssuer ? getIssuerName(destIssuer) : 'Not set'}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Search Button */}
            <button
              onClick={handleFindPaths}
              disabled={isLoading || !sourceAccount || !destAccount}
              className="w-full px-4 py-2.5 rounded bg-cyber-cyan/20 border border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan/30 transition-all font-cyber text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  SEARCHING PATHS...
                </>
              ) : (
                <>
                  <Search size={14} />
                  FIND PAYMENT PATHS
                </>
              )}
            </button>
          </div>

          {/* Connection Error */}
          <AnimatePresence>
            {connectionError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 rounded border bg-cyber-red/10 border-cyber-red/30"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-cyber-red flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-cyber-red font-cyber mb-1">CONNECTION ERROR</p>
                    <p className="text-[10px] text-cyber-red/80 whitespace-pre-wrap">{connectionError}</p>
                    <p className="text-[9px] text-cyber-muted mt-2">
                      Check browser console for details. Make sure you're connected to the internet.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {/* Status */}
                <div className={`p-3 rounded border ${
                  result.success && result.alternatives.length > 0
                    ? 'bg-cyber-green/10 border-cyber-green/30'
                    : 'bg-cyber-red/10 border-cyber-red/30'
                }`}>
                  <div className="flex items-center gap-2">
                    {result.success && result.alternatives.length > 0 ? (
                      <>
                        <CheckCircle size={16} className="text-cyber-green" />
                        <span className="text-sm text-cyber-green font-cyber">
                          {result.alternatives.length} PATH{result.alternatives.length > 1 ? 'S' : ''} FOUND
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={16} className="text-cyber-red" />
                        <span className="text-sm text-cyber-red font-cyber">
                          {result.error || 'NO PATHS FOUND'}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Path List */}
                {result.alternatives.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-cyber-muted">AVAILABLE PATHS (best first)</p>
                    {result.alternatives.slice(0, 5).map((alt, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedPath(alt)}
                        className={`w-full p-3 rounded border text-left transition-all ${
                          selectedPath === alt
                            ? 'bg-cyber-cyan/10 border-cyber-cyan/50'
                            : 'bg-cyber-darker/50 border-cyber-border/50 hover:border-cyber-cyan/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-cyber-muted">#{i + 1}</span>
                            <span className="text-xs font-mono text-cyber-text">
                              {alt.sourceAmount.value} {alt.sourceAmount.currency}
                            </span>
                            <ArrowRight size={12} className="text-cyber-muted" />
                            <span className="text-xs font-mono text-cyber-cyan">
                              {result.destinationAmount.value} {result.destinationAmount.currency}
                            </span>
                          </div>
                          {alt.liquidityScore && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                              alt.liquidityScore >= 80 ? 'bg-cyber-green/20 text-cyber-green' :
                              alt.liquidityScore >= 50 ? 'bg-cyber-yellow/20 text-cyber-yellow' :
                              'bg-cyber-red/20 text-cyber-red'
                            }`}>
                              {alt.liquidityScore}% score
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[9px] text-cyber-muted">
                          <span><Layers size={10} className="inline mr-1" />{alt.hops || 0} hops</span>
                          <span><Zap size={10} className="inline mr-1" />Rate: {formatRate(alt.effectiveRate || 0)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Path Details */}
                {selectedPath && selectedPath.pathsComputed.length > 0 && (
                  <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-border/50">
                    <p className="text-[10px] text-cyber-muted mb-2">PATH DETAILS</p>
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-xs text-cyber-cyan font-mono">
                        {selectedPath.sourceAmount.currency}
                      </span>
                      {selectedPath.pathsComputed[0]?.map((step, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <ArrowRight size={12} className="text-cyber-muted" />
                          <span className="text-xs text-cyber-text font-mono">
                            {step.currency || 'XRP'}
                            {step.issuer && (
                              <span className="text-cyber-muted text-[9px] ml-1">
                                ({getIssuerName(step.issuer)})
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                      <ArrowRight size={12} className="text-cyber-muted" />
                      <span className="text-xs text-cyber-green font-mono">
                        {result.destinationAmount.currency}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {activeTab === 'liquidity' && (
        <>
          {/* Liquidity Analysis Form */}
          <div className="space-y-3 mb-4">
            <p className="text-xs text-cyber-muted">
              Analyze XRP liquidity to different currencies across the DEX
            </p>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/50 text-center">
                <p className="text-[10px] text-cyber-muted">FROM</p>
                <p className="text-sm font-cyber text-cyber-cyan">XRP</p>
              </div>
              <div>
                <label className="text-[10px] text-cyber-muted mb-1 block">TO CURRENCY</label>
                <select
                  value={destCurrency}
                  onChange={(e) => {
                    setDestCurrency(e.target.value);
                    const pair = POPULAR_PAIRS.find(p => p.destination.currency === e.target.value);
                    if (pair?.destination.issuer) setDestIssuer(pair.destination.issuer);
                  }}
                  className="w-full bg-cyber-darker border border-cyber-border rounded px-3 py-2 text-xs text-cyber-text focus:border-cyber-purple focus:outline-none"
                >
                  <option value="USD">USD (GateHub)</option>
                  <option value="EUR">EUR (GateHub)</option>
                  <option value="BTC">BTC (GateHub)</option>
                  <option value="ETH">ETH (GateHub)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleAnalyzeLiquidity}
              disabled={isLoading}
              className="w-full px-4 py-2.5 rounded bg-cyber-purple/20 border border-cyber-purple/50 text-cyber-purple hover:bg-cyber-purple/30 transition-all font-cyber text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  ANALYZING...
                </>
              ) : (
                <>
                  <TrendingUp size={14} />
                  ANALYZE LIQUIDITY
                </>
              )}
            </button>
          </div>

          {/* Connection Error for Liquidity */}
          <AnimatePresence>
            {connectionError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 rounded border bg-cyber-red/10 border-cyber-red/30"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-cyber-red flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-cyber-red font-cyber mb-1">CONNECTION ERROR</p>
                    <p className="text-[10px] text-cyber-red/80">{connectionError}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Liquidity Results */}
          <AnimatePresence>
            {liquidity && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <div className="p-3 rounded bg-cyber-purple/10 border border-cyber-purple/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-cyber text-sm text-cyber-purple">{liquidity.pair}</span>
                    <span className="text-[9px] text-cyber-muted">
                      {liquidity.pathCount} paths available
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded bg-cyber-darker/50">
                      <p className="text-[9px] text-cyber-muted">Best Rate</p>
                      <p className="text-sm font-mono text-cyber-green">{formatRate(liquidity.bestRate)}</p>
                    </div>
                    <div className="p-2 rounded bg-cyber-darker/50">
                      <p className="text-[9px] text-cyber-muted">Worst Rate</p>
                      <p className="text-sm font-mono text-cyber-red">{formatRate(liquidity.worstRate)}</p>
                    </div>
                    <div className="p-2 rounded bg-cyber-darker/50">
                      <p className="text-[9px] text-cyber-muted">Spread</p>
                      <p className="text-sm font-mono text-cyber-yellow">{liquidity.spreadPercent.toFixed(2)}%</p>
                    </div>
                    <div className="p-2 rounded bg-cyber-darker/50">
                      <p className="text-[9px] text-cyber-muted">Max Tested</p>
                      <p className="text-sm font-mono text-cyber-cyan">{liquidity.maxLiquidity} {destCurrency}</p>
                    </div>
                  </div>
                </div>

                {liquidity.pathCount === 0 && (
                  <div className="p-3 rounded bg-cyber-red/10 border border-cyber-red/30 text-center">
                    <AlertCircle size={16} className="text-cyber-red mx-auto mb-1" />
                    <p className="text-xs text-cyber-red">No liquidity found for this pair</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Info Footer */}
      <div className="mt-4 pt-3 border-t border-cyber-border">
        <p className="text-[9px] text-cyber-muted text-center">
          {isConnected() ? '🟢' : '⚪'} XRPL Mainnet via WebSocket (xrplcluster.com)
        </p>
        <p className="text-[8px] text-cyber-muted/70 text-center mt-1">
          Click DEMO to load test accounts, then FIND PAYMENT PATHS
        </p>
      </div>
    </div>
  );
}

export default PathfindingTool;
