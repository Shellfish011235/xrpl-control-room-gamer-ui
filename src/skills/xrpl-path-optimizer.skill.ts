/**
 * Skill: xrpl-path-optimizer
 * YAML-equivalent: name, description, tools, prompt.
 * Find best XRPL route for $AMT from $SRC to $DEST; score risk/cost/speed.
 */

export const xrplPathOptimizerSkill = {
  name: 'xrpl-path-optimizer',
  description: 'Find best XRPL route for amount from source to dest, score risk/cost/speed.',
  tools: ['path_find', 'amm_info', 'bridge_query'] as const,
  prompt: `Find best XRPL route for $AMT from $SRC to $DEST. Score risk/cost/speed. Use path_find, amm_info, and bridge_query when relevant. Output: recommended path, cost (drops/fees), risk score 0-100, and ETA (ledger hops).`,
};

export default xrplPathOptimizerSkill;
