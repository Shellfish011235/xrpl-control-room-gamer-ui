# XRPL & payments

## XRPL
- **Drops**: 1 XRP = 1_000_000 drops. Use `xrpToDrops` / `dropsToXRP` from `src/services/xrplService.ts`.
- **Addresses**: Start with `r`, base58. Validate with `isValidXRPLAddress()` from xrplService.
- **Ledger calls**: Use `xrplRequest()`-style fetch to public RPC (e.g. xrplcluster.com). No `xrpl.js` in package.json; build JSON payloads by hand where needed.

## Wallets & signing
- **Xaman (Xumm)** in `src/services/xaman/xamanService.ts`: `requestPaymentSignature()`, `requestCustomTransactionSignature(tx, sourceAccount?)` for PaymentChannelCreate etc. Signing is async (QR/deep link); subscribe to `signingSigned` / `signingRejected`.
- **Wallet store** `src/store/walletStore.ts`: `wallets`, `activeWalletId`, `addWallet`, etc. Demo wallets (`provider === 'demo'`) cannot sign real transactions.

## Payment channels
- **Ledger**: `getPaymentChannels(account)` and `buildPaymentChannelCreateTx()` in xrplService. Channels from `account_objects` type `payment_channel`.
- **Real streams**: "Stream now" in the app = repeated **Payment** transactions (one Xaman sign per payment), not channel claims. Channel claims require the channel key to sign claim auth; not exposed in UI.

## Agent panel
- Global drawer: **Chat** (Quick send + SecureAgentPanel), **Track** (receipts/limits/pending), **Streams** (RealStreamsPanel + OpenClaw). State in `agentPanelStore` (`open`, `panelTab`, `setOpen(open, tab?)`).
