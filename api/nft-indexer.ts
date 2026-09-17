import { extractIndexedNFTMetadata } from '../src/services/nftIndexerRecovery.js';

const INDEXER_ORIGIN = 'https://xmagnetic.org/nfts/asset/';
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

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
    const tokenId = new URL(request.url).searchParams.get('tokenId')?.trim() ?? '';
    if (!/^[A-F0-9]{64}$/i.test(tokenId)) return json({ error: 'A valid NFTokenID is required' }, 400);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    try {
      const upstream = await fetch(`${INDEXER_ORIGIN}${tokenId}`, {
        signal: controller.signal,
        headers: { Accept: 'text/html' },
      });
      if (!upstream.ok) return json({ error: 'Indexer lookup failed' }, 502);
      const metadata = extractIndexedNFTMetadata(await upstream.text(), tokenId);
      return metadata ? json(metadata) : json({ error: 'Indexer has no artwork for this token' }, 404);
    } catch {
      return json({ error: 'Indexer lookup unavailable' }, 502);
    } finally {
      clearTimeout(timeout);
    }
  },
};
