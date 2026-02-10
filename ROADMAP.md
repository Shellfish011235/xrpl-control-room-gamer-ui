# XRPL Control Room – Phased Roadmap

**Principle:** Prioritize **prototypes**, **community feedback**, and **free resources** before scaling to real transactions or users. Stay grounded in XRPL ecosystem trends, grants, and regulations.

**Regulatory stance:** We stay current on crypto, digital assets, and AI regulations (US federal/state, EU, and other key jurisdictions). See [REGULATORY-WATCH.md](./REGULATORY-WATCH.md) and [COMPLIANCE-GLOBAL-US-FLORIDA.md](./COMPLIANCE-GLOBAL-US-FLORIDA.md).

---

## Overview

| Phase | Focus | Risk level | Timeline |
|-------|--------|------------|----------|
| **1** | Simulations & paper trading (AI-driven, zero real funds) | Zero | 1–2 weeks |
| **2** | XRPL Testnet (pseudo-real on-chain, no value) | Low | 2–4 weeks |
| **3** | Compliant programmatic tools (APIs, policy engines) | Medium → controlled | 4–6 weeks |
| **4** | Funding & community validation (grants, accelerator, feedback) | Low | Ongoing from now |
| **5** | Document & audit for compliance (AI risk, explainability, audit trails) | — | Ongoing |

---

## 1. Strengthen Simulations and Paper Trading (Zero-Risk Testing)

**Why safe:** No real funds or on-chain actions—purely client-side or mock data. Prototype AI decision-making (auto-trader, whale tracking, prediction-style logic) without compliance exposure.

### Next actions

- **Expand paper trading (24 pairs):**
  - Add **AI-driven scenarios**: use Zustand/TanStack Query to simulate XRPL WebSocket-style feeds and test AI logic (e.g. Kelly Criterion for position sizing).
  - Deploy iterations to Vercel for quick testing.

- **Mock AI agents:**
  - Simple **rule-based agents** (JavaScript) that “transact” in sim mode from gamified inputs (XP, achievements).
  - Later: optional integration with open-source models (e.g. Hugging Face) for basic predictions.

### Timeline

**1–2 weeks** — iterate and push to Vercel demo.

### Resources

