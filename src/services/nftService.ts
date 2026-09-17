/**
 * NFT Service (XLS-20) – account_nfts, mint/offer payloads, floor data.
 * Central hub for NFT Arena. Testnet-first; mainnet via settings toggle.
 */

import { getAccountNFTs } from './xrplService';
import { mergeNFTRecords } from './nftReconciliation';
export { mergeNFTRecords } from './nftReconciliation';

export type NFTRecord = Awaited<ReturnType<typeof getAccountNFTs>>[number] & {
  image?: string;
  name?: string;
  description?: string;
};

const XRPSCAN_NFT_API = 'https://api.xrpscan.com/api/v1';

type XRPScanNFT = {
  NFTokenID?: unknown;
  nft_id?: unknown;
  Issuer?: unknown;
  issuer?: unknown;
  NFTokenTaxon?: unknown;
  nft_taxon?: unknown;
  nft_serial?: unknown;
  URI?: unknown;
  uri?: unknown;
  Flags?: unknown;
  flags?: unknown;
};

function normalizeXRPScanNFT(value: XRPScanNFT): NFTRecord | null {
  const tokenId = typeof value.NFTokenID === 'string'
    ? value.NFTokenID
    : typeof value.nft_id === 'string' ? value.nft_id : '';
  if (!tokenId) return null;

  const issuer = typeof value.Issuer === 'string'
    ? value.Issuer
    : typeof value.issuer === 'string' ? value.issuer : '';
  const taxon = Number(value.NFTokenTaxon ?? value.nft_taxon ?? 0);
  const serial = Number(value.nft_serial ?? 0);
  const uri = typeof value.URI === 'string'
    ? value.URI
    : typeof value.uri === 'string' ? value.uri : undefined;

  return {
    tokenId,
    issuer,
    taxon: Number.isFinite(taxon) ? taxon : 0,
    serial: Number.isFinite(serial) ? serial : 0,
    ...(uri ? { uri } : {}),
    flags: Number(value.Flags ?? value.flags ?? 0),
  } as NFTRecord;
}

