// XRPL Service - Fetches real data from the XRP Ledger

// XRPL Public JSON-RPC Servers (with CORS support)
const XRPL_ENDPOINTS = [
  'https://s1.ripple.com:51234',
  'https://s2.ripple.com:51234',
  'https://xrplcluster.com',
];

// Current endpoint index for fallback
let currentEndpointIndex = 0;

function getXRPLUrl(): string {
  return XRPL_ENDPOINTS[currentEndpointIndex];
}

function switchToNextEndpoint(): void {
  currentEndpointIndex = (currentEndpointIndex + 1) % XRPL_ENDPOINTS.length;
  console.log(`[XRPL] Switching to endpoint: ${getXRPLUrl()}`);
}

// Response structure varies by endpoint, handled dynamically in xrplRequest

interface AccountInfoResult {
  account_data: {
    Account: string;
    Balance: string; // Balance in drops (1 XRP = 1,000,000 drops)
    Flags: number;
    LedgerEntryType: string;
    OwnerCount: number;
    PreviousTxnID: string;
    PreviousTxnLgrSeq: number;
    Sequence: number;
    index: string;
  };
  ledger_current_index?: number;
  validated?: boolean;
}

interface AccountLinesResult {
  account: string;
  lines: Array<{
    account: string;
    balance: string;
    currency: string;
    limit: string;
    limit_peer: string;
    quality_in: number;
    quality_out: number;
  }>;
}

interface AccountNFTsResult {
  account: string;
  account_nfts: Array<{
    Flags: number;
    Issuer: string;
    NFTokenID: string;
    NFTokenTaxon: number;
    URI?: string;
    nft_serial: number;
  }>;
}

interface ServerInfoResult {
  info: {
    build_version: string;
    complete_ledgers: string;
    hostid: string;
    load_factor: number;
    peers: number;
    pubkey_node: string;
    server_state: string;
    validated_ledger: {
      age: number;
      base_fee_xrp: number;
      hash: string;
      reserve_base_xrp: number;
      reserve_inc_xrp: number;
      seq: number;
    };
    validation_quorum: number;
  };
}

interface AccountTxResult {
  account: string;
  ledger_index_max: number;
  ledger_index_min: number;
  limit: number;
  transactions: Array<{
    meta: {
      TransactionResult: string;
      delivered_amount?: string | { currency: string; issuer: string; value: string };
    };
    tx: {
      Account: string;
      Amount?: string | { currency: string; issuer: string; value: string };
      Destination?: string;
      Fee: string;
      TransactionType: string;
      date: number;
      hash: string;
    };
    validated: boolean;
  }>;
}

// Helper to make JSON-RPC calls to XRPL with timeout and retry
async function xrplRequest<T>(method: string, params: Record<string, unknown>[] = [{}], retryCount = 0): Promise<T> {
  const url = getXRPLUrl();
  console.log(`[XRPL] Request: ${method} to ${url}`, params);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method,
        params,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`XRPL request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[XRPL] Raw response for ${method}:`, JSON.stringify(data, null, 2));
    console.log(`[XRPL] Data keys:`, Object.keys(data));
    
    // Handle different response structures
    // Some endpoints return { result: { ... } }, others might return differently
    const result = data.result || data;
    console.log(`[XRPL] Extracted result for ${method}:`, JSON.stringify(result, null, 2));
    console.log(`[XRPL] Result keys:`, result ? Object.keys(result) : 'null');
    
    // Check for errors in the response
    if (result.error || data.error) {
      const errorMsg = result.error_message || result.error || data.error_message || data.error;
      throw new Error(errorMsg);
    }
    
    // Check for status errors
    if (result.status === 'error') {
      throw new Error(result.error_message || 'Unknown XRPL error');
    }

    return result as T;
  } catch (error) {
    clearTimeout(timeoutId);
    
    console.error(`[XRPL] Error for ${method}:`, error);
    
    // If it's an abort error (timeout), try next endpoint
    if (error instanceof Error && error.name === 'AbortError') {
      console.log(`[XRPL] Request timed out, trying next endpoint...`);
    }
    
    // If we haven't tried all endpoints, switch and retry
    if (retryCount < XRPL_ENDPOINTS.length - 1) {
      switchToNextEndpoint();
      return xrplRequest<T>(method, params, retryCount + 1);
    }
    
    throw error;
  }
}

