# C2V Evolution Roadmap – Verifiable AI Payment Rail

**Cognition-to-Value (C2V)** evolves the current CARV/ILP/OODA stack with independent verifiers, ZK attestation, and adaptive governance. This doc maps the four-phase plan to existing code and new modules.

---

## Current State (Baseline)

| Component | Location | Role |
|-----------|----------|------|
| **PIE** | `src/services/carv/types.ts`, `pieGenerator.ts` | Payment Intent Envelope: constraints (max_fee, slippage_bps), proofs (hashes), status flow |
| **Validation** | `src/services/carv/intentValidator.ts`, `regimeEngine.ts` | Single + aggregate validation; regime rules (block/warn/flag) |
| **Orchestra** | `src/orchestra/validate.ts`, `orchestra.ts` | `validateIntent()` for agent intents; ValidatorAgent batch |
| **OODA / Feynman** | `src/services/ilp/types.ts`, `topology.ts`, `ilpStore.ts` | OODA loop for ILP topology; FeynmanSummary (summary, complexity); LEAR invariants |
| **Routing** | `src/services/carv/pathfinder.ts`, `venueRouter.ts`, `xrplConnector.ts` | Pathfinding, venue selection, XRPL execution |

**Gap:** LLM/rule-based flow without independent cross-validation; no ZK proofs; no formal FEYNMAN explain → test/reject pipeline; no governance layer.

---

## Phase 1: Strengthen Early Gates (FEYNMAN & PIE)

**Goal:** Reduce single-point failure and hallucination bypass by layering non-LLM verifiers. Target: &lt;100ms overhead, 50% reduction in hallucination bypass (internal benchmarks).

### 1.1 FEYNMAN – Explain + Guard Rails + Symbolic Checks

| Deliverable | Path | Description |
|-------------|------|-------------|
| **Structured explain** | `src/c2v/feynman/explain.ts` | Output structured JSON with verifiable claims (e.g. `claims: { amountWithinCap, routeValid, regimeHashPresent }`). Pipe to ensemble voter. |
| **Guard rails** | `src/c2v/feynman/guardrails.ts` | Inference-time rails (NeMo Guardrails–style): policy rules that flag inconsistencies in explanations without full LLM re-reasoning. |
| **Symbolic validation** | `src/c2v/feynman/symbolic.ts` | Rule-based / Z3-style checks for `test.ts` / `reject.ts`: verify explanation logic against formal specs (e.g. `amount ≤ maxBounds`, `slippage_bps ≤ 10000`). |
| **Ensemble voter** | `src/c2v/feynman/ensemble.ts` | 2–3 diverse models (e.g. Hugging Face integrations); majority vote on accept/reject. |

**Integration:**  
- Feed FEYNMAN output into existing ILP `FeynmanSummary` and/or CARV plan display.  
- Run guardrails + symbolic **before** marking PIE as `validated` in `intentValidator` / `regimeEngine`.

**Testing:** Red-teaming with Garak-style datasets; measure hallucination bypass rate before/after.

### 1.2 PIE Bounds – Lightweight Counter-Check

| Deliverable | Path | Description |
|-------------|------|-------------|
| **Bounds verifier** | `src/c2v/feynman/pieBoundsVerifier.ts` | Fine-tuned smaller model (e.g. distilled Llama) or rule engine to counter-check `maxSlippage`, `riskFlags`, `max_fee` coherence. &lt;100ms. |

**Integration:** Call from `pieGenerator` or `intentValidator` after LLM/rule PIE construction; reject or flag if verifier disagrees.

---

## Phase 2: CAR with Verifiable Proofs and Ledger Support

**Goal:** Make attestation provably compliant (ZK); add runtime monitoring and circuit breakers. CAR = Compute → Validate → Attest → Route.

### 2.1 CAR Module Layout

| File | Role |
|------|------|
| `src/c2v/car/compute.ts` | Pathfinding / route computation. Target: zkVM integration to prove optimal route without exposing full logic. |
| `src/c2v/car/validate.ts` | Validation + **anomaly detection** (e.g. fee spike, repeated route failures). **Circuit breaker:** auto-pause + human alert on threshold. |
| `src/c2v/car/attest.ts` | **ZK attestation:** generate zk-SNARKs (e.g. circom-ts) to prove PIE compliance (e.g. `amount ≤ maxBounds`, `route valid per ledger state`) without revealing cognition details. Enables verifiable audits and multi-chain portability. |

**Formal spec:** `docs/invariants.md` – CAR invariants as formal schema for community audits (aligned with zkML/verifiable AI trends).

