import assert from 'node:assert/strict';
import test from 'node:test';

import { assetProxyUrl, extractIPFSPath, rewriteIPFSImage } from '../api/nftIpfs.ts';

const CID = 'bafybeiatzdnexbgd3mf4luibmikrnmbup4enyrr44g3erl3uozunxowa34';

test('extracts safe paths from the real XRPL NFT URI formats', () => {
  assert.equal(extractIPFSPath(`ipfs://${CID}/6328.json`), `${CID}/6328.json`);
  assert.equal(
    extractIPFSPath(`https://ipfs.filebase.io/ipfs/${CID}/6328.json`),
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
