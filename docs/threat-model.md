# C2V Threat Model

Placeholder for red-team results and documented threats. Phase 4: Populate with multi-turn attacks, goal hijacks, exfiltration sims, and benchmarks (e.g. DARPA AI Cyber Challenge). Target: top-5% resilience scores; publish for transparency.

---

## 1. Scope

- **In scope:** FEYNMAN (explain, guardrails, symbolic), CAR (compute, validate, attest), LEAR ensemble, governance, PIE lifecycle.
- **Out of scope:** Physical security, infra DDoS (handled by host).

---

## 2. Threat Categories

| Category | Example | Mitigation |
|----------|---------|------------|
| **Hallucination bypass** | LLM produces PIE that passes UI but violates bounds | FEYNMAN guardrails + symbolic + ensemble; PIE bounds verifier. |
| **Goal hijack** | Adversarial prompt steers agent to wrong payee/amount | Reject harness; human-in-the-loop; rate limits. |
| **Exfiltration** | Leak of regime/keys via side channel | No secrets in client; ZK attestation reveals only public inputs. |
| **Poisoning** | Malicious training data or API response | LEAR ensemble; majority vote; diversity of models. |
| **Circuit breaker bypass** | Repeated failures without pause | Server-side or deterministic circuit breaker; anomaly detection. |

---

## 3. Red-Team Pipeline

- **Location:** `tests/redteam.ts`
- **Content:** Multi-turn attacks, goal hijacks, exfiltration sims.
- **Benchmarks:** Align with 2025/2026 challenges (e.g. DARPA AI Cyber); quantify robustness.
- **Target:** Top-5% resilience scores; update this doc with results.

---

## 4. Assumptions

- Human override remains strongest invariant; no autonomous spend without user sign (e.g. Xaman).
- Client is untrusted; critical enforcement (e.g. caps) must be server-side or on-chain where required.
- ZK proofs and formal invariants (`docs/invariants.md`) reduce trust in single LLM.

---

*To be updated after red-team runs and benchmark integration.*
