import assert from 'node:assert/strict';
import test from 'node:test';

import { mergeNFTRecords } from '../src/services/nftReconciliation.ts';

const nft = (tokenId: string, uri?: string) => ({
  tokenId,
  issuer: 'rIssuer',
  taxon: 1,
  serial: 1,
  flags: 0,
  ...(uri ? { uri } : {}),
});

test('reconciles a second NFT source without duplicating ledger records', () => {
  const result = mergeNFTRecords(
    [nft('one'), nft('two', 'ipfs://two')],
    [nft('one', 'https://indexer.example/one.json'), nft('three', 'ipfs://three')]
  );

  assert.deepEqual(result.map((value) => value.tokenId), ['one', 'two', 'three']);
  assert.equal(result[0].uri, 'https://indexer.example/one.json');
  assert.equal(result[1].uri, 'ipfs://two');
});
