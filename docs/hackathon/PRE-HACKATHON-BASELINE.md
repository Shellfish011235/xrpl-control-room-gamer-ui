# Pre-Hackathon Baseline Disclosure — XRPL Control Room

Date captured: 2026-10-05
Event: Ripple Swell XRP Ledger Hackathon 2026
Branch: `main`
Baseline commit: `8bd33c9ff577ecfb293699e847120e324e423811`

## Purpose
This file records UI and observability work that existed before the judged build window.

## Pre-existing capabilities
- XRPL Control Room application shell and routing.
- Ledger Impact / amendment-oriented UI foundations.
- Task Receipts local review UI and receipt hashing.
- Security/compliance status surfaces.
- Agent/payment/pathfinding/network navigation concepts.
- Existing Xaman integration and user-controlled signing boundaries.

## Verified baseline
On 2026-10-05:
- `npm run type-check` passed.
- `npm test` passed **26/26 tests**.
- `npm run build` succeeded. Vite reported only bundle chunk-size warnings.
- `npm audit --omit=dev` reported **0 known production vulnerabilities**.

## Judged work reserved for the event
- Minimal event-specific XRPL Control Plane result surface.
- Display of required capabilities, ledger state, policy result, Wave Router result and final decision.
- Event-specific receipt presentation for `ALLOW_PLAN`, `DENY`, and `SIMULATION_ONLY`.

## Boundary
The event UI must not imply wallet signing, transaction submission, custody or Mainnet authority when those capabilities are not present.