async function fetchXRPScanAccountNFTs(address: string): Promise<NFTRecord[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(`${XRPSCAN_NFT_API}/account/${encodeURIComponent(address)}/nfts?limit=400`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return [];
    const payload = await response.json() as unknown;
    if (!Array.isArray(payload)) return [];
    return payload
      .filter((value): value is XRPScanNFT => Boolean(value) && typeof value === 'object')
      .map(normalizeXRPScanNFT)
      .filter((value): value is NFTRecord => value !== null);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

/** Fetch the ledger list immediately. The page streams metadata separately. */
export async function fetchAccountNFTs(address: string): Promise<NFTRecord[]> {
  let primaryRecords: NFTRecord[] = [];
  let primaryError: unknown;
  try {
    const primary = await getAccountNFTs(address);
    primaryRecords = primary.map((nft) => ({ ...nft } as NFTRecord));
  } catch (error) {
    primaryError = error;
  }
  // XRPScan is used as a reconciliation source so a lagging/partial public node
  // cannot hide NFTs that are already visible through an independent indexer.
  const secondary = await fetchXRPScanAccountNFTs(address);
  if (primaryError && secondary.length === 0) throw primaryError;
  return mergeNFTRecords(primaryRecords, secondary);
}

/** Filter by taxon and/or issuer (client-side). */
export function filterNFTs(
  nfts: NFTRecord[],
  opts: { taxon?: number; issuer?: string }
): NFTRecord[] {
  return nfts.filter((n) => {
    if (opts.taxon != null && n.taxon !== opts.taxon) return false;
    if (opts.issuer && n.issuer !== opts.issuer) return false;
    return true;
  });
}

/** Floor/volume placeholder – XRPScan or mock. */
export async function fetchCollectionFloor(
  _issuer: string,
  _taxon?: number
): Promise<{ floorXRP?: number; volume24h?: number }> {
  try {
    // XRPScan NFT endpoints if/when available; else mock for BETA
    const res = await fetch(
      `${XRPSCAN_NFT_API}/account/${_issuer}/nfts?limit=1`,
      { mode: 'cors' }
    );
    if (res.ok) {
      const data = (await res.json()) as { nfts?: unknown[] };
      return { floorXRP: undefined, volume24h: undefined };
    }
  } catch {
    // ignore
  }
  return {};
}

/** Max URI length (XLS-20 recommendation; ledger limit is 256 bytes for URI). */
const MAX_URI_BYTES = 256;

/** Result of URI validation for mint (safety + snipe prevention). */
export type MintUriValidation = {
  ok: boolean;
  error?: string;
  warning?: string;
  /** True if URI is insecure (http) or high snipe risk */
  insecure?: boolean;
};

/**
 * Validate NFT mint URI for safety and anti-snipe best practices.
 * - Allows: https://, ipfs://, data: (inline JSON)
 * - Warns/blocks: http:// (insecure, tamperable, can be scraped)
 * - Enforces length limit
 */
export function validateMintUri(uri: string): MintUriValidation {
  const trimmed = uri.trim();
  if (!trimmed) {
    return { ok: false, error: 'URI is required' };
  }
  const byteLength = new TextEncoder().encode(trimmed).length;
  if (byteLength > MAX_URI_BYTES) {
    return { ok: false, error: `URI too long (${byteLength} bytes, max ${MAX_URI_BYTES})` };
  }
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('http://')) {
    return {
      ok: false,
      insecure: true,
      error: 'Use HTTPS only. HTTP metadata can be intercepted or altered; bots can snipe it.',
    };
  }
  if (lower.startsWith('https://') || lower.startsWith('ipfs://') || lower.startsWith('data:')) {
    if (lower.startsWith('https://') && (lower.includes('pastebin') || lower.includes('hastebin') || lower.includes('paste.ee'))) {
      return {
        ok: true,
        warning: 'Public paste URLs are visible to everyone. Mint immediately or use IPFS/your own server to avoid sniping.',
        insecure: true,
      };
    }
    return { ok: true };
  }
  if (trimmed.startsWith('{')) {
    return {
      ok: false,
      error: 'Pasting raw JSON here is unsafe—anyone can copy it and mint first. Host metadata at a URL (HTTPS or IPFS) instead.',
    };
  }
  return {
    ok: false,
    error: 'URI must be HTTPS, IPFS (ipfs://), or inline data (data:). No HTTP or raw JSON.',
  };
}

/** Build NFTokenMint tx for Xaman (URI as hex). */
export function buildNFTokenMintPayload(params: {
  account: string;
  uri: string;
  taxon: number;
  transferFee?: number;
  flags?: number;
}): Record<string, unknown> {
  const uriHex =
    typeof params.uri === 'string' && params.uri.length > 0
      ? Array.from(new TextEncoder().encode(params.uri))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase()
      : '';
  return {
    TransactionType: 'NFTokenMint',
    Account: params.account,
    NFTokenTaxon: params.taxon,
    URI: uriHex,
    Flags: params.flags ?? 0,
    ...(params.transferFee != null && { TransferFee: params.transferFee }),
  };
}

/** Build NFTokenCreateOffer (sell) – owner sells NFT for XRP. */
export function buildNFTokenSellOfferPayload(params: {
  account: string;
  nftId: string;
  amountXRP: string;
  expiration?: number;
}): Record<string, unknown> {
  const drops = Math.round(parseFloat(params.amountXRP) * 1_000_000).toString();
  return {
    TransactionType: 'NFTokenCreateOffer',
    Account: params.account,
    NFTokenID: params.nftId,
    Amount: drops,
    ...(params.expiration != null && { Expiration: params.expiration }),
  };
}

/** Build NFTokenCreateOffer (buy) – buyer offers XRP for NFT. */
export function buildNFTokenBuyOfferPayload(params: {
  account: string;
  nftId: string;
  amountXRP: string;
  owner?: string;
  expiration?: number;
}): Record<string, unknown> {
  const drops = Math.round(parseFloat(params.amountXRP) * 1_000_000).toString();
  const payload: Record<string, unknown> = {
    TransactionType: 'NFTokenCreateOffer',
    Account: params.account,
    NFTokenID: params.nftId,
    Amount: drops,
    ...(params.expiration != null && { Expiration: params.expiration }),
  };
  if (params.owner) payload.Owner = params.owner;
  return payload;
}

/** Build NFTokenAcceptOffer – accept a sell or buy offer. */
export function buildNFTokenAcceptOfferPayload(params: {
  account: string;
  offerId: string;
}): Record<string, unknown> {
  return {
    TransactionType: 'NFTokenAcceptOffer',
    Account: params.account,
    NFTokenSellOffer: params.offerId,
  };
}

/** Build NFTokenBurn tx. */
export function buildNFTokenBurnPayload(params: {
  account: string;
  nftId: string;
}): Record<string, unknown> {
  return {
    TransactionType: 'NFTokenBurn',
    Account: params.account,
    NFTokenID: params.nftId,
  };
}
