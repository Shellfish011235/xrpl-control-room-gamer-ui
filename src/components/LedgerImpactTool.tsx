import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Clock, Users, ExternalLink, ChevronRight,
  Cpu, HardDrive, Wifi, DollarSign, MemoryStick, RefreshCw,
  X, FileText, CheckCircle, AlertTriangle, Loader2
} from 'lucide-react';
import { fetchXRPLAmendments, type XRPLAmendment } from '../services/freeDataFeeds';

// Types based on XRPL Governance Companion
type PerformanceImpact = 'Low' | 'Medium' | 'High' | 'Unknown';
type Confidence = 'High' | 'Medium' | 'Low';
type Tier = 'A' | 'B' | 'C';

type AffectedArea = 'CPU' | 'Memory' | 'Disk IO' | 'Network' | 'Fee pressure';

interface LedgerImpact {
  estimatedImpact: PerformanceImpact;
  confidence: Confidence;
  affectedAreas: AffectedArea[];
  rationale: string;
  evidenceLinks?: { label: string; url: string }[];
}

interface Amendment {
  id: string;
  name: string;
  summary: string;
  tier: Tier;
  performanceImpact: PerformanceImpact;
  waitingDays: number;
  ledgerImpact: LedgerImpact;
  validatorSupport: { current: number; required: number };
  enabled?: boolean;
  // Live data fields
  percentSupport?: number;
  status?: 'enabled' | 'majority' | 'pending' | 'unsupported';
  daysUntilEnabled?: number;
}

