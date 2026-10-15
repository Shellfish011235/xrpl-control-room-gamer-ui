# Ledger Impact Amendment Status Fix — 2026-10-15

## Problem
The Control Room Ledger Impact Tool described its amendment feed as live, but network status came only from XRPScan. Static impact metadata was also dated March 2026. That made the UI vulnerable to stale `enabled` / `supported` state when an amendment changed status.

## Root cause
`fetchXRPLAmendments()` in `src/services/freeDataFeeds.ts` used only `https://api.xrpscan.com/api/v1/amendments`. The UI had no independent live XRPL `feature` check.

## Resolution
The service now combines two sources:

- XRPL Mainnet `feature` RPC at `https://xrplcluster.com` is authoritative for `enabled` and `supported`.
- XRPScan remains the source for validator vote counts, majority timestamps, thresholds, and countdown metadata.

If the feature RPC is unavailable, the service degrades to XRPScan rather than inventing a live status. The UI labels the source explicitly as `XRPL Mainnet feature RPC + XRPScan`; cached fallback is labeled as cached impact metadata.

## Current Mainnet verification
Fresh live check on 2026-10-15:

| Amendment | Enabled | Supported | XRPScan support |
| --- | --- | --- | ---: |
| BatchV1_1 | yes | yes | 84.4% |
| fixBatchV1_2 | yes | yes | 100% |
| PermissionDelegationV1_1 | yes | yes | 84.8% |
| PermissionedDEX | yes | yes | 82.4% |
| SingleAssetVault | no | yes | 59.4% |
| LendingProtocol | no | yes | 53.1% |
| LendingProtocolV1_1 | no | yes | 53.1% |

Important: this is Mainnet state. Devnet was separately verified with SingleAssetVault, LendingProtocol and LendingProtocolV1_1 enabled. Do not conflate Devnet feature availability with Mainnet activation or with a user's vault subscription/credential approval.

## Regression protection
Added `tests/freeDataFeeds.amendments.test.ts`.

The test deliberately gives XRPScan a stale `BatchV1_1 enabled=false` response while the live XRPL feature response says `enabled=true`. The merged result must be `enabled`.

TDD evidence:
- RED: test failed because the old service trusted XRPScan only.
- GREEN: test passed after live feature-state merge was implemented.

## Verification
- targeted regression test: 1/1 pass
- `npm run type-check`: pass
- `npm run build`: pass
- focused ESLint on `src/services/freeDataFeeds.ts`: 0 errors, 2 pre-existing warnings
- repo-wide `npm run lint`: still fails on unrelated pre-existing Control Room lint errors; not changed as part of this focused fix

## Files changed
- `src/services/freeDataFeeds.ts`
- `src/components/LedgerImpactTool.tsx`
- `tests/freeDataFeeds.amendments.test.ts`

## Hackathon relevance
This is pre-event reliability hardening of an existing Control Room feature. It does not implement the judged autonomous lending execution feature. It improves the accuracy of the ledger-state information the later control plane will consume.
