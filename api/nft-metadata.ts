import { assetProxyUrl, extractIPFSPath, fetchIPFS, rewriteIPFSImage } from './nftIpfs.js';

const MAX_METADATA_BYTES = 2 * 1024 * 1024;

function json(body: unknown, status = 200, cache = false): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(cache ? { 'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400' } : {}),
    },
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
    const uri = new URL(request.url).searchParams.get('uri')?.trim();
    if (!uri || !extractIPFSPath(uri)) return json({ error: 'A valid IPFS URI is required' }, 400);

    try {
      const upstream = await fetchIPFS(uri);
      const bytes = await upstream.arrayBuffer();
      if (bytes.byteLength > MAX_METADATA_BYTES) return json({ error: 'NFT metadata is too large' }, 413);
      const contentType = upstream.headers.get('content-type')?.toLowerCase() ?? '';
      if (contentType.startsWith('image/')) return json({ image: assetProxyUrl(uri) }, 200, true);

      const metadata = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
      if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
        return json({ error: 'Invalid NFT metadata' }, 502);
      }
      return json({ ...metadata, image: rewriteIPFSImage(metadata.image) }, 200, true);
    } catch {
      return json({ error: 'NFT metadata is unavailable from IPFS gateways' }, 502);
    }
  },
};
