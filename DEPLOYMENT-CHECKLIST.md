# XRPL Control Room - Deployment Checklist

## ✅ Countdown Timers Now Dynamic!

**GOOD NEWS:** As of the latest update, countdown timers are now calculated **automatically** from the XRPScan API's `majority` field, which contains a Ripple epoch timestamp.

Each amendment's countdown is **individual** - NOT batched. When an amendment reaches majority, its 2-week countdown starts from that specific moment.

---

## How the Countdown System Works

1. **API Fetch**: We call `https://api.xrpscan.com/api/v1/amendments`
2. **Ripple Epoch Conversion**: The `majority` field (e.g., `822304671`) is converted:
   - Ripple epoch = seconds since Jan 1, 2000
   - Unix timestamp = Ripple timestamp + 946684800
   - JavaScript Date = `new Date(unixTimestamp * 1000)`
3. **Activation Date**: Majority date + 14 days = activation date
4. **Live Countdown**: Real-time countdown calculated from now to activation date

---

## Pre-Deployment Checklist

### 1. Verify API Connectivity
The countdown system depends on `https://api.xrpscan.com/api/v1/amendments`

Check that it returns data with `majority` timestamps for amendments at majority:
```json
{
  "name": "PermissionedDomains",
  "majority": 822304671,  // <-- This Ripple epoch timestamp is key!
  ...
}
```

### 2. Update Home.tsx Governance Panel (Optional)
If you want to show static summary data on the home page, update around line 736:
```typescript
{[
  { name: 'PermissionedDomains', support: 88, status: 'Feb 4, 2026', voters: '30/34' },
  // ... update from xrpscan
].map((item) => (
```

### 3. Verify Validator Count
Check if the total UNL validator count has changed from 34.
Update in `Home.tsx` if needed.

---

## Current Amendment Status (Jan 27, 2026)

| Amendment | Status | Voters | Activation | 
|-----------|--------|--------|------------|
| fixPriceOracleOrder | **ENABLED** | 33/34 | Jan 27, 2026 |
| fixMPTDeliveredAmount | **ENABLED** | 33/34 | Jan 27, 2026 |
| fixIncludeKeyletFields | **ENABLED** | 33/34 | Jan 27, 2026 |
| fixAMMClawbackRounding | **ENABLED** | 33/34 | Jan 27, 2026 |
| fixTokenEscrowV1 | **ENABLED** | 33/34 | Jan 27, 2026 |
| PermissionedDomains | MAJORITY | 30/34 | **Feb 4, 2026** ← Live countdown! |
| Batch | VOTING | 23/34 | - |
| TokenEscrow | VOTING | 23/34 | - |
| PermissionedDEX | VOTING | 20/34 | - |

**Source:** https://xrpscan.com/amendments

---

## Post-Deployment Verification

After deploying:
1. [ ] Open the live site
2. [ ] Navigate to the Ledger Impact Tool
3. [ ] Verify amendments at majority show **live countdown timers**
4. [ ] Verify each amendment has its **own individual countdown** (not batched!)
5. [ ] Verify countdown is ticking down every second
6. [ ] Click on an amendment to verify modal shows countdown with activation date

---

## Troubleshooting

### If countdown shows wrong time or isn't ticking:

1. **Check browser console** for `[FreeFeeds]` log messages
   - Should see: `PermissionedDomains: Majority at 2026-01-21T..., Activates: 2026-02-04T..., Countdown: 7d 11h 54m 23s`

2. **Verify API response** has `majority` field as a number
   - If `majority: null`, the API isn't returning the timestamp

3. **Check for CORS issues** in browser network tab
   - XRPScan API should be accessible from browser

### If an amendment loses then regains majority:

The 2-week countdown **restarts from zero** when the new `majority` timestamp is set.
This is handled automatically - no code changes needed!

---

## Technical Details

**Ripple Epoch Conversion:**
```typescript
const RIPPLE_EPOCH_OFFSET = 946684800;  // Jan 1, 2000 in Unix time

function rippleEpochToDate(rippleTimestamp: number): Date {
  const unixTimestamp = rippleTimestamp + RIPPLE_EPOCH_OFFSET;
  return new Date(unixTimestamp * 1000);
}
```

**Example:**
- `majority: 822304671` (Ripple epoch)
- Unix: 822304671 + 946684800 = 1768989471
- Date: January 21, 2026 (when PermissionedDomains reached majority)
- Activation: February 4, 2026 (14 days later)
