# Using the Grid Strategy with Real XRP

The **Grid** strategy in the Terminal places an adaptive offer ladder (buy orders below mid, sell orders above mid) on the XRPL DEX. You sign every transaction in Xaman — non-custodial.

## Steps

1. **Connect a wallet**  
   In **Profile** (or the header wallet area), add and select a wallet (e.g. Xaman). The Terminal syncs this address to the strategy agents so Grid/DCA/MM/Arb use it for real XRP.

2. **Open the Terminal**  
   Go to **Terminal** (institutional trading view).

3. **Enable Grid**  
   In **STRATEGY UNLOCKS**, turn on **Grid** (“Adaptive offer ladder”). Optionally set **Risk & exposure** → Max exposure (XRP).

4. **Switch to Live (real XRP)**  
   In the bar under the header, set **Strategy mode** to **Live (real XRP)**.  
   - **Simulate** = agents suggest trades; no real signing.  
   - **Live (real XRP)** = when a plan is ready, you sign in Xaman and submit real offers.

5. **Wait for a plan**  
   With Grid enabled and Live selected, the Grid agent runs about every 90 seconds. When the price is available and under max exposure, it will emit buy/sell offer intents. The Orchestra batches them and shows **Plan ready (N tx) – sign in Xaman to submit**.

6. **Sign in Xaman**  
   Click **Sign in Xaman**. A Xaman (Xumm) signing request opens (QR or in-app). Approve the transaction. The first transaction in the plan is submitted. You can dismiss the plan or sign again when the next plan appears (each window can contain multiple offers).

## Grid behavior

- **Levels:** 2 buy levels below mid, 2 sell levels above mid (0.5% step by default).
- **Size:** 20 XRP per offer.
- **Pair:** XRP / USD (Bitstamp-style IOU). You need a USD trust line for the issuer used in the app.
- **Throttle:** One grid “refresh” every 90 seconds so the UI doesn’t flood.

## Safety

- You sign every transaction. The app never holds or sends your XRP without your approval.
- Use **Pause agents** to stop new suggestions; use **Simulate** to test without signing.
- Set **Max exposure (XRP)** under Risk & exposure to cap how much the agents can suggest.

## Troubleshooting

- **“Connect a wallet”**  
  Add/select a wallet in Profile so the strategy store has an address.

- **No plan appears**  
  Ensure Grid is on, mode is Live, agents are not paused, and current exposure is below max. The Grid agent only runs when there is a valid market mid (e.g. from the Terminal price feed).

- **Xaman doesn’t open**  
  Configure your Xaman app and API key (see [XAMAN-SETUP.md](../XAMAN-SETUP.md)). Ensure the app is allowed to open signing requests.

- **Only one tx signed**  
  Currently the Terminal “Sign in Xaman” button submits the **first** transaction in the plan. If the plan has multiple offers, repeat when the next plan appears, or sign the first and dismiss the rest.
