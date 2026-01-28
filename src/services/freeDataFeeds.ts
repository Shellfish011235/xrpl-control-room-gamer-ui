// Free Data Feeds Service
// Integrates free APIs for live data: SentiCrypt (sentiment), XRPScan (amendments, whale tracking)
// No API keys required - completely free!

// ==================== TYPES ====================

export interface CryptoSentiment {
  date: string;
  mean: number;        // -1.0 to 1.0
  sum: number;
  score1: number;
  score2: number;
  score3: number;
  count: number;
  price: number;       // BTC price (for correlation)
  volume: number;
}

export interface XRPLAmendment {
  amendment_id: string;
  name: string;
  introduced: string;
  enabled: boolean;
  enabled_on?: string;
  majority?: number | string | null;  // Ripple epoch timestamp (seconds since Jan 1, 2000) or ISO string
  supported: boolean;
  count: number;       // Validator votes FOR
  threshold: number;   // Votes needed
  validations: number; // Total validators
  tx_hash?: string;
  eta?: string;        // ETA string from API (e.g., "05d:03h:58m")
  xls?: string;        // XLS specification code (e.g., "XLS-80")
  xls_url?: string;    // URL to XLS specification
  // Calculated fields
  percentSupport?: number;
  status?: 'enabled' | 'majority' | 'pending' | 'unsupported';
  daysUntilEnabled?: number;
  hoursUntilEnabled?: number;
  minutesUntilEnabled?: number;
  secondsUntilEnabled?: number;
  activationDate?: Date;  // Calculated activation date (majority + 14 days)
}

export interface WhaleTransaction {
  hash: string;
  account: string;
  destination?: string;
  amount: number;      // In XRP
  type: string;
  timestamp: string;
  fee: number;
}

export interface XRPLMetrics {
  ledger_index: number;
  txn_count_24h: number;
  txn_rate: number;
  avg_fee: number;
  active_accounts_24h: number;
  new_accounts_24h: number;
}

// ==================== SENTICRYPT API ====================
// Free crypto sentiment - https://senticrypt.com/

const SENTICRYPT_API = 'https://api.senticrypt.com/v2';

/**
 * Fetch current crypto market sentiment (BTC-based, correlates with overall market)
 * Returns sentiment scores from -1.0 (bearish) to 1.0 (bullish)
 */
export async function fetchCryptoSentiment(): Promise<{
  current: CryptoSentiment | null;
  trend: 'bullish' | 'bearish' | 'neutral';
  score: number; // 0-100 scale
  history: CryptoSentiment[];
}> {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch recent history (last 7 days for trend)
    const response = await fetch(`${SENTICRYPT_API}/all.json`);
    
    if (!response.ok) {
      throw new Error(`SentiCrypt API error: ${response.status}`);
    }
    
    const data: CryptoSentiment[] = await response.json();
    
    // Get most recent entries (sorted by date desc typically)
    const sortedData = data.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    const current = sortedData[0] || null;
    const recent7 = sortedData.slice(0, 7);
    
    // Calculate trend from recent data
    let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let avgMean = 0;
    
    if (recent7.length > 0) {
      avgMean = recent7.reduce((sum, d) => sum + d.mean, 0) / recent7.length;
      if (avgMean > 0.1) trend = 'bullish';
      else if (avgMean < -0.1) trend = 'bearish';
    }
    
    // Convert -1 to 1 scale to 0-100 scale
    const score = current ? Math.round((current.mean + 1) * 50) : 50;
    
    return {
      current,
      trend,
      score: Math.max(0, Math.min(100, score)),
      history: recent7
    };
  } catch (error) {
    console.error('[FreeFeeds] SentiCrypt error:', error);
    return {
      current: null,
      trend: 'neutral',
      score: 50,
      history: []
    };
  }
}

// ==================== XRPSCAN API ====================
// Free XRPL data - https://docs.xrpscan.com/

const XRPSCAN_API = 'https://api.xrpscan.com/api/v1';

// Ripple epoch starts January 1, 2000 00:00:00 UTC
// Unix epoch offset for Ripple = 946684800 seconds
const RIPPLE_EPOCH_OFFSET = 946684800;

/**
 * Convert Ripple epoch timestamp to JavaScript Date
 * Ripple epoch = seconds since Jan 1, 2000
 * @param rippleTimestamp - seconds since Jan 1, 2000
 * @returns JavaScript Date object
 */
