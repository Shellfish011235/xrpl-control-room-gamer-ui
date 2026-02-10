# Make xrplcontrolroom.com Use the Same Data as Local

When you run the app locally with `START-XRPL-APP.bat`, it reads from your **`.env`** file. The live site (xrplcontrolroom.com) does **not** see that file—you must set the **same variables in your hosting provider** and **redeploy**.

## 1. Copy your local env values

From `C:\Users\anamb\xrpl-control-room-gamer-ui\.env` (or from memory), note:

- `VITE_XAMAN_API_KEY` – Xaman app API key (real signing vs demo mode)
- `VITE_AGENT_SERVICE_WALLET` – XRPL address for Power Mode / paid actions
- `VITE_OPENCLAW_FEE_WALLET` – (optional) OpenClaw fee wallet
- `VITE_COINGECKO_API_KEY` – (optional) if you use it
- `VITE_ANALYTICS_ID` – (optional) if you use it

## 2. Set them in your production host

The project uses **Vercel** (see `vercel.json`). So:

1. Go to [vercel.com](https://vercel.com) → your **xrpl-control-room-gamer-ui** (or the project linked to xrplcontrolroom.com).
2. **Settings** → **Environment Variables**.
3. Add each variable from step 1:
   - **Name:** e.g. `VITE_XAMAN_API_KEY`
   - **Value:** same as in your local `.env`
   - **Environment:** Production (and Preview if you want).
4. Save.

Important: only variables whose name starts with **`VITE_`** are embedded in the frontend build. Non-`VITE_` vars (e.g. `PROXY_PORT`) are for server-side only and are not used by this static frontend.

## 3. Redeploy

Env vars are baked in at **build time**. After adding or changing them:

- **Vercel:** Deployments → open latest deployment → **Redeploy**, or push a new commit to trigger a deploy.

After redeploy, xrplcontrolroom.com will use the same Xaman API key, agent service wallet, and optional keys as your local app.

## 4. “Data” that is already the same

These do **not** depend on env and are the same locally and on xrplcontrolroom.com:

- XRPL (s1.ripple.com, s2.ripple.com, xrplcluster.com)
- XRPScan (amendments, etc.)
- CoinGecko / Binance (public price APIs)

So “same data” here mainly means: **same config** (Xaman real signing, same wallets, same optional API keys). Once the `VITE_*` vars are set in production and you redeploy, the site matches your local behavior and data sources.

## 5. If you use Xaman key only in the browser (no .env)

If you never put `VITE_XAMAN_API_KEY` in `.env` and instead enter your Xaman API key in the app (e.g. Secure Agent Panel / “Connect Xaman”), that value is stored in **localStorage** for **that origin only** (e.g. `http://localhost:5173`). The production site (xrplcontrolroom.com) is a different origin, so it has its own (empty) localStorage.

Options:

- **A)** Set `VITE_XAMAN_API_KEY` in Vercel (step 2) so production is in “production” mode with real signing without users re-entering the key, or  
- **B)** On xrplcontrolroom.com, open the in-app Xaman settings and enter your API key once; it will then be saved in localStorage for that domain.

---

**Summary:** Add the same `VITE_*` variables from your local `.env` to Vercel → Environment Variables, then redeploy. After that, xrplcontrolroom.com uses the same data and config as when you run locally.
