/**
 * Skill: bridge-query
 * YAML-equivalent: name, description, tools, prompt.
 * Cross-chain bridge flows, XRPL ↔ EVM/Solana.
 */

export const bridgeQuerySkill = {
  name: 'bridge-query',
  description: 'Cross-chain bridge flows, XRPL ↔ EVM/Solana, volume and route queries.',
  tools: ['bridge_query', 'axelar_volume', 'evm_rpc'] as const,
  prompt: `Query bridge flows: XRPL ↔ EVM, XRPL ↔ Solana. Use bridge_query for routes, axelar_volume for 24h volume, evm_rpc for sidechain state. Output: available routes, estimated time, volume (if available), and any alerts (e.g. "Cheaper route via ILP bridge—execute?").`,
};

export default bridgeQuerySkill;
