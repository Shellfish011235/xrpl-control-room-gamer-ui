import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assetProxyUrl,
  extractIPFSPath,
  fetchIPFSBytes,
  rewriteIPFSImage,
} from '../api/nftIpfs.ts';
import { getNFTMediaStatus } from '../src/services/nftMediaStatus.ts';

const CID = 'bafybeiatzdnexbgd3mf4luibmikrnmbup4enyrr44g3erl3uozunxowa34';

test('extracts safe paths from the real XRPL NFT URI formats', () => {
  assert.equal(extractIPFSPath(`ipfs://${CID}/6328.json`), `${CID}/6328.json`);
  assert.equal(
    extractIPFSPath(`https://ipfs.filebase.io/ipfs/${CID}/6328.json`),
    `${CID}/6328.json`
  );
  assert.equal(
    extractIPFSPath(`https://${CID}.ipfs.w3s.link/6328.json`),
    `${CID}/6328.json`
  );
});

test('rejects non-IPFS URLs and traversal attempts', () => {
  assert.equal(extractIPFSPath('https://example.com/private-file'), null);
  assert.equal(extractIPFSPath(`ipfs://${CID}/../secret`), null);
});

test('rewrites IPFS images to a same-origin asset URL', () => {
  const image = `ipfs://${CID}/image.png`;
  assert.equal(rewriteIPFSImage(image), assetProxyUrl(image));
  assert.equal(rewriteIPFSImage('https://images.example/nft.png'), 'https://images.example/nft.png');
});

test('times out when a gateway sends headers but stalls its response body', async () => {
  const stalledFetcher: typeof fetch = async () =>
    new Response(new ReadableStream({ start() {} }), {
      status: 200,
      headers: { 'content-type': 'image/png' },
    });

  await assert.rejects(
    fetchIPFSBytes(`ipfs://${CID}/image.png`, 1024, stalledFetcher, ['https://gateway.test/ipfs/'], 20)
  );
});

test('rejects a streamed gateway response that exceeds the byte limit', async () => {
  const oversizedFetcher: typeof fetch = async () =>
    new Response(new Uint8Array(32), {
      status: 200,
      headers: { 'content-type': 'image/png' },
    });

  await assert.rejects(
    fetchIPFSBytes(`ipfs://${CID}/image.png`, 16, oversizedFetcher, ['https://gateway.test/ipfs/'])
  );
});

test('classifies NFT media states explicitly', () => {
  assert.equal(getNFTMediaStatus({ uri: 'ipfs://cid', isLoading: true }), 'loading');
  assert.equal(getNFTMediaStatus({ uri: 'ipfs://cid', image: '/api/nft-asset' }), 'loaded');
  assert.equal(getNFTMediaStatus({ uri: 'ipfs://cid', isLoading: false }), 'unavailable');
  assert.equal(getNFTMediaStatus({}), 'no-uri');
});