// Convert drops to XRP (1 XRP = 1,000,000 drops)
export function dropsToXRP(drops: string | number | undefined | null): number {
  if (drops === undefined || drops === null) {
    console.warn('[XRPL] dropsToXRP received undefined/null, returning 0');
    return 0;
  }
  const numDrops = Number(drops);
  if (isNaN(numDrops)) {
    console.warn(`[XRPL] dropsToXRP received invalid value: ${drops}, returning 0`);
    return 0;
  }
  const xrp = numDrops / 1_000_000;
  console.log(`[XRPL] dropsToXRP: ${drops} drops = ${xrp} XRP`);
  return xrp;
}

// Convert XRP to drops
export function xrpToDrops(xrp: number): string {
  return Math.floor(xrp * 1_000_000).toString();
}

// Validate XRPL address format
export function isValidXRPLAddress(address: string): boolean {
  // Basic validation: starts with 'r', 25-35 characters, alphanumeric (no 0, O, I, l)
  const xrplAddressRegex = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;
  return xrplAddressRegex.test(address);
}

// Get account info (balance, sequence, etc.)
export async function getAccountInfo(address: string): Promise<{
  balance: number;
  ownerCount: number;
  sequence: number;
  exists: boolean;
}> {
  console.log(`[XRPL] Getting account info for: ${address}`);
  
  try {
    const result = await xrplRequest<AccountInfoResult>('account_info', [
      {
        account: address,
        ledger_index: 'validated',
      },
    ]);

    console.log(`[XRPL] Account info result:`, JSON.stringify(result, null, 2));
    console.log(`[XRPL] Result type:`, typeof result);
    console.log(`[XRPL] Result keys:`, result ? Object.keys(result) : 'null');

    // Check if account_data exists in the response
    // XRPL may return account_data directly or nested
    const accountData = result?.account_data || (result as unknown as AccountInfoResult['account_data']);
    
    if (!accountData || !accountData.Balance) {
      console.log(`[XRPL] No account_data.Balance in response`);
      console.log(`[XRPL] accountData:`, JSON.stringify(accountData, null, 2));
      return {
        balance: 0,
        ownerCount: 0,
        sequence: 0,
        exists: false,
      };
    }

    // Log the raw balance for debugging
    const rawBalance = accountData.Balance;
    console.log(`[XRPL] Raw balance (drops): ${rawBalance}`);
    console.log(`[XRPL] Raw balance type: ${typeof rawBalance}`);
    
    const balanceXRP = dropsToXRP(rawBalance);
    console.log(`[XRPL] Converted balance (XRP): ${balanceXRP}`);

    return {
      balance: balanceXRP,
      ownerCount: accountData.OwnerCount || 0,
      sequence: accountData.Sequence || 0,
      exists: true,
    };
  } catch (error) {
    console.error(`[XRPL] Error getting account info:`, error);
    
    // Account not found or other error
    if (error instanceof Error && (
      error.message.includes('actNotFound') || 
      error.message.includes('Account not found') ||
      error.message.includes('account_data')
    )) {
      return {
        balance: 0,
        ownerCount: 0,
        sequence: 0,
        exists: false,
      };
    }
    throw error;
  }
}

// Get account creation year by fetching the earliest transaction
export async function getAccountCreationYear(address: string): Promise<number | null> {
  try {
    // Fetch the first transaction for this account to determine creation date
    const result = await xrplRequest<{
      transactions: Array<{
        tx: { date?: number };
        meta: { TransactionResult: string };
      }>;
      marker?: unknown;
    }>('account_tx', [
      {
        account: address,
        ledger_index_min: -1,
        ledger_index_max: -1,
        limit: 1,
        forward: true, // Start from the earliest
      },
    ]);

    if (result.transactions && result.transactions.length > 0) {
      const firstTx = result.transactions[0];
      if (firstTx.tx?.date) {
        // XRPL dates are seconds since Ripple Epoch (Jan 1, 2000)
        // Convert to Unix timestamp by adding Ripple Epoch offset
        const rippleEpoch = 946684800; // Jan 1, 2000 in Unix time
        const unixTimestamp = (firstTx.tx.date + rippleEpoch) * 1000;
        const date = new Date(unixTimestamp);
        return date.getFullYear();
      }
    }
    return null;
  } catch (error) {
    console.error('[XRPL] Error fetching account creation year:', error);
    return null;
  }
}

