const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const UPSTREAM_TIMEOUT_MS = 8_000;

const ALLOWED_HOSTS = [
  'arweave.net',
  'cdn.xmagnetic.org',
  'images.xmagnetic.org',
  'ipfs.filebase.io',
  'gateway.pinata.cloud',
  'w3s.link',
  'ipfs.io',
  'dweb.link',
  'nftstorage.link',
] as const;

function isAllowedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return ALLOWED_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

async function readBoundedBody(response: Response): Promise<Uint8Array> {
  const contentLength = Number(response.headers.get('content-length') ?? 0);
  if (contentLength > MAX_IMAGE_BYTES) throw new Error('Image exceeds size limit');
  if (!response.body) return new Uint8Array();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_IMAGE_BYTES) {
      await reader.cancel();
      throw new Error('Image exceeds size limit');
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function inferImageType(bytes: Uint8Array, contentType: string): string | null {
  if (contentType.startsWith('image/')) return contentType.split(';')[0];
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (String.fromCharCode(...bytes.slice(0, 6)).startsWith('GIF8')) return 'image/gif';
  if (String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

    const rawUrl = new URL(request.url).searchParams.get('url')?.trim();
    if (!rawUrl) return errorResponse('An image URL is required', 400);

    let target: URL;
    try {
      target = new URL(rawUrl);
    } catch {
      return errorResponse('A valid image URL is required', 400);
    }
    if (target.protocol !== 'https:' || !isAllowedHost(target.hostname)) {
      return errorResponse('Image host is not allowed', 403);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    try {
      const upstream = await fetch(target, {
        signal: controller.signal,
        headers: { Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8' },
      });
      if (!upstream.ok) return errorResponse('Image upstream returned an error', 502);

      const bytes = await readBoundedBody(upstream);
      const contentType = upstream.headers.get('content-type')?.toLowerCase() ?? '';
      const imageType = inferImageType(bytes, contentType);
      if (!imageType) return errorResponse('Upstream response is not an image', 415);

      return new Response(bytes, {
        headers: {
          'Content-Type': imageType,
          'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } catch {
      return errorResponse('Image is unavailable', 502);
    } finally {
      clearTimeout(timeout);
    }
  },
};
