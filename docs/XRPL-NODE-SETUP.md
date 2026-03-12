# XRPL Private Node Setup

This doc describes how the dashboard connects to a configurable XRPL node (e.g. your private rippled on a Mac Mini) and how to run in local-LAN vs production (Vercel).

## Architecture Summary

- **Config** (`src/config/xrplNode.ts`): Reads `VITE_XRPL_RPC_URL`, `VITE_XRPL_WS_URL`, `VITE_XRPL_PROXY_URL`. Exposes `getRpcUrl()`, `getWsUrl()`, and public fallbacks when unset.
- **HTTP client** (`src/lib/xrplClient.ts`): JSON-RPC over HTTP. `xrplRequest(method, params?)`, typed helpers (`server_info`, `ledger`, `tx`, `account_info`, `book_offers`). Allowlist of methods only; no admin commands.
- **WebSocket manager** (`src/lib/xrplWebsocket.ts`): Single WS connection, reconnect with exponential backoff, `subscribe(streams)`, `onMessage(cb)`. Tracks connection state and last ledger index for the Node Status widget.
- **Node Status widget** (`src/components/NodeStatusWidget.tsx`): Shows connected/disconnected, `server_state`, validated ledger index, peer count, uptime, ledger age. Uses the shared WS and periodic `server_info` (HTTP).
- **Consumers**: `xrplService` uses `lib/xrplClient` for all RPC. Navigation ledger ticker and Node Status use `lib/xrplWebsocket`. `xrplClient` (xrpl.js), `xrplDex`, and `xrplPathfinding` use configurable WS URL from `config/xrplNode`.

**Modes**

1. **Local LAN**: Set `VITE_XRPL_RPC_URL` and `VITE_XRPL_WS_URL` to your node (e.g. `http://192.168.5.43:5005`, `ws://192.168.5.43:6006`). Browser and node on same network; no CORS if rippled allows origin or you use a local proxy.
2. **Production (Vercel)**: The Vercel-hosted app runs in users’ browsers. Those browsers cannot reach a private `192.168.x.x` node. Use **VITE_XRPL_PROXY_URL** pointing to a server that forwards JSON-RPC (and optionally WS) to your node, or leave unset to use public XRPL endpoints.

## Files Created or Changed

| File | Change |
|------|--------|
| `src/config/xrplNode.ts` | **New.** Env-based RPC/WS URL and fallbacks. |
| `src/lib/xrplClient.ts` | **New.** HTTP `xrplRequest`, typed helpers, method allowlist. |
| `src/lib/xrplWebsocket.ts` | **New.** WS connect/disconnect, reconnect backoff, subscribe, onMessage, state/ledger index. |
| `src/components/NodeStatusWidget.tsx` | **New.** Node Status UI (connection, server_state, ledger, peers, uptime). |
| `src/services/xrplService.ts` | Uses `xrplRequest` from `lib/xrplClient`; removed local URL/request logic. |
| `src/services/xrplClient.ts` | Uses `getWsUrl()` / `isCustomNode()` from `config/xrplNode` for xrpl.js Client URL. |
| `src/services/xrplDex.ts` | WS URL from `getDexWsServers()` (config-based). |
| `src/services/xrplPathfinding.ts` | WS URL from `getPathfindingWsServers()` (config-based). |
| `src/components/Navigation.tsx` | Ledger index from `lib/xrplWebsocket`; added `NodeStatusWidget`. |
| `.env.example` | Added `VITE_XRPL_RPC_URL`, `VITE_XRPL_WS_URL`, `VITE_XRPL_PROXY_URL`. |
| `docs/XRPL-NODE-SETUP.md` | **New.** This file. |

## Environment Variables

Place these in `.env` (and in Vercel Environment Variables for production if using a proxy).

| Variable | Purpose |
|---------|---------|
| `VITE_XRPL_RPC_URL` | HTTP JSON-RPC base (e.g. `http://192.168.5.43:5005`). When set, used for all RPC. |
| `VITE_XRPL_WS_URL` | WebSocket URL (e.g. `ws://192.168.5.43:6006`). When set, used for ledger stream and xrpl.js Client (mainnet). |
| `VITE_XRPL_PROXY_URL` | Optional. When RPC URL is not set, this is used as RPC base (e.g. your server that forwards to the node). |

- No secrets in these; URLs only.
- Vite only exposes variables prefixed with `VITE_` to the client.

## Run and Test Locally

1. **Copy env and set your node:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```
   VITE_XRPL_RPC_URL=http://192.168.5.43:5005
   VITE_XRPL_WS_URL=ws://192.168.5.43:6006
   ```

2. **Install and run:**
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:3000.

3. **Verify:**
   - Nav bar: “Node” widget shows **Connected**, `server_state`, ledger #, peers.
   - Ledger ticker updates when new ledgers close.
   - Tools that use XRPL (Control Room, DEX, Pathfinding, etc.) use your node.

4. **CORS:** If the browser blocks requests to `http://192.168.5.43:5005` or `ws://192.168.5.43:6006`, either:
   - Configure rippled to allow your origin, or
   - Run a small local proxy (e.g. Node or Vite proxy) that forwards to the node and set `VITE_XRPL_RPC_URL` / `VITE_XRPL_WS_URL` to the proxy (e.g. `http://localhost:5006`).

## Test Checklist

- [ ] With `VITE_XRPL_RPC_URL` and `VITE_XRPL_WS_URL` set: Node Status shows Connected and correct ledger/peers.
- [ ] Ledger ticker in nav updates (ledger stream).
- [ ] Control Room / wallet flows that call `server_info` or account/tx work.
- [ ] DEX order book (book_offers) loads when using your node.
- [ ] Pathfinding (book_offers) works when using your node.
- [ ] With env vars removed: app falls back to public endpoints and still works.
- [ ] After disconnecting the node (or wrong URL): Node Status shows Disconnected; reconnect with backoff after node is back.

## Production Limitation (Vercel + Private Node)

- **Vercel** serves a static/client app. Requests run in **each user’s browser**.
- A **private node** at `192.168.5.43` is only reachable from your LAN. Users on the internet cannot connect to it.
- So: **direct browser → private node** only works when the user is on the same network as the node (e.g. you at home). For a **public** Vercel deployment you have two options:
  1. **Do not set** `VITE_XRPL_RPC_URL` / `VITE_XRPL_WS_URL` for production: app uses public XRPL endpoints for all users.
  2. **Use a proxy**: Set `VITE_XRPL_PROXY_URL` (and optionally a WS proxy URL if you add one) to a **public** server you control that forwards to your private node. Then only that server needs to reach `192.168.5.43` (e.g. via VPN or running the proxy on the same LAN).

A thin server-side proxy would accept POST at e.g. `/api/xrpl` with body `{ method, params }`, forward to `http://192.168.5.43:5005`, and return the response. The client would set `VITE_XRPL_PROXY_URL=https://your-proxy.com` (or `https://your-vercel-app.vercel.app/api/xrpl` if you implement the route in Vercel serverless and that serverless function can reach your node, e.g. via a tunnel or VPN).
