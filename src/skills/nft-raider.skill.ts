/**
 * Skill: nft-raider
 * YAML-equivalent: name, description, tools, prompt.
 * XRPL NFT discovery, floor prices, mint/offer suggestions.
 */

export const nftRaiderSkill = {
  name: 'nft-raider',
  description: 'XRPL NFT discovery, floor prices, mint/offer suggestions.',
  tools: ['account_nfts', 'nft_floor', 'nftoken_mint', 'nftoken_create_offer'] as const,
  prompt: `Analyze XRPL NFTs: collections (taxon/issuer), floor prices, and suggest mint or sell/buy offers. Use account_nfts, nft_floor when available; nftoken_mint and nftoken_create_offer for actions. Output: summary, floor if known, and suggested next step (e.g. "Mint with URI" or "Create sell offer at X XRP").`,
};

export default nftRaiderSkill;
