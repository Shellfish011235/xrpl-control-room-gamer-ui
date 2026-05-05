# ILP lens — data accuracy model

## XRPL public / live-style sources (separate from ILP)

| Path | Accuracy (typical) | Notes |
|------|-------------------|--------|
| Local `rippled` WebSocket / `server_info` | `LIVE_VERIFIED` | Your node; highest trust for that deployment. |
| Public XRPL WebSocket streams | `PUBLIC_XRPL` | Network consensus / ledger data; not connector-private. |
| XRPScan registry / nodes | `PUBLIC_DIRECTORY` | Aggregated third-party; may lag or omit nodes. |

## ILP / Open Payments — realistic sources

| Source | Accuracy (typical) | Notes |
|--------|---------------------|--------|
| Local Rafiki / connector webhooks & telemetry | `LOCAL_TELEMETRY` | Private to your deployment; not “global ILP truth.” |
| Rafiki testnet — reachable health checks | `TESTNET_VERIFIED` | Testnet only; not mainnet production claims. |
| Open Payments / wallet-address URL reachability | `LOCAL_TELEMETRY` / `TESTNET_VERIFIED` | Reachability ≠ successful quote or payment. |
| Payment pointer / wallet address resolution | `MANUAL` / `UNKNOWN` | Depends on configuration and verification. |
| Webhook event stream (signed, server-validated) | `LOCAL_TELEMETRY` when trusted | Frontend must not trust unsigned payloads as verified. |
| Derived route estimates (XRPL signal + endpoint probe) | `DERIVED` / `SIMULATED` | Never `LIVE_VERIFIED` without a real, attested payment path. |

## Do **not** present as global live truth

- Worldwide ILP connector map with live liquidity
- Global connector peer lists or private institutional packet streams
- Real-time **global** ILP volume aggregates
- Static `ilpData.ts` connector metrics (volume, tx/day, latency, uptime) as production telemetry

Those remain **demo**, **derived**, or **manual** unless backed by an explicit configured feed and methodology.

## Accuracy labels (UI)

See `src/types/dataAccuracy.ts` — `getAccuracyLabel` / `getAccuracyWarning`.

## Compliance / security (this repo)

- No private keys, seeds, or custody in the client.
- No signing or transaction submission from these adapters.
- No real payment execution, quote creation, or Open Payments grant flows from the browser adapters described here.
- Health checks use `fetch` without credentials; CORS may block — result is `unknown`, not a crash.

## Environment (optional probes)

`VITE_RAFIKI_LOCAL_URL`, `VITE_OPEN_PAYMENTS_WALLET_ADDRESS_URL`, `VITE_OPEN_PAYMENTS_AUTH_SERVER_URL`, `VITE_OPEN_PAYMENTS_RESOURCE_SERVER_URL` — see `.env.example`. Never commit secrets; `VITE_*` is public in builds.