function rippleEpochToDate(rippleTimestamp: number): Date {
  // Convert Ripple epoch to Unix timestamp, then to milliseconds
  const unixTimestamp = rippleTimestamp + RIPPLE_EPOCH_OFFSET;
  return new Date(unixTimestamp * 1000);
}

/**
 * Calculate countdown from majority date to activation (14 days after majority)
 * Each amendment has its own individual countdown based on when IT reached majority
 * @param majorityTimestamp - Ripple epoch timestamp when amendment reached majority
 * @returns Object with days, hours, minutes, seconds until activation, plus activation date
 */
function calculateIndividualCountdown(majorityTimestamp: number): {
  daysUntilEnabled: number;
  hoursUntilEnabled: number;
  minutesUntilEnabled: number;
  secondsUntilEnabled: number;
  activationDate: Date;
} {
  // Convert majority timestamp to JavaScript Date
  const majorityDate = rippleEpochToDate(majorityTimestamp);
  
  // Activation is 14 days (2 weeks) after reaching majority
  const activationDate = new Date(majorityDate.getTime() + (14 * 24 * 60 * 60 * 1000));
  
  // Calculate remaining time
  const now = new Date();
  const msRemaining = activationDate.getTime() - now.getTime();
  
  if (msRemaining <= 0) {
    // Already activated or about to activate
    return {
      daysUntilEnabled: 0,
      hoursUntilEnabled: 0,
      minutesUntilEnabled: 0,
      secondsUntilEnabled: 0,
      activationDate
    };
  }
  
  // Calculate each component individually for this specific amendment
  const totalSeconds = Math.floor(msRemaining / 1000);
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;
  
  return {
    daysUntilEnabled: days,
    hoursUntilEnabled: hours,
    minutesUntilEnabled: minutes,
    secondsUntilEnabled: seconds,
    activationDate
  };
}

/**
 * Fetch all XRPL amendments with their current voting status
 * This is the real-time data for your Ledger Impact Tool!
 * 
 * IMPORTANT: Each amendment has its OWN individual countdown based on when
 * that specific amendment reached majority. Countdowns are NOT batched!
 */
export async function fetchXRPLAmendments(): Promise<XRPLAmendment[]> {
  try {
    const response = await fetch(`${XRPSCAN_API}/amendments`);
    
    if (!response.ok) {
      throw new Error(`XRPScan API error: ${response.status}`);
    }
    
    const amendments: XRPLAmendment[] = await response.json();
    
    // Enhance with calculated fields - INDIVIDUAL countdown per amendment
    return amendments.map(amendment => {
      const percentSupport = amendment.validations > 0 
        ? (amendment.count / amendment.validations) * 100 
        : 0;
      
      let status: XRPLAmendment['status'] = 'pending';
      let daysUntilEnabled: number | undefined;
      let hoursUntilEnabled: number | undefined;
      let minutesUntilEnabled: number | undefined;
      let secondsUntilEnabled: number | undefined;
      let activationDate: Date | undefined;
      
      if (amendment.enabled) {
        // Amendment is already active on the network
        status = 'enabled';
      } else if (amendment.majority && typeof amendment.majority === 'number') {
        // Amendment has reached majority - calculate individual countdown
        status = 'majority';
        
        // Calculate countdown from THIS amendment's specific majority timestamp
        const countdown = calculateIndividualCountdown(amendment.majority);
        daysUntilEnabled = countdown.daysUntilEnabled;
        hoursUntilEnabled = countdown.hoursUntilEnabled;
        minutesUntilEnabled = countdown.minutesUntilEnabled;
        secondsUntilEnabled = countdown.secondsUntilEnabled;
        activationDate = countdown.activationDate;
        
        console.log(`[FreeFeeds] ${amendment.name}: Majority at ${rippleEpochToDate(amendment.majority).toISOString()}, Activates: ${activationDate.toISOString()}, Countdown: ${daysUntilEnabled}d ${hoursUntilEnabled}h ${minutesUntilEnabled}m ${secondsUntilEnabled}s`);
        
      } else if (percentSupport >= 80) {
        // High support but no majority timestamp yet - unusual case
        status = 'majority';
        // Default to 14 days if we have high support but no majority date
        daysUntilEnabled = 14;
        hoursUntilEnabled = 0;
        minutesUntilEnabled = 0;
        secondsUntilEnabled = 0;
      } else if (!amendment.supported) {
        status = 'unsupported';
      }
      
      return {
        ...amendment,
        percentSupport: Math.round(percentSupport * 10) / 10,
        status,
        daysUntilEnabled,
        hoursUntilEnabled,
        minutesUntilEnabled,
        secondsUntilEnabled,
        activationDate
      };
    });
  } catch (error) {
    console.error('[FreeFeeds] XRPScan amendments error:', error);
    return [];
  }
}

