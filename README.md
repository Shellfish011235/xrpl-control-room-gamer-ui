# 🎮 XRPL Control Room - Gamer UI

A cyberpunk-inspired gamified dashboard for monitoring the XRP Ledger ecosystem. Built with React, TypeScript, and Tailwind CSS.

![XRPL Control Room](https://img.shields.io/badge/XRPL-Control%20Room-00d4ff?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMGQ0ZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjwvc3ZnPg==)

## ✨ Features

### 🏠 Home Dashboard
- **Digital Profile Panel** - Avatar, reputation, social score, skill points
- **Drag & Drop Simulation** - Interactive DEX, AMM, and VOTE nodes
- **Ledger Impact Tool** - Risk analysis and real-time metrics
- **Xaman Wallet Integration** - QR code connection
- **Live Feeds** - Twitter/X and GitHub activity streams

### 🗺️ World Map
- Interactive global network visualization
- XRPL node hotspots and validator locations
- Region filters and network statistics
- TPS charts and distribution analytics

### 💀 Underworld
- Regulatory intelligence monitoring
- Risk radar with compliance metrics
- Jurisdiction comparison scores
- SEC/CFTC, GENIUS Act, EO 14178 summaries
- Real-time regulatory alert ticker

### 👤 Character
- Digital profile with XP and leveling system
- Achievement badges and unlockables
- Top XRPL contributors leaderboard
- Community events calendar
- Social links (Reddit, Discord, XRPL Commons)

### 🏥 Clinic
- Portfolio health diagnostics
- RLUSD and stablecoin metrics
- ETF inflow/outflow analysis
- Projection calculator
- Resource library (SDKs, docs, tutorials)

## 🛠️ Tech Stack

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS 3
- **Routing:** React Router DOM 7
- **Animations:** Framer Motion
- **Charts:** Recharts
- **State:** Zustand
- **Data Fetching:** TanStack Query
- **Icons:** Lucide React

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/shellfish011235/xrpl-control-room-gamer-ui.git

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
| Cyber Green | `#00ff88` | Success states |
| Cyber Yellow | `#ffd700` | Warnings, achievements |
| Cyber Red | `#ff4444` | Errors, alerts |
| Cyber Dark | `#0a0f1a` | Background |

## 📁 Project Structure

```
xrpl-control-room-gamer-ui/
├── src/
│   ├── components/
│   │   └── Navigation.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── WorldMap.tsx
│   │   ├── Underworld.tsx
│   │   ├── Character.tsx
│   │   └── Clinic.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

## 🌐 Deployment

### Vercel
```bash
npm i -g vercel
vercel
```

### Netlify
```bash
npm run build
# Deploy the `dist` folder
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🔗 Links

- [XRPL Documentation](https://xrpl.org)
- [Ripple Developer Portal](https://ripple.com/build)
- [XRP Ledger Foundation](https://foundation.xrpl.org)

---

Built with 💙 for the XRPL Community
