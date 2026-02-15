# Micropayments → AI Agent Payments: Feature Accuracy Report

This document states the **data source and status** of each element on the **Micropayments** page, **AI Agents** tab, so you can see what is live vs demo vs static.

---

## Page header (Micropayments)

| Element | Source | Status |
|--------|--------|--------|
| **"MAINNET LIVE - ra7Zj3GMAvuY7QEAJr1YADJ6Ss43Rxyo64"** | Hardcoded in `Micropayments.tsx`; same address as OpenClaw platform fee wallet in code. | **Static label.** Indicates the *platform/fee* wallet is on mainnet. It does **not** mean the AI Agent stats or transaction feed below are live from chain. |
| **Key stats banner** ($0.00003 fee, 100K+ TPS, 4s finality, $0.0001 min payment) | Hardcoded in `Micropayments.tsx`. | **Static / educational.** General XRPL/ILP facts, not live metrics from this app. |
| **"WHY XRPL/ILP DOMINATES MICROPAYMENTS"** (Fee ratio, Payment channels, ILP cross-currency) | Static copy in `Micropayments.tsx`. | **Static.** Informational only. |

---

## AI Agent Payments panel

| Element | Source | Status |
|--------|--------|--------|
| **"4 AGENTS ONLINE"** | Derived from `DEMO_AGENTS` in `AIAgentPayments.tsx`: 4 agents have `status: 'online'`, 1 has `status: 'busy'`. Count is `agents.filter(a => a.status === 'online').length`. | **Demo.** Agents list is the hardcoded `DEMO_AGENTS` array; not connected to any real agent or chain. |
| **"0 TRANSACTIONS"** | `transactions.length` in `AIAgentPayments.tsx`. Initially `[]`; only grows when you click **Simulate**. | **Accurate for current state.** No real on-chain tx; when simulation is off, count is correctly 0. |
| **"0.000 XRP VOLUME"** | Sum of `tx.amount` in `transactions` (in drops, then ÷ 1e6 for display). | **Accurate for current state.** No transactions ⇒ 0 volume. If you run **Simulate**, this becomes **simulated** volume only. |
| **"0ms AVG LATENCY"** | Average of `tx.latencyMs` over `transactions`. No transactions ⇒ 0. | **Accurate for current state.** No real latency measurement; when Simulate runs it’s **simulated** latency. |
| **"▷ Simulate" button** | Toggles `isSimulating`; a `setInterval` pushes fake `AgentTransaction` objects into `transactions` and updates agent `totalEarned`/`totalSpent`. | **Demo only.** Generates in-app fake traffic; no XRPL/ILP calls, no real payments. |
| **"WHY XRPL/ILP FOR AI AGENTS"** (bullets) | Static copy in `AIAgentPayments.tsx`. | **Static.** Educational. |
| **"REGISTERED AGENTS"** list (names, addresses, status, ±XRP) | `DEMO_AGENTS` in `AIAgentPayments.tsx`: fixed names, fake addresses (e.g. `rGPT5Agent1234567890`), static `totalEarned`/`totalSpent`/`callsProcessed`. When Simulate runs, these values are updated by the simulation. | **Demo.** Not real agents or real balances; addresses are placeholders. |
| **"LIVE TRANSACTION FEED"** | Renders the `transactions` array. Starts empty; fills only with **Simulate**-generated items. | **Not live.** No XRPL/ILP subscription or API. "Live" is misleading; it’s either empty or **simulated** only. |
| **"THE AI AGENT ECONOMY"** / **"WHY NOT ETHEREUM?"** | Static copy. | **Static.** Informational. |

---

## Summary

- **Actual / enabled:**  
  - The **numeric stats** (0 transactions, 0 XRP volume, 0ms latency) correctly reflect state when simulation is off.  
  - The app can be configured for mainnet (e.g. OpenClaw / fee wallet); the **"MAINNET LIVE"** line is a static mainnet label for that, not a guarantee that the AI Agent section is live.

- **Demo / simulated:**  
  - **4 AGENTS ONLINE**, **REGISTERED AGENTS** (list and ±XRP), and **Simulate**-driven stats and feed are all **demo/simulated** data. No real agent registry or on-chain AI-agent payments.

- **Static / educational:**  
  - All “Why XRPL/ILP” and “Why not Ethereum?” content and the top banner stats are **static** and describe network capabilities, not live app data.

- **Misleading label:**  
  - **"LIVE TRANSACTION FEED"** suggests real-time chain data; it is either empty or simulation-only. Renaming or labeling it as “Simulated feed” when Simulate is on would improve accuracy.

---

## Micropayment Cost Comparison (chart + table)

| Element | Source | Status / Accuracy |
|--------|--------|-------------------|
| **Payment amount selector** ($0.001–$10) | UI state in `CostComparator.tsx`. | **Interactive.** Only changes how fee % is computed from the same static fees. |
| **"XRPL PAYMENT CHANNELS WIN"** + fee vs ETH L1 | Hardcoded: XRPL channel = `$0.000001`, ETH L1 = `$0.12` in `CostComparator.tsx` and `streamingPayments.ts`. | **Static benchmarks.** Not live fees. |
| **Bar chart (Micropayment Score)** | Scores and fees from `NETWORK_COSTS` in `streamingPayments.ts`. | **Static.** Same source as table. |
| **Comparison table** (Network, Fee/Tx, Fee %, Finality, TPS, Viable?) | Full data from `NETWORK_COSTS` in `src/services/micropayments/streamingPayments.ts`. No API or live feed. | **Reference benchmarks.** See below. |
| **Viability legend** (Optimal / Viable / Not viable) | Derived from fee % &lt; 1%, &lt; 10%, &gt; 10% in component. | **Accurate** relative to the static fee data. |

**Are the numbers "true"?**

- **Spirit:** Yes. XRPL and payment channels are generally much cheaper and faster than Ethereum L1 and Bitcoin for micropayments; the ranking is correct.
- **Source:** All figures are **hardcoded** in `NETWORK_COSTS`. There is no real-time fee API (e.g. gas trackers, XRPL fee endpoint).
- **Accuracy of benchmarks:**
  - **XRPL:** ~0.00001 XRP (≈ $0.00003 at ~$3/XRP), 4s finality, ~1500 TPS — **generally accurate** as typical figures.
  - **XRPL Payment Channel:** Off-chain claims are effectively free; $0.000001 and 100K TPS are **illustrative** (design/theoretical), not measured.
  - **Ethereum L1:** $0.12 is **illustrative** (current avg ~$0.04–$0.15); L1 fees vary with congestion.
  - **Bitcoin:** $1.00 and 600s finality are **ballpark**; fees and block times vary.
  - **Solana, Polygon, Arbitrum, Lightning:** **Benchmark-style** values, not live.

**Conclusion:** The comparison is **true as reference/educational material** but uses **static benchmark data**, not live network data. The Cost Comparison UI now shows a **REFERENCE** badge to indicate benchmark data, not live feeds.

---

## File references

- `src/pages/Micropayments.tsx` – page layout, header, mainnet label, key stats banner, tabs.
- `src/components/micropayments/AIAgentPayments.tsx` – DEMO_AGENTS, stats, Simulate, REGISTERED AGENTS, LIVE TRANSACTION FEED.
- `src/components/micropayments/CostComparator.tsx` – amount selector, "XRPL PAYMENT CHANNELS WIN", bar chart, comparison table.
- `src/services/micropayments/streamingPayments.ts` – `NETWORK_COSTS` array (all fee/finality/TPS values).
