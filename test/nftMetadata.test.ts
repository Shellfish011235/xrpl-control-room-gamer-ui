import assert from 'node:assert/strict';
import test from 'node:test';

import {
  loadNFTMetadata,
  parseNFTUri,
  resolveNFTUriCandidates,
} from '../src/services/nftMetadata.ts';

const CID = 'bafybeigdyrzt5sfp7udm7hu76u4ntx6n4g4ue2m2qbv3wzcdg6q4x4m5ae';

test('recognizes ipfs URIs and bare CIDs as gateway candidates', () => {
  const fromScheme = resolveNFTUriCandidates(`ipfs://${CID}/metadata.json`);
  const fromBareCid = resolveNFTUriCandidates(`${CID}/metadata.json`);

  assert.equal(fromScheme.length, 1);
  assert.equal(
    fromBareCid[0],
    `/api/nft-metadata?uri=${encodeURIComponent(`${CID}/metadata.json`)}`
  );
  assert.equal(
    fromScheme[0],
    `/api/nft-metadata?uri=${encodeURIComponent(`ipfs://${CID}/metadata.json`)}`
  );
});

test('routes existing IPFS gateway URLs through the same-origin metadata proxy', () => {
  const filebaseUri = `https://ipfs.filebase.io/ipfs/${CID}/6328.json`;

  assert.deepEqual(resolveNFTUriCandidates(filebaseUri), [
    `/api/nft-metadata?uri=${encodeURIComponent(filebaseUri)}`,
  ]);
});

test('uses the same-origin proxy response for IPFS metadata and images', async () => {
  const requests: string[] = [];
  const fetcher: typeof fetch = async (input) => {
    const url = String(input);
    requests.push(url);

    return Response.json({
      name: 'Dream Life NFT',
      image: `/api/nft-asset?uri=${encodeURIComponent(`ipfs://${CID}/image.png`)}`,
    });
  };

  const metadata = await parseNFTUri(`ipfs://${CID}/metadata.json`, fetcher);

  assert.equal(requests.length, 1);
  assert.equal(metadata.name, 'Dream Life NFT');
  assert.equal(
    metadata.image,
    `/api/nft-asset?uri=${encodeURIComponent(`ipfs://${CID}/image.png`)}`
  );
});

test('returns no unusable image URL when every IPFS gateway fails', async () => {
  const fetcher: typeof fetch = async () => new Response('unavailable', { status: 503 });

  const metadata = await parseNFTUri(`ipfs://${CID}/metadata.json`, fetcher);

  assert.deepEqual(metadata, {});
});

test('streams metadata updates without delaying the ledger NFT list', async () => {
  const updates: Array<{ tokenId: string; name?: string }> = [];
  const records = [
    { tokenId: 'one', uri: 'ipfs://one' },
    { tokenId: 'two' },
  ];

  const task = loadNFTMetadata(
    records,
    (tokenId, metadata) => updates.push({ tokenId, name: metadata.name }),
    async () => ({ name: 'Loaded later' })
  );

  assert.deepEqual(records, [
    { tokenId: 'one', uri: 'ipfs://one' },
    { tokenId: 'two' },
  ]);
  await task;
  assert.deepEqual(updates, [{ tokenId: 'one', name: 'Loaded later' }]);
});
