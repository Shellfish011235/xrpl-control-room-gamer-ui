export interface VerifiedNFTRecovery {
  image: string;
  name: string;
  source: 'verified-registry';
  evidenceUrl: string;
  verifiedAt: string;
}

const VERIFIED_AT = '2026-09-17';
const XMAGNETIC_ASSET = 'https://xmagnetic.org/nfts/asset/';

function recovery(tokenId: string, name: string, image: string): readonly [string, VerifiedNFTRecovery] {
  return [tokenId, {
    image,
    name,
    source: 'verified-registry',
    evidenceUrl: `${XMAGNETIC_ASSET}${tokenId}`,
    verifiedAt: VERIFIED_AT,
  }];
}

/**
 * Exact NFTokenID overrides for media retained by a public XRPL indexer when
 * the ledger URI is absent or its original storage URL no longer resolves.
 * Entries are never inferred by issuer, taxon, or serial number.
 */
const VERIFIED_NFT_RECOVERIES = new Map<string, VerifiedNFTRecovery>([
  recovery(
    '000822B03EA060FD1026C04B2D390CC132D07D600DA9B0825020438E000005F4',
    'Agent #1340',
    'https://cdn.xmagnetic.org/image/QmdR9vcWtdGNdEny7DAC64GZpsx9pnidyXwm4UEWGpYJ4o',
  ),
  recovery(
    '00080BB89D1CA3B74D2A7A20C5471DF10978F6ED0FD976B306D1300E000000A8',
    'Workstation #4',
    'https://cdn.xmagnetic.org/image?url=https%3A%2F%2Farweave.net%2Fg0HUfbAlU9A14-jYhMRZq7_mf1xi7ovoiLW-LDFgzL4%2FWorkstation_4.png',
  ),
  recovery(
    '00080BB89D1CA3B74D2A7A20C5471DF10978F6ED0FD976B31DB70109000000A9',
    'Workstation #8',
    'https://cdn.xmagnetic.org/image?url=https%3A%2F%2Farweave.net%2Fg0HUfbAlU9A14-jYhMRZq7_mf1xi7ovoiLW-LDFgzL4%2FWorkstation_8.png',
  ),
  recovery(
    '0008177087D408DB95FAF41FF9AA29BB53EBCE2BFF08242C93F84F2200001D76',
    'Doodlepunkx #7569',
    'https://cdn.xmagnetic.org/image/QmPaXnTZDMtudnhrYY6Amsq7Vn7XTNaGLCG5hNn3hYjW6d',
  ),
  recovery(
    '00081B584DE1028403A87660AF70552CDC4021196CE7AC1FBCFC4483000001E9',
    'Veronicas #2043',
    'https://cdn.xmagnetic.org/image/QmVqhbL5Wij2vsy4GVrhb5hdJD6YQkB3QRPSas7RUHkXdK',
  ),
  recovery(
    '00081D4C04A1A273DC40150088722A58A47390DF7C5CBB6C3D48D7150000010F',
    'Revellers #805',
    'https://cdn.xmagnetic.org/image/QmXNBLXqqK747wTb22Kd7r9ic5b1W3Yktbd3bADcgP5RYU',
  ),
  recovery(
    '0008271003D1E3A4BF9BD5C0A9BBFA392D2C7CBD96D60A491C9554AF00001A62',
    'Mutant Apes XRP. #7778',
    'https://cdn.xmagnetic.org/image/QmZE2Wt23QGk1GchLPaHPLTgkY7LEZC34eSqvH6FoFb2Us',
  ),
  recovery(
    '0008271003D1E3A4BF9BD5C0A9BBFA392D2C7CBD96D60A49266FB44800000C7F',
    'Mutant Apes XRP. #6901',
    'https://cdn.xmagnetic.org/image/QmdMUBKhyqJyL2u7Xy9d56fndJzdn75SaPUB3b74JkUbiN',
  ),
  recovery(
    '00081B582517D7DE96BBC2F9B557B1681E82DA739BDA7BD14E7610D000000360',
    'Revive Anime #9144',
    'https://cdn.xmagnetic.org/image/QmbRetGE8Kv8bdokQDKaqcCNu8xiSuD4Q3soH7MRnN5Pwa',
  ),
  recovery(
    '00081D4C8837F61EECD09529A18F8E8A3D63CF6E3473ACCE07C756BD000017D9',
    'Dreamers #1474',
    'https://cdn.xmagnetic.org/image/QmWemidzgVmNHz4MUEdn4ZTQvg6rGbVjxkR4PseUBtbUeD',
  ),
  recovery(
    '00081D4C8837F61EECD09529A18F8E8A3D63CF6E3473ACCE2143D2F900001F95',
    'Dreamers #638',
    'https://cdn.xmagnetic.org/image/QmUzCc8DPeQtQ9QBYGFz3NrgQgE7L77coqNKanivgdMyqg',
  ),
  recovery(
    '00081D4C8837F61EECD09529A18F8E8A3D63CF6E3473ACCE49E7CF92000009C0',
    'Dreamers #9292',
    'https://cdn.xmagnetic.org/image/QmbCMprX7LHJgG5cw1b8nJeczBjL1c98oHGcFLqhfM2UQX',
  ),
  recovery(
    '00081D4C8837F61EECD09529A18F8E8A3D63CF6E3473ACCEC632930600001234',
    'Dreamers #4954',
    'https://cdn.xmagnetic.org/image/QmSmk93kpWHuWm8NKN2hDiuW2drCcPDLnP6i4QZiC1jvyL',
  ),
]);

export function getVerifiedNFTRecovery(tokenId: string): VerifiedNFTRecovery | null {
  const normalized = tokenId.trim().toUpperCase();
  if (!/^[A-F0-9]{64}$/.test(normalized)) return null;
  return VERIFIED_NFT_RECOVERIES.get(normalized) ?? null;
}

export function getVerifiedNFTRecoveryCount(): number {
  return VERIFIED_NFT_RECOVERIES.size;
}
