# CAR Invariants – Formal Schema

Formal specification of CAR (Compute → Validate → Attest → Route) invariants for community audits and ZK attestation. Aligned with Phase 2 C2V and verifiable AI (zkML, EZKL, DeepProve).

---

## 1. PIE (Payment Intent Envelope) Invariants

| Invariant | Predicate | Description |
|-----------|-----------|--------------|
| **I1. Amount positive** | `amount > 0` | PIE amount must be a positive number. |
| **I2. Slippage bounds** | `0 ≤ slippage_bps ≤ 10000` | Slippage in basis points within [0, 10000]. |
| **I3. Regime anchor** | `regime_summary_hash ≠ ∅ ∧ ≠ "0xnone"` | Regime summary hash required for salience anchoring. |
| **I4. No self-loop** | `payer ≠ payee` | Payer and payee must differ (unless test mode). |
| **I5. Max fee** | `max_fee` string, length ≤ 50 | Max fee representation bounded. |

---

## 2. Validation Invariants

| Invariant | Predicate | Description |
|-----------|-----------|--------------|
| **V1. Daily volume** | `current_daily_volume + amount ≤ daily_volume_cap` | Per-day volume cap. |
| **V2. Single amount** | `amount ≤ max_single_amount` | Per-tx cap. |
| **V3. Asset allowlist** | `asset ∈ allowed_assets` | Only allowed assets. |

---

## 3. Attestation Invariants (ZK)

| Invariant | Proof goal | Description |
|-----------|------------|-------------|
| **A1. Amount bound** | Prove `amount ≤ maxBounds` | ZK proof that amount is within configured bound without revealing amount. |
| **A2. Route valid** | Prove `route valid per ledger state` | Route satisfies pathfinding and ledger state (zkVM / path proof). |
| **A3. Regime hash** | Prove `regime_hash present` | Commitment to regime in proofs. |

---

## 4. Circuit Breaker Invariants

| Invariant | Condition | Action |
|-----------|-----------|--------|
| **C1. Failure streak** | N route failures in window T | Auto-pause; human alert. |
| **C2. Fee spike** | Fee > K × baseline | Escalate or pause depending on severity. |

---

## 5. Schema (JSON) for Tooling

```json
{
  "version": "1.0",
  "pie": {
    "amount": { "min": 0, "exclusiveMin": true },
    "slippage_bps": { "min": 0, "max": 10000 },
    "regime_summary_hash": { "notEmpty": true, "not": "0xnone" },
    "payer_neq_payee": true
  },
  "validation": {
    "daily_volume_cap": { "type": "number" },
    "max_single_amount": { "type": "number" },
    "allowed_assets": { "type": "array", "items": { "type": "string" } }
  },
  "attestation": {
    "proof_types": ["zk-snark", "merkle", "signature"]
  }
}
```

---

*Open-sourcing this spec supports community audits and positions C2V in verifiable AI (e.g. zkML libraries).*
