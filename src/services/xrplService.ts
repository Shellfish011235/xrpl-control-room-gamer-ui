// XRPL Service - Fetches real data from the XRP Ledger

// XRPL Public Servers
// Mainnet: https://xrplcluster.com or https://s1.ripple.com
// Testnet: https://s.altnet.rippletest.net:51234
const XRPL_URL = 'https://xrplcluster.com';

interface XRPLResponse<T> {
  result: T;
  status?: string;
  error?: string;
  error_message?: string;
}

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

// Helper to make JSON-RPC calls to XRPL
async function xrplRequest<T>(method: string, params: Record<string, unknown>[] = [{}]): Promise<T> {
  const response = await fetch(XRPL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`XRPL request failed: ${response.statusText}`);
  }

  const data: XRPLResponse<T> = await response.json();
  
  if (data.error) {
    throw new Error(data.error_message || data.error);
  }

  return data.result;
}

// Convert drops to XRP (1 XRP = 1,000,000 drops)
export function dropsToXRP(drops: string | number): number {
  return Number(drops) / 1_000_000;
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
  try {
    const result = await xrplRequest<AccountInfoResult>('account_info', [
      {
        account: address,
        ledger_index: 'validated',
      },
    ]);

    return {
      balance: dropsToXRP(result.account_data.Balance),
      ownerCount: result.account_data.OwnerCount,
      sequence: result.account_data.Sequence,
      exists: true,
    };
  } catch (error) {
    // Account not found or other error
    if (error instanceof Error && error.message.includes('actNotFound')) {
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
  const [accountInfo, tokens, nfts, transactions] = await Promise.all([
    getAccountInfo(address),
    getAccountLines(address),
    getAccountNFTs(address),
    getAccountTransactions(address, 5),
  ]);

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
