# Ledger Impact Amendment Status Fix — 2026-10-15

## Problem
The Control Room Ledger Impact Tool could show amendment status that looked stale even while the live feed was available. Two separate problems were involved:

1. enabled/supported state had historically depended on XRPScan rather than the ledger's live `feature` RPC;
2. legacy amendments such as `Batch`, `fixBatchInnerSigs`, and `PermissionDelegation` remained in the default review queue after their replacement amendments were live.

The second issue made the UI especially confusing: users could see an old disabled amendment in **Needs Review** while its active replacement was hidden under **Enabled**.

## Root cause
`fetchXRPLAmendments()` originally treated XRPScan as the only status source. The earlier hardening at commit `383571e` fixed this by merging XRPScan vote metadata with XRPL Mainnet `feature` RPC state.

A remaining presentation bug lived one layer higher: the UI did not model amendment replacement/supersession. Static impact text was also dated March 2026 and still described BatchV1_1 as being under review.

## Resolution
The status model now separates **live protocol state** from **historical amendment context**:

- XRPL Mainnet `feature` RPC at `https://xrplcluster.com` is authoritative for `enabled` and `supported`.
- XRPScan remains the source for validator vote counts, thresholds, majority timestamps, and countdown metadata.
- Legacy amendments are marked `supersededBy` when their replacement is enabled:
  - `Batch` → `BatchV1_1`
  - `fixBatchInnerSigs` → `BatchV1_1`
  - `PermissionDelegation` → `PermissionDelegationV1_1`
- Superseded amendments no longer inflate **Needs Review**, **Pending**, or majority counts.
- Legacy rows are explicitly labeled `SUPERSEDED → <replacement>` when visible under **All**.
- The detail view shows a historical/legacy notice instead of presenting the old security warning as the current feature state.
- Cached/offline fallback metadata carries the same supersession mapping so stale legacy items are not presented as current review work when the network is unavailable.
- Batch impact text now distinguishes the retired original Batch amendment from the active `BatchV1_1` replacement and enabled `fixBatchV1_2` fix.

## Current Mainnet verification
Fresh live check on 2026-10-15:

| Amendment | Enabled | Supported | XRPScan validator support |
| --- | --- | --- | ---: |
| BatchV1_1 | yes | yes | 27 / 32 |
| fixBatchV1_2 | yes | yes | 32 / 32 |
| PermissionDelegationV1_1 | yes | yes | 28 / 33 |
| PermissionedDEX | yes | yes | 28 / 34 |
| SingleAssetVault | no | yes | 19 / 32 |
| LendingProtocol | no | yes | 17 / 32 |
| LendingProtocolV1_1 | no | yes | 17 / 32 |

Legacy entries remain visible in the data feed for historical/governance context, but they are not equivalent to current active feature work.

Important network boundary: this table is **Mainnet** state. Devnet was separately verified with `SingleAssetVault`, `LendingProtocol`, and `LendingProtocolV1_1` enabled. Devnet protocol availability does **not** mean our wallet has an approved vault subscription, credential, or Permissioned Domain access.

## Regression protection
`tests/freeDataFeeds.amendments.test.ts` now covers two failure modes:

1. stale XRPScan `enabled=false` must be overridden when live Mainnet `feature` RPC says the amendment is enabled;
2. a legacy amendment must report `supersededBy` when its live replacement is enabled.

TDD evidence for the second behavior:
- RED observed: `Batch.supersededBy` was `undefined` when the test expected `BatchV1_1`.
- GREEN observed after implementation: **2/2 tests passed**.

## Fresh verification
Executed in isolated worktree `fix/ledger-impact-amendment-status`:

- `npx tsx --test tests/freeDataFeeds.amendments.test.ts` → **2 passed, 0 failed**
- `npm run type-check` → **pass**
- `npm run build` → **pass**, Vite production build completed in 14.23s
- `npm run lint` → **repo-wide baseline remains red: 59 errors / 836 warnings** across unrelated existing Control Room files

Known pre-existing build warnings remain around Recharts chunking, mixed static/dynamic orchestra imports, and large bundles. They are outside this amendment-status fix.

## Files changed
- `src/services/freeDataFeeds.ts`
- `src/components/LedgerImpactTool.tsx`
- `src/data/amendmentImpactData.ts`
- `tests/freeDataFeeds.amendments.test.ts`
- `docs/hackathon/2026-10-15-LEDGER-IMPACT-AMENDMENT-STATUS-FIX.md`

## Hackathon relevance
This is pre-event reliability hardening of an existing Control Room feature. It does not implement autonomous lending execution, signing, submission, or the judged lending feature. It improves the accuracy and clarity of ledger-state information that later Shellfish policy logic may consume.

## Resume point after this fix
Return to the lending-track investigation at the exact prior checkpoint:

1. inspect real Devnet `Vault`, `LoanBroker`, and `Loan` ledger objects read-only;
2. distinguish vault lifecycle phase from account subscription/credential eligibility;
3. determine whether our disposable Devnet account has any actual access/credential relationship (currently **not established**);
4. map verified ledger fields into proposed Shellfish policy inputs without implementing the judged autonomous execution path early.
