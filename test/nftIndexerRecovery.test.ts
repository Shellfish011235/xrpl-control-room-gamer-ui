import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractIndexedNFTMetadata,
  fetchIndexedNFTMetadata,
} from '../src/services/nftIndexerRecovery.ts';
import {
  getVerifiedNFTRecovery,
  getVerifiedNFTRecoveryCount,
} from '../src/data/nftRecoveryRegistry.ts';

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
  const result = await fetchIndexedNFTMetadata(tokenId, async () => new Response(JSON.stringify({
    image: 'https://cdn.example/image.webp',
    source: 'xmagnetic',
  })));
  assert.equal(result?.image, 'https://cdn.example/image.webp');
});

test('preserves recovery source provenance from the API', async () => {
  const result = await fetchIndexedNFTMetadata(tokenId, async () => new Response(JSON.stringify({
    image: 'https://cdn.example/recovered.webp',
    source: 'verified-registry',
  })));

  assert.equal(result?.source, 'verified-registry');
});
    
test('extracts artwork from nested indexer records', () => {
  const nestedTokenId = 'A'.repeat(64);
  const html = '<script id="__NEXT_DATA__" type="application/json">' + JSON.stringify({
    props: { pageProps: { nft: {
      nftokenId: nestedTokenId,
      metadata: { image_url: 'https://cdn.example/image.png', name: 'Recovered NFT' },
    } } },
  }) + '</script>';

  assert.deepEqual(extractIndexedNFTMetadata(html, nestedTokenId), {
    image: 'https://cdn.example/image.png',
    name: 'Recovered NFT',
    source: 'xmagnetic',
  });
});

test('prefers an indexer retained asset over a dead original metadata URL', () => {
  const html = '<script id="__NEXT_DATA__" type="application/json">' + JSON.stringify({
    props: { pageProps: { nft: {
      nftokenID: tokenId,
      metadata: {
        name: 'Agent #1340',
        media: { content: 'https://ipfs.io/ipfs/dead-original', format: 'IMAGE' },
      },
      assets: { image: 'https://cdn.xmagnetic.org/image/recovered-copy' },
    } } },
  }) + '</script>';

  assert.deepEqual(extractIndexedNFTMetadata(html, tokenId), {
    image: '/api/nft-image?url=https%3A%2F%2Fcdn.xmagnetic.org%2Fimage%2Frecovered-copy',
    name: 'Agent #1340',
    source: 'xmagnetic',
  });
});

test('ignores unrelated URLs in an indexer assets object', () => {
  const html = '<script id="__NEXT_DATA__" type="application/json">' + JSON.stringify({
    props: { pageProps: { nft: {
      nftokenID: tokenId,
      assets: { website: 'https://malicious.example/not-artwork' },
      metadata: { image: 'https://cdn.example/actual-artwork.png' },
    } } },
  }) + '</script>';

  assert.equal(
    extractIndexedNFTMetadata(html, tokenId)?.image,
    'https://cdn.example/actual-artwork.png',
  );
});

test('falls through an empty assets object to the metadata image', () => {
  const html = '<script id="__NEXT_DATA__" type="application/json">' + JSON.stringify({
    props: { pageProps: { nft: {
      nftokenID: tokenId,
      assets: {},
      metadata: { image: 'https://cdn.example/actual-artwork.png' },
    } } },
  }) + '</script>';

  assert.equal(
    extractIndexedNFTMetadata(html, tokenId)?.image,
    'https://cdn.example/actual-artwork.png',
  );
});

test('returns a verified recovery for an NFT with no on-ledger URI', () => {
  const recovered = getVerifiedNFTRecovery(
    '00081D4C8837F61EECD09529A18F8E8A3D63CF6E3473ACCE07C756BD000017D9',
  );

  assert.deepEqual(recovered, {
    image: 'https://cdn.xmagnetic.org/image/QmWemidzgVmNHz4MUEdn4ZTQvg6rGbVjxkR4PseUBtbUeD',
    name: 'Dreamers #1474',
    source: 'verified-registry',
    evidenceUrl: 'https://xmagnetic.org/nfts/asset/00081D4C8837F61EECD09529A18F8E8A3D63CF6E3473ACCE07C756BD000017D9',
    verifiedAt: '2026-09-17',
  });
});

test('never guesses a registry recovery for an unknown token', () => {
  assert.equal(getVerifiedNFTRecovery('F'.repeat(64)), null);
});

test('contains all 13 audited recovery records', () => {
  const expectedTokenIds = [
    '000822B03EA060FD1026C04B2D390CC132D07D600DA9B0825020438E000005F4',
    '00080BB89D1CA3B74D2A7A20C5471DF10978F6ED0FD976B306D1300E000000A8',
    '00080BB89D1CA3B74D2A7A20C5471DF10978F6ED0FD976B31DB70109000000A9',
    '0008177087D408DB95FAF41FF9AA29BB53EBCE2BFF08242C93F84F2200001D76',
    '00081B584DE1028403A87660AF70552CDC4021196CE7AC1FBCFC4483000001E9',
    '00081D4C04A1A273DC40150088722A58A47390DF7C5CBB6C3D48D7150000010F',
    '0008271003D1E3A4BF9BD5C0A9BBFA392D2C7CBD96D60A491C9554AF00001A62',
    '0008271003D1E3A4BF9BD5C0A9BBFA392D2C7CBD96D60A49266FB44800000C7F',
    '00081B582517D7DE96BBC2F9B557B1681E82DA739BDA7BD14E7610D000000360',
    '00081D4C8837F61EECD09529A18F8E8A3D63CF6E3473ACCE07C756BD000017D9',
    '00081D4C8837F61EECD09529A18F8E8A3D63CF6E3473ACCE2143D2F900001F95',
    '00081D4C8837F61EECD09529A18F8E8A3D63CF6E3473ACCE49E7CF92000009C0',
    '00081D4C8837F61EECD09529A18F8E8A3D63CF6E3473ACCEC632930600001234',
  ];

  assert.equal(getVerifiedNFTRecoveryCount(), expectedTokenIds.length);
  for (const expectedTokenId of expectedTokenIds) {
    assert.ok(getVerifiedNFTRecovery(expectedTokenId), `missing ${expectedTokenId}`);
  }
});