// Get account trust lines (issued currencies/tokens)
export async function getAccountLines(address: string): Promise<Array<{
  currency: string;
  balance: number;
  issuer: string;
  limit: number;
}>> {
  try {
    const result = await xrplRequest<AccountLinesResult>('account_lines', [
      {
        account: address,
        ledger_index: 'validated',
      },
    ]);

    return result.lines.map((line) => ({
      currency: line.currency,
      balance: parseFloat(line.balance),
      issuer: line.account,
      limit: parseFloat(line.limit),
    }));
  } catch {
    return [];
  }
}

// Get account NFTs with full metadata
export async function getAccountNFTs(address: string): Promise<Array<{
  tokenId: string;
  issuer: string;
  taxon: number;
  uri?: string;
  serial: number;
  flags: number;
}>> {
  try {
    const result = await xrplRequest<AccountNFTsResult>('account_nfts', [
      {
        account: address,
        ledger_index: 'validated',
      },
    ]);

    return result.account_nfts.map((nft) => ({
      tokenId: nft.NFTokenID,
      issuer: nft.Issuer,
      taxon: nft.NFTokenTaxon,
      uri: nft.URI ? decodeHex(nft.URI) : undefined,
      serial: nft.nft_serial,
      flags: nft.Flags,
    }));
  } catch {
    return [];
  }
}

// Known XRPL Meme Coins / Community Tokens
export const KNOWN_MEME_COINS: Record<string, {
  name: string;
  symbol: string;
  icon?: string;
  color: string;
}> = {
  // Popular XRPL meme coins (currency codes are case-sensitive)
  '584D414E00000000000000000000000000000000': { name: 'Xaman', symbol: 'XMAN', color: '#3052FF' },
  'XRdoge': { name: 'XRdoge', symbol: 'XRdoge', icon: '🐕', color: '#C2A633' },
  'Coreum': { name: 'Coreum', symbol: 'CORE', color: '#25D695' },
  'CSC': { name: 'CasinoCoin', symbol: 'CSC', icon: '🎰', color: '#00D4FF' },
  'SOLO': { name: 'Sologenic', symbol: 'SOLO', icon: '⭐', color: '#FFD700' },
  'XSOL': { name: 'Sologenic', symbol: 'XSOL', color: '#FFD700' },
  'ELS': { name: 'Elysian', symbol: 'ELS', color: '#8B5CF6' },
  'XGO': { name: 'XGO', symbol: 'XGO', icon: '🚀', color: '#00FF88' },
  'VGB': { name: 'VGB', symbol: 'VGB', color: '#FF6B35' },
  'XPM': { name: 'XPmarket', symbol: 'XPM', color: '#E91E63' },
  'XPUNK': { name: 'XPUNK', symbol: 'XPUNK', icon: '👾', color: '#9C27B0' },
  'ARMY': { name: 'XRP Army', symbol: 'ARMY', icon: '⚔️', color: '#F44336' },
  'GREYHOUND': { name: 'Greyhound', symbol: 'GREYHOUND', icon: '🐕', color: '#607D8B' },
  'HOUND': { name: 'Greyhound', symbol: 'HOUND', icon: '🐕', color: '#607D8B' },
  'XRPayNet': { name: 'XRPayNet', symbol: 'XRPAYNET', color: '#2196F3' },
  'XMEME': { name: 'XMeme', symbol: 'XMEME', icon: '😂', color: '#FF9800' },
  'BEAR': { name: 'Bear', symbol: 'BEAR', icon: '🐻', color: '#795548' },
  'BULL': { name: 'Bull', symbol: 'BULL', icon: '🐂', color: '#4CAF50' },
  'MOON': { name: 'Moon', symbol: 'MOON', icon: '🌙', color: '#FFC107' },
  'DOGE': { name: 'Doge', symbol: 'DOGE', icon: '🐕', color: '#C2A633' },
  'PEPE': { name: 'Pepe', symbol: 'PEPE', icon: '🐸', color: '#4CAF50' },
  'SHIB': { name: 'Shiba', symbol: 'SHIB', icon: '🐕', color: '#FFA726' },
  'XRPepe': { name: 'XRPepe', symbol: 'XRPepe', icon: '🐸', color: '#4CAF50' },
  'XSPECTAR': { name: 'xSPECTAR', symbol: 'XSPECTAR', color: '#673AB7' },
  'MAG': { name: 'Magnetic', symbol: 'MAG', icon: '🧲', color: '#E91E63' },
  'EQUILIBRIUM': { name: 'Equilibrium', symbol: 'EQ', color: '#00BCD4' },
  'RPR': { name: 'Reaper', symbol: 'RPR', icon: '💀', color: '#212121' },
  'SEC': { name: 'SEC', symbol: 'SEC', icon: '⚖️', color: '#3F51B5' },
  'FURY': { name: 'Fury', symbol: 'FURY', icon: '🔥', color: '#FF5722' },
};

