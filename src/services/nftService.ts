/**
 * NFT Service (XLS-20) – account_nfts, mint/offer payloads, floor data.
 * Central hub for NFT Arena. Testnet-first; mainnet via settings toggle.
 */

import { getAccountNFTs, parseNFTUri } from './xrplService';

export type NFTRecord = Awaited<ReturnType<typeof getAccountNFTs>>[number] & {
  image?: string;
  name?: string;
  description?: string;
};

const XRPSCAN_NFT_API = 'https://api.xrpscan.com/api/v1';

/** Fetch NFTs for an address (uses existing xrplService.getAccountNFTs). */
export async function fetchAccountNFTs(address: string): Promise<NFTRecord[]> {
  const list = await getAccountNFTs(address);
  const out: NFTRecord[] = [];
  for (const nft of list) {
    const rec: NFTRecord = { ...nft };
    if (nft.uri) {
      try {
        const meta = await parseNFTUri(nft.uri);
        rec.image = meta.image;
        rec.name = meta.name;
        rec.description = meta.description;
      } catch {
        // keep uri only
      }
    }
    out.push(rec);
  }
  return out;
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
