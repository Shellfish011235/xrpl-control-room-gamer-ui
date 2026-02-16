# Modular Skills (OpenClaw-style)

Each skill is defined in a `*.skill.ts` file and optionally documented with YAML in comments.

## Format (YAML equivalent)

```yaml
name: xrpl-path-optimizer
description: Find best XRPL route for amount from source to dest, score risk/cost/speed.
tools: [path_find, amm_info, bridge_query]
prompt: "Find best XRPL route for $AMT from $SRC to $DEST, score risk/cost/speed."
```

## Loaded skills

- **xrpl-path-optimizer** – Path find, AMM info, bridge query for route optimization.
- **nft-raider** – account_nfts, floor, mint/offer for XLS-20.
- **bridge-query** – Bridge flows XRPL ↔ EVM/Solana.

Agents auto-load these via `src/skills/index.ts` and the orchestrator registry (`src/agents/skills/registry.ts`).
