import assert from 'node:assert/strict';
import test from 'node:test';

import { fetchAllAccountNFTPages } from '../src/services/nftPagination.ts';

const rawNFT = (serial: number) => ({
  Flags: 0,
  Issuer: 'rIssuer',
  NFTokenID: `token-${serial}`,
  NFTokenTaxon: 1,
  nft_serial: serial,
});

test('collects every unique NFT across paginated ledger responses', async () => {
  const requests: Array<Record<string, unknown>> = [];
  const page = await fetchAllAccountNFTPages('rWallet', async (params) => {
    requests.push(params);
    if (!params.marker) {
      return { account_nfts: Array.from({ length: 100 }, (_, i) => rawNFT(i)), marker: 'page-2' };
    }
    return { account_nfts: Array.from({ length: 36 }, (_, i) => rawNFT(i + 100)) };
  });

  assert.equal(page.length, 136);
  assert.equal(requests.length, 2);
  assert.equal(requests[1].marker, 'page-2');
});

test('rejects instead of silently returning a partial NFT collection', async () => {
  let calls = 0;
  await assert.rejects(
    fetchAllAccountNFTPages('rWallet', async () => {
      calls += 1;
      if (calls === 1) return { account_nfts: [rawNFT(1)], marker: 'page-2' };
      throw new Error('page two unavailable');
    }),
    /page two unavailable/
  );
});