// Amendment metadata (performance impact assessments)
const amendmentMetadata: Record<string, { 
  summary: string; 
  tier: Tier; 
  impact: PerformanceImpact;
  areas: AffectedArea[];
  rationale: string;
}> = {
  'AMM': { summary: 'Native automated market maker functionality', tier: 'B', impact: 'Medium', areas: ['CPU', 'Memory', 'Disk IO'], rationale: 'New ledger object type and transaction types. Pathfinding complexity increases.' },
  'Clawback': { summary: 'Enables token issuers to reclaim tokens from holders', tier: 'B', impact: 'Low', areas: ['CPU'], rationale: 'Adds flag check during token transfers. Only affects tokens with clawback enabled.' },
  'PriceOracle': { summary: 'Native price oracle infrastructure for on-chain feeds', tier: 'B', impact: 'Medium', areas: ['CPU', 'Network', 'Fee pressure'], rationale: 'New transaction type and ledger objects. Moderate impact on validation bandwidth.' },
  'DID': { summary: 'Decentralized Identifier support on XRPL', tier: 'C', impact: 'Low', areas: ['Disk IO'], rationale: 'New ledger object type for DID documents. Minimal processing overhead.' },
  'XChainBridge': { summary: 'Cross-chain bridge functionality', tier: 'A', impact: 'Medium', areas: ['CPU', 'Network'], rationale: 'Enables atomic cross-chain transactions with witness servers.' },
  'fixNFTokenRemint': { summary: 'Fixes NFToken reminting edge cases', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Bug fix amendment with negligible performance impact.' },
  'fixReducedOffersV1': { summary: 'Corrects offer reduction calculations', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Minor calculation fix in DEX operations.' },
  'fixAMMOverflowOffer': { summary: 'Fixes AMM overflow in offer calculations', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Prevents integer overflow in AMM edge cases.' },
  'fixInnerObjTemplate2': { summary: 'Template fix for inner objects', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Internal template consistency fix.' },
  'MPTokensV1': { summary: 'Multi-Purpose Token support', tier: 'B', impact: 'Medium', areas: ['CPU', 'Memory', 'Disk IO'], rationale: 'New token type with additional metadata support.' },
  'Credentials': { summary: 'On-chain credential verification', tier: 'B', impact: 'Low', areas: ['Disk IO'], rationale: 'New ledger entry type for credential storage.' },
  'InvariantsV1_1': { summary: 'Enhanced ledger invariant checks', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Additional validation checks during consensus.' },
};

// Helper to convert XRPScan amendment to our Amendment type
function convertToAmendment(xrpAmendment: XRPLAmendment): Amendment {
  const metadata = amendmentMetadata[xrpAmendment.name] || {
    summary: `XRPL amendment: ${xrpAmendment.name}`,
    tier: 'C' as Tier,
    impact: 'Unknown' as PerformanceImpact,
    areas: ['CPU'] as AffectedArea[],
    rationale: 'Performance impact not yet assessed.'
  };

  // Calculate waiting days
  let waitingDays = 0;
  if (xrpAmendment.majority) {
    const majorityDate = new Date(xrpAmendment.majority);
    const now = new Date();
    const daysSinceMajority = Math.floor((now.getTime() - majorityDate.getTime()) / (24 * 60 * 60 * 1000));
    waitingDays = Math.max(0, 14 - daysSinceMajority);
  }

  return {
    id: xrpAmendment.amendment_id,
    name: xrpAmendment.name,
    summary: metadata.summary,
    tier: metadata.tier,
    performanceImpact: metadata.impact,
    waitingDays: xrpAmendment.daysUntilEnabled || waitingDays,
    ledgerImpact: {
      estimatedImpact: metadata.impact,
      confidence: amendmentMetadata[xrpAmendment.name] ? 'High' : 'Low',
      affectedAreas: metadata.areas,
      rationale: metadata.rationale,
      evidenceLinks: [
        { label: 'View on XRPScan', url: `https://xrpscan.com/amendment/${xrpAmendment.name}` }
      ]
    },
    validatorSupport: { 
      current: xrpAmendment.count, 
      required: xrpAmendment.threshold 
    },
    enabled: xrpAmendment.enabled,
    percentSupport: xrpAmendment.percentSupport,
    status: xrpAmendment.status,
    daysUntilEnabled: xrpAmendment.daysUntilEnabled
  };
}

const areaIcons: Record<AffectedArea, React.ReactNode> = {
  'CPU': <Cpu size={12} />,
  'Memory': <MemoryStick size={12} />,
  'Disk IO': <HardDrive size={12} />,
  'Network': <Wifi size={12} />,
  'Fee pressure': <DollarSign size={12} />
};

const impactColors: Record<PerformanceImpact, string> = {
  'Low': 'cyber-green',
  'Medium': 'cyber-yellow',
  'High': 'cyber-red',
  'Unknown': 'cyber-muted'
};

const tierColors: Record<Tier, string> = {
  'A': 'cyber-green',
  'B': 'cyber-yellow',
  'C': 'cyber-purple'
};

export function LedgerImpactTool() {
  const [amendments, setAmendments] = useState<Amendment[]>([]);
  const [selectedAmendment, setSelectedAmendment] = useState<Amendment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'enabled'>('pending');
  const [dataSource, setDataSource] = useState<'live' | 'fallback'>('fallback');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch live amendments from XRPScan
  const fetchAmendments = useCallback(async () => {
    setIsLoading(true);
    try {
      const liveAmendments = await fetchXRPLAmendments();
      
      if (liveAmendments.length > 0) {
        // Sort: majority/pending first, then by support percentage
        const sorted = liveAmendments
          .map(convertToAmendment)
          .sort((a, b) => {
            // Enabled amendments last
            if (a.enabled && !b.enabled) return 1;
            if (!a.enabled && b.enabled) return -1;
            // Then by status (majority first)
            if (a.status === 'majority' && b.status !== 'majority') return -1;
            if (a.status !== 'majority' && b.status === 'majority') return 1;
            // Then by support percentage
            return (b.percentSupport || 0) - (a.percentSupport || 0);
          });
        
        setAmendments(sorted);
        setDataSource('live');
        setLastUpdate(new Date());
        console.log('[LedgerImpact] Loaded', sorted.length, 'amendments from XRPScan');
      }
    } catch (error) {
      console.error('[LedgerImpact] Failed to fetch amendments:', error);
      setDataSource('fallback');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchAmendments();
  }, [fetchAmendments]);

  const filteredAmendments = amendments.filter(a => {
    if (filter === 'pending') return !a.enabled;
    if (filter === 'enabled') return a.enabled;
    return true;
  });

  const handleRefresh = async () => {
    await fetchAmendments();
  };

  // Count amendments at majority (>80% support, not yet enabled)
  const atMajority = amendments.filter(a => !a.enabled && a.status === 'majority').length;

  // Calculate impact summary
  const impactSummary = {
    low: filteredAmendments.filter(a => a.ledgerImpact.estimatedImpact === 'Low').length,
    medium: filteredAmendments.filter(a => a.ledgerImpact.estimatedImpact === 'Medium').length,
    high: filteredAmendments.filter(a => a.ledgerImpact.estimatedImpact === 'High').length,
  };

  return (
    <div className="cyber-panel p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-cyber-border">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-cyber-cyan" />
          <span className="font-cyber text-sm text-cyber-cyan tracking-wider">LEDGER IMPACT TOOL</span>
          {dataSource === 'live' && (
            <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-cyber-green/20 text-cyber-green border border-cyber-green/30">
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-1.5 hover:bg-cyber-glow/10 rounded transition-colors"
          title="Refresh amendments from XRPScan"
        >
          <RefreshCw size={14} className={`text-cyber-muted hover:text-cyber-glow ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Majority Alert Banner */}
      {atMajority > 0 && (
        <div className="mb-4 p-2 rounded bg-cyber-yellow/10 border border-cyber-yellow/30 flex items-center gap-2">
          <AlertTriangle size={14} className="text-cyber-yellow shrink-0" />
          <p className="text-[10px] text-cyber-yellow">
            <span className="font-cyber">{atMajority}</span> amendment{atMajority > 1 ? 's' : ''} at majority threshold - 
            in 2-week waiting period before activation
          </p>
        </div>
      )}

      {/* Impact Summary Bars */}
      <div className="mb-4">
        <p className="text-xs text-cyber-muted mb-2">Impact Distribution</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-cyber-green w-14">Low ({impactSummary.low})</span>
            <div className="flex-1 h-2 bg-cyber-darker rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-cyber-green"
                initial={{ width: 0 }}
                animate={{ width: `${(impactSummary.low / filteredAmendments.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-cyber-yellow w-14">Med ({impactSummary.medium})</span>
            <div className="flex-1 h-2 bg-cyber-darker rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-cyber-yellow"
                initial={{ width: 0 }}
                animate={{ width: `${(impactSummary.medium / filteredAmendments.length) * 100}%` }}
                transition={{ duration: 0.5, delay: 0.1 }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-cyber-red w-14">High ({impactSummary.high})</span>
            <div className="flex-1 h-2 bg-cyber-darker rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-cyber-red"
                initial={{ width: 0 }}
                animate={{ width: `${(impactSummary.high / filteredAmendments.length) * 100}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-3">
        {(['pending', 'enabled', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2 py-1 text-[10px] font-cyber rounded transition-all ${
              filter === f 
                ? 'bg-cyber-glow/20 text-cyber-glow border border-cyber-glow/30'
                : 'text-cyber-muted hover:text-cyber-text'
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Amendments List */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 size={24} className="text-cyber-cyan animate-spin mb-2" />
            <p className="text-xs text-cyber-muted">Loading from XRPScan...</p>
          </div>
        ) : filteredAmendments.length === 0 ? (
          <div className="text-center py-8 text-cyber-muted text-xs">
            No amendments found for this filter
          </div>
        ) : (
          filteredAmendments.slice(0, 15).map((amendment) => (
            <motion.button
              key={amendment.id}
              onClick={() => setSelectedAmendment(amendment)}
              className={`w-full p-2 rounded-lg border bg-cyber-darker/50 hover:border-cyber-glow/30 transition-all text-left group ${
                amendment.status === 'majority' 
                  ? 'border-cyber-yellow/50' 
                  : 'border-cyber-border/50'
              }`}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-cyber bg-${tierColors[amendment.tier]}/20 text-${tierColors[amendment.tier]} border border-${tierColors[amendment.tier]}/30`}>
                    {amendment.tier}
                  </span>
                  <span className="text-xs text-cyber-text font-medium truncate">{amendment.name}</span>
                  {amendment.status === 'majority' && (
                    <span className="px-1 py-0.5 rounded text-[8px] bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/30">
                      {amendment.daysUntilEnabled}d
                    </span>
                  )}
                </div>
                <span className={`text-[10px] text-${impactColors[amendment.ledgerImpact.estimatedImpact]}`}>
                  {amendment.ledgerImpact.estimatedImpact}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {amendment.ledgerImpact.affectedAreas.slice(0, 3).map(area => (
                    <span key={area} className="text-cyber-muted" title={area}>
                      {areaIcons[area]}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className={
                    (amendment.percentSupport || 0) >= 80 ? 'text-cyber-green' :
                    (amendment.percentSupport || 0) >= 50 ? 'text-cyber-yellow' :
                    'text-cyber-muted'
                  }>
                    {amendment.validatorSupport.current}/{amendment.validatorSupport.required}
                  </span>
                  <Users size={10} className="text-cyber-muted" />
                </div>
              </div>
            </motion.button>
          ))
        )}
      </div>

      {/* Last Update */}
      {lastUpdate && (
        <div className="mt-2 text-[9px] text-cyber-muted text-right">
          Updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}

      {/* Quick Links */}
      <div className="mt-4 pt-3 border-t border-cyber-border space-y-1.5">
        <a
          href="https://xrpl.org/amendments.html"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 rounded bg-cyber-darker/50 border border-cyber-border/50 hover:border-cyber-glow/30 transition-all text-xs text-cyber-text group"
        >
          <FileText size={14} className="text-cyber-glow" />
          <span>XRPL Amendments Docs</span>
          <ExternalLink size={12} className="ml-auto text-cyber-muted group-hover:text-cyber-glow" />
        </a>
      </div>

      {/* Amendment Detail Modal */}
      <AnimatePresence>
        {selectedAmendment && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedAmendment(null)}
          >
            <motion.div
              className="cyber-panel cyber-glow w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-cyber bg-${tierColors[selectedAmendment.tier]}/20 text-${tierColors[selectedAmendment.tier]} border border-${tierColors[selectedAmendment.tier]}/30`}>
                      Tier {selectedAmendment.tier}
                    </span>
                    {selectedAmendment.enabled && (
                      <span className="px-2 py-0.5 rounded text-xs font-cyber bg-cyber-green/20 text-cyber-green border border-cyber-green/30">
                        ENABLED
                      </span>
                    )}
                  </div>
                  <h3 className="font-cyber text-lg text-cyber-glow">{selectedAmendment.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedAmendment(null)}
                  className="p-2 hover:bg-cyber-glow/10 rounded transition-colors"
                >
                  <X size={20} className="text-cyber-muted" />
                </button>
              </div>

              {/* Summary */}
              <p className="text-sm text-cyber-text mb-4">{selectedAmendment.summary}</p>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/50 text-center">
                  <Clock size={14} className="text-cyber-muted mx-auto mb-1" />
                  <p className="text-xs text-cyber-muted">Waiting</p>
                  <p className="font-cyber text-sm text-cyber-text">{selectedAmendment.waitingDays}d</p>
                </div>
                <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/50 text-center">
                  <Users size={14} className="text-cyber-muted mx-auto mb-1" />
                  <p className="text-xs text-cyber-muted">Support</p>
                  <p className="font-cyber text-sm text-cyber-text">
                    {selectedAmendment.validatorSupport.current}/{selectedAmendment.validatorSupport.required}
                  </p>
                </div>
                <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/50 text-center">
                  <Zap size={14} className={`text-${impactColors[selectedAmendment.ledgerImpact.estimatedImpact]} mx-auto mb-1`} />
                  <p className="text-xs text-cyber-muted">Impact</p>
                  <p className={`font-cyber text-sm text-${impactColors[selectedAmendment.ledgerImpact.estimatedImpact]}`}>
                    {selectedAmendment.ledgerImpact.estimatedImpact}
                  </p>
                </div>
              </div>

              {/* Ledger Impact Details */}
              <div className="mb-4">
                <h4 className="font-cyber text-sm text-cyber-cyan mb-2 flex items-center gap-2">
                  <Zap size={14} />
                  LEDGER IMPACT ANALYSIS
                </h4>
                
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/30">
                    <p className="text-[10px] text-cyber-muted mb-1">Estimated Impact</p>
                    <p className={`font-cyber text-${impactColors[selectedAmendment.ledgerImpact.estimatedImpact]}`}>
                      {selectedAmendment.ledgerImpact.estimatedImpact}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/30">
                    <p className="text-[10px] text-cyber-muted mb-1">Confidence</p>
                    <p className="font-cyber text-cyber-text">{selectedAmendment.ledgerImpact.confidence}</p>
                  </div>
                </div>

                {/* Affected Areas */}
                <div className="mb-3">
                  <p className="text-[10px] text-cyber-muted mb-2">Affected Areas</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedAmendment.ledgerImpact.affectedAreas.map(area => (
                      <span 
                        key={area}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-cyber-purple/20 text-cyber-purple text-xs border border-cyber-purple/30"
                      >
                        {areaIcons[area]}
                        {area}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Rationale */}
                <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-border/30">
                  <p className="text-[10px] text-cyber-muted mb-1">Technical Rationale</p>
                  <p className="text-sm text-cyber-text">{selectedAmendment.ledgerImpact.rationale}</p>
                </div>
              </div>

              {/* Evidence Links */}
              {selectedAmendment.ledgerImpact.evidenceLinks && selectedAmendment.ledgerImpact.evidenceLinks.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-cyber-muted mb-1">Evidence & References</p>
                  {selectedAmendment.ledgerImpact.evidenceLinks.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded bg-cyber-darker/50 border border-cyber-border/50 hover:border-cyber-glow/50 transition-all text-xs text-cyber-text group"
                    >
                      <ExternalLink size={12} className="text-cyber-glow" />
                      <span>{link.label}</span>
                      <ChevronRight size={12} className="ml-auto text-cyber-muted group-hover:text-cyber-glow" />
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LedgerImpactTool;
