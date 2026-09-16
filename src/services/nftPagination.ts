export interface RawAccountNFT {
  Flags: number;
  Issuer: string;
  NFTokenID: string;
  NFTokenTaxon: number;
  URI?: string;
  nft_serial: number;
}

export interface AccountNFTPage {
  account_nfts: RawAccountNFT[];
  marker?: unknown;
}

type RequestNFTPage = (params: Record<string, unknown>) => Promise<AccountNFTPage>;

export async function fetchAllAccountNFTPages(
  address: string,
  requestPage: RequestNFTPage,
  maxPages = 100
): Promise<RawAccountNFT[]> {
  const allNFTs: RawAccountNFT[] = [];
  const seenMarkers = new Set<string>();
  const seenTokenIds = new Set<string>();
  let marker: unknown;

  for (let pageCount = 0; pageCount < maxPages; pageCount += 1) {
    const params: Record<string, unknown> = {
      account: address,
      ledger_index: 'validated',
      limit: 100,
    };

    if (marker) {
      const markerKey = JSON.stringify(marker);
      if (seenMarkers.has(markerKey)) {
        throw new Error('XRPL returned a repeated NFT pagination marker.');
      }
      seenMarkers.add(markerKey);
      params.marker = marker;
    }

    const result = await requestPage(params);
    if (!Array.isArray(result?.account_nfts)) {
      throw new Error('XRPL account_nfts response did not contain an NFT array.');
    }

    for (const nft of result.account_nfts) {
      if (!seenTokenIds.has(nft.NFTokenID)) {
        seenTokenIds.add(nft.NFTokenID);
        allNFTs.push(nft);
      }
    }

    marker = result.marker;
    if (!marker) return allNFTs;
  }

  throw new Error(`XRPL NFT pagination exceeded the ${maxPages}-page safety limit.`);
}