/**
 * Fetch specific amendment info
 */
export async function fetchAmendmentInfo(amendmentId: string): Promise<XRPLAmendment | null> {
  try {
    const response = await fetch(`${XRPSCAN_API}/amendment/${amendmentId}`);
    
    if (!response.ok) return null;
    
    return await response.json();
  } catch (error) {
    console.error('[FreeFeeds] Amendment info error:', error);
    return null;
  }
}

/**
 * Fetch XRPL network metrics
 */
export async function fetchXRPLMetrics(): Promise<XRPLMetrics | null> {
  try {
    const response = await fetch(`${XRPSCAN_API}/metrics`);
    
    if (!response.ok) {
      throw new Error(`XRPScan metrics error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[FreeFeeds] XRPScan metrics error:', error);
    return null;
  }
}

/**
 * Fetch recent large transactions (whale activity)
 * Uses XRPScan's advanced search to find payments > 1M XRP
 */
export async function fetchWhaleTransactions(minAmount: number = 1000000): Promise<WhaleTransaction[]> {
  try {
    // XRPScan advanced search for large payments
    const response = await fetch(
      `https://console.xrpscan.com/api/v1/search?type=Payment&amount_min=${minAmount}&limit=20`
    );
    
    if (!response.ok) {
      // Fallback: try the regular API
      console.warn('[FreeFeeds] Advanced search unavailable, using fallback');
      return [];
    }
    
    const data = await response.json();
    
    return (data.transactions || []).map((tx: any) => ({
      hash: tx.hash,
      account: tx.Account,
      destination: tx.Destination,
      amount: typeof tx.Amount === 'string' ? parseInt(tx.Amount) / 1000000 : tx.Amount?.value || 0,
      type: tx.TransactionType,
      timestamp: tx.date || tx.close_time_iso,
      fee: parseInt(tx.Fee || '0') / 1000000
    }));
  } catch (error) {
    console.error('[FreeFeeds] Whale transactions error:', error);
    return [];
  }
}

/**
 * Fetch account info (for known whale wallets)
 */
export async function fetchAccountInfo(address: string): Promise<{
  balance: number;
  sequence: number;
  ownerCount: number;
} | null> {
  try {
    const response = await fetch(`${XRPSCAN_API}/account/${address}`);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    return {
      balance: parseInt(data.xrpBalance || '0'),
      sequence: data.sequence || 0,
      ownerCount: data.ownerCount || 0
    };
  } catch (error) {
    console.error('[FreeFeeds] Account info error:', error);
    return null;
  }
}

// ==================== COMBINED SENTIMENT ====================

/**
 * Get combined sentiment analysis using free sources
 * Correlates BTC sentiment with XRP (high correlation historically)
 */
export async function getCombinedSentiment(): Promise<{
  overall: number;         // 0-100
  trend: 'bullish' | 'bearish' | 'neutral';
  sources: {
    senticrypt: number;    // 0-100
    marketCorrelation: number;
  };
  dataSource: 'live' | 'fallback';
  lastUpdate: Date;
}> {
  const sentiment = await fetchCryptoSentiment();
  
  if (sentiment.current) {
    return {
      overall: sentiment.score,
      trend: sentiment.trend,
      sources: {
        senticrypt: sentiment.score,
        marketCorrelation: Math.round((sentiment.current.score1 + 1) * 50)
      },
      dataSource: 'live',
      lastUpdate: new Date()
    };
  }
  
  // Fallback
  return {
    overall: 50,
    trend: 'neutral',
    sources: {
      senticrypt: 50,
      marketCorrelation: 50
    },
    dataSource: 'fallback',
    lastUpdate: new Date()
  };
}

// ==================== EXPORTS ====================

export const FreeDataFeeds = {
  fetchCryptoSentiment,
  fetchXRPLAmendments,
  fetchAmendmentInfo,
  fetchXRPLMetrics,
  fetchWhaleTransactions,
  fetchAccountInfo,
  getCombinedSentiment
};

export default FreeDataFeeds;