- **LayerAI (XRP AI Bot):** natural-language mock commands before real signing → inspiration for chat-based AI in the dashboard. [@LayerAIorg](https://x.com/LayerAIorg)
- Existing stack: Zustand, TanStack Query, Recharts (for sim viz).

### Product roadmap checkboxes (from README)

- [ ] Backtesting engine with historical data *(feeds into sim/paper)*
- [ ] Advanced order types (TWAP, iceberg) *(can be sim-first)*

---

## 2. XRPL Testnet (Pseudo-Real Transactions, Low Risk)

**Why safe:** Testnet = fake XRP, no value; no financial regs. Validates AI agent flows without production risk.

### Next actions

- **Connect UI to XRPL Testnet** via `xrpl.js` (confirm already in stack). Programmatic signing with software wallets (MPC mocks if needed; no passkeys required for this phase).
- **AI agent prototypes:** Start with **supervised agents** (human confirms via Xaman QR) for AMM deposits, pathfinding, etc. Keep agent logic in APIs (e.g. Node.js backend) to reduce injection risk (see agent security best practices; [@valhalla_dev](https://x.com/valhalla_dev)).
- **Compliance sims:** Use Underworld features to “audit” testnet txs with mock AML checks or policy engines.

### Timeline

**2–4 weeks** — aim for a **testnet demo branch** on GitHub.

### Resources

- **Ripple Wallet-as-a-Service (WaaS):** programmatic signing with policy enforcement (approvals, risk tools). [docs.ripple.com](https://docs.ripple.com) — MPC for secure keys fits AI use.
- xrpl.js testnet docs; Xaman testnet mode.

### Compliance tie-in

- No real value → no money transmission. Document that testnet is for development and demos only.

---

## 3. Compliant Programmatic Tools (Build Toward Autonomy)

**Why safe:** Use enterprise-grade APIs with built-in compliance (AML, audits) for real txs later. Avoid raw self-custody for agents to minimize MSB/KYC triggers.

### Next actions

- **Ripple Custody / Palisade (WaaS):** Explore programmatic wallet creation/signing and **policy engines** (transaction limits, counterparty checks, auto-approvals). [Ripple Wallet API docs](https://ripple.com/products/wallet/api-docs). Mock in the UI first.
- **Trust layers for agents:** Inspired by t54ai’s XRPL trust layer and [@BankXRP](https://x.com/BankXRP)—fraud checks, safety controls (rate limits, human overrides) for AI-driven payments/trades.
- **RWAs/DeFi:** If expanding to tokenized assets, lean on XRPL native primitives for safety (e.g. [@Lolipeterh](https://x.com/Lolipeterh)).

### Timeline

**4–6 weeks** — API mocks first, then sandbox access (Ripple dev environments).

### Compliance tie-in

- **EU AI Act:** Full enforcement Aug 2026; AI in finance = high-risk. Need risk assessments, transparency (explainability in UI), and oversight.
- **US (e.g. Colorado AI Act):** June 2026. Document AI decisions, risk assessments, and oversight to align early.
- See [COMPLIANCE-GLOBAL-US-FLORIDA.md](./COMPLIANCE-GLOBAL-US-FLORIDA.md) and [REGULATORY-WATCH.md](./REGULATORY-WATCH.md).

---

## 4. Funding and Community Validation (Free Support, Low Commitment)

**Why safe:** Grants = resources without equity dilution; community feedback surfaces risks early.

### Next actions

- **XRPL Grants – AI Fund:** Rolling for AI projects on XRPL (up to ~$200k, 12-month builds). Apps closed Dec 2025; reopen **Spring 2026** — monitor [xrplgrants.org](https://xrplgrants.org), [submit.xrplgrants.org](https://submit.xrplgrants.org). Prep pitch: gamified UI + AI agents (DeFi/RWA themes). Email **info@xrplgrants.org** for updates.
- **XRPL Accelerator:** Early-stage mentorship on scaling safely (global, AI-focused). [xrpl.org](https://xrpl.org).
- **Community:** Share repo/demo on X (@RippleXDev, @XRPLF), xrpl.org forums. Explore collabs (e.g. XRPL EVM perp exchanges for AI agents; [@ShaneOnChain](https://x.com/ShaneOnChain)).

### Timeline

**Now** — email for grant updates; open a GitHub issue or post for feedback.

### Resources

- **ChatXRP** (past AI grantee) — natural-language fit; [cryptopotato.com](https://cryptopotato.com).
- Japan/Korea/Brazil funds if relevant; [cryptoslate.com](https://cryptoslate.com).

---

## 5. Document and Audit for Compliance (Future-Proofing)

**Why safe:** Builds accountability; required for AI regs (audit trails, incident reporting, explainability).

### Next actions

- **Expand COMPLIANCE docs:** Add AI-specific sections (risk policy, explainability protocols). See [COMPLIANCE-GLOBAL-US-FLORIDA.md](./COMPLIANCE-GLOBAL-US-FLORIDA.md).
- **Logging:** Log all sim and testnet actions for mock audits (e.g. Recharts for viz).
- **Legal review:** Use free XRPL community resources or platforms (e.g. Legal.io) for crypto/AI advice — US GENIUS/CLARITY Acts, stablecoins, digital assets. [globallegalinsights.com](https://www.globallegalinsights.com).

### Timeline

**Ongoing** — integrate as we build.

### Resources

- **Agentic AI:** Provenance (trace decisions), permissions. [zodia-custody.com](https://zodia-custody.com).
- **EU AI Act:** High-risk fintech AI — risk assessments, transparency, audit trails by mid-2026. [nortal.com](https://www.nortal.com).
- **KYC/audit:** [kyc-chain.com](https://kyc-chain.com) for reference on audit trails and incident reporting.

---

## How This Fits the README Roadmap

- **Done:** Real-time feeds, liquidation heatmap, risk metrics, alerts, paper trading, game theory lab, Network (world map, topology, corridors), pathfinding, compliance/safety docs.
- **Next (in order):**
  1. **Phase 1 (this doc):** AI-driven paper trading + mock agents → backtesting, advanced order types (sim-first).
  2. **Phase 2:** Testnet branch + supervised agents + mock AML in Underworld.
  3. **Phase 3:** WaaS/policy mocks, trust layers, then sandbox.
  4. **Phase 4:** Grants, accelerator, community — ongoing.
  5. **Phase 5:** AI risk docs, explainability, logging — ongoing.

Still on the product list: REST API, PostgreSQL/TimescaleDB for tick data, mobile responsive. These can be scheduled after Phases 1–2 are in motion.

---

*This roadmap is for planning only. Compliance and legal obligations depend on your jurisdiction and product; see COMPLIANCE-GLOBAL-US-FLORIDA.md and consult qualified counsel.*
