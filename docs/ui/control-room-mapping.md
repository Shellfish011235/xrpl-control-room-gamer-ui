# Control Room UI Mapping

Phase 3: Document where behavioral anomaly escalation and rate limits hook into the UI. Supports habituation detection (e.g. auto-approval >80% → escalated review, randomized quizzes or MFA) and rate-limited proposals per session.

---

## 1. Escalation Points

| UI Area | Current | Phase 3 Hook |
|---------|---------|--------------|
| **Secure Agent / CARV** | User confirms plan → Xaman sign | If habituation score > threshold: show quiz or MFA before opening Xaman. |
| **Agent Economy** | Power Mode unlock, receipts | Rate-limit unlock attempts per session; escalate if > N per hour. |
| **Orchestra / Terminal** | Strategy agents, plan execution | Rate-limit proposals per session; circuit breaker alert banner. |

---

## 2. Habituation Detection

- **Input:** Per-session approval rate, time-between-approvals, pattern (e.g. always approve in <2s).
- **Output:** Score or flag; if >80% auto-approval or “fatigue” pattern → escalate (quiz, MFA, or delay).
- **Implementation:** `src/c2v/ui/habituation.ts` (or equivalent); ML-based profiling e.g. TensorFlow.js (stub for now).

---

## 3. Rate Limits

- **Proposals per session:** Cap number of payment/route proposals per user per session; show “slow down” or cooldown.
- **Alerts:** Circuit breaker (CAR validate) triggers banner in control room: “Routing paused due to anomaly; check alerts.”

---

*To be updated as UI components are wired to c2v modules.*
