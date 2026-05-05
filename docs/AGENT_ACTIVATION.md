# Agent activation (observe / analyze / simulate)

This document describes the **safe agent runtime** added under the existing **Global Agent Panel** (Track tab) and optional **Secure Agent** chat commands. It does **not** replace the Gamer UI or `agentPanelStore`.

## Operating mode

Agents are active only in:

- **Observe** — read-only context and status text  
- **Analyze** — structured findings and policy-aware summaries  
- **Recommend** — human-readable next steps  
- **Simulate** — outputs explicitly labelled as simulated / derived  

There is **no** automated execution of XRPL transactions, Xaman signing, payments, trades, bridges, swaps, offers, or custody.

## Blocked actions (global)

The policy layer (`src/agents/policy.ts`) treats these as **always blocked** for agent logic:

- `sign_transaction`  
- `send_payment`  
- `place_order`  
- `bridge_assets`  
- `swap_assets`  
- `custody_assets`  
- `request_private_key`  
- `export_secret`  
- `bypass_policy`  

Every agent in `src/agents/agentRegistry.ts` includes at least the universal subset (`request_private_key`, `export_secret`, `bypass_policy`). Liquidity- and payment-surface agents also list the full financial block set.

## Capabilities

Capabilities are declared on each agent (`AgentCapability` in `src/agents/types.ts`). Examples:

- Read-only: `read_xrpl_network`, `read_xrpl_wallet`, `read_xrpl_liquidity`, `read_validator_data`, `read_ilp_endpoint_health`, `read_rafiki_telemetry`  
- Analysis: `analyze_compliance`, `analyze_security`  
- Simulation: `simulate_route`, `simulate_trade`  
- Records: `create_receipt`, `prepare_user_action` (draft / packet only — **not** execution)  

`prepare_user_action` is allowed only as **non-executing** drafts (e.g. grant packet outline).

## Data sources (current vs next)

| Area | Current | Next live-data steps |
|------|---------|----------------------|
| XRPL network | Client + public WS URLs in app | Tie `network_health_check` to live ping / ledger close metrics |
| Wallet | `target` on task + wallet store address | `account_info`, `account_lines` read-only in task engine |
| Liquidity | Adapters referenced in copy | Wire `book_offers` / AMM read paths into findings |
| ILP | `ilpOperatorRealtimeConfig`, health adapters | Real Rafiki / OP probe results into `ilp_endpoint_check` |
| Compliance / security | Store + rules + prompt firewall | Deeper jurisdiction scoring; log correlation |

## Where to use it in the UI

1. **Global agent FAB** → **Track** tab → **Agent runtime** card (`AgentRuntimeStatus`).  
   Quick buttons: Network check, ILP check, Compliance, Security, Grant readiness.  
2. **Secure Agent chat** (optional): slash-style **observe-only** commands (no wallet required):  
   - `/network-check`  
   - `/ilp-check`  
   - `/compliance` or `/compliance-review`  
   - `/security` or `/security-review`  
   - `/route-sim` or `/route-simulation`  

Each run creates **findings**, **recommendations**, and a **local receipt** (input/output hashes).

## Receipts

`src/agents/agentReceiptEngine.ts` builds `AgentReceipt` rows with:

- Deterministic **local** hashes (`createSimpleHash`) — not cryptographic proofs  
- `policyResult` / `securityResult` for audit display  
- Links to `taskId` and `agentIds`  

Receipts accumulate in `agentRuntimeStore` and are shown in the runtime status card (latest hash). They complement (do not replace) Agent Economy receipt tabs.

## How to add a new agent

1. Add a row to `AGENT_REGISTRY` in `src/agents/agentRegistry.ts` with `id`, `name`, `capabilities`, `blockedActions`, `dataSources`, `riskLevel`.  
2. Ensure **blocked** lists include at least `request_private_key`, `export_secret`, `bypass_policy`.  
3. If the agent touches liquidity or payments context, also include the financial block list (`FINANCIAL_BLOCKED`).  
4. Optionally map the agent as `PRIMARY_AGENT_FOR_TASK` in `src/agents/agentTaskEngine.ts` for a task type.

## How to add a new task type

1. Extend `AgentTaskType` in `src/agents/types.ts`.  
2. Add a `PRIMARY_AGENT_FOR_TASK` mapping in `src/agents/agentTaskEngine.ts`.  
3. Implement a `switch` branch in `runAgentTask()` with at least one finding and one recommendation, and set `policyResult` / `securityResult` / `summary` appropriately.  
4. Wire UI: add a button in `AgentRuntimeStatus.tsx` and/or a chat command in `SecureAgentPanel.tsx`.  
5. Extend `runQuickTask` title/description maps in `src/store/agentRuntimeStore.ts`.

## Store API (`agentRuntimeStore`)

- `initializeAgents()` — reset roster from registry  
- `enqueueTask(partial)` — queue a task, returns `taskId`  
- `runTask(taskId)` — run engine, append results  
- `runQuickTask(type, target?)` — enqueue + run in one call  
- `setAgentStatus(agentId, status)` — manual status override  
- `clearAgentRuntime()` — clear tasks/results and reload agents  

## Files

| File | Role |
|------|------|
| `src/agents/types.ts` | Shared types |
| `src/agents/agentRegistry.ts` | Agent definitions |
| `src/agents/policy.ts` | Block / capability helpers |
| `src/agents/agentReceiptEngine.ts` | Local receipt + hash |
| `src/agents/agentTaskEngine.ts` | In-browser task runner |
| `src/store/agentRuntimeStore.ts` | Zustand runtime state |
| `src/components/agents/AgentRuntimeStatus.tsx` | Track tab UI |
| `src/components/AgentEconomyDrawerContent.tsx` | Embeds runtime status |

This layer is the **foundation** for plugging in real XRPL / ILP / Rafiki reads next, while keeping execution strictly user-driven outside the agent runtime.
