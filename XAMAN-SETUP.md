# Real Xaman Signing — Setup (Step 1)

Follow these steps to enable **real** wallet signing instead of demo mode.

---

## 1. Get your Xaman API key

1. Open **https://apps.xumm.dev**
2. Sign in (or create an account)
3. Create a new app (e.g. "XRPL Control Room")
4. In the app dashboard, copy the **API Key** (not the API Secret — the browser app only needs the key)

---

## 2. Add the key to `.env`

1. In the project root (`xrpl-control-room-gamer-ui`), open or create a file named **`.env`**
2. Add this line (replace with your real key):

   ```env
   VITE_XAMAN_API_KEY=paste-your-api-key-here
   ```

3. Save the file.  
   **Do not commit `.env`** — it’s already in `.gitignore`.

---

## 3. Restart the dev server

Env vars are read at build time, so you must restart:

```bash
# Stop the current server (Ctrl+C), then:
npm run dev
```

Check the browser console on load. You should see:

- `[Xaman] ✅ Production mode (from env) - real signing enabled`

If you still see **Demo mode**, the key wasn’t loaded (check the variable name and that `.env` is in the project root).

---

## 4. Connect Xaman and do a test payment

1. In the app, open **Micropayments** (or the page with the Secure Payment Agent / “Connect Xaman”).
2. Click **Connect Xaman** and enter your API key in the in-app form if you didn’t use `.env` (or it will already be in production mode from `.env`).
3. Connect your wallet (scan QR with the Xaman app or use the deep link).
4. In the chat, try a small test payment, e.g.:
   - *“Send 1 XRP to rYourOwnAddress”*  
   (use your own address so you’re sending to yourself and not losing funds.)
5. Confirm the plan, then **sign in the Xaman app** when the QR/deep link appears. The transaction will be submitted to the real network.

---

## Troubleshooting

| Issue | What to do |
|--------|------------|
| Still says Demo mode after adding `.env` | Restart dev server; ensure the line is `VITE_XAMAN_API_KEY=...` with no spaces around `=`. |
| “Failed to create payload” when signing | Check API key at apps.xumm.dev; ensure the app is active and the key is correct. |
| QR / deep link doesn’t open Xaman | Install Xaman on your phone; use the same network or try the manual link. |
| Want to switch back to demo | Remove or comment out `VITE_XAMAN_API_KEY` in `.env`, or in the app use “Disconnect Xaman” to clear saved credentials, then restart. |

---

Once this works, you’re on **real Xaman signing**. Next you can improve the chat (e.g. LLM for “asking questions”) or add royalties flows.
