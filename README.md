# 🎮 XRPL Control Room - Gamer UI

A cyberpunk-inspired **institutional-grade trading terminal** for monitoring the XRP Ledger ecosystem. Built with React 19, TypeScript, and Tailwind CSS.

![XRPL Control Room](https://img.shields.io/badge/XRPL-Control%20Room-00d4ff?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMGQ0ZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjwvc3ZnPg==)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite)

## ✨ Features

### 📊 Terminal (NEW - Institutional Trading)
- **Real-Time Price Feeds** - WebSocket connection to Binance for live BTC, ETH, XRP, SOL, DOGE prices
- **Liquidation Heatmap** - Visualize leveraged position liquidation zones with risk scoring
- **Order Book Depth** - Live bid/ask ladders with spread analysis and imbalance detection
- **Advanced Risk Metrics** - VaR (95%/99%), CVaR, Sharpe, Sortino, Calmar ratios
- **Position Sizing Tools** - Kelly Criterion, Fixed Fractional, Volatility-Adjusted, Risk Parity
- **Stress Testing** - Predefined scenarios (Black Monday, COVID crash, Flash crash, Rate hike)
- **Multi-Channel Alerts** - Telegram, Discord, browser push notifications
- **Paper Trading** - Risk-free practice with 24 crypto pairs and auto-trader bot

### 🧠 Memetic Lab
- **Game Theory Scenarios** - Prisoner's Dilemma, Stag Hunt, Pump & Dump detection
- **Cognitive Security** - Defense against narrative warfare, FUD, Sybil attacks
- **Social Engineering Simulator** - Test your defenses against manipulation tactics
- **AI Quantum Analytics** - Nash equilibrium analysis, memetic propagation models
- **Prediction Markets** - Polymarket/Kalshi integration with signal fusion
- **Whale Tracking** - Monitor large transactions and whale wallet activity

### 🏠 Home Dashboard
- **Digital Profile Panel** - Avatar, reputation, social score, skill points
- **Drag & Drop Simulation** - Interactive DEX, AMM, and VOTE nodes
- **Ledger Impact Tool** - Risk analysis and real-time metrics
- **Xaman Wallet Integration** - QR code connection
- **Live Feeds** - Twitter/X and GitHub activity streams

### 🗺️ World Map
- **Interactive World Map** - Global XRPL network visualization
- **Payment Corridors** - ILP corridor volume and routing data
- **Node Hotspots** - Validator locations and health metrics
- **Regional Analytics** - TPS charts and distribution stats
- **Live Data Toggle** - Switch between live XRPScan data and static view

### 💀 Underworld
- **Regulatory Intelligence** - Real-time tracking of crypto regulations
- **Risk Radar** - Compliance metrics by jurisdiction
- **SEC/CFTC Monitoring** - GENIUS Act, EO 14178 summaries
- **Alert Ticker** - Breaking regulatory news

### 👤 Character
- **XP & Leveling System** - Gamified progression
- **Achievement Badges** - Unlock rewards for milestones
- **Leaderboard** - Top XRPL contributors
- **Community Events** - Calendar integration

### 🏥 Clinic
- **Portfolio Diagnostics** - Health scoring and recommendations
- **Stablecoin Metrics** - RLUSD tracking
- **ETF Analysis** - Inflow/outflow monitoring
- **Resource Library** - SDKs, documentation, tutorials

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 19 + TypeScript 5 |
| **Build Tool** | Vite 5.4 |
| **Styling** | Tailwind CSS 3 |
| **Routing** | React Router DOM 7 |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **State** | Zustand |
| **Data Fetching** | TanStack Query (React Query) |
| **Real-Time Data** | WebSockets (Binance, XRPL) |
| **Icons** | Lucide React |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Shellfish011235/xrpl-control-room-gamer-ui.git

# Navigate to project directory
cd xrpl-control-room-gamer-ui

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## 📁 Project Structure

```
xrpl-control-room-gamer-ui/
├── src/
│   ├── components/
│   │   ├── institutional/        # Trading terminal components
│   │   │   ├── AlertBuilder.tsx
│   │   │   ├── LiquidationHeatmap.tsx
│   │   │   ├── OrderBookDepth.tsx
│   │   │   └── RiskDashboard.tsx
│   │   ├── Navigation.tsx
│   │   ├── PaperTradingPanel.tsx
│   │   └── WalletConnect.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Terminal.tsx          # Institutional trading terminal
│   │   ├── MemeticLab.tsx        # Game theory & cognitive security
│   │   ├── WorldMap.tsx
│   │   ├── Underworld.tsx
│   │   ├── Character.tsx
│   │   └── Clinic.tsx
│   ├── services/
│   │   ├── websocketPriceFeeds.ts    # Real-time price aggregation
│   │   ├── liquidationHeatmap.ts     # Liquidation zone analysis
│   │   ├── advancedRiskMetrics.ts    # Portfolio risk calculations
│   │   ├── alertNotifications.ts     # Multi-channel notifications
│   │   ├── aiQuantumAnalytics.ts     # AI/ML prediction models
│   │   ├── predictionMarkets.ts      # Market sentiment integration
│   │   └── xrplService.ts            # XRPL WebSocket connection
│   ├── store/
│   │   ├── paperTradingStore.ts
│   │   └── globeStore.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── COMPETITIVE-ANALYSIS.md       # Market positioning research
├── INSTITUTIONAL-UPGRADE-PLAN.md # Development roadmap
└── package.json
```

## 🎨 Design Philosophy

This dashboard features a **cyberpunk/gaming aesthetic** inspired by:
- Sci-fi HUD interfaces
- Neon color palettes (cyan, purple, green accents)
- Glowing borders and animated grids
- Dark theme with high contrast elements
- Smooth micro-interactions and transitions

### Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Cyber Glow | `#00d4ff` | Primary accent, highlights |
| Cyber Purple | `#a855f7` | Secondary accent |
| Cyber Green | `#00ff88` | Success states, profits |
| Cyber Yellow | `#ffd700` | Warnings, achievements |
| Cyber Red | `#ff4444` | Errors, alerts, losses |
| Cyber Dark | `#0a0f1a` | Background |

## 🔌 API Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| **XRPL WebSocket** | Ledger index, live feed | ✅ Live |
| **CoinGecko** | XRP price in nav bar | ✅ Live |
| **Binance WebSocket** | Real-time orderbook, trades | ✅ Live (Terminal) |
| **XRPL Pathfinding** | Payment routing (ripple_path_find) | ✅ Live |
| **World Globe** | 2D map visualization | ✅ Fixed |
| **CoinGlass** | Liquidation data | 🔧 Ready for API key |
| **Telegram Bot API** | Alert notifications | 🔧 Ready for token |
| **Discord Webhooks** | Alert notifications | 🔧 Ready for webhook URL |

## 🌐 Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

### Netlify
```bash
npm run build
# Deploy the `dist` folder
```

### Docker
```bash
docker build -t xrpl-control-room .
docker run -p 3000:3000 xrpl-control-room
```

## 🗺️ Roadmap

- [x] Real-time WebSocket price feeds (Terminal)
- [x] Liquidation heatmap visualization (Terminal)
- [x] Advanced risk metrics (VaR, Sharpe, etc.)
- [x] Multi-channel alert system
- [x] Paper trading simulator
- [x] Game theory & cognitive security lab
- [x] World Map with error handling and fallback CDNs
- [x] XRPL Pathfinding with live mainnet connection
- [ ] Backtesting engine with historical data
- [ ] Advanced order types (TWAP, iceberg)
- [ ] REST API for external integrations
- [ ] PostgreSQL/TimescaleDB for tick data
- [ ] Mobile responsive optimization

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🔗 Links

- [XRPL Documentation](https://xrpl.org)
- [Ripple Developer Portal](https://ripple.com/build)
- [XRP Ledger Foundation](https://foundation.xrpl.org)
- [CoinGecko API](https://www.coingecko.com/en/api)
- [Binance WebSocket API](https://binance-docs.github.io/apidocs/spot/en/#websocket-market-streams)

---

Built with 💙 for the XRPL Community
