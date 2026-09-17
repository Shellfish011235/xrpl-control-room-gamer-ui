export interface IndexedNFTMetadata {
  image?: string;
  name?: string;
  description?: string;
  source: 'xmagnetic';
}

const TOKEN_ID_PATTERN = /^[A-F0-9]{64}$/i;
const RECOVERY_TIMEOUT_MS = 10_000;

function isUsableUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim().length === 0) return false;
  return /^https?:\/\//i.test(value) || value.startsWith('data:image/');
}

function readNextData(html: string): unknown | null {
  const match = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) return null;
  try {
    return JSON.parse(match[1].replace(/&quot;/g, '"'));
  } catch {
    return null;
  }
}

export function extractIndexedNFTMetadata(html: string, tokenId: string): IndexedNFTMetadata | null {
  const root = readNextData(html);
  if (!root || typeof root !== 'object') return null;
  const pageProps = (root as { props?: { pageProps?: { nft?: unknown } } }).props?.pageProps;
  const nft = pageProps?.nft;
  if (!nft || typeof nft !== 'object') return null;
  const record = nft as Record<string, unknown>;
  if (record.nftokenID !== tokenId && record.nftokenId !== tokenId && record.id !== tokenId) return null;

  const metadata = record.metadata && typeof record.metadata === 'object'
    ? record.metadata as Record<string, unknown>
    : {};
  const media = metadata.media && typeof metadata.media === 'object'
    ? metadata.media as Record<string, unknown>
    : {};
  const assets = record.assets && typeof record.assets === 'object'
    ? record.assets as Record<string, unknown>
    : {};
  const image = [assets.image, media.content, metadata.image, metadata.thumbnail].find(isUsableUrl);
  if (!image) return null;

  return {
    image,
    ...(typeof metadata.name === 'string' ? { name: metadata.name } : {}),
    ...(typeof metadata.description === 'string' ? { description: metadata.description } : {}),
    source: 'xmagnetic',
  };
}

export async function fetchIndexedNFTMetadata(
  tokenId: string,
  fetcher: typeof fetch = fetch,
): Promise<IndexedNFTMetadata | null> {
  if (!TOKEN_ID_PATTERN.test(tokenId)) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RECOVERY_TIMEOUT_MS);
  try {
    const response = await fetcher(`/api/nft-indexer?tokenId=${encodeURIComponent(tokenId)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const payload = await response.json() as unknown;
    if (!payload || typeof payload !== 'object') return null;
    const record = payload as Record<string, unknown>;
    return isUsableUrl(record.image)
      ? {
          image: record.image,
          ...(typeof record.name === 'string' ? { name: record.name } : {}),
          ...(typeof record.description === 'string' ? { description: record.description } : {}),
          source: 'xmagnetic',
        }
      : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
