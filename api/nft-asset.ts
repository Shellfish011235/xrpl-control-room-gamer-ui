import { extractIPFSPath, fetchIPFS } from './nftIpfs.js';

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function inferImageType(bytes: Uint8Array, upstreamType: string): string | null {
  if (upstreamType.startsWith('image/')) return upstreamType.split(';')[0];
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (String.fromCharCode(...bytes.slice(0, 6)).startsWith('GIF8')) return 'image/gif';
  if (String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET') return errorResponse('Method not allowed', 405);
    const uri = new URL(request.url).searchParams.get('uri')?.trim();
    if (!uri || !extractIPFSPath(uri)) return errorResponse('A valid IPFS URI is required', 400);

    try {
      const upstream = await fetchIPFS(uri);
      const bytes = new Uint8Array(await upstream.arrayBuffer());
      if (bytes.byteLength > MAX_IMAGE_BYTES) return errorResponse('NFT image is too large', 413);
      const type = inferImageType(bytes, upstream.headers.get('content-type')?.toLowerCase() ?? '');
      if (!type) return errorResponse('IPFS asset is not a supported image', 415);

      return new Response(bytes, {
        headers: {
          'Content-Type': type,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } catch {
      return errorResponse('NFT image is unavailable from IPFS gateways', 502);
    }
  },
};