// Check if a token is a known meme coin
export function isMemeToken(currency: string): boolean {
  const normalizedCurrency = currency.toUpperCase();
  return Object.keys(KNOWN_MEME_COINS).some(
    key => key.toUpperCase() === normalizedCurrency || 
           KNOWN_MEME_COINS[key].symbol.toUpperCase() === normalizedCurrency
  );
}

// Get meme coin info
export function getMemeTokenInfo(currency: string): { name: string; symbol: string; icon?: string; color: string } | null {
  const normalizedCurrency = currency.toUpperCase();
  
  for (const [key, info] of Object.entries(KNOWN_MEME_COINS)) {
    if (key.toUpperCase() === normalizedCurrency || info.symbol.toUpperCase() === normalizedCurrency) {
      return info;
    }
  }
  
  // If not found but looks like a meme coin (short currency code), return generic info
  if (currency.length <= 5) {
    return {
      name: currency,
      symbol: currency,
      icon: '🪙',
      color: '#9E9E9E',
    };
  }
  
  return null;
}

// Parse NFT URI to get image/metadata
export async function parseNFTUri(uri: string): Promise<{
  image?: string;
  name?: string;
  description?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}> {
  try {
    // Handle IPFS URIs
    let fetchUrl = uri;
    if (uri.startsWith('ipfs://')) {
      fetchUrl = `https://ipfs.io/ipfs/${uri.slice(7)}`;
    } else if (uri.startsWith('https://') || uri.startsWith('http://')) {
      fetchUrl = uri;
    } else {
      // Try to decode as base64 JSON
      try {
        const decoded = atob(uri);
        const metadata = JSON.parse(decoded);
        return {
          image: metadata.image,
          name: metadata.name,
          description: metadata.description,
          attributes: metadata.attributes,
        };
      } catch {
        return { image: uri };
      }
    }

    // Fetch metadata
    const response = await fetch(fetchUrl);
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const metadata = await response.json();
        let image = metadata.image;
        
        // Convert IPFS image URLs
        if (image?.startsWith('ipfs://')) {
          image = `https://ipfs.io/ipfs/${image.slice(7)}`;
        }
        
        return {
          image,
          name: metadata.name,
          description: metadata.description,
          attributes: metadata.attributes,
        };
      } else if (contentType?.includes('image')) {
        return { image: fetchUrl };
      }
    }
    
    return { image: uri };
  } catch {
    return { image: uri };
  }
}

// Get recent transactions
export async function getAccountTransactions(address: string, limit: number = 10): Promise<Array<{
  hash: string;
  type: string;
  amount?: number;
  currency?: string;
  destination?: string;
  timestamp: number;
  success: boolean;
}>> {
  try {
    const result = await xrplRequest<AccountTxResult>('account_tx', [
      {
        account: address,
        ledger_index_min: -1,
        ledger_index_max: -1,
        limit,
      },
    ]);

    return result.transactions.map((tx) => {
      let amount: number | undefined;
      let currency = 'XRP';

      if (tx.tx.Amount) {
        if (typeof tx.tx.Amount === 'string') {
          amount = dropsToXRP(tx.tx.Amount);
        } else {
          amount = parseFloat(tx.tx.Amount.value);
          currency = tx.tx.Amount.currency;
        }
      }

      return {
        hash: tx.tx.hash,
        type: tx.tx.TransactionType,
        amount,
        currency,
        destination: tx.tx.Destination,
        timestamp: rippleTimeToUnix(tx.tx.date),
        success: tx.meta.TransactionResult === 'tesSUCCESS',
      };
    });
  } catch {
    return [];
  }
}

