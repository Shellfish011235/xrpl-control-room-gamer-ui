import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Clock, Users, ExternalLink, ChevronRight,
  Cpu, HardDrive, Wifi, DollarSign, MemoryStick, RefreshCw,
  X, FileText, AlertTriangle, Loader2, Timer, Github, User
} from 'lucide-react';
import { fetchXRPLAmendments, type XRPLAmendment } from '../services/freeDataFeeds';

// ==================== RESPONSIVE LAYOUT HOOK ====================
// Detects window size for responsive component behavior

function useResponsiveLayout() {
  const [layout, setLayout] = useState({
    isMobile: false,
    isMinimized: false,
    isSmallHeight: false,
    isTinyHeight: false,
  });

  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setLayout({
        isMobile: width < 640,
        isMinimized: width < 400 || height < 500,
        isSmallHeight: height < 600,
        isTinyHeight: height < 450,
      });
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  return layout;
}

// ==================== COUNTDOWN TIMER COMPONENT ====================
// Shows countdown until 2-week waiting period completes
// Shows elapsed time when countdown is complete but amendment not yet enabled

interface CountdownTimerProps {
  majorityDate: string | null;
  daysUntilEnabled?: number;
  hoursUntilEnabled?: number;
  minutesUntilEnabled?: number;
  secondsUntilEnabled?: number;
  activationDate?: Date | string;  // Calculated activation date from API
  compact?: boolean;
  className?: string;
}

// Helper to validate if a date is reasonable (after 2020)
function isValidMajorityDate(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const year2020 = new Date('2020-01-01').getTime();
  return date.getTime() > year2020 && !isNaN(date.getTime());
}

function CountdownTimer({ 
  majorityDate, 
  daysUntilEnabled, 
  hoursUntilEnabled, 
  minutesUntilEnabled, 
  secondsUntilEnabled,
  activationDate,
  compact = false, 
  className = '' 
}: CountdownTimerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  // Update every second for live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate time values - Uses INDIVIDUAL countdown per amendment from API
  const timeData = useMemo(() => {
    // BEST CASE: We have activationDate from the API (calculated from Ripple epoch majority timestamp)
    if (activationDate) {
      const targetDate = typeof activationDate === 'string' ? new Date(activationDate) : activationDate;
      const diff = targetDate.getTime() - currentTime.getTime();
      
      if (diff > 0) {
        // Live countdown to this specific amendment's activation
        const totalSeconds = Math.floor(diff / 1000);
        const days = Math.floor(totalSeconds / (24 * 60 * 60));
        const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
        const seconds = totalSeconds % 60;
        return { days, hours, minutes, seconds, isCountdown: true, isExpired: false, hasActivationDate: true };
      }
      // Activation date passed - waiting for flag ledger
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isCountdown: false, isExpired: true, hasActivationDate: true };
    }
    
    // FALLBACK: If we have explicit d/h/m/s from API, use them with live countdown
    if (daysUntilEnabled !== undefined && daysUntilEnabled >= 0) {
      // Calculate total seconds remaining based on API values minus elapsed time since component mounted
      const initialTotalSeconds = 
        (daysUntilEnabled * 24 * 60 * 60) + 
        ((hoursUntilEnabled || 0) * 60 * 60) + 
        ((minutesUntilEnabled || 0) * 60) + 
        (secondsUntilEnabled || 0);
      
      const adjustedTotalSeconds = Math.max(0, initialTotalSeconds - elapsedSeconds);
      
      if (adjustedTotalSeconds > 0) {
        const days = Math.floor(adjustedTotalSeconds / (24 * 60 * 60));
        const hours = Math.floor((adjustedTotalSeconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((adjustedTotalSeconds % (60 * 60)) / 60);
        const seconds = adjustedTotalSeconds % 60;
        return { 
          days, hours, minutes, seconds, 
          isCountdown: true, 
          isExpired: false,
          hasActivationDate: false
        };
      }
      // Countdown reached zero
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isCountdown: false, isExpired: true, hasActivationDate: false };
    }
    
    // No countdown data - show waiting state
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isCountdown: false, isExpired: true, hasActivationDate: false };
  }, [activationDate, daysUntilEnabled, hoursUntilEnabled, minutesUntilEnabled, secondsUntilEnabled, currentTime, elapsedSeconds]);

  // Compact inline display for list view - BIGGER and MORE READABLE
  if (compact) {
    if (timeData.isExpired) {
      // Countdown complete - waiting for flag ledger activation
      return (
        <span className={`px-2 py-1 rounded text-xs bg-cyber-green/20 text-cyber-green border border-cyber-green/40 font-mono font-bold flex items-center gap-1.5 ${className}`}>
          <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
          ACTIVATING...
        </span>
      );
    }
    // Show live countdown - PURPLE background with WHITE text for contrast
    return (
      <span className={`px-2 py-1 rounded text-xs bg-purple-900/80 border border-purple-500/50 font-mono font-bold tracking-wide ${className}`}>
        <span className="text-white">{timeData.days}d</span>
        <span className="text-cyan-300 ml-1">{String(timeData.hours).padStart(2, '0')}</span>
        <span className="text-purple-300">:</span>
        <span className="text-cyan-300">{String(timeData.minutes).padStart(2, '0')}</span>
        <span className="text-purple-300">:</span>
        <span className="text-cyan-300">{String(timeData.seconds).padStart(2, '0')}</span>
      </span>
    );
  }

  // Full display for modal view
  if (timeData.isExpired) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <Timer size={14} className="text-cyber-green animate-pulse" />
          <span className="text-cyber-green font-cyber text-sm">2-week countdown complete!</span>
        </div>
        <p className="text-[10px] text-cyber-muted mt-2">
          Amendment awaiting next flag ledger for activation
        </p>
      </div>
    );
  }

  // Full display - live countdown with days, hours, minutes, seconds
  // COMPACT: Purple background with WHITE/CYAN text for contrast
  return (
    <div className={`${className}`}>
      <div className="flex gap-2 justify-center">
        <div className="text-center px-3 py-2 rounded bg-purple-900/80 border border-purple-500/60">
          <p className="font-mono text-xl font-bold text-white">{timeData.days}</p>
          <p className="text-[9px] text-purple-300 font-cyber">DAYS</p>
        </div>
        <div className="text-center px-3 py-2 rounded bg-purple-900/80 border border-purple-500/60">
          <p className="font-mono text-xl font-bold text-white">{String(timeData.hours).padStart(2, '0')}</p>
          <p className="text-[9px] text-purple-300 font-cyber">HRS</p>
        </div>
        <div className="text-center px-3 py-2 rounded bg-purple-900/80 border border-cyan-500/60">
          <p className="font-mono text-xl font-bold text-cyan-300">{String(timeData.minutes).padStart(2, '0')}</p>
          <p className="text-[9px] text-cyan-300 font-cyber">MIN</p>
        </div>
        <div className="text-center px-3 py-2 rounded bg-purple-900/80 border border-cyan-500/60">
          <p className="font-mono text-xl font-bold text-cyan-300">{String(timeData.seconds).padStart(2, '0')}</p>
          <p className="text-[9px] text-cyan-300 font-cyber">SEC</p>
        </div>
      </div>
    </div>
  );
}