### 2.2 Integration

- **Current:** CARV uses `intentValidator` → `regimeEngine` → pathfinder → xrplConnector.  
- **Evolved:** Insert `car/validate` (with anomaly + circuit breaker) and `car/attest` (ZK proof) between validation and routing. Attestation batch can carry ZK proof root.
- **Multi-chain:** ZK-verified intents portable to EVM/Solana via ZK bridges (future).

---

## Phase 3: Human Fatigue and Adaptive Governance

**Goal:** Keep human-override as strongest invariant; make reviews sustainable and reduce single-LLM dependency.

### 3.1 Behavioral Anomaly Escalation

| Deliverable | Path | Description |
|-------------|------|-------------|
| **Habituation detection** | `src/c2v/ui/habituation.ts` (or in control-room UI) | ML-based profiling (e.g. TensorFlow.js): if auto-approval rate &gt;80%, escalate with randomized quizzes or MFA. Rate-limit proposals per session. |
| **Control room mapping** | `docs/ui/control-room-mapping.md` | Document where escalation and rate limits hook into the UI. |

### 3.2 Ensemble Diversity for Cognition

| Deliverable | Path | Description |
|-------------|------|-------------|
| **LEAR ensemble** | `src/c2v/lear/adapt.ts` | OODA/LEAR queries an ensemble (e.g. Llama-3 + proprietary API). Majority voting for proposals; reduces poisoning. Optional: post-train with safety datasets (e.g. NVIDIA-curated). |

**Integration:** Wire into ILP topology OODA decisions and/or CARV plan approval path.

### 3.3 Governance Module

| Deliverable | Path | Description |
|-------------|------|-------------|
| **Governance** | `src/c2v/governance/` | DAO-like mechanics: token-weighted voting on invariants. Tie to PIE `complianceFlags` for community-driven risk bounds. Align with 2026 frameworks (incident reporting, iterative safeguards). |

---

## Phase 4: Testing, Iteration, and Ecosystem

### 4.1 Red-Team and Threat Model

| Deliverable | Path | Description |
|-------------|------|-------------|
| **Red-team suite** | `tests/redteam.ts` | Multi-turn attacks, goal hijacks, exfiltration sims. Use benchmarks (e.g. DARPA AI Cyber Challenge) to quantify robustness; target top-5% resilience. |
| **Threat model** | `docs/threat-model.md` | Publish results and threat model for transparency. |

### 4.2 Ledger-Agnostic and Roadmap

| Deliverable | Description |
|-------------|-------------|
| **Ledger adapters** | Refactor `ledger/` (or extend `src/services/carv/` and `src/services/ilp/`) to support adapters (e.g. EVM). ZK intents enable cross-ledger routing. |
| **Milestones** | **v1.1 (Q2 2026):** Verifier ensembles + ZK attestation. **v2.0 (Q4 2026):** Full governance + multi-chain. Track against SB 53, EU AI Act. |

---

## File Tree (New / Evolved)

```
src/c2v/
├── feynman/
│   ├── explain.ts       # Structured JSON + verifiable claims
│   ├── guardrails.ts    # Policy rules, <100ms
│   ├── symbolic.ts      # Z3-like / rule-based test/reject
│   ├── ensemble.ts      # 2–3 model voter
│   ├── pieBoundsVerifier.ts
│   ├── test.ts          # Symbolic test harness
│   └── reject.ts        # Symbolic reject harness
├── car/
│   ├── compute.ts       # Pathfinding; zkVM-ready
│   ├── validate.ts      # Anomaly + circuit breaker
│   └── attest.ts        # ZK proofs (circom-ts / snark)
├── lear/
│   └── adapt.ts         # Ensemble + majority vote
├── governance/
│   └── (DAO-like voting on invariants)
└── ui/
    └── (habituation escalation hooks)

docs/
├── invariants.md        # Formal CAR schema
├── threat-model.md      # Red-team results + threats
└── ui/
    └── control-room-mapping.md

tests/
└── redteam.ts           # Multi-turn, goal hijack, exfil sims
```

---

## References

- NVIDIA NeMo Guardrails: [build.nvidia.com](https://build.nvidia.com)
- ZK / zkML: circom-ts, EZKL, DeepProve; Sindri, zkVM for compute
- Garak: vulnerability scanning for LLMs
- DARPA AI Cyber Challenge, Frontier AI Safety, EU AI Act / California SB 53

---

*This roadmap keeps C2V lean and DIY-friendly while scaling safety margins for XRPL agentics and verifiable AI.*
