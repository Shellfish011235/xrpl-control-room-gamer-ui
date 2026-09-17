import assert from 'node:assert/strict';
import test from 'node:test';

import { extractIndexedNFTMetadata } from '../src/services/nftIndexerRecovery.ts';

test('extracts artwork from nested indexer records', () => {
  const tokenId = 'A'.repeat(64);
  const html = `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
    props: {
      pageProps: {
        nft: {
          nftokenId: tokenId,
          metadata: {
            image_url: 'https://cdn.example/image.png',
            name: 'Recovered NFT',
          },
        },
      },
    },
  })}</script>`;

  assert.deepEqual(extractIndexedNFTMetadata(html, tokenId), {
    image: 'https://cdn.example/image.png',
    name: 'Recovered NFT',
    source: 'xmagnetic',
  });
});
