export interface ReconcilableNFT {
  tokenId: string;
  uri?: string;
  [key: string]: unknown;
}

/** Merge a second indexer's records without replacing the validated ledger source. */
export function mergeNFTRecords<T extends ReconcilableNFT>(primary: T[], secondary: T[]): T[] {
  const merged = new Map(primary.map((nft) => [nft.tokenId, nft]));
  for (const nft of secondary) {
    const existing = merged.get(nft.tokenId);
    if (!existing) {
      merged.set(nft.tokenId, nft);
      continue;
    }
    if (!existing.uri && nft.uri) merged.set(nft.tokenId, { ...existing, uri: nft.uri });
  }
  return [...merged.values()];
}
