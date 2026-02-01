# Deploy to xrplcontrolroom.com via OpenClaw Agent

## Quick Deploy Prompt (Copy to Your OpenClaw Agent)

```
Deploy https://github.com/Shellfish011235/xrpl-control-room-gamer-ui to Vercel NOW.

Details:
- React + TypeScript + Vite project
- Build: npm run build → /dist
- vercel.json already configured
- Domain: xrplcontrolroom.com

Steps:
1. Clone repo
2. npm install
3. vercel link (create new project "xrpl-control-room")
4. vercel deploy --prod
5. vercel domains add xrplcontrolroom.com
6. Give me DNS records to add

Env vars (use these):
VITE_XRPL_WSS=wss://xrplcluster.com
VITE_XRPL_TESTNET_WSS=wss://s.altnet.rippletest.net:51233

Go fast. Report progress.
```

## Manual Steps If Needed

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Login
```bash
vercel login
```

### 3. Deploy
```bash
cd xrpl-control-room-gamer-ui
vercel --prod
```

### 4. Add Domain
```bash
vercel domains add xrplcontrolroom.com
```

### 5. DNS Records (Add at your registrar)

| Type | Name | Value |
|------|------|-------|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

## After Deployment

Update these files:
- README.md → Add live URL
- SOCIAL-POSTS.md → Replace github links with xrplcontrolroom.com

## Verify

1. Visit https://xrplcontrolroom.com
2. Check /micropayments page loads
3. Check OpenClaw dashboard shows real wallet balance
4. WebSocket connections work (Network tab)

---

*Let's go viral* 🚀
