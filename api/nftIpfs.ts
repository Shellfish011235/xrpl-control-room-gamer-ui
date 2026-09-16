const CID_PATTERN = /^(?:Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[a-z2-7][a-z2-7]{20,})$/;

export const IPFS_GATEWAYS = [
  'https://ipfs.filebase.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://w3s.link/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://dweb.link/ipfs/',
  'https://nftstorage.link/ipfs/',
] as const;

const UPSTREAM_TIMEOUT_MS = 7_000;

export function extractIPFSPath(uri: string): string | null {
  let path = uri.trim();
  if (path.startsWith('ipfs://')) {
    path = path.slice(7).replace(/^ipfs\//, '');
  } else if (/^https?:\/\//i.test(path)) {
    try {
      const url = new URL(path);
      const index = url.pathname.indexOf('/ipfs/');
      if (index >= 0) {
        path = url.pathname.slice(index + 6);
      } else {
        const subdomainCid = url.hostname.match(/^([^.]+)\.ipfs\./i)?.[1];
        if (!subdomainCid) return null;
        path = `${subdomainCid}${url.pathname}`;
      }
    } catch {
      return null;
    }
  }

  path = path.replace(/^\/+/, '');
  const segments = path.split('/');
  if (!CID_PATTERN.test(segments[0]) || segments.some((part) => part === '..' || part.includes('\\'))) {
    return null;
  }
  return path;
}

export interface IPFSBytes {
  bytes: Uint8Array;
  contentType: string;
}

async function readBoundedBody(response: Response, maxBytes: number): Promise<Uint8Array> {
  const contentLength = Number(response.headers.get('content-length') ?? 0);
  if (contentLength > maxBytes) throw new Error('IPFS response exceeds size limit');
  if (!response.body) return new Uint8Array();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error('IPFS response exceeds size limit');
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

async function fetchGatewayBytes(
  gateway: string,
  path: string,
  maxBytes: number,
  fetcher: typeof fetch,
  timeoutMs: number
): Promise<IPFSBytes> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const operation = (async () => {
      const response = await fetcher(`${gateway}${path}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json,image/*;q=0.9,*/*;q=0.5' },
      });
      if (!response.ok) throw new Error(`Gateway returned ${response.status}`);
      const bytes = await readBoundedBody(response, maxBytes);
      return {
        bytes,
        contentType: response.headers.get('content-type')?.toLowerCase() ?? '',
      };
    })();

    const deadline = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => {
        controller.abort();
        reject(new Error('IPFS gateway timed out'));
      }, timeoutMs);
    });
    return await Promise.race([operation, deadline]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function fetchIPFSBytes(
  uri: string,
  maxBytes: number,
  fetcher: typeof fetch = fetch,
  gateways: readonly string[] = IPFS_GATEWAYS,
  timeoutMs = UPSTREAM_TIMEOUT_MS
): Promise<IPFSBytes> {
  const path = extractIPFSPath(uri);
  if (!path) throw new Error('Unsupported IPFS URI');
  return Promise.any(
    gateways.map((gateway) => fetchGatewayBytes(gateway, path, maxBytes, fetcher, timeoutMs))
  );
}

export function assetProxyUrl(uri: string): string {
  return `/api/nft-asset?uri=${encodeURIComponent(uri)}`;
}

export function rewriteIPFSImage(image: unknown): unknown {
  return typeof image === 'string' && extractIPFSPath(image) ? assetProxyUrl(image) : image;
}
