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
      if (index < 0) return null;
      path = url.pathname.slice(index + 6);
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

async function fetchGateway(gateway: string, path: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const response = await fetch(`${gateway}${path}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json,image/*;q=0.9,*/*;q=0.5' },
    });
    if (!response.ok) throw new Error(`Gateway returned ${response.status}`);
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchIPFS(uri: string): Promise<Response> {
  const path = extractIPFSPath(uri);
  if (!path) throw new Error('Unsupported IPFS URI');
  return Promise.any(IPFS_GATEWAYS.map((gateway) => fetchGateway(gateway, path)));
}

export function assetProxyUrl(uri: string): string {
  return `/api/nft-asset?uri=${encodeURIComponent(uri)}`;
}

export function rewriteIPFSImage(image: unknown): unknown {
  return typeof image === 'string' && extractIPFSPath(image) ? assetProxyUrl(image) : image;
}
