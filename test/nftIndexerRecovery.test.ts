import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractIndexedNFTMetadata,
  fetchIndexedNFTMetadata,
} from '../src/services/nftIndexerRecovery.ts';

const tokenId = '00081D4C8837F61EECD09529A18F8E8A3D63CF6E3473ACCE07C756BD000017D9';

test('extracts artwork from an indexer page when the ledger URI is empty', () => {
  const page = '<script id="__NEXT_DATA__" type="application/json">' + JSON.stringify({
    props: { pageProps: { nft: {
      nftokenID: tokenId,
      uri: null,
      metadata: {
        name: 'Dreamers #1474',
        media: { content: 'https://cdn.example/image.webp', format: 'IMAGE' },
      },
      assets: { image: 'https://cdn.example/image.webp' },
    } } },
  }) + '</script>';

  assert.deepEqual(extractIndexedNFTMetadata(page, tokenId), {
    image: 'https://cdn.example/image.webp',
    name: 'Dreamers #1474',
    source: 'xmagnetic',
  });
});

test('does not accept an indexer result for a different token', () => {
  const page = '<script id="__NEXT_DATA__" type="application/json">' + JSON.stringify({
    props: { pageProps: { nft: { nftokenID: 'different-token', assets: { image: 'https://cdn.example/image.webp' } } } },
  }) + '</script>';

  assert.equal(extractIndexedNFTMetadata(page, tokenId), null);
});

test('fetches indexed NFT metadata through the recovery client', async () => {
  const page = '<script id="__NEXT_DATA__" type="application/json">' + JSON.stringify({
    props: { pageProps: { nft: { nftokenID: tokenId, assets: { image: 'https://cdn.example/image.webp' } } } },
  }) + '</script>';

  const result = await fetchIndexedNFTMetadata(tokenId, async () => new Response(JSON.stringify({
    image: 'https://cdn.example/image.webp',
    source: 'xmagnetic',
  })));
  assert.equal(result?.image, 'https://cdn.example/image.webp');
});