// Get server info (network status)
export async function getServerInfo(): Promise<{
  ledgerIndex: number;
  serverState: string;
  baseFee: number;
  reserveBase: number;
  reserveInc: number;
  peers: number;
}> {
  const result = await xrplRequest<ServerInfoResult>('server_info', [{}]);

  return {
    ledgerIndex: result.info.validated_ledger.seq,
    serverState: result.info.server_state,
    baseFee: result.info.validated_ledger.base_fee_xrp,
    reserveBase: result.info.validated_ledger.reserve_base_xrp,
    reserveInc: result.info.validated_ledger.reserve_inc_xrp,
    peers: result.info.peers,
  };
}

// Get full wallet data (combines multiple calls)
export async function getWalletData(address: string): Promise<{
  balance: number;
  exists: boolean;
  tokens: Array<{ currency: string; balance: number; issuer: string }>;
  nftCount: number;
  recentTxCount: number;
}> {
  console.log(`[XRPL] Getting full wallet data for: ${address}`);
  
  // Get account info first - this is required
  let accountInfo;
  try {
    accountInfo = await getAccountInfo(address);
    console.log(`[XRPL] Account info result:`, JSON.stringify(accountInfo, null, 2));
    console.log(`[XRPL] Balance from accountInfo: ${accountInfo.balance} (type: ${typeof accountInfo.balance})`);
    console.log(`[XRPL] Exists from accountInfo: ${accountInfo.exists}`);
  } catch (error) {
    console.error(`[XRPL] Failed to get account info:`, error);
    return {
      balance: 0,
      exists: false,
      tokens: [],
      nftCount: 0,
      recentTxCount: 0,
    };
  }

  // If account doesn't exist, return early
  if (!accountInfo.exists) {
    return {
      balance: accountInfo.balance,
      exists: false,
      tokens: [],
      nftCount: 0,
      recentTxCount: 0,
    };
  }

  // Fetch additional data in parallel, but don't fail if they error
  let tokens: Array<{ currency: string; balance: number; issuer: string; limit: number }> = [];
  let nfts: Array<{ tokenId: string; issuer: string; taxon: number; uri?: string; serial: number; flags: number }> = [];
  let transactions: Array<{ hash: string; type: string; amount?: number; currency?: string; destination?: string; timestamp: number; success: boolean }> = [];

  try {
    const results = await Promise.allSettled([
      getAccountLines(address),
      getAccountNFTs(address),
      getAccountTransactions(address, 5),
    ]);

    if (results[0].status === 'fulfilled') {
      tokens = results[0].value;
      console.log(`[XRPL] Got ${tokens.length} tokens`);
    } else {
      console.warn(`[XRPL] Failed to get tokens:`, results[0].reason);
    }

    if (results[1].status === 'fulfilled') {
      nfts = results[1].value;
      console.log(`[XRPL] Got ${nfts.length} NFTs`);
    } else {
      console.warn(`[XRPL] Failed to get NFTs:`, results[1].reason);
    }

    if (results[2].status === 'fulfilled') {
      transactions = results[2].value;
      console.log(`[XRPL] Got ${transactions.length} transactions`);
    } else {
      console.warn(`[XRPL] Failed to get transactions:`, results[2].reason);
    }
  } catch (error) {
    console.error(`[XRPL] Error fetching additional data:`, error);
  }

  return {
    balance: accountInfo.balance,
    exists: accountInfo.exists,
    tokens: tokens.map((t) => ({
      currency: t.currency,
      balance: t.balance,
      issuer: t.issuer,
    })),
    nftCount: nfts.length,
    recentTxCount: transactions.length,
  };
}

// Helper: Decode hex string to UTF-8
function decodeHex(hex: string): string {
  try {
    const bytes = new Uint8Array(hex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);
    return new TextDecoder().decode(bytes);
  } catch {
    return hex;
  }
}

// Helper: Convert Ripple epoch time to Unix timestamp
function rippleTimeToUnix(rippleTime: number): number {
  // Ripple epoch starts at 2000-01-01 00:00:00 UTC
  const RIPPLE_EPOCH = 946684800;
  return (rippleTime + RIPPLE_EPOCH) * 1000;
}

// Format currency code (handle hex-encoded currencies)
export function formatCurrency(currency: string): string {
  if (currency.length === 3) {
    return currency;
  }
  // Hex-encoded currency (40 chars)
  if (currency.length === 40) {
    const decoded = decodeHex(currency.replace(/0+$/, ''));
    return decoded || currency.slice(0, 8) + '...';
  }
  return currency;
}