// Export for use in other components
export { CountdownTimer };

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
  // Live data fields from XRPScan API
  percentSupport?: number;
  status?: 'enabled' | 'majority' | 'pending' | 'unsupported';
  // Individual countdown per amendment (not batched!)
  daysUntilEnabled?: number;
  hoursUntilEnabled?: number;
  minutesUntilEnabled?: number;
  secondsUntilEnabled?: number;
  activationDate?: Date;  // Calculated activation date (majority + 14 days)
  majorityDate?: string | null; // Date when majority was reached
  enabledOn?: string | null; // Date when amendment was enabled
  // Author information
  author?: string;  // Developer who proposed the amendment
  github?: string;  // GitHub PR/spec link
}

// Amendment metadata (performance impact assessments)
// Updated February 2026 with live data from xrpscan.com
// Author information from GitHub XRPL repository
const amendmentMetadata: Record<string, { 
  summary: string; 
  tier: Tier; 
  impact: PerformanceImpact;
  areas: AffectedArea[];
  rationale: string;
  author?: string;  // Developer who proposed the amendment
  github?: string;  // GitHub PR/spec link
}> = {
  // ==================== CURRENTLY AT MAJORITY ====================
  // Note: Only linking to official XLS specs or verified XRPL-Standards discussions
  'fixPriceOracleOrder': { summary: 'Fixes ordering issues in Price Oracle calculations', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Bug fix for price oracle ordering. Minimal performance impact, improves oracle reliability.', author: 'Ripple Engineering' },
  'fixMPTDeliveredAmount': { summary: 'Fixes delivered amount calculation for Multi-Purpose Tokens', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Bug fix for MPT amount calculations. Ensures accurate delivery amounts.', author: 'Ripple Engineering' },
  'fixIncludeKeyletFields': { summary: 'Fixes keylet field inclusion in ledger entries', tier: 'A', impact: 'Low', areas: ['CPU', 'Disk IO'], rationale: 'Internal fix for keylet field handling. No user-facing impact.', author: 'Ripple Engineering' },
  'fixAMMClawbackRounding': { summary: 'Fixes rounding issues in AMM clawback operations', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Corrects edge-case rounding in AMM+Clawback interactions.', author: 'Ripple Engineering' },
  'fixTokenEscrowV1': { summary: 'Fixes edge cases in token escrow functionality', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Bug fix for token escrow. Improves escrow reliability for issued tokens.', author: 'Ripple Engineering' },
  
  // ==================== AT MAJORITY ====================
  'PermissionedDomains': { summary: 'Enables permissioned domains for institutional use cases (XLS-80)', tier: 'B', impact: 'Low', areas: ['Disk IO', 'CPU'], rationale: 'New ledger object type for domain permissions. Enables compliant institutional deployments.', author: 'Mayukha Vadari', github: 'https://opensource.ripple.com/docs/xls-80d-permissioned-domains' },
  
  // ==================== CURRENTLY VOTING ====================
  'PermissionedDEX': { summary: 'Enables permissioned DEX trading for compliant assets (XLS-81)', tier: 'B', impact: 'Medium', areas: ['CPU', 'Memory'], rationale: 'Adds permission checks to DEX operations. Moderate overhead for compliant trading.', author: 'Mayukha Vadari', github: 'https://opensource.ripple.com/docs/xls-81d-permissioned-dexes' },
  'TokenEscrow': { summary: 'Native escrow support for issued tokens (XLS-85)', tier: 'B', impact: 'Medium', areas: ['CPU', 'Disk IO'], rationale: 'Extends escrow functionality to all tokens. New transaction types and ledger objects.', author: 'Denis Angell', github: 'https://opensource.ripple.com/docs/xls-85-token-escrow' },
  'Batch': { summary: 'Enables batching multiple transactions atomically (XLS-56)', tier: 'B', impact: 'Medium', areas: ['CPU', 'Memory', 'Fee pressure'], rationale: 'Allows atomic multi-transaction batches. Increases validation complexity but reduces fees.', author: 'RichardAH', github: 'https://opensource.ripple.com/docs/xls-56-batch-transactions' },
  'fixXChainRewardRounding': { summary: 'Fixes reward rounding in cross-chain bridge', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Bug fix for XChain reward calculations. Minor validation overhead.', author: 'Ripple Engineering' },
  
  // ==================== ENABLED (for reference) ====================
  'AMM': { summary: 'Native automated market maker functionality (XLS-30)', tier: 'B', impact: 'Medium', areas: ['CPU', 'Memory', 'Disk IO'], rationale: 'New ledger object type and transaction types. Pathfinding complexity increases.', author: 'Aanchal Malhotra & David Schwartz', github: 'https://opensource.ripple.com/docs/xls-30d-amm' },
  'Clawback': { summary: 'Enables token issuers to reclaim tokens from holders (XLS-39)', tier: 'B', impact: 'Low', areas: ['CPU'], rationale: 'Adds flag check during token transfers. Only affects tokens with clawback enabled.', author: 'Shawn Xie', github: 'https://github.com/XRPLF/XRPL-Standards/tree/master/XLS-0039d-clawback' },
  'PriceOracle': { summary: 'Native price oracle infrastructure for on-chain feeds (XLS-47)', tier: 'B', impact: 'Medium', areas: ['CPU', 'Network', 'Fee pressure'], rationale: 'New transaction type and ledger objects. Moderate impact on validation bandwidth.', author: 'Ripple Engineering', github: 'https://opensource.ripple.com/docs/xls-47d-price-oracles' },
  'DID': { summary: 'Decentralized Identifier support on XRPL (XLS-40)', tier: 'C', impact: 'Low', areas: ['Disk IO'], rationale: 'New ledger object type for DID documents. Minimal processing overhead.', author: 'Mayukha Vadari', github: 'https://opensource.ripple.com/docs/xls-40d-decentralized-identity' },
  'XChainBridge': { summary: 'Cross-chain bridge functionality (XLS-38)', tier: 'C', impact: 'Medium', areas: ['CPU', 'Network'], rationale: 'Enables atomic cross-chain transactions with witness servers. Low adoption so far.', author: 'Ripple Engineering', github: 'https://opensource.ripple.com/docs/xls-38d-cross-chain-bridge' },
  'fixNFTokenRemint': { summary: 'Fixes NFToken reminting edge cases', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Bug fix amendment with negligible performance impact.', author: 'Ripple Engineering' },
  'fixReducedOffersV1': { summary: 'Corrects offer reduction calculations', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Minor calculation fix in DEX operations.', author: 'Ripple Engineering' },
  'fixReducedOffersV2': { summary: 'Additional offer reduction calculation fixes', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Follow-up fix for DEX offer calculations.', author: 'Ripple Engineering' },
  'fixAMMOverflowOffer': { summary: 'Fixes AMM overflow in offer calculations', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Prevents integer overflow in AMM edge cases.', author: 'Ripple Engineering' },
  'fixAMMv1_1': { summary: 'AMM improvements and bug fixes (v1.1)', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Bug fixes for AMM functionality.', author: 'Ripple Engineering' },
  'fixAMMv1_2': { summary: 'AMM improvements and bug fixes (v1.2)', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Additional bug fixes for AMM.', author: 'Ripple Engineering' },
  'fixAMMv1_3': { summary: 'AMM improvements and bug fixes (v1.3)', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Latest AMM bug fixes.', author: 'Ripple Engineering' },
  'fixInnerObjTemplate2': { summary: 'Template fix for inner objects', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Internal template consistency fix.', author: 'Ripple Engineering' },
  'MPTokensV1': { summary: 'Multi-Purpose Token support (XLS-33)', tier: 'B', impact: 'Medium', areas: ['CPU', 'Memory', 'Disk IO'], rationale: 'New token type with additional metadata support.', author: 'Ripple Engineering', github: 'https://opensource.ripple.com/docs/xls-33d-multi-purpose-tokens' },
  'Credentials': { summary: 'On-chain credential verification (XLS-70)', tier: 'B', impact: 'Low', areas: ['Disk IO'], rationale: 'New ledger entry type for credential storage.', author: 'Mayukha Vadari', github: 'https://opensource.ripple.com/docs/xls-70d-credentials' },
  'DeepFreeze': { summary: 'Enhanced freeze functionality for compliance', tier: 'B', impact: 'Low', areas: ['CPU'], rationale: 'Adds deep freeze capability. Minimal overhead.', author: 'Ripple Engineering' },
  'DynamicNFT': { summary: 'Mutable NFT metadata support (XLS-46)', tier: 'B', impact: 'Low', areas: ['Disk IO', 'CPU'], rationale: 'Allows NFT metadata updates. New transaction type.', author: 'Denis Angell', github: 'https://opensource.ripple.com/docs/xls-46d-dynamic-nfts' },
  'AMMClawback': { summary: 'Clawback support for AMM LP tokens', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Extends clawback to AMM LP tokens. Minor validation overhead.', author: 'Ripple Engineering' },
  'NFTokenMintOffer': { summary: 'Combine NFT minting with sell offer (XLS-52)', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Convenience feature. Reduces transaction count.', author: 'Denis Angell', github: 'https://opensource.ripple.com/docs/xls-52d-nftoken-mint-offer' },
  'fixDirectoryLimit': { summary: 'Fixes directory pagination limits', tier: 'A', impact: 'Low', areas: ['CPU', 'Disk IO'], rationale: 'Bug fix for directory handling. Improves large account support.', author: 'Ripple Engineering' },
  'fixEnforceNFTokenTrustline': { summary: 'Enforces NFToken trustline requirements', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Security fix for NFToken trustlines.', author: 'Ripple Engineering' },
  'fixEnforceNFTokenTrustlineV2': { summary: 'Additional NFToken trustline enforcement', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Follow-up security fix.', author: 'Ripple Engineering' },
  'fixPayChanCancelAfter': { summary: 'Fixes payment channel cancel timing', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Bug fix for payment channel timing.', author: 'Ripple Engineering' },
  'fixNFTokenPageLinks': { summary: 'Fixes NFToken page linking issues', tier: 'A', impact: 'Low', areas: ['Disk IO'], rationale: 'Bug fix for NFToken pagination.', author: 'Ripple Engineering' },
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

  // Use API-provided days (each amendment has its own individual countdown)
  const waitingDays = xrpAmendment.daysUntilEnabled || 0;
  
  // Build evidence links - include GitHub if available
  const evidenceLinks: { label: string; url: string }[] = [
    { label: 'View on XRPScan', url: `https://xrpscan.com/amendment/${xrpAmendment.name}` }
  ];
  if (metadata.github) {
    evidenceLinks.push({ label: 'GitHub Spec/PR', url: metadata.github });
  }

  return {
    id: xrpAmendment.amendment_id,
    name: xrpAmendment.name,
    summary: metadata.summary,
    tier: metadata.tier,
    performanceImpact: metadata.impact,
    waitingDays: waitingDays,
    ledgerImpact: {
      estimatedImpact: metadata.impact,
      confidence: amendmentMetadata[xrpAmendment.name] ? 'High' : 'Low',
      affectedAreas: metadata.areas,
      rationale: metadata.rationale,
      evidenceLinks
    },
    validatorSupport: { 
      current: xrpAmendment.count, 
      required: xrpAmendment.threshold 
    },
    enabled: xrpAmendment.enabled,
    percentSupport: xrpAmendment.percentSupport,
    status: xrpAmendment.status,
    // Individual countdown per amendment (not batched!)
    daysUntilEnabled: xrpAmendment.daysUntilEnabled,
    hoursUntilEnabled: xrpAmendment.hoursUntilEnabled,
    minutesUntilEnabled: xrpAmendment.minutesUntilEnabled,
    secondsUntilEnabled: xrpAmendment.secondsUntilEnabled,
    activationDate: xrpAmendment.activationDate,  // Calculated from Ripple epoch majority timestamp
    majorityDate: xrpAmendment.majority ? String(xrpAmendment.majority) : null,
    enabledOn: xrpAmendment.enabled_on || null,
    // Author information
    author: metadata.author,
    github: metadata.github
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
  
  // Responsive layout detection
  const { isSmallHeight, isTinyHeight, isMinimized } = useResponsiveLayout();

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
                  : amendment.status === 'enabled'
                  ? 'border-cyber-green/30'
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
                  
                  {/* Live countdown timer badge for amendments at majority */}
                  {amendment.status === 'majority' && (
                    <CountdownTimer 
                      majorityDate={amendment.majorityDate} 
                      daysUntilEnabled={amendment.daysUntilEnabled}
                      hoursUntilEnabled={amendment.hoursUntilEnabled}
                      minutesUntilEnabled={amendment.minutesUntilEnabled}
                      secondsUntilEnabled={amendment.secondsUntilEnabled}
                      activationDate={amendment.activationDate}
                      compact 
                    />
                  )}
                  
                  {/* Enabled date badge for enabled amendments */}
                  {amendment.status === 'enabled' && amendment.enabledOn && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] bg-cyber-green/20 text-cyber-green border border-cyber-green/30">
                      ✓ {new Date(amendment.enabledOn).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] text-${impactColors[amendment.ledgerImpact.estimatedImpact]}`}>
                  {amendment.ledgerImpact.estimatedImpact}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedAmendment(null)}
          >
            <motion.div
              className="cyber-panel cyber-glow w-full max-w-lg max-h-[98vh] flex flex-col"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* COMPACT HEADER - Name, Author, X button */}
              <div className="flex items-center justify-between gap-2 border-b border-cyber-border/50 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-cyber bg-${tierColors[selectedAmendment.tier]}/20 text-${tierColors[selectedAmendment.tier]} border border-${tierColors[selectedAmendment.tier]}/30`}>
                      {selectedAmendment.tier}
                    </span>
                    <h3 className="font-cyber text-cyber-glow text-sm truncate">
                      {selectedAmendment.name}
                    </h3>
                    {selectedAmendment.enabled && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-cyber bg-cyber-green/20 text-cyber-green">
                        ✓
                      </span>
                    )}
                  </div>
                  {/* Author + GitHub Link */}
                  {selectedAmendment.author && (
                    <div className="flex items-center gap-2 mt-1">
                      <User size={12} className="text-cyber-purple" />
                      <span className="text-xs text-cyber-purple">{selectedAmendment.author}</span>
                      {selectedAmendment.github && (
                        <a 
                          href={selectedAmendment.github} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/40 border border-purple-500/50 text-[10px] text-purple-300 hover:text-white transition-all"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Github size={12} />
                          <span>View Spec</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
                {/* X BUTTON */}
                <button
                  onClick={() => setSelectedAmendment(null)}
                  className="p-1.5 bg-red-500/30 hover:bg-red-500/50 border border-red-500/50 rounded transition-colors shrink-0"
                  title="Close"
                >
                  <X size={16} className="text-red-400" />
                </button>
              </div>

              {/* SCROLLABLE CONTENT - More compact */}
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
                {/* Summary */}
                <p className="text-cyber-text text-xs">
                  {selectedAmendment.summary}
                </p>

              {/* Countdown Timer for Majority Amendments */}
              {selectedAmendment.status === 'majority' && (
                <div className="p-2 rounded-lg bg-purple-900/30 border border-purple-500/40">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock size={12} className="text-purple-400" />
                    <span className="text-xs font-cyber text-purple-300">TIME UNTIL ACTIVATION</span>
                  </div>
                  <CountdownTimer 
                    majorityDate={selectedAmendment.majorityDate} 
                    daysUntilEnabled={selectedAmendment.daysUntilEnabled}
                    hoursUntilEnabled={selectedAmendment.hoursUntilEnabled}
                    minutesUntilEnabled={selectedAmendment.minutesUntilEnabled}
                    secondsUntilEnabled={selectedAmendment.secondsUntilEnabled}
                    activationDate={selectedAmendment.activationDate}
                  />
                  {selectedAmendment.activationDate && (
                    <p className="text-[10px] text-purple-300/70 mt-2 text-center">
                      Activates: {new Date(selectedAmendment.activationDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {/* Enabled Date for Already Activated Amendments */}
              {selectedAmendment.status === 'enabled' && selectedAmendment.enabledOn && (
                <div className="p-2 rounded bg-cyber-green/10 border border-cyber-green/30 flex items-center gap-2">
                  <Clock size={12} className="text-cyber-green" />
                  <span className="text-[10px] font-cyber text-cyber-green">ACTIVATED</span>
                  <span className="text-cyber-green font-mono text-xs">
                    {new Date(selectedAmendment.enabledOn).toLocaleDateString()}
                  </span>
                </div>
              )}

              {/* Quick Stats - Compact row */}
              <div className="grid grid-cols-3 gap-1">
                <div className="p-1.5 rounded bg-cyber-darker/50 border border-cyber-border/50 text-center">
                  <p className="text-[9px] text-cyber-muted">Waiting</p>
                  <p className="font-cyber text-cyber-text text-xs">{selectedAmendment.waitingDays}d</p>
                </div>
                <div className="p-1.5 rounded bg-cyber-darker/50 border border-cyber-border/50 text-center">
                  <p className="text-[9px] text-cyber-muted">Support</p>
                  <p className="font-cyber text-cyber-text text-xs">
                    {selectedAmendment.validatorSupport.current}/{selectedAmendment.validatorSupport.required}
                  </p>
                </div>
                <div className="p-1.5 rounded bg-cyber-darker/50 border border-cyber-border/50 text-center">
                  <p className="text-[9px] text-cyber-muted">Impact</p>
                  <p className={`font-cyber text-${impactColors[selectedAmendment.ledgerImpact.estimatedImpact]} text-xs`}>
                    {selectedAmendment.ledgerImpact.estimatedImpact}
                  </p>
                </div>
              </div>

              {/* Ledger Impact Details - Compact */}
              <div>
                <h4 className="font-cyber text-cyber-cyan flex items-center gap-1.5 text-xs mb-1.5">
                  <Zap size={12} />
                  IMPACT ANALYSIS
                </h4>
                
                {/* Affected Areas - Inline */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedAmendment.ledgerImpact.affectedAreas.map(area => (
                    <span 
                      key={area}
                      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/30 text-[10px]"
                    >
                      {areaIcons[area]}
                      {area}
                    </span>
                  ))}
                  <span className="px-1.5 py-0.5 rounded bg-cyber-darker/50 text-cyber-text border border-cyber-border/30 text-[10px]">
                    {selectedAmendment.ledgerImpact.confidence} confidence
                  </span>
                </div>

                {/* Rationale - Compact */}
                <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/30">
                  <p className="text-[10px] text-cyber-text">{selectedAmendment.ledgerImpact.rationale}</p>
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
              </div>

              {/* COMPACT FOOTER - Back Button */}
              <div className="border-t border-cyber-border/50 px-3 py-2">
                <button
                  onClick={() => setSelectedAmendment(null)}
                  className="w-full py-2 px-3 bg-cyber-darker hover:bg-cyber-glow/10 border border-cyber-border hover:border-cyber-glow/50 rounded transition-all text-xs font-cyber text-cyber-text flex items-center justify-center gap-2"
                >
                  <ChevronRight size={14} className="rotate-180" />
                  Back
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LedgerImpactTool;
