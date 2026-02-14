# Agent economy until XRPL Batch: Xahau and what we do today

Until the XRPL **Batch amendment (XLS-56)** ships on mainnet, every on-ledger Payment needs a separate user signature. That makes high-frequency agent payments tedious. This doc outlines how to put the **Clawbot / agentic economy to work anyway**: using **Xahau** for autonomous micropayments, and what we use on mainnet in the meantime.

---

## The problem

- **XRPL mainnet today**: One Payment = one sign in Xaman. Stream now = N payments = N signs.
- **XRPL Batch (XLS-56)**: When it goes live, one sign could submit many transactions atomically. We’re waiting on that.
- **Goal**: Let the agent economy run (many small payments) without the user signing every single tx.

---

## Yes: it can be done through the Xahau network

**Xahau** is an XRPL sidechain with **Hooks**: small WebAssembly programs on accounts. The important feature for the agent economy is **emitted transactions**.

- **Emitted transactions**: A Hook can **create and submit transactions** that are not signed by the user. They use an `EmitDetails` block instead of a signature. So the Hook runs on the user’s account and can **send many Payments** (or other tx types) on their behalf, within whatever rules the Hook encodes.
- **Flow**:
  1. User **signs once** (or rarely): create/fund a Xahau account, install a Hook, and optionally set params (e.g. max per payment, daily cap, whitelisted recipients).
  2. The **Hook** holds or has access to funds (XAH, Xahau’s native asset).
  3. When the **agent / Clawbot** (or any authorized caller) sends a valid request (e.g. signed intent, API call with proof), the Hook checks the rules and, if allowed, **emits** a Payment. No user signature for that Payment.
  4. Repeat for many micropayments: one sign to set up and fund, then the Hook + agent do the rest.

So the **Clawbot agentic economy** can run on Xahau with **far fewer signatures**: setup and top-ups only, not per payment.

**References:**

