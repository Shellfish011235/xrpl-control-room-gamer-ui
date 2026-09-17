import { extractIndexedNFTMetadata } from '../src/services/nftIndexerRecovery.js';

const INDEXER_ORIGIN = 'https://xmagnetic.org/nfts/asset/';
const XRPSCAN_NFT_ORIGIN = 'https://api.xrpscan.com/api/v1/nft/';
const UPSTREAM_TIMEOUT_MS = 8_000;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}

function decodeHex(value: unknown): string | undefined {
  if (typeof value !== 'string' || !/^(?:[0-9a-f]{2})+$/i.test(value)) return undefined;
  try {
    return new TextDecoder().decode(
      Uint8Array.from(value.match(/.{2}/g) ?? [], (byte) => parseInt(byte, 16))
    );
  } catch {
    return undefined;
  }
}

function readString(record: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function extractXRPSCanRecovery(value: unknown, tokenId: string): Record<string, string> | null {
  if (!value || typeof value !== 'object') return null;
  const root = value as Record<string, unknown>;
  const record = (root.nft && typeof root.nft === 'object' ? root.nft : root) as Record<string, unknown>;
  const id = readString(record, 'NFTokenID', 'nft_id', 'nftokenID', 'id');
  if (id && id.toUpperCase() !== tokenId.toUpperCase()) return null;

  const uriValue = readString(record, 'URI', 'uri', 'metadata_uri', 'metadataUri');
  const uri = uriValue && !uriValue.startsWith('http') ? decodeHex(uriValue) ?? uriValue : uriValue;
  const image = readString(record, 'image', 'image_url', 'imageUrl');
  const name = readString(record, 'name');
  const description = readString(record, 'description');

  if (!uri && !image && !name && !description) return null;
  return {
    ...(uri ? { uri } : {}),
    ...(image ? { image } : {}),
    ...(name ? { name } : {}),
    ...(description ? { description } : {}),
    source: 'xmagnetic',
  };
}

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
    const tokenId = new URL(request.url).searchParams.get('tokenId')?.trim() ?? '';
    if (!/^[A-F0-9]{64}$/i.test(tokenId)) return json({ error: 'A valid NFTokenID is required' }, 400);

    try {
      const upstream = await fetchWithTimeout(`${INDEXER_ORIGIN}${tokenId}`, {
        headers: { Accept: 'text/html' },
      });
      if (upstream.ok) {
        const metadata = extractIndexedNFTMetadata(await upstream.text(), tokenId);
        if (metadata) return json(metadata);
      }
    } catch {
      // Continue to the independent XRPScan recovery source.
    }

    try {
      const upstream = await fetchWithTimeout(`${XRPSCAN_NFT_ORIGIN}${tokenId}`, {
        headers: { Accept: 'application/json' },
      });
      if (!upstream.ok) return json({ error: 'NFT recovery sources have no metadata' }, 404);
      const metadata = extractXRPSCanRecovery(await upstream.json(), tokenId);
      return metadata ? json(metadata) : json({ error: 'NFT recovery sources have no metadata' }, 404);
    } catch {
      return json({ error: 'NFT recovery sources unavailable' }, 502);
    }
  },
};
