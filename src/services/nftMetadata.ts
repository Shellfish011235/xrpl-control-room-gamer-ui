export interface NFTMetadata {
  image?: string;
  name?: string;
  description?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

const BARE_CID_PATTERN = /^(?:Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[a-z2-7][a-z2-7]{20,})(?:\/.*)?$/;
const FETCH_TIMEOUT_MS = 12_000;

function getIPFSPath(uri: string): string | null {
  const trimmed = uri.trim();
  if (trimmed.startsWith('ipfs://')) {
    return trimmed.slice(7).replace(/^ipfs\//, '');
  }
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const markerIndex = url.pathname.indexOf('/ipfs/');
      if (markerIndex >= 0) return url.pathname.slice(markerIndex + 6);
      const subdomainCid = url.hostname.match(/^([^.]+)\.ipfs\./i)?.[1];
      if (subdomainCid) return `${subdomainCid}${url.pathname}`;
    } catch {
      return null;
    }
  }
  return BARE_CID_PATTERN.test(trimmed) ? trimmed : null;
}

export function resolveNFTUriCandidates(uri: string): string[] {
  const trimmed = uri.trim();
  const ipfsPath = getIPFSPath(trimmed);
  if (ipfsPath) {
    return [`/api/nft-metadata?uri=${encodeURIComponent(trimmed)}`];
  }

  return /^https?:\/\//i.test(trimmed) ? [trimmed] : [];
}

function normalizeImageUri(image: unknown): string | undefined {
  if (typeof image !== 'string' || image.trim().length === 0) return undefined;
  const trimmed = image.trim();
  const ipfsPath = getIPFSPath(trimmed);
  if (ipfsPath) return `/api/nft-asset?uri=${encodeURIComponent(trimmed)}`;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:image/') || trimmed.startsWith('/api/nft-asset?')) {
    return trimmed;
  }
  return undefined;
}

function normalizeMetadata(value: unknown): NFTMetadata {
  if (!value || typeof value !== 'object') return {};
  const metadata = value as Record<string, unknown>;
  const nested = metadata.metadata && typeof metadata.metadata === 'object'
    ? metadata.metadata as Record<string, unknown>
    : {};
  const media = metadata.media && typeof metadata.media === 'object'
    ? metadata.media as Record<string, unknown>
    : {};

  const image = normalizeImageUri(
    metadata.image ?? metadata.image_url ?? metadata.imageUrl ??
    nested.image ?? nested.image_url ?? nested.imageUrl ??
    media.image ?? media.content
  );

  return {
    ...(image ? { image } : {}),
    name: typeof (metadata.name ?? nested.name) === 'string' ? String(metadata.name ?? nested.name) : undefined,
    description: typeof (metadata.description ?? nested.description) === 'string'
      ? String(metadata.description ?? nested.description)
      : undefined,
    attributes: Array.isArray(metadata.attributes)
      ? metadata.attributes.filter(
          (attribute): attribute is { trait_type: string; value: string } =>
            Boolean(attribute) &&
            typeof attribute === 'object' &&
            typeof (attribute as Record<string, unknown>).trait_type === 'string' &&
            typeof (attribute as Record<string, unknown>).value === 'string'
        )
      : undefined,
  };
}

function parseInlineMetadata(uri: string): NFTMetadata | null {
  try {
    if (uri.startsWith('data:application/json;base64,')) {
      return normalizeMetadata(JSON.parse(atob(uri.slice('data:application/json;base64,'.length))));
    }
    if (uri.startsWith('data:application/json,')) {
      return normalizeMetadata(JSON.parse(decodeURIComponent(uri.slice('data:application/json,'.length))));
    }
    if (!uri.includes('://')) {
      return normalizeMetadata(JSON.parse(atob(uri)));
    }
  } catch {
    return null;
  }
  return null;
}

async function fetchWithTimeout(fetcher: typeof fetch, url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetcher(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function parseNFTUri(
  uri: string,
  fetcher: typeof fetch = fetch
): Promise<NFTMetadata> {
  const inlineMetadata = parseInlineMetadata(uri.trim());
  if (inlineMetadata) return inlineMetadata;

  const candidates = resolveNFTUriCandidates(uri);
  for (const candidate of candidates) {
    try {
      const response = await fetchWithTimeout(fetcher, candidate);
      if (!response.ok) continue;

      const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
      if (contentType.includes('json')) {
        return normalizeMetadata(await response.json());
      }
      if (contentType.startsWith('image/')) {
        return { image: candidate };
      }
      const text = await response.text();
      try {
        return normalizeMetadata(JSON.parse(text));
      } catch {
        // Continue when an HTTP metadata endpoint returns non-JSON content.
      }
    } catch {
      // Try the next gateway candidate.
    }
  }

  return {};
}

export async function loadNFTMetadata<T extends { tokenId: string; uri?: string }>(
  records: readonly T[],
  onUpdate: (tokenId: string, metadata: NFTMetadata) => void,
  parser: (uri: string) => Promise<NFTMetadata> = parseNFTUri,
  concurrency = 8
): Promise<void> {
  const withUri = records.filter((record): record is T & { uri: string } => Boolean(record.uri));
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < withUri.length) {
      const record = withUri[nextIndex];
      nextIndex += 1;
      try {
        onUpdate(record.tokenId, await parser(record.uri));
      } catch {
        onUpdate(record.tokenId, {});
      }
    }
  };

  const workerCount = Math.min(Math.max(1, concurrency), withUri.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
}