- [Emitted Transactions | Xahau](https://docs.xahau.network/concepts/emitted-transactions) — Hooks can autonomously initiate transactions; no signature, use `EmitDetails`.
- [Hooks | Xahau](https://xahau.network/docs/hooks/) — Hooks as Wasm modules, blocking/allowing and initiating txs.
- [emit | Xahau](https://docs.xahau.network/technical/hooks-functions/emitted-transaction/emit-1) — Hook API to emit a tx.

---

## Flare and others: same or better for XRPL?

Other networks in or around the XRPL ecosystem can also support “one sign → many actions” for the agent economy. They use different models than Xahau.

### Flare Network

- **Relationship to XRPL**: Flare is a separate L1. XRP is bridged as **FXRP** (FAssets) for use in Flare DeFi. So value is “XRP over there,” not native XRPL.
- **Smart Accounts**: XRPL users can trigger Flare actions **without holding FLR**. You send **one XRPL Payment** with instructions in the **memo**. An operator/executor reads it via the Flare Data Connector and runs the corresponding smart contract on Flare (e.g. mint FXRP, transfer, call contract). So **one XRPL sign** = one instruction package that executes on Flare; the contract can then do many internal operations (transfers, swaps, etc.).
- **For the agent economy**: One XRPL Payment (memo = “allow agent to spend up to X” or “execute batch Y”) → executor runs Flare contract → contract can disburse many micropayments in FXRP/FLR. So Flare **does the same kind of thing**: one sign on XRPL, then execution (and many payouts) happens on Flare. **Trade-off**: You’re on Flare (FXRP, FLR), not native XRPL/XAH; you depend on FAssets bridge and executors.

**References:** [Flare Smart Accounts](https://dev.flare.network/smart-accounts/overview), [FAssets / FXRP](https://flare.network/news/fassets-fxrp-is-live-on-mainnet), [XRPFi strategy](https://flare.network/news/flares-xrpfi-long-term-strategy-programmable-financial-infrastructure).

### XRPL EVM Sidechain

- **What it is**: EVM-compatible sidechain; XRP as gas; bridged via **Axelar** (and others). Full Solidity smart contracts.
- **For the agent economy**: You get EVM patterns: allowances, batch transfers, meta-transactions, etc. A contract can hold or receive XRP (wrapped/bridged) and do many transfers in one or few txs. So “same or better” in the sense of **flexibility** (full EVM tooling); different **stack** (EVM, bridges, gas in XRP). Good if you want maximum DeFi/composability and are okay with a separate chain and bridge.

**References:** [XRPL EVM Sidechain](https://www.xrplevm.org/), [Axelar + XRPL](https://ripple.com/insights/xrpl-evm-sidechain-enhancing-interoperability-with-axelar-bridge).

### Xahau vs Flare vs XRPL EVM (for “one sign, many payments”)

| | Xahau | Flare | XRPL EVM Sidechain |
|--|--------|--------|---------------------|
| **Same family as XRPL** | Yes (sidechain, same codebase lineage) | No (separate L1) | Sidechain, but EVM (different VM) |
| **Native asset** | XAH | FLR; XRP as FXRP | XRP (gas) |
| **One sign → many actions** | Yes (Hook emits txs; no signature per emit) | Yes (one XRPL Payment + memo → executor runs contract; contract does many ops) | Yes (EVM contracts, allowances, batch) |
| **Where execution runs** | On Xahau (Hook on account) | On Flare (smart contract) | On EVM sidechain (contract) |
| **Best for XRPL-native feel** | Highest (same ledger model, Hooks) | Medium (XRPL as trigger; value on Flare) | Medium (XRPL gas, but EVM model) |
| **Maturity / docs** | Hooks + emitted txs documented | FAssets + Smart Accounts live | EVM sidechain + Axelar live |

**Summary:** Flare and the XRPL EVM sidechain **do the same or more** for “one sign, many payments” and agent-style flows. Flare does it via one XRPL Payment with a memo and execution on Flare; XRPL EVM does it via full EVM contracts. For **staying closest to XRPL** (same ledger model, native sidechain, no bridge for the “execution chain”), **Xahau** is the tightest fit. For **maximum DeFi and ecosystem**, Flare (FXRP, Smart Accounts) and XRPL EVM (full EVM) are strong alternatives.

---

## From our network topology: which connectors, bridges, and sidechains allow this?

The app’s **Network** page and topology data (`src/data/corridorData.ts`, `ilpData.ts`) already list chains, bridges, and ILP connectors. Here’s how they map to “agent economy with fewer signs” and micropayment flows.

### Sidechains / chains in our topology that allow it

| Chain (from `xrplConnectedChains`) | Bridge from XRPL (from `crossChainBridges`) | How they allow it |
|-----------------------------------|---------------------------------------------|-------------------|
| **Xahau** | Xahau Burn2Mint | **Hooks + emitted transactions**: one sign to fund Hook account, then Hook emits many Payments. No signature per payment. |
| **Flare Network** | Flare FAssets | **Smart Accounts**: one XRPL Payment with memo → executor runs Flare contract; contract can do many FXRP/FLR transfers. |
| **XRPL EVM Sidechain** | XRPL EVM Bridge | **Full EVM**: Solidity contracts, allowances, batch transfers, meta-txs. Bridge XRP in, then contract does many payouts. |
| **Coreum** | Coreum-XRPL Bridge | **CosmWasm smart contracts**: batch/allowance patterns on Coreum; bridge XRP/CORE. Same idea as EVM, different VM. |
| **The Root Network** | Root Network XRP Bridge | **Substrate + EVM**: gaming/metaverse chain; smart contract patterns possible for batch/agent flows. |
| **Evernode** | (XRPL Hooks integration) | **HotPocket smart contracts** + EVR; decentralized hosting. Less documented for “emit many payments” but programmable. |
| **Songbird** | (Flare canary) | Flare’s canary; same Smart Account / FAssets ideas for testing. |

So from **our topology maps**, the chains that **do** allow “one sign → many actions” (or equivalent) are: **Xahau**, **Flare**, **XRPL EVM Sidechain**, **Coreum**, and in principle **Root Network** and **Evernode**. The bridges that get you there from XRPL are in the table above.

### Bridges and connectors (what they add)

- **Bridges** (Squid, Axelar, Wormhole, Flare FAssets, Xahau Burn2Mint, Coreum-XRPL, Root XRP Bridge, etc.) move value **to** those chains. They don’t by themselves reduce signing on XRPL; they’re the **on-ramp** to the chain where you then run Hook/contract logic.
- **ILP connectors** (e.g. Rafiki in `ilpData.ts`) are for **micropayment routing** across ledgers (SPSP, Open Payments, streaming). They enable **flows** of small payments across networks; they don’t give you “one sign, N payments” on a single ledger. So: use ILP for **routing** micropayments; use Xahau/Flare/EVM sidechain for **execution** with fewer signs.

### Summary table (from our data)

| Item in topology | Type | Allows agent economy / low-sign? |
|------------------|------|-----------------------------------|
| Xahau | Chain | ✅ Yes (Hooks emitted txs) |
| Flare Network | Chain | ✅ Yes (Smart Accounts + memo) |
| XRPL EVM Sidechain | Chain | ✅ Yes (EVM contracts) |
| Coreum | Chain | ✅ Yes (CosmWasm contracts) |
| The Root Network | Chain | ✅ In principle (smart contracts) |
| Evernode | Chain | ✅ In principle (HotPocket) |
| Songbird | Chain | ✅ Same model as Flare (canary) |
| Xahau Burn2Mint | Bridge | On-ramp to Xahau |
| Flare FAssets | Bridge | On-ramp to Flare (FXRP) |
| XRPL EVM Bridge | Bridge | On-ramp to XRPL EVM |
| Coreum-XRPL Bridge | Bridge | On-ramp to Coreum |
| Axelar / Squid / Wormhole | Bridge | Connect XRPL EVM (and others) to 40+ chains |
| Rafiki / ILP connectors | Connector | Micropayment **routing** (streaming); not “one sign N txs” on one ledger |

So: **yes**, several of the **connectors, bridges, and sidechains** in our network topology **do** allow the same or better (Flare, XRPL EVM, Coreum, Root, Evernode, Songbird). Xahau is the only one in the map with **native emitted transactions** (no signature per tx); the others use smart contracts on their own chain after you bridge.

---

## What we do on mainnet until Batch (and until we support Xahau)

| Approach | Where in app | Signing | Use when |
|----------|----------------|--------|----------|
| **Stream now** | Agent panel → Streams | One sign per payment | You’re okay signing each one; want a timed sequence (e.g. 5 × 0.1 XRP). |
| **Payment channels** | Agent panel → Streams | One sign to create (and to fund); claims need key | Same recipient, many future payments; we have create/list; full claim flow still needs key/signing. |
| **Quick send / Chat** | Agent panel → Chat | One sign per payment | Single payments, invoices. |
| **Track (caps & receipts)** | Agent panel → Track | N/A | Stay in control; caps limit how much the agent can ask you to sign. |
| **CARV batch** | CARV flow | Per PIE today; attestation is batched | Proof/audit batching; doesn’t reduce XRPL signs yet. |

So today we **don’t** avoid the “one sign per Payment” on mainnet; we **do** make it manageable with Stream now (sequential payments), channels (create once, pay one recipient many times later), and clear UX/copy that batch is coming.

---

## Putting it together: Clawbot agentic economy “until then”

1. **On XRPL mainnet (today)**  
   - Use **Stream now** when you want multiple payments in a row (accept N signs).  
   - Use **channels** where one recipient gets many payments (one sign to create; claiming still limited in our app).  
   - Use **Track** for caps and receipts so the agent economy is visible and bounded.  
   - Set expectations: “Batch (one sign for many txs) is coming; until then, each payment = one approval.”

2. **On Xahau (path to less signing)**  
   - Design or use a **Hook** that:  
     - Holds or is funded with XAH.  
     - Accepts authorized requests (e.g. from OpenClaw/Clawbot or your agent backend).  
     - Enforces rules (max amount, caps, whitelist).  
     - **Emits** Payment transactions for each valid request.  
   - User signs **once** (or rarely) to fund and configure; the Hook + agent do the rest.  
   - When we’re ready, the app can: link to Xahau docs, support a Xahau wallet (e.g. for funding the Hook), or integrate a “Xahau agent account” flow.

3. **When XRPL Batch (XLS-56) is live**  
   - We can support **batch submission** on mainnet: one sign for many Payments.  
   - That will complement (not replace) the Xahau path: mainnet for batch, Xahau for Hook-driven autonomous flows.

---

## Summary

- **Can the Clawbot agentic economy work without tedious transaction signing?**  
  - **On mainnet today**: Only by using Stream now / channels and accepting one sign per payment (and documenting that batch is coming).  
  - **On Xahau**: **Yes.** Hooks + emitted transactions let one (or few) user signatures fund and set rules, then the Hook emits many micropayments for the agent/Clawbot.  
- **Next steps**: Document Xahau in the app (e.g. Learn or a “Future” section), and when ready, add Xahau wallet/Hook flows so users can “put the clawbot agentic economy to work” there with minimal signing.
