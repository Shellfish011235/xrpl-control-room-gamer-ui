export interface IndexedNFTMetadata {
  image?: string;
  uri?: string;
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

function normalizeRecoveredImage(image: string): string {
  try {
    const url = new URL(image);
    const host = url.hostname.toLowerCase();
    if (url.protocol === 'https:' && (host === 'arweave.net' || host.endsWith('.arweave.net') || host.endsWith('.xmagnetic.org'))) {
      return `/api/nft-image?url=${encodeURIComponent(image)}`;
    }
  } catch {
    // Keep the original value for non-URL image data.
  }
  return image;
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

function readString(record: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function findNFTRecord(value: unknown, tokenId: string): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findNFTRecord(item, tokenId);
      if (found) return found;
    }
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = readString(record, 'nftokenID', 'nftokenId', 'NFTokenID', 'nft_id', 'id');
  if (id && id.toUpperCase() === tokenId.toUpperCase()) return record;

  for (const child of Object.values(record)) {
    if (child && typeof child === 'object') {
      const found = findNFTRecord(child, tokenId);
      if (found) return found;
    }
  }
  return null;
}

function findFirstUrl(value: unknown): string | undefined {
  if (isUsableUrl(value)) return value;
  if (!value || typeof value !== 'object') return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findFirstUrl(item);
      if (found) return found;
    }
    return undefined;
  }
  for (const child of Object.values(value as Record<string, unknown>)) {
    const found = findFirstUrl(child);
    if (found) return found;
  }
  return undefined;
}

export function extractIndexedNFTMetadata(html: string, tokenId: string): IndexedNFTMetadata | null {
  const root = readNextData(html);
  if (!root) return null;
  const record = findNFTRecord(root, tokenId);
  if (!record) return null;

  const metadata = record.metadata && typeof record.metadata === 'object'
    ? record.metadata as Record<string, unknown>
    : {};
  const image = findFirstUrl(
    metadata.image ?? metadata.image_url ?? metadata.imageUrl ??
    (metadata.media && typeof metadata.media === 'object' ? metadata.media : undefined) ??
    record.assets ?? record.image
  );
  const uri = readString(record, 'URI', 'uri', 'metadata_uri', 'metadataUri');
  const name = readString(metadata, 'name') ?? readString(record, 'name');
  const description = readString(metadata, 'description') ?? readString(record, 'description');

  if (!image && !uri && !name && !description) return null;
  return {
    ...(image ? { image: normalizeRecoveredImage(image) } : {}),
    ...(uri ? { uri } : {}),
    ...(name ? { name } : {}),
    ...(description ? { description } : {}),
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
    const image = typeof record.image === 'string' && isUsableUrl(record.image)
      ? normalizeRecoveredImage(record.image)
      : undefined;
    const uri = typeof record.uri === 'string' && record.uri.trim()
      ? record.uri.trim()
      : undefined;
    if (!image && !uri) return null;
    return {
      ...(image ? { image } : {}),
      ...(uri ? { uri } : {}),
      ...(typeof record.name === 'string' ? { name: record.name } : {}),
      ...(typeof record.description === 'string' ? { description: record.description } : {}),
      source: 'xmagnetic',
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
