import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Clock, Users, ExternalLink, ChevronRight,
  Cpu, HardDrive, Wifi, DollarSign, MemoryStick, RefreshCw,
  X, FileText, AlertTriangle, Loader2, Timer, Github, User, CheckCircle2, KeyRound, Info
} from 'lucide-react';
import { fetchXRPLAmendments, type XRPLAmendment } from '../services/freeDataFeeds';
import { useIsInAppBrowser } from '../hooks/useIsInAppBrowser';
import { useGovernanceStore } from '../store/governanceStore';

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
  author?: string;
  github?: string;
  /** Alias for companion: proposer name */
  proposerName?: string;
  /** Alias for companion: primary GitHub proposal URL */
  githubProposalUrl?: string;
  /** Who benefits (Governance Companion style) */
  whoBenefits?: string;
  /** Stakeholder categories */
  whoBenefitsCategories?: string[];
  /** Example use cases (illustrative) */
  whoBenefitsExamples?: string[];
  /** Estimated review time in minutes */
  estimatedReviewMinutes?: number;
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
  author?: string;
  github?: string;
  /** Who benefits (Governance Companion style) — plain-English */
  whoBenefits?: string;
  /** Stakeholder categories (e.g. Enterprise, Builders) */
  whoBenefitsCategories?: string[];
  /** Example use cases (illustrative) */
  whoBenefitsExamples?: string[];
  /** Estimated review time in minutes */
  estimatedReviewMinutes?: number;
}> = {
  // ==================== CURRENTLY AT MAJORITY ====================
  // Note: Only linking to official XLS specs or verified XRPL-Standards discussions
  // Who-this-helps synopses aligned with XRPL Governance Companion style (categories, explanation, examples)
  'fixPriceOracleOrder': { summary: 'Fixes ordering issues in Price Oracle calculations', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Bug fix for price oracle ordering. Minimal performance impact, improves oracle reliability.', author: 'Ripple Engineering', github: 'https://github.com/XRPLF/rippled/labels/amendment', whoBenefits: 'Improves reliability for applications using native price oracles and DeFi protocols.', whoBenefitsCategories: ['Builders', 'Exchanges/Liquidity', 'Enterprise'], whoBenefitsExamples: ['DeFi protocols', 'Oracle consumers', 'Price-feed applications'], estimatedReviewMinutes: 5 },
  'fixMPTDeliveredAmount': { summary: 'Fixes delivered amount calculation for Multi-Purpose Tokens', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Bug fix for MPT amount calculations. Ensures accurate delivery amounts.', author: 'Ripple Engineering', github: 'https://github.com/XRPLF/rippled/labels/amendment', whoBenefits: 'Ensures accurate token delivery for MPT issuers and exchanges.', whoBenefitsCategories: ['Exchanges/Liquidity', 'Builders', 'Enterprise'], whoBenefitsExamples: ['Token issuers', 'DEXs', 'Settlement systems'], estimatedReviewMinutes: 5 },
  'fixIncludeKeyletFields': { summary: 'Fixes keylet field inclusion in ledger entries', tier: 'A', impact: 'Low', areas: ['CPU', 'Disk IO'], rationale: 'Internal fix for keylet field handling. No user-facing impact.', author: 'Ripple Engineering', github: 'https://github.com/XRPLF/rippled/labels/amendment', whoBenefits: 'Improves ledger consistency and reliability for all node operators and builders.', whoBenefitsCategories: ['Public Infrastructure', 'Builders'], whoBenefitsExamples: ['Node operators', 'Indexing services', 'Wallet providers'], estimatedReviewMinutes: 5 },
  'fixAMMClawbackRounding': { summary: 'Fixes rounding issues in AMM clawback operations', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Corrects edge-case rounding in AMM+Clawback interactions.', author: 'Ripple Engineering', github: 'https://github.com/XRPLF/rippled/labels/amendment', whoBenefits: 'Ensures correct accounting when AMM LP tokens use clawback; benefits compliant DeFi.', whoBenefitsCategories: ['Exchanges/Liquidity', 'Enterprise', 'Builders'], whoBenefitsExamples: ['AMM liquidity providers', 'Regulated token issuers', 'Compliance-focused DEXs'], estimatedReviewMinutes: 5 },
  'fixTokenEscrowV1': { summary: 'Fixes edge cases in token escrow functionality', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Bug fix for token escrow. Improves escrow reliability for issued tokens.', author: 'Ripple Engineering', github: 'https://github.com/XRPLF/rippled/labels/amendment', whoBenefits: 'Improves reliability of token escrow for issuers and applications using conditional releases.', whoBenefitsCategories: ['Enterprise', 'Builders', 'Exchanges/Liquidity'], whoBenefitsExamples: ['Escrow services', 'Token issuers', 'Conditional payment apps'], estimatedReviewMinutes: 5 },
  
  // ==================== AT MAJORITY ====================
  'PermissionedDomains': { summary: 'Enables permissioned domains for institutional use cases (XLS-80)', tier: 'B', impact: 'Low', areas: ['Disk IO', 'CPU'], rationale: 'New ledger object type for domain permissions. Enables compliant institutional deployments.', author: 'Mayukha Vadari', github: 'https://opensource.ripple.com/docs/xls-80d-permissioned-domains', whoBenefits: 'Institutional validators and enterprises requiring compliant domain controls.', whoBenefitsCategories: ['Enterprise', 'Public Infrastructure'], whoBenefitsExamples: ['Institutional validators', 'Regulated enterprises'], estimatedReviewMinutes: 15 },
  
  // ==================== CURRENTLY VOTING ====================
  'PermissionedDEX': { summary: 'Enables permissioned DEX trading for compliant assets (XLS-81)', tier: 'B', impact: 'Medium', areas: ['CPU', 'Memory'], rationale: 'Adds permission checks to DEX operations. Moderate overhead for compliant trading.', author: 'Mayukha Vadari', github: 'https://opensource.ripple.com/docs/xls-81d-permissioned-dexes', whoBenefits: 'Enables compliant DEX trading and regulated asset markets.', whoBenefitsCategories: ['Enterprise', 'Exchanges/Liquidity', 'Security/Stability'], whoBenefitsExamples: ['Regulated exchanges', 'Security token platforms', 'Compliance-focused DEXs'], estimatedReviewMinutes: 15 },
  'TokenEscrow': { summary: 'Native escrow support for issued tokens (XLS-85)', tier: 'B', impact: 'Medium', areas: ['CPU', 'Disk IO'], rationale: 'Extends escrow functionality to all tokens. New transaction types and ledger objects.', author: 'Denis Angell', github: 'https://opensource.ripple.com/docs/xls-85-token-escrow', whoBenefits: 'Enables time-locked and conditional token releases for any issued asset.', whoBenefitsCategories: ['Enterprise', 'Builders', 'Exchanges/Liquidity'], whoBenefitsExamples: ['Escrow services', 'Token issuers', 'Conditional payments', 'Vesting'], estimatedReviewMinutes: 20 },
  'Batch': { summary: 'Enables batching multiple transactions atomically (XLS-56)', tier: 'B', impact: 'Medium', areas: ['CPU', 'Memory', 'Fee pressure'], rationale: 'Allows atomic multi-transaction batches. Increases validation complexity but reduces fees.', author: 'RichardAH', github: 'https://opensource.ripple.com/docs/xls-56-batch-transactions', whoBenefits: 'Reduces cost and complexity for applications that need to submit multiple operations atomically.', whoBenefitsCategories: ['Builders', 'Exchanges/Liquidity', 'Public Infrastructure'], whoBenefitsExamples: ['DEX aggregators', 'Batch payment apps', 'Multi-step DeFi flows'], estimatedReviewMinutes: 25 },
  'fixXChainRewardRounding': { summary: 'Fixes reward rounding in cross-chain bridge', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Bug fix for XChain reward calculations. Minor validation overhead.', author: 'Ripple Engineering', github: 'https://github.com/XRPLF/rippled/labels/amendment', whoBenefits: 'Ensures accurate bridge rewards for sidechain operators and cross-chain applications.', whoBenefitsCategories: ['Builders', 'Enterprise', 'Public Infrastructure'], whoBenefitsExamples: ['Sidechain operators', 'Bridge providers', 'Cross-chain apps'], estimatedReviewMinutes: 5 },
  
  // ==================== ENABLED (for reference) ====================
  'AMM': { summary: 'Native automated market maker functionality (XLS-30)', tier: 'B', impact: 'Medium', areas: ['CPU', 'Memory', 'Disk IO'], rationale: 'New ledger object type and transaction types. Pathfinding complexity increases.', author: 'Aanchal Malhotra & David Schwartz', github: 'https://opensource.ripple.com/docs/xls-30d-amm', whoBenefits: 'Enables decentralized liquidity provision and more efficient token swaps.', whoBenefitsCategories: ['Exchanges/Liquidity', 'Builders', 'Public Infrastructure'], whoBenefitsExamples: ['DEX aggregators', 'Liquidity providers', 'Token projects'], estimatedReviewMinutes: 25 },
  'Clawback': { summary: 'Enables token issuers to reclaim tokens from holders (XLS-39)', tier: 'B', impact: 'Low', areas: ['CPU'], rationale: 'Adds flag check during token transfers. Only affects tokens with clawback enabled.', author: 'Shawn Xie', github: 'https://github.com/XRPLF/XRPL-Standards/tree/master/XLS-0039d-clawback', whoBenefits: 'Enables compliant stablecoin implementations and regulated asset tokenization.', whoBenefitsCategories: ['Enterprise', 'Security/Stability', 'Builders'], whoBenefitsExamples: ['Regulated stablecoins', 'Security tokens', 'Compliance-focused issuers'] },
  'PriceOracle': { summary: 'Native price oracle infrastructure for on-chain feeds (XLS-47)', tier: 'B', impact: 'Medium', areas: ['CPU', 'Network', 'Fee pressure'], rationale: 'New transaction type and ledger objects. Moderate impact on validation bandwidth.', author: 'Ripple Engineering', github: 'https://opensource.ripple.com/docs/xls-47d-price-oracles', whoBenefits: 'Enables DeFi applications that require reliable on-chain price data.', whoBenefitsCategories: ['Builders', 'Exchanges/Liquidity', 'Enterprise'], whoBenefitsExamples: ['Lending protocols', 'Derivatives', 'Stablecoin mechanisms'], estimatedReviewMinutes: 15 },
  'DID': { summary: 'Decentralized Identifier support on XRPL (XLS-40)', tier: 'C', impact: 'Low', areas: ['Disk IO'], rationale: 'New ledger object type for DID documents. Minimal processing overhead.', author: 'Mayukha Vadari', github: 'https://opensource.ripple.com/docs/xls-40d-decentralized-identity', whoBenefits: 'Supports identity verification use cases and credential issuance.', whoBenefitsCategories: ['Builders', 'Enterprise', 'Public Infrastructure'], whoBenefitsExamples: ['Identity providers', 'KYC services', 'Credential issuers'], estimatedReviewMinutes: 20 },
  'XChainBridge': { summary: 'Cross-chain bridge functionality (XLS-38)', tier: 'C', impact: 'Medium', areas: ['CPU', 'Network'], rationale: 'Enables atomic cross-chain transactions with witness servers. Low adoption so far.', author: 'Ripple Engineering', github: 'https://opensource.ripple.com/docs/xls-38d-cross-chain-bridge', whoBenefits: 'Enables new sidechain deployments and cross-chain asset transfers.', whoBenefitsCategories: ['Builders', 'Enterprise', 'Public Infrastructure'], whoBenefitsExamples: ['Sidechain operators', 'Cross-chain applications', 'Enterprise deployments'], estimatedReviewMinutes: 45 },
  'fixNFTokenDirV1': { summary: 'Corrects edge-case errors in NFToken directory pagination logic', tier: 'A', impact: 'Low', areas: ['CPU', 'Disk IO'], rationale: 'Adds a single validation check during NFToken operations. Benchmarks show negligible impact.', author: 'XRPLF', github: 'https://github.com/XRPLF/rippled/pull/4567', whoBenefits: 'Improves reliability for NFT marketplaces and applications that handle high-volume token operations.', whoBenefitsCategories: ['Builders', 'Exchanges/Liquidity', 'Public Infrastructure'], whoBenefitsExamples: ['NFT marketplaces', 'Gaming platforms', 'Collectible services'], estimatedReviewMinutes: 5 },
  'fixReducedOffersV1': { summary: 'Fixes rounding errors in offer crossing when dealing with very small amounts', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Replaces one rounding function with another. No measurable performance difference.', author: 'Ripple Engineering', github: 'https://github.com/XRPLF/rippled/pull/4591', whoBenefits: 'Ensures accurate accounting for all transactions, particularly micro-transactions.', whoBenefitsCategories: ['Security/Stability', 'Exchanges/Liquidity', 'Public Infrastructure'], whoBenefitsExamples: ['High-frequency trading', 'Micro-payment systems'], estimatedReviewMinutes: 5 },
  'fixReducedOffersV2': { summary: 'Additional offer reduction calculation fixes', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Follow-up fix for DEX offer calculations.', author: 'Ripple Engineering', github: 'https://github.com/XRPLF/rippled/labels/amendment', whoBenefits: 'Ensures accurate accounting for DEX offers and micro-transactions (follow-up to fixReducedOffersV1).', whoBenefitsCategories: ['Security/Stability', 'Exchanges/Liquidity', 'Public Infrastructure'], whoBenefitsExamples: ['DEXs', 'High-frequency trading', 'Micro-payments'], estimatedReviewMinutes: 5 },
  'fixAMMOverflowOffer': { summary: 'Fixes AMM overflow in offer calculations', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Prevents integer overflow in AMM edge cases.', author: 'Ripple Engineering', github: 'https://github.com/XRPLF/rippled/labels/amendment', whoBenefits: 'Prevents incorrect AMM behavior in edge cases; protects liquidity providers and DEX users.', whoBenefitsCategories: ['Exchanges/Liquidity', 'Builders', 'Public Infrastructure'], whoBenefitsExamples: ['AMM pools', 'DEX aggregators', 'Liquidity providers'], estimatedReviewMinutes: 5 },
  'fixAMMv1_1': { summary: 'AMM improvements and bug fixes (v1.1)', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Bug fixes for AMM functionality.', author: 'Ripple Engineering', github: 'https://github.com/XRPLF/rippled/labels/amendment', whoBenefits: 'Improves AMM reliability and correctness for all liquidity and swap use cases.', whoBenefitsCategories: ['Exchanges/Liquidity', 'Builders', 'Public Infrastructure'], whoBenefitsExamples: ['AMM pools', 'Liquidity providers', 'Token projects'], estimatedReviewMinutes: 5 },
  'fixAMMv1_2': { summary: 'AMM improvements and bug fixes (v1.2)', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Additional bug fixes for AMM.', author: 'Ripple Engineering', github: 'https://github.com/XRPLF/rippled/labels/amendment', whoBenefits: 'Further AMM stability and correctness for DEX and liquidity applications.', whoBenefitsCategories: ['Exchanges/Liquidity', 'Builders', 'Public Infrastructure'], whoBenefitsExamples: ['DEX aggregators', 'Liquidity providers', 'Token projects'], estimatedReviewMinutes: 5 },
  'fixAMMv1_3': { summary: 'AMM improvements and bug fixes (v1.3)', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Latest AMM bug fixes.', author: 'Ripple Engineering', github: 'https://github.com/XRPLF/rippled/labels/amendment', whoBenefits: 'Latest AMM fixes improve safety and predictability for native liquidity.', whoBenefitsCategories: ['Exchanges/Liquidity', 'Builders', 'Public Infrastructure'], whoBenefitsExamples: ['AMM pools', 'Liquidity providers', 'DEXs'], estimatedReviewMinutes: 5 },
  'fixInnerObjTemplate2': { summary: 'Template fix for inner objects', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Internal template consistency fix.', author: 'Ripple Engineering', github: 'https://github.com/XRPLF/rippled/labels/amendment', whoBenefits: 'Improves ledger and object consistency for node operators and infrastructure.', whoBenefitsCategories: ['Public Infrastructure', 'Builders'], whoBenefitsExamples: ['Node operators', 'Indexing services'], estimatedReviewMinutes: 5 },
  'MPTokensV1': { summary: 'Multi-Purpose Token support (XLS-33)', tier: 'B', impact: 'Medium', areas: ['CPU', 'Memory', 'Disk IO'], rationale: 'New token type with additional metadata support.', author: 'Ripple Engineering', github: 'https://opensource.ripple.com/docs/xls-33d-multi-purpose-tokens', whoBenefits: 'Enables richer token types and metadata for issuers and applications.', whoBenefitsCategories: ['Builders', 'Enterprise', 'Exchanges/Liquidity'], whoBenefitsExamples: ['Token issuers', 'Asset platforms', 'Settlement systems'], estimatedReviewMinutes: 25 },
  'Credentials': { summary: 'On-chain credential verification (XLS-70)', tier: 'B', impact: 'Low', areas: ['Disk IO'], rationale: 'New ledger entry type for credential storage.', author: 'Mayukha Vadari', github: 'https://opensource.ripple.com/docs/xls-70d-credentials', whoBenefits: 'Supports verifiable credentials and identity use cases on the ledger.', whoBenefitsCategories: ['Builders', 'Enterprise', 'Public Infrastructure'], whoBenefitsExamples: ['Identity providers', 'KYC services', 'Credential issuers'], estimatedReviewMinutes: 20 },
  'DeepFreeze': { summary: 'Enhanced freeze functionality for compliance', tier: 'B', impact: 'Low', areas: ['CPU'], rationale: 'Adds deep freeze capability. Minimal overhead.', author: 'Ripple Engineering', github: 'https://github.com/XRPLF/rippled/labels/amendment', whoBenefits: 'Enables stronger compliance controls for token issuers and regulated assets.', whoBenefitsCategories: ['Enterprise', 'Security/Stability', 'Builders'], whoBenefitsExamples: ['Regulated issuers', 'Compliance teams', 'Security tokens'], estimatedReviewMinutes: 10 },
  'DynamicNFT': { summary: 'Mutable NFT metadata support (XLS-46)', tier: 'B', impact: 'Low', areas: ['Disk IO', 'CPU'], rationale: 'Allows NFT metadata updates. New transaction type.', author: 'Denis Angell', github: 'https://opensource.ripple.com/docs/xls-46d-dynamic-nfts', whoBenefits: 'Enables updatable NFT metadata for gaming, collectibles, and dynamic content.', whoBenefitsCategories: ['Builders', 'Exchanges/Liquidity', 'Public Infrastructure'], whoBenefitsExamples: ['Gaming platforms', 'NFT marketplaces', 'Collectible services'], estimatedReviewMinutes: 15 },
  'AMMClawback': { summary: 'Clawback support for AMM LP tokens', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Extends clawback to AMM LP tokens. Minor validation overhead.', author: 'Ripple Engineering', github: 'https://github.com/XRPLF/rippled/labels/amendment', whoBenefits: 'Allows compliant AMM LP token issuance with optional clawback.', whoBenefitsCategories: ['Exchanges/Liquidity', 'Enterprise', 'Builders'], whoBenefitsExamples: ['Regulated AMMs', 'Compliance-focused DEXs', 'LP token issuers'], estimatedReviewMinutes: 5 },
  'NFTokenMintOffer': { summary: 'Combine NFT minting with sell offer (XLS-52)', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Convenience feature. Reduces transaction count.', author: 'Denis Angell', github: 'https://opensource.ripple.com/docs/xls-52d-nftoken-mint-offer', whoBenefits: 'Simplifies NFT mint-and-sell flows; lower cost and fewer steps for creators and marketplaces.', whoBenefitsCategories: ['Builders', 'Exchanges/Liquidity', 'Public Infrastructure'], whoBenefitsExamples: ['NFT marketplaces', 'Creators', 'Gaming platforms'], estimatedReviewMinutes: 5 },
  'fixDirectoryLimit': { summary: 'Fixes directory pagination limits', tier: 'A', impact: 'Low', areas: ['CPU', 'Disk IO'], rationale: 'Bug fix for directory handling. Improves large account support.', author: 'Ripple Engineering', github: 'https://github.com/XRPLF/rippled/labels/amendment', whoBenefits: 'Improves reliability for accounts with many ledger entries and directory users.', whoBenefitsCategories: ['Builders', 'Public Infrastructure'], whoBenefitsExamples: ['Wallet providers', 'Indexing services', 'Large account holders'], estimatedReviewMinutes: 5 },
  'fixEnforceNFTokenTrustline': { summary: 'Enforces NFToken trustline requirements', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Security fix for NFToken trustlines.', author: 'Ripple Engineering', github: 'https://github.com/XRPLF/rippled/labels/amendment', whoBenefits: 'Strengthens NFToken security and correct trustline behavior.', whoBenefitsCategories: ['Security/Stability', 'Builders', 'Exchanges/Liquidity'], whoBenefitsExamples: ['NFT marketplaces', 'Wallet providers', 'Gaming platforms'], estimatedReviewMinutes: 5 },
  'fixEnforceNFTokenTrustlineV2': { summary: 'Additional NFToken trustline enforcement', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Follow-up security fix.', author: 'Ripple Engineering', github: 'https://github.com/XRPLF/rippled/labels/amendment', whoBenefits: 'Further NFToken trustline security for marketplaces and applications.', whoBenefitsCategories: ['Security/Stability', 'Builders', 'Exchanges/Liquidity'], whoBenefitsExamples: ['NFT marketplaces', 'Wallet providers', 'Collectible services'], estimatedReviewMinutes: 5 },
  'fixPayChanCancelAfter': { summary: 'Fixes payment channel cancel timing', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Bug fix for payment channel timing.', author: 'Ripple Engineering', github: 'https://github.com/XRPLF/rippled/labels/amendment', whoBenefits: 'Correct payment channel lifecycle for streaming and high-throughput payment apps.', whoBenefitsCategories: ['Builders', 'Exchanges/Liquidity', 'Public Infrastructure'], whoBenefitsExamples: ['Payment channels', 'Streaming payments', 'Micropayment apps'], estimatedReviewMinutes: 5 },
  'fixNFTokenPageLinks': { summary: 'Fixes NFToken page linking issues', tier: 'A', impact: 'Low', areas: ['Disk IO'], rationale: 'Bug fix for NFToken pagination.', author: 'Ripple Engineering', github: 'https://github.com/XRPLF/rippled/labels/amendment', whoBenefits: 'Improves NFToken directory and pagination reliability for marketplaces and wallets.', whoBenefitsCategories: ['Builders', 'Exchanges/Liquidity', 'Public Infrastructure'], whoBenefitsExamples: ['NFT marketplaces', 'Wallet providers', 'Indexing services'], estimatedReviewMinutes: 5 },
  'fixNFTokenRemint': { summary: 'Fixes NFToken reminting edge cases', tier: 'A', impact: 'Low', areas: ['CPU'], rationale: 'Bug fix amendment with negligible performance impact.', author: 'Ripple Engineering', github: 'https://github.com/XRPLF/rippled/labels/amendment', whoBenefits: 'Improves NFToken burn-and-remint reliability for creators and marketplaces.', whoBenefitsCategories: ['Builders', 'Exchanges/Liquidity', 'Public Infrastructure'], whoBenefitsExamples: ['NFT marketplaces', 'Gaming platforms', 'Collectible services'], estimatedReviewMinutes: 5 },
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
    author: metadata.author,
    github: metadata.github,
    proposerName: metadata.author,
    githubProposalUrl: metadata.github,
    whoBenefits: metadata.whoBenefits,
    whoBenefitsCategories: metadata.whoBenefitsCategories,
    whoBenefitsExamples: metadata.whoBenefitsExamples,
    estimatedReviewMinutes: metadata.estimatedReviewMinutes,
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

// Inline style maps for the portaled modal — iOS WebView often ignores Tailwind/theme when content is under document.body
const tierStyles: Record<Tier, { bg: string; border: string; text: string }> = {
  A: { bg: 'rgba(34,197,94,0.2)', border: 'rgba(34,197,94,0.5)', text: '#22c55e' },
  B: { bg: 'rgba(234,179,8,0.2)', border: 'rgba(234,179,8,0.5)', text: '#eab308' },
  C: { bg: 'rgba(168,85,247,0.2)', border: 'rgba(168,85,247,0.5)', text: '#a855f7' },
};
const impactStyles: Record<PerformanceImpact, string> = {
  Low: '#22c55e',
  Medium: '#eab308',
  High: '#ef4444',
  Unknown: '#94a3b8',
};

/** Get one amendment from static metadata (for AmendmentDetail when API fails, e.g. X in-app browser). */
function getStaticAmendmentByName(name: string): Amendment | null {
  const meta = amendmentMetadata[name];
  if (!meta) return null;
  const evidenceLinks: { label: string; url: string }[] = [
    { label: 'View on XRPScan', url: `https://xrpscan.com/amendment/${name}` }
  ];
  if (meta.github) evidenceLinks.push({ label: 'GitHub Spec/PR', url: meta.github });
  return {
    id: name,
    name,
    summary: meta.summary,
    tier: meta.tier,
    performanceImpact: meta.impact,
    waitingDays: 0,
    ledgerImpact: {
      estimatedImpact: meta.impact,
      confidence: 'High',
      affectedAreas: meta.areas,
      rationale: meta.rationale,
      evidenceLinks,
    },
    validatorSupport: { current: 0, required: 34 },
    enabled: false,
    percentSupport: 0,
    status: 'pending',
    author: meta.author,
    github: meta.github,
    whoBenefits: meta.whoBenefits,
    whoBenefitsCategories: meta.whoBenefitsCategories,
    whoBenefitsExamples: meta.whoBenefitsExamples,
    estimatedReviewMinutes: meta.estimatedReviewMinutes,
  };
}

// Re-export for AmendmentDetail
export type { Amendment };

/** Fetch a single amendment by name (for AmendmentDetail when location.state is lost, e.g. X in-app browser). */
export async function fetchAmendmentByName(name: string): Promise<Amendment | null> {
  try {
    const list = await fetchXRPLAmendments();
    const found = list.find((a) => a.name === name);
    return found ? convertToAmendment(found) : getStaticAmendmentByName(name);
  } catch (e) {
    console.warn('[LedgerImpact] fetchAmendmentByName failed (using static fallback):', e);
    return getStaticAmendmentByName(name);
  }
}

/** Static amendment list from metadata — used when live fetch fails (e.g. X in-app browser) so the box always has data. */
function getStaticAmendments(): Amendment[] {
  return Object.entries(amendmentMetadata).map(([name, meta]) => {
    const evidenceLinks: { label: string; url: string }[] = [
      { label: 'View on XRPScan', url: `https://xrpscan.com/amendment/${name}` }
    ];
    if (meta.github) evidenceLinks.push({ label: 'GitHub Spec/PR', url: meta.github });
    return {
      id: name,
      name,
      summary: meta.summary,
      tier: meta.tier,
      performanceImpact: meta.impact,
      waitingDays: 0,
      ledgerImpact: {
        estimatedImpact: meta.impact,
        confidence: 'High',
        affectedAreas: meta.areas,
        rationale: meta.rationale,
        evidenceLinks,
      },
      validatorSupport: { current: 0, required: 34 },
      enabled: false,
      percentSupport: 0,
      status: 'pending',
      author: meta.author,
      github: meta.github,
      whoBenefits: meta.whoBenefits,
      whoBenefitsCategories: meta.whoBenefitsCategories,
      whoBenefitsExamples: meta.whoBenefitsExamples,
      estimatedReviewMinutes: meta.estimatedReviewMinutes,
    };
  });
}

type FilterMode = 'all' | 'pending' | 'enabled' | 'needs_review';

export function LedgerImpactTool() {
  const [amendments, setAmendments] = useState<Amendment[]>(() => getStaticAmendments());
  const [selectedAmendment, setSelectedAmendment] = useState<Amendment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('needs_review');
  const [dataSource, setDataSource] = useState<'live' | 'fallback'>('fallback');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const isInAppBrowser = useIsInAppBrowser();
  const { reviewedAmendmentIds, isReviewed, markReviewed, unmarkReviewed, validatorPublicKey, setValidatorPublicKey } = useGovernanceStore();
  
  // Responsive layout detection
  const { isSmallHeight, isTinyHeight, isMinimized } = useResponsiveLayout();

  // Use full-page link (no modal) when in-app browser OR narrow viewport (e.g. iPhone in X).
  // Modals often render blank in X/Twitter WebView; full page always shows content.
  const useFullPageLink = isInAppBrowser || isMinimized || isSmallHeight;

  // Fetch live amendments from XRPScan; on failure keep showing static list so the box always has info
  const fetchAmendments = useCallback(async () => {
    setIsLoading(true);
    try {
      const liveAmendments = await fetchXRPLAmendments();
      
      if (liveAmendments.length > 0) {
        const sorted = liveAmendments
          .map(convertToAmendment)
          .sort((a, b) => {
            if (a.enabled && !b.enabled) return 1;
            if (!a.enabled && b.enabled) return -1;
            if (a.status === 'majority' && b.status !== 'majority') return -1;
            if (a.status !== 'majority' && b.status === 'majority') return 1;
            return (b.percentSupport || 0) - (a.percentSupport || 0);
          });
        setAmendments(sorted);
        setDataSource('live');
        setLastUpdate(new Date());
        console.log('[LedgerImpact] Loaded', sorted.length, 'amendments from XRPScan');
      }
    } catch (error) {
      console.error('[LedgerImpact] Failed to fetch amendments:', error);
      setAmendments(getStaticAmendments());
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
    if (filter === 'needs_review') return !a.enabled && !isReviewed(a.name);
    return true;
  });

  const needsAttentionCount = amendments.filter(a => !a.enabled && !isReviewed(a.name)).length;

  const handleRefresh = async () => {
    await fetchAmendments();
  };

  // Count amendments in two-week activation period (at majority, not yet enabled)
  const atMajority = amendments.filter(a => !a.enabled && a.status === 'majority').length;
  const showPendingTab = atMajority > 0;

  // If user had PENDING selected but no amendments are in countdown, switch to needs_review
  useEffect(() => {
    if (filter === 'pending' && !showPendingTab) {
      setFilter('needs_review');
    }
  }, [filter, showPendingTab]);

  // Tab order: show PENDING only when there are amendments in the two-week activation period
  const filterTabs: FilterMode[] = showPendingTab
    ? ['pending', 'needs_review', 'enabled', 'all']
    : ['needs_review', 'enabled', 'all'];

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

      {/* When live fetch failed we show cached list; small note to refresh for live data */}
      {dataSource === 'fallback' && (
        <div className="mb-3 p-2 rounded bg-cyber-glow/10 border border-cyber-glow/30 flex items-center justify-between gap-2">
          <p className="text-[10px] text-cyber-muted">Showing cached amendments. Tap refresh for live vote counts.</p>
          <button
            type="button"
            onClick={() => fetchAmendments()}
            disabled={isLoading}
            className="shrink-0 px-2 py-1 rounded bg-cyber-glow/20 text-cyber-glow border border-cyber-glow/50 text-[10px] font-cyber hover:bg-cyber-glow/30 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      )}

      {/* Needs attention (Governance Companion style) */}
      {needsAttentionCount > 0 && (
        <button
          type="button"
          onClick={() => setFilter('needs_review')}
          className="mb-3 w-full p-2 rounded bg-cyber-glow/10 border border-cyber-glow/30 flex items-center gap-2 text-left hover:bg-cyber-glow/20 transition-colors"
        >
          <FileText size={14} className="text-cyber-glow shrink-0" />
          <span className="text-[10px] text-cyber-glow">
            <span className="font-cyber">{needsAttentionCount}</span> amendment{needsAttentionCount !== 1 ? 's' : ''} need your review
          </span>
          <ChevronRight size={12} className="ml-auto text-cyber-glow" />
        </button>
      )}

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

      {/* Impact Summary Bars - only when we have amendments (avoid NaN in WebView) */}
      {filteredAmendments.length > 0 && (
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
      )}

      {/* Filter Tabs — PENDING only when amendments are in two-week activation; default is NEEDS REVIEW */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {filterTabs.map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            aria-label={`Filter: ${f === 'needs_review' ? 'Needs review' : f}`}
            className={`px-3 py-1.5 text-[10px] font-semibold rounded-md transition-all ${
              filter === f
                ? 'bg-cyber-glow/30 text-cyber-glow border-2 border-cyber-glow/50 shadow-[0_0_12px_rgba(0,212,255,0.25)]'
                : 'bg-cyber-darker/50 text-cyber-muted border border-cyber-border/50 hover:text-cyber-text hover:border-cyber-border'
            }`}
          >
            {f === 'needs_review' ? 'NEEDS REVIEW' : f.toUpperCase()}
          </button>
        ))}
      </div>

      {useFullPageLink && (
        <p className="text-[10px] text-cyber-yellow/90 bg-cyber-yellow/10 border border-cyber-yellow/30 rounded px-2 py-1.5 mb-2">
          Tap a row — amendment details open as a full page (works best in X app and on phones).
        </p>
      )}

      {/* Amendments List - minHeight so panel is never invisible in WebView */}
      <div className="space-y-2 max-h-64 min-h-[120px] overflow-y-auto pr-1 bg-cyber-darker/30 rounded-lg border border-cyber-border/50">
        {isLoading && amendments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 size={24} className="text-cyber-cyan animate-spin mb-2" />
            <p className="text-xs text-cyber-muted">Loading from XRPScan...</p>
          </div>
        ) : filteredAmendments.length === 0 ? (
          <div className="text-center py-8 text-cyber-muted text-xs">
            No amendments found for this filter
            {isInAppBrowser && (
              <p className="mt-3 text-cyber-yellow/90">
                If data never loaded, open this page in Safari or Chrome for the best experience.
              </p>
            )}
          </div>
        ) : (
          filteredAmendments.slice(0, 15).map((amendment) => {
            const rowClass = `w-full min-h-[44px] p-3 rounded-lg border bg-cyber-darker/50 hover:border-cyber-glow/30 active:bg-cyber-glow/10 transition-all text-left group touch-manipulation ${
              amendment.status === 'majority' ? 'border-cyber-yellow/50' : amendment.status === 'enabled' ? 'border-cyber-green/30' : 'border-cyber-border/50'
            }`;
            const rowContent = (
              <>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-cyber bg-${tierColors[amendment.tier]}/20 text-${tierColors[amendment.tier]} border border-${tierColors[amendment.tier]}/30`}>
                      {amendment.tier}
                    </span>
                    <span className="text-xs text-cyber-text font-medium truncate">{amendment.name}</span>
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
                  <div className="flex items-center gap-2 text-[10px]" title="Validators supporting (reviewing / voting)">
                    <span className={(amendment.percentSupport || 0) >= 80 ? 'text-cyber-green' : (amendment.percentSupport || 0) >= 50 ? 'text-cyber-yellow' : 'text-cyber-muted'}>
                      {amendment.validatorSupport.current}/{amendment.validatorSupport.required} validators
                    </span>
                    <Users size={10} className="text-cyber-muted" />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); (isReviewed(amendment.name) ? unmarkReviewed : markReviewed)(amendment.name); }}
                    className="p-1 rounded hover:bg-cyber-glow/20 transition-colors"
                    title={isReviewed(amendment.name) ? 'Unmark as reviewed' : 'Mark as reviewed'}
                    aria-label={isReviewed(amendment.name) ? 'Unmark as reviewed' : 'Mark as reviewed'}
                  >
                    {isReviewed(amendment.name) ? (
                      <CheckCircle2 size={14} className="text-cyber-green" />
                    ) : (
                      <Clock size={14} className="text-cyber-muted hover:text-cyber-glow" />
                    )}
                  </button>
                </div>
              </>
            );
            if (useFullPageLink) {
              return (
                <Link
                  key={amendment.id}
                  to={`/amendment/${encodeURIComponent(amendment.name)}`}
                  state={{ amendment }}
                  className={rowClass}
                >
                  {rowContent}
                </Link>
              );
            }
            return (
              <motion.button
                key={amendment.id}
                type="button"
                onClick={() => setSelectedAmendment(amendment)}
                onTouchEnd={() => setSelectedAmendment(amendment)}
                className={rowClass}
                whileHover={{ scale: 1.01 }}
              >
                {rowContent}
              </motion.button>
            );
          })
        )}
      </div>

      {/* Last Update */}
      {lastUpdate && (
        <div className="mt-2 text-[9px] text-cyber-muted text-right" title="Live amendment data last fetched">
          Stats updated {lastUpdate.toLocaleString()}
        </div>
      )}

      {/* Validator context (optional) — Governance Companion style */}
      <div className="mt-3 pt-2 border-t border-cyber-border space-y-1.5">
        <p className="text-[9px] text-cyber-muted flex items-center gap-1">
          <KeyRound size={10} /> Validator context (optional)
        </p>
        <a
          href="https://xrpscan.com/validators"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 rounded bg-cyber-darker/50 border border-cyber-border/50 hover:border-cyber-glow/30 text-[10px] text-cyber-text"
        >
          <Users size={10} className="text-cyber-glow" />
          Look up validator addresses on XRPScan
          <ExternalLink size={10} />
        </a>
        <input
          type="text"
          value={validatorPublicKey ?? ''}
          onChange={(e) => setValidatorPublicKey(e.target.value.trim() || null)}
          placeholder="Validator public key"
          className="w-full px-2 py-1.5 text-[10px] font-mono bg-cyber-darker border border-cyber-border rounded text-cyber-text placeholder:text-cyber-muted focus:border-cyber-glow/50 focus:outline-none"
        />
        {validatorPublicKey && (
          <a
            href={`https://xrpscan.com/validator/${encodeURIComponent(validatorPublicKey)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 rounded bg-cyber-darker/50 border border-cyber-border/50 hover:border-cyber-glow/30 text-[10px] text-cyber-text"
          >
            View validator on XRPScan
            <ExternalLink size={10} />
          </a>
        )}
      </div>

      {/* Quick Links + Data source */}
      <div className="mt-4 pt-3 border-t border-cyber-border space-y-1.5">
        <p className="text-[9px] text-cyber-muted text-right" aria-label="Ledger impact data source">
          Data: {dataSource === 'live' ? 'XRPScan (live)' : 'Fallback'}
        </p>
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
        <Link
          to="/governance-guide"
          className="flex items-center gap-2 p-2 rounded bg-cyber-darker/50 border border-cyber-border/50 hover:border-cyber-glow/30 transition-all text-xs text-cyber-text group"
        >
          <FileText size={14} className="text-cyber-glow" />
          <span>Governance Guide (FAQ)</span>
          <ChevronRight size={12} className="ml-auto text-cyber-muted group-hover:text-cyber-glow" />
        </Link>
      </div>

      {/* Amendment Detail Modal - Portaled to body for X in-app browser / iOS WebView */}
      {selectedAmendment && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2147483647,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 12,
            WebkitOverflowScrolling: 'touch',
            transform: 'translateZ(0)',
            WebkitBackfaceVisibility: 'hidden' as const,
            isolation: 'isolate',
          }}
          onClick={() => setSelectedAmendment(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="amendment-modal-title"
        >
          <div
            style={{
              width: '100%',
              maxWidth: 720,
              maxHeight: '92vh',
              minHeight: 360,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative',
              backgroundColor: '#0f172a',
              border: '2px solid #334155',
              borderRadius: 12,
              color: '#e2e8f0',
              transform: 'translateZ(0)',
              WebkitBackfaceVisibility: 'hidden' as const,
              backfaceVisibility: 'hidden',
              isolation: 'isolate',
              filter: 'none',
              boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
              {/* HEADER - inline styles only for iOS WebView */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderBottom: '1px solid #334155', padding: '8px 12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 600,
                        backgroundColor: (tierStyles[selectedAmendment.tier] ?? tierStyles.C).bg,
                        color: (tierStyles[selectedAmendment.tier] ?? tierStyles.C).text,
                        border: `1px solid ${(tierStyles[selectedAmendment.tier] ?? tierStyles.C).border}`,
                      }}
                    >
                      {selectedAmendment.tier}
                    </span>
                    <h3 id="amendment-modal-title" style={{ margin: 0, fontSize: 14, color: '#00d4ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedAmendment.name}
                    </h3>
                    {selectedAmendment.enabled && (
                      <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, backgroundColor: 'rgba(34,197,94,0.2)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.5)' }}>
                        ✓
                      </span>
                    )}
                  </div>
                  {(selectedAmendment.author || selectedAmendment.github) && (
                    <div style={{ marginTop: 6 }}>
                      <p style={{ margin: 0, fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Proposal credit</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                        {selectedAmendment.author && (
                          <span style={{ fontSize: 12, color: '#a855f7', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <User size={12} /> {selectedAmendment.author}
                          </span>
                        )}
                        {selectedAmendment.github && (
                          <a
                            href={selectedAmendment.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 10, color: '#c4b5fd', padding: '2px 8px', borderRadius: 4, backgroundColor: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.5)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            onClick={(e) => e.stopPropagation()}
                            title="View proposal on GitHub (source)"
                          >
                            <Github size={10} /> View proposal on GitHub
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAmendment(null)}
                  style={{ padding: 6, backgroundColor: 'rgba(239,68,68,0.3)', border: '1px solid rgba(239,68,68,0.5)', borderRadius: 4, color: '#f87171', flexShrink: 0 }}
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* SCROLLABLE CONTENT - explicit minHeight + no filter so iOS renders text, not blur bars */}
              <div
                style={{
                  flex: '1 1 0',
                  minHeight: 320,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  padding: '12px 16px',
                  WebkitOverflowScrolling: 'touch',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  filter: 'none',
                  WebkitFontSmoothing: 'antialiased' as const,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
              >
                <p style={{ margin: 0, fontSize: 12, color: '#e2e8f0', lineHeight: 1.4, opacity: 1 }}>
                  {selectedAmendment.summary}
                </p>

                {/* Who this helps — always visible, matching Governance Companion (dark blue panel, categories, examples, disclaimer) */}
                <div style={{ padding: '12px 14px', borderRadius: 10, backgroundColor: '#1e3a5f', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Users size={18} style={{ color: '#fff' }} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Who this helps</span>
                    </div>
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.08)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.15)' }}>informational</span>
                  </div>
                  {selectedAmendment.whoBenefitsCategories && selectedAmendment.whoBenefitsCategories.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      {selectedAmendment.whoBenefitsCategories.map((cat, i) => (
                        <span key={i} style={{ padding: '5px 12px', borderRadius: 999, fontSize: 11, background: 'rgba(59, 130, 246, 0.35)', color: '#fff', border: '1px solid rgba(59, 130, 246, 0.4)' }}>{cat}</span>
                      ))}
                    </div>
                  )}
                  {(selectedAmendment.whoBenefits && selectedAmendment.whoBenefits.trim()) ? (
                    <p style={{ margin: 0, fontSize: 12, color: '#fff', lineHeight: 1.5 }}>{selectedAmendment.whoBenefits}</p>
                  ) : (
                    <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>No beneficiary summary for this amendment yet.</p>
                  )}
                  {selectedAmendment.whoBenefitsExamples && selectedAmendment.whoBenefitsExamples.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <span style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>Examples: </span>
                      {selectedAmendment.whoBenefitsExamples.map((ex, i) => (
                        <span key={i} style={{ display: 'inline-block', margin: '2px 6px 2px 0', padding: '4px 10px', borderRadius: 6, fontSize: 11, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>{ex}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                    <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Info size={12} /> Examples are illustrative, not endorsements.
                    </p>
                  </div>
                </div>

                {/* Countdown: show when amendment has reached majority (2-week wait) or we have countdown data */}
                {(selectedAmendment.status === 'majority' || selectedAmendment.activationDate || (selectedAmendment.daysUntilEnabled != null && !selectedAmendment.enabled)) && (
                  <div style={{ padding: 10, borderRadius: 8, backgroundColor: 'rgba(88,28,135,0.35)', border: '1px solid rgba(168,85,247,0.5)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                      <Timer size={14} style={{ color: '#c4b5fd' }} />
                      <span style={{ fontSize: 12, color: '#c4b5fd', fontWeight: 600 }}>2-week activation countdown</span>
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
                      <p style={{ margin: '8px 0 0', fontSize: 11, color: 'rgba(196,181,253,0.9)', textAlign: 'center' }}>
                        Activates: {new Date(selectedAmendment.activationDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {selectedAmendment.status === 'enabled' && selectedAmendment.enabledOn && (
                  <div style={{ padding: 8, borderRadius: 4, backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={12} style={{ color: '#22c55e' }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#22c55e' }}>ACTIVATED</span>
                    <span style={{ color: '#22c55e', fontSize: 12 }}>
                      {new Date(selectedAmendment.enabledOn).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                  <div style={{ padding: 6, borderRadius: 4, backgroundColor: 'rgba(15,23,42,0.8)', border: '1px solid #334155', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: 9, color: '#94a3b8' }}>Waiting</p>
                    <p style={{ margin: 0, fontSize: 12, color: '#e2e8f0', fontWeight: 600 }}>{selectedAmendment.waitingDays}d</p>
                  </div>
                  <div style={{ padding: 6, borderRadius: 4, backgroundColor: 'rgba(15,23,42,0.8)', border: '1px solid #334155', textAlign: 'center' }} title="Validators supporting (reviewing / voting)">
                    <p style={{ margin: 0, fontSize: 9, color: '#94a3b8' }}>Validators</p>
                    <p style={{ margin: 0, fontSize: 12, color: '#e2e8f0', fontWeight: 600 }}>
                      {selectedAmendment.validatorSupport.current}/{selectedAmendment.validatorSupport.required}
                    </p>
                    <a
                      href="https://xrpscan.com/validators"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ marginTop: 4, display: 'inline-block', fontSize: 9, color: '#00d4ff', textDecoration: 'none' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Look up validators
                    </a>
                  </div>
                  <div style={{ padding: 6, borderRadius: 4, backgroundColor: 'rgba(15,23,42,0.8)', border: '1px solid #334155', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: 9, color: '#94a3b8' }}>Impact</p>
                    <p style={{ margin: 0, fontSize: 12, color: impactStyles[selectedAmendment.ledgerImpact.estimatedImpact] ?? impactStyles.Unknown, fontWeight: 600 }}>
                      {selectedAmendment.ledgerImpact.estimatedImpact}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 6px', fontSize: 12, color: '#00ffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Zap size={12} /> IMPACT ANALYSIS
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                    {selectedAmendment.ledgerImpact.affectedAreas.map((area) => (
                      <span
                        key={area}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: '2px 6px', borderRadius: 4, fontSize: 10, backgroundColor: 'rgba(168,85,247,0.2)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)' }}
                      >
                        {areaIcons[area]}
                        {area}
                      </span>
                    ))}
                    <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, color: '#e2e8f0', backgroundColor: 'rgba(15,23,42,0.8)', border: '1px solid #334155' }}>
                      {selectedAmendment.ledgerImpact.confidence} confidence
                    </span>
                  </div>
                  <div style={{ padding: 8, borderRadius: 4, backgroundColor: 'rgba(15,23,42,0.8)', border: '1px solid #334155' }}>
                    <p style={{ margin: 0, fontSize: 10, color: '#e2e8f0', lineHeight: 1.4 }}>{selectedAmendment.ledgerImpact.rationale}</p>
                  </div>
                </div>

                {selectedAmendment.estimatedReviewMinutes != null && (
                  <p style={{ margin: 0, fontSize: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Timer size={12} /> Est. review time: {selectedAmendment.estimatedReviewMinutes} min
                  </p>
                )}

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); (isReviewed(selectedAmendment.name) ? unmarkReviewed : markReviewed)(selectedAmendment.name); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 12px',
                    borderRadius: 4, border: '1px solid #334155', fontSize: 11, backgroundColor: isReviewed(selectedAmendment.name) ? 'rgba(34,197,94,0.2)' : '#1e293b', color: isReviewed(selectedAmendment.name) ? '#22c55e' : '#e2e8f0',
                  }}
                >
                  {isReviewed(selectedAmendment.name) ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                  {isReviewed(selectedAmendment.name) ? 'Reviewed' : 'Mark as reviewed'}
                </button>

                {selectedAmendment.ledgerImpact.evidenceLinks && selectedAmendment.ledgerImpact.evidenceLinks.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={{ margin: 0, fontSize: 10, color: '#94a3b8' }}>Evidence &amp; References</p>
                    {selectedAmendment.ledgerImpact.evidenceLinks.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderRadius: 4, backgroundColor: 'rgba(15,23,42,0.8)', border: '1px solid #334155', fontSize: 12, color: '#e2e8f0' }}
                      >
                        <ExternalLink size={12} style={{ color: '#00d4ff' }} />
                        <span>{link.label}</span>
                        <ChevronRight size={12} style={{ marginLeft: 'auto', color: '#94a3b8' }} />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid #334155', padding: '8px 12px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedAmendment(null)}
                  style={{ width: '100%', padding: '8px 12px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 4, fontSize: 12, color: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back
                </button>
              </div>
            </div>
          </div>,
        document.body
      )}
    </div>
  );
}

export default LedgerImpactTool;
