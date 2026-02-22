# Data Proxies — Cleaner, More Accurate Data

Routing external API calls through proxies gives you:

- **CORS** — Avoid browser blocking when APIs don’t allow direct frontend requests.
- **Caching** — Serve cached responses for stable, consistent data (prices, ledger, corridors).
- **Normalization** — Backend can validate and reshape responses before they reach the UI.
- **Rate limits** — One proxy can handle rate limiting and retries instead of each client.

---

## Env vars

| Variable | Purpose | Example |
|----------|---------|--------|
| `VITE_DATA_PROXY_URL` | Prefix for **GET** requests to external APIs (CoinGecko, Binance REST, XRPScan, etc.). App sends `GET {proxy}{encodeURIComponent(url)}`. | `https://api.allorigins.win/raw?url=` |
| `VITE_XRPL_PROXY_URL` | Base URL for **XRPL JSON-RPC**. When set, all `account_info`, `server_info`, etc. go to this URL (POST, same body as Ripple). Your backend forwards to an XRPL node. | `https://your-api.com/xrpl` |
| `VITE_RSS_PROXY` | Prefix for **RSS/Atom** feeds (Innovation Radar). Same pattern as DATA_PROXY. | `https://api.allorigins.win/raw?url=` |

---

## What uses the proxy

- **VITE_DATA_PROXY_URL**  
  - Price REST fallbacks: CoinGecko, Binance (in `websocketPriceFeeds`, `PaperTradingPanel`).  
  - Any new GET calls that use `proxyFetch()` from `@/lib/dataProxy`.

- **VITE_XRPL_PROXY_URL**  
  - All XRPL JSON-RPC in `xrplService` (account_info, server_info, account_tx, path_find, etc.).  
  - Backend must accept POST with the same JSON body as Ripple and forward to `https://xrplcluster.com` (or another node) and return the response.

- **VITE_RSS_PROXY**  
  - Innovation Radar feed fetches (see `innovationRadar/config.ts` and `rssPoller.ts`).

---

## GET proxy contract (VITE_DATA_PROXY_URL)

The app does:

```http
GET {VITE_DATA_PROXY_URL}{encodeURIComponent("https://api.coingecko.com/...")}
```

So the proxy must:

1. Accept a single URL (query param `url` or as suffix, depending on your proxy).
2. Fetch that URL server-side.
3. Return the response body (and ideally correct `Content-Type`).

**Public CORS examples:**

- `https://api.allorigins.win/raw?url=` — append the encoded target URL.
- Or run your own (e.g. Vercel serverless) that forwards `?url=...` and returns the body.

---

## XRPL proxy contract (VITE_XRPL_PROXY_URL)

The app sends the same POST body it would send to Ripple:

```json
{ "method": "account_info", "params": [{ "account": "r...", "ledger_index": "validated" }] }
```

Your backend should:

1. Receive POST at the base URL (e.g. `/xrpl`).
2. Forward the body to `https://xrplcluster.com` (or another XRPL node).
3. Return the JSON response as-is (or normalized if you want).

This gives you one place to cache, rate-limit, or swap nodes.

---

## Optional: single backend for all data

You can run one backend that:

- **GET:** `GET /api/fetch?url=...` → fetch url, return body (for DATA_PROXY).
- **XRPL:** `POST /xrpl` → forward body to XRPL node, return response.
- **RSS:** Same as GET, or a dedicated `/api/rss?url=...`.

Then set:

```env
VITE_DATA_PROXY_URL=https://your-backend.com/api/fetch?url=
VITE_XRPL_PROXY_URL=https://your-backend.com/xrpl
VITE_RSS_PROXY=https://your-backend.com/api/fetch?url=
```

---

*See `src/lib/dataProxy.ts` for the implementation and which services use `proxyFetch` / XRPL proxy.*
