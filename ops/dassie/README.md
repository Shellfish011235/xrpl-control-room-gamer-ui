# S9 Dassie telemetry (draft, operator-only)

## Status

- S9 Dassie 0.4.5 on DigitalOcean Ubuntu 24.04, XRPL Testnet periphery node.
- The UI adds **Payment Rails → S9 Dassie** with a strict `schema_version: 1` contract.
- UI fetches only `GET /api/dassie/status` on the SAME origin, every 30 seconds.
- **The route is not deployed or implemented yet.** Until then the panel must say unavailable.
- No live deployment or change to the wallet was performed by this branch.

## Security boundaries

The source of truth is `dassie status` executed locally by the S9 host. The collector writes a private file at `/var/lib/s9-dassie-telemetry/status.json`, permissions 0600 under a 0700 directory. It has no network listener and performs no transactions. It explicitly excludes:
wallet keys, setup tokens, private SSH keys, wallet balances, hub account IDs, full peer identifiers, arbitrary CLI output, and payment destinations.

Do **NOT** publish this private file to a static hosting bucket or GitHub. Do **NOT** proxy the Dassie wallet admin interface, the Dassie IPC socket, or ssh directly to a browser. Never set a `VITE_*` variable to a secret: Vite embeds them into public bundles.

Before wiring the frontend to actual telemetry, deploy an operator-authenticated same-origin backend endpoint with the following boundaries:
1. Read a sanitized collector snapshot through an authenticated server-side channel (restricted SSH or approved private network).
2. Validate the fixed allowlisted fields, timestamp and version server-side.
3. Require an authenticated operator identity, rate limit requests, disable CORS for other origins, set `Cache-Control: no-store` and do not log credential-bearing headers.
4. Ensure the route returns 401/403 if unauthorized, 503 when unavailable; never return fabricated live data.
5. Run a deployment-specific review before enabling the route.

## Manual verification

On the trusted S9 server, inspect the pinned source in `ops/dassie/s9_status_export.py` before deploying. Run `python3 -m py_compile` then execute it once, check that output has schema version 1 and only the fields enumerated in the file. Do not paste raw Dassie outputs into issue comments. Automated polling should be configured only after verifying the security boundaries.

On a local Control Room build, the S9 panel must say **Status unavailable** until the authenticated endpoint exists. Do not represent the old successful test payment as a live counter when the endpoint is disconnected.

## Known gaps

The public Control Room frontend currently requires a wallet to show its operator subpanels. This remains unchanged. UI and local collector are staged; backend ingress and protected deployment are deliberately separate approval and verification steps. No secrets have been committed.
