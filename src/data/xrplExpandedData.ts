// xrplExpandedData.ts - XRPL Ecosystem Data with Verified Links (Updated January 2026)
// Categories: Marketplaces, Community, Events, NFTs, Memes, Wallets, Education

export interface XRPLProject {
  name: string;
  description: string;
  links: string[];
  location: string;
  coordinates?: { lat: number; lng: number };
  category?: string;
}

// ==================== MARKETPLACES ====================
export const xrplMarketplaces: XRPLProject[] = [
  {
    name: "xrp.cafe",
    description: "The #1 NFT marketplace on XRPL with enforced Layer 1 royalties, fast 3-second transactions, and open-source creator tools.",
    links: ["https://xrp.cafe/", "https://twitter.com/xraboratory"],
    location: "Global",
  },
  {
    name: "XPMarket",
    description: "All-in-one XRPL platform for tokens, NFTs, DEX trading, AMM pools, portfolio tracking, and airdrops.",
    links: ["https://xpmarket.com/", "https://twitter.com/XPMarket_"],
    location: "Global",
  },
  {
    name: "Sologenic",
    description: "DEX and NFT marketplace for tokenized securities with 200+ supported assets, Quick Swap, and inter-chain bridge.",
    links: ["https://sologenic.org/", "https://twitter.com/solaboratory"],
    location: "Dubai, UAE",
    coordinates: { lat: 25.2048, lng: 55.2708 },
  },
  {
    name: "OpulenceX",
    description: "NFT marketplace with 1% fees, built-in royalty protection, society staking, and verified artist collections.",
    links: ["https://opulencex.io/", "https://twitter.com/opaboratoryx"],
    location: "Global",
  },
  {
    name: "Bidds (onXRP)",
    description: "Leading XRPL NFT marketplace handling 62% of on-chain volume, integrated as xApp in Xaman wallet.",
    links: ["https://bidds.com/", "https://onxrp.com/", "https://twitter.com/onaboratory"],
    location: "Global",
  },
  {
    name: "First Ledger",
    description: "The fastest way to trade memecoins on XRPL. Launch tokens for 20 XRP with automatic liquidity burn.",
    links: ["https://firstledger.net/", "https://docs.firstledger.net/", "https://twitter.com/First_Ledger"],
    location: "Global",
  },
  {
    name: "Magnetic X",
    description: "Advanced XRPL DEX interface with real-time charts, order books, and token analytics.",
    links: ["https://xmagnetic.org/", "https://twitter.com/AMMaboratory"],
    location: "Global",
  },
  {
    name: "GateHub",
    description: "Gateway and wallet for XRPL with fiat on/off ramps, DEX trading, and issued stablecoins.",
    links: ["https://gatehub.net/", "https://twitter.com/AMMaboratory"],
    location: "UK/Slovenia",
    coordinates: { lat: 46.0569, lng: 14.5058 },
  },
  {
    name: "Orchestra Finance",
    description: "DeFi protocol on XRPL offering lending, borrowing, and yield optimization.",
    links: ["https://orchestra.finance/", "https://twitter.com/OrchestraFi"],
    location: "Global",
  },
  {
    name: "XRP Toolkit",
    description: "Advanced trading interface for XRPL DEX with wallet management and order tools.",
    links: ["https://www.xrptoolkit.com/", "https://twitter.com/AMMaboratory"],
    location: "Global",
  },
];

// ==================== COMMUNITY CONNECTORS ====================
export const xrplCommunityConnectors: XRPLProject[] = [
  {
    name: "IOV Foundation NY",
    description: "Community education project by @deathranger14 focused on XRPL and blockchain education through YouTube content and community engagement.",
    links: ["https://twitter.com/IOVFoundationNY", "https://twitter.com/deathranger14", "https://www.youtube.com/@IOVFoundationNY"],
    location: "New York, USA",
    coordinates: { lat: 40.7128, lng: -74.0060 },
  },
  {
    name: "Casino Coin",
    description: "Regulated gaming and casino project on XRPL. CSC token powers compliant gaming applications, sportsbook, and casino integrations built on the XRP Ledger.",
    links: ["https://casinocoin.org/", "https://twitter.com/CasinoCoin_XRPL", "https://t.me/CasinoCoin"],
    location: "Global",
    coordinates: { lat: 51.5074, lng: -0.1278 },
  },
  {
    name: "Onami Press",
    description: "Community media and coverage for XRPL and the broader crypto ecosystem.",
    links: [],
    location: "Global",
  },
  {
    name: "Genfinity",
    description: "Web3 education and news platform with dedicated XRP and XRPL coverage—protocol updates, institutional DeFi, and ecosystem developments.",
    links: ["https://genfinity.io/", "https://genfinity.io/category/crypto/xrp/"],
    location: "Global",
  },
  {
    name: "Wave of Innovation",
    description: "Ripple's initiative supporting innovation on the XRP Ledger—evolving funding, FinTech Builder Program, and ecosystem support into 2026.",
    links: ["https://ripple.com/insights/supporting-innovation-on-the-xrp-ledger", "https://ripple.com/insights/unlocking-innovation-the-evolution-of-ripples-xrpl-community-support-programs"],
    location: "Global",
  },
  {
    name: "Glow",
    description: "XRPL Commons' retroactive funding program rewarding past contributions to the XRPL ecosystem. Community votes via XRPL wallets; awards in XRP.",
    links: ["https://glow.xrpl-commons.org/", "https://glow-docs.xrpl-commons.org/", "https://www.xrpl-commons.org/newsroom/why-glow-celebrating-xrpl-contributors-2"],
    location: "Paris, France",
    coordinates: { lat: 48.8566, lng: 2.3522 },
  },
  {
    name: "XRPL Bug Bounty Program",
    description: "Newly released bug bounty program (Ripple-sponsored) for stress testing and securing amendments before launch. Covers rippled, xrpl.js, xrpl-py, xrpl4j. Report via responsible disclosure.",
    links: ["https://github.com/XRPLF/rippled/security", "https://xrpl.org/blog/2025/vulnerabilitydisclosurereport-bug-sep2025"],
    location: "Global",
  },
  {
    name: "XRPL Commons",
    description: "Paris-based nonprofit building XRPL community through events, training, hackathons, and the Aquarium residency program.",
    links: ["https://www.xrpl-commons.org/", "https://twitter.com/xrpl_commons"],
    location: "Paris, France",
    coordinates: { lat: 48.8566, lng: 2.3522 },
  },
  {
    name: "Lost Art (OCLostArt)",
    description: "Orange County arts & tech collective hosting LOST conferences, XRPL California meetups, and Web3 education events.",
    links: ["https://www.oclost.art/", "https://twitter.com/OCLostArt"],
    location: "California, USA",
    coordinates: { lat: 33.7175, lng: -117.8311 },
  },
  {
    name: "Anodos Finance",
    description: "DeFi super app with passkey-secured wallet, DEX, and neobank. Opening world's first XRPL Hub in Greece.",
    links: ["https://anodos.finance/", "https://dex.anodos.finance/", "https://twitter.com/AnodosFinance"],
    location: "Thessaloniki, Greece",
    coordinates: { lat: 40.6401, lng: 22.9444 },
  },
  {
    name: "EasyA",
    description: "Web3 education platform partnered with Ripple, hosting hackathons and bringing 1M+ builders to XRPL.",
    links: ["https://www.easya.io/", "https://www.easya.io/challenges", "https://twitter.com/AMMaboratory"],
    location: "Global",
  },
  {
    name: "XRPL Army HQ",
    description: "X Community for sharing XRPL content, projects, and boosting ecosystem visibility.",
    links: ["https://twitter.com/i/communities/1488963786088288260", "https://twitter.com/Spec_0p"],
    location: "Global",
  },
  {
    name: "XRP Lions",
    description: "Active community hosting X Spaces, collaborations, and ecosystem discussions.",
    links: ["https://twitter.com/XRP_LIONS"],
    location: "Global",
  },
  {
    name: "Bithomp",
    description: "XRPL explorer, analytics platform, and community tools provider.",
    links: ["https://bithomp.com/", "https://twitter.com/AMMaboratory"],
    location: "Global",
  },
  {
    name: "XRPL Foundation",
    description: "Independent nonprofit supporting XRPL development, grants, and ecosystem growth.",
    links: ["https://foundation.xrpl.org/", "https://twitter.com/AMMaboratory"],
    location: "Global",
  },
  {
    name: "Ripple Developer Relations",
    description: "Official Ripple team supporting XRPL developers with resources, events, and community engagement.",
    links: ["https://xrpl.org/", "https://twitter.com/RippleXDev"],
    location: "San Francisco, USA",
    coordinates: { lat: 37.7749, lng: -122.4194 },
  },
  {
    name: "XRPL Labs",
    description: "Creators of Xaman wallet and major XRPL infrastructure, driving ecosystem development.",
    links: ["https://xrpl-labs.com/", "https://twitter.com/AMMaboratoryLabs"],
    location: "Netherlands",
    coordinates: { lat: 52.1326, lng: 5.2913 },
  },
];

// ==================== EVENTS & HACKATHONS ====================
// Calendars: https://xrpl.org/community/events · https://www.xrpl-commons.org/engage/events · https://ripple.com/events/all/
export const xrplCommunityEvents: XRPLProject[] = [
  {
    name: "EasyA Consensus Hong Kong Hackathon 2026",
    description: "February 10–12, 2026, Hong Kong. 48-hour hackathon alongside Consensus; partner technology includes XRPL (Ripple). Accepted developers receive a free Consensus ticket.",
    links: ["https://www.easya.io/events/easya-consensus-hong-kong-hackathon", "https://www.easya.io/challenges/xrpledger"],
    location: "Hong Kong",
    coordinates: { lat: 22.3193, lng: 114.1694 },
  },
  {
    name: "Hack The Block 2026 (XRPL @ Paris Blockchain Week)",
    description: "April 11–12, 2026, Paris. Flagship PBW hackathon with XRPL tracks; hosted with XRPL Commons. See also XRPL Zone (Apr 14) and Community Night (Apr 15).",
    links: ["https://lu.ma/Hacktheblock2026-PBW-XRPL", "https://parisblockchainweek.com/xrpl", "https://xrpl.org/community/events"],
    location: "Paris, France",
    coordinates: { lat: 48.8566, lng: 2.3522 },
  },
  {
    name: "XRPLasVegas 2026",
    description: "May 1–2, 2026 at Paris Las Vegas. Large XRP / XRPL community conference.",
    links: ["https://xrplasvegas.com/", "https://twitter.com/AMMaboratory"],
    location: "Las Vegas, USA",
    coordinates: { lat: 36.1699, lng: -115.1398 },
  },
  {
    name: "Consensus Miami 2026",
    description: "May 5–7, 2026. Listed on Ripple’s events calendar; major Americas crypto conference (XRP/XRPL ecosystem).",
    links: ["https://consensus.coindesk.com/", "https://ripple.com/events/all/"],
    location: "Miami, FL, USA",
    coordinates: { lat: 25.7617, lng: -80.1918 },
  },
  {
    name: "EasyA Consensus Miami Hackathon 2026",
    description: "May 5–7, 2026, Miami, FL. 72-hour hackathon alongside Consensus; partner technology includes XRPL (Ripple). Large prize pool; free Consensus ticket for accepted developers.",
    links: ["https://www.easya.io/events/easya-consensus-miami-hackathon", "https://www.easya.io/challenges/xrpledger"],
    location: "Miami, FL, USA",
    coordinates: { lat: 25.7617, lng: -80.1918 },
  },
  {
    name: "Stablecon Europe 2026",
    description: "May 19–20, 2026, Amsterdam. Ripple calendar — stablecoin and payments industry.",
    links: ["https://ripple.com/events/all/"],
    location: "Amsterdam, Netherlands",
    coordinates: { lat: 52.3676, lng: 4.9041 },
  },
  {
    name: "Chain of Blocks Summit EU26",
    description: "May 20–22, 2026, Floriana, Malta. Web3 summit with XRPL Commons participation; cross-chain and RWA themes.",
    links: ["https://lu.ma/8xdc6wgg", "https://www.xrpl-commons.org/engage/events"],
    location: "Floriana, Malta",
    coordinates: { lat: 35.8917, lng: 14.5083 },
  },
  {
    name: "Money20/20 Europe 2026",
    description: "June 2–4, 2026, Amsterdam. Ripple calendar — fintech and payments.",
    links: ["https://europe.money2020.com/", "https://ripple.com/events/all/"],
    location: "Amsterdam, Netherlands",
    coordinates: { lat: 52.3676, lng: 4.9041 },
  },
  {
    name: "XRPL Blockchain Research Summit 2026",
    description: "June 16–17, 2026, Paris. Invitation-only research summit (XRPL Commons).",
    links: ["https://www.xrpl-commons.org/engage/events"],
    location: "Paris, France",
    coordinates: { lat: 48.8566, lng: 2.3522 },
  },
  {
    name: "Point Zero Forum 2026",
    description: "June 23–25, 2026, Zurich. Ripple calendar — digital assets and policy.",
    links: ["https://www.pointzeroforum.ch/", "https://ripple.com/events/all/"],
    location: "Zurich, Switzerland",
    coordinates: { lat: 47.3769, lng: 8.5417 },
  },
  {
    name: "Febraban Tech 2026",
    description: "August 24–26, 2026, São Paulo. Ripple calendar — banking and tech in Latin America.",
    links: ["https://ripple.com/events/all/"],
    location: "São Paulo, Brazil",
    coordinates: { lat: -23.5505, lng: -46.6333 },
  },
  {
    name: "Stablecon USA 2026",
    description: "September 9–11, 2026, Washington, D.C. Ripple calendar — stablecoin ecosystem.",
    links: ["https://ripple.com/events/all/"],
    location: "Washington, D.C., USA",
    coordinates: { lat: 38.9072, lng: -77.0369 },
  },
  {
    name: "SIBOS 2026 (Miami)",
    description: "September 28 – October 1, 2026, Miami, FL. Ripple calendar — global banking and payments.",
    links: ["https://www.sibos.com/", "https://ripple.com/events/all/"],
    location: "Miami, FL, USA",
    coordinates: { lat: 25.7617, lng: -80.1918 },
  },
  {
    name: "Korea Blockchain Week 2026",
    description: "September 30 – October 1, 2026, Seoul. Ripple calendar — regional blockchain week.",
    links: ["https://koreablockchainweek.com/", "https://ripple.com/events/all/"],
    location: "Seoul, South Korea",
    coordinates: { lat: 37.5665, lng: 126.978 },
  },
  {
    name: "Ripple Swell 2026",
    description: "October 27–29, 2026, New York City. Ripple flagship (unified Swell + Apex); XRPL, custody, and payments.",
    links: ["https://ripple.com/events/swell/", "https://ripple.com/events/all/"],
    location: "New York City, USA",
    coordinates: { lat: 40.7128, lng: -74.006 },
  },
  {
    name: "Interledger Summit (annual)",
    description: "Interledger Foundation: yearly summit and hackathon for Open Payments, ILP, and web monetization. Check site for the next city and dates.",
    links: ["https://interledger.org/summit", "https://interledger.org/events"],
    location: "Varies",
  },
  {
    name: "XRP Ledger Apex 2025",
    description: "Ripple’s 2025 developer summit (Singapore). For 2026 flagship programming, follow Ripple Swell and ripple.com/events.",
    links: ["https://xrplaboratory.com/", "https://twitter.com/RippleXDev", "https://ripple.com/events/all/"],
    location: "Singapore",
    coordinates: { lat: 1.3521, lng: 103.8198 },
  },
  {
    name: "LOST 2025 Conference",
    description: "Southern California's leading Web3 art & tech event. Free admission, live presentations, and networking.",
    links: ["https://www.oclost.art/lost2025/", "https://twitter.com/OCLostArt"],
    location: "Fullerton, California",
    coordinates: { lat: 33.8704, lng: -117.9242 },
  },
  {
    name: "EasyA x Ripple Apex Hackathon",
    description: "$25,000 hackathon at XRP Ledger Apex Singapore - June 7-8, 2025. Grand prize $6,000 USDC.",
    links: ["https://www.easya.io/events/easya-ripple-apex-hackathon", "https://twitter.com/AMMaboratory"],
    location: "Singapore",
    coordinates: { lat: 1.3521, lng: 103.8198 },
  },
  {
    name: "XRPL Commons Training (Paris)",
    description: "Free 2-day hands-on XRPL development training at XRPL Commons HQ in Paris.",
    links: ["https://www.xrpl-commons.org/learn/training", "https://docs.xrpl-commons.org/"],
    location: "Paris, France",
    coordinates: { lat: 48.8566, lng: 2.3522 },
  },
  {
    name: "Digital Assets Forum 2026",
    description: "February 5-6, 2026 in London. Industry leaders discussing digital asset regulation and adoption.",
    links: ["https://www.xrpl-commons.org/engage/events"],
    location: "London, UK",
    coordinates: { lat: 51.5074, lng: -0.1278 },
  },
  {
    name: "XRPL Hacks Hackathon",
    description: "Global online hackathon for XRPL developers with prizes and mentorship.",
    links: ["https://xrpl.org/community", "https://twitter.com/RippleXDev"],
    location: "Global (Online)",
  },
  {
    name: "Non Fungible Leaders",
    description: "January 21, 2026 in Paris. NFT and digital art leadership summit.",
    links: ["https://www.xrpl-commons.org/engage/events"],
    location: "Paris, France",
    coordinates: { lat: 48.8566, lng: 2.3522 },
  },
  {
    name: "The Aquarium Residency",
    description: "XRPL Commons program to accelerate and launch XRPL projects with mentorship and funding.",
    links: ["https://www.xrpl-commons.org/the-aquarium"],
    location: "Paris, France",
    coordinates: { lat: 48.8566, lng: 2.3522 },
  },
  {
    name: "XRP Community Day",
    description: "Annual community celebration on X Spaces focusing on ecosystem innovation and updates.",
    links: ["https://twitter.com/RippleXDev"],
    location: "Global (Online)",
  },
];

// ==================== NFT PROJECTS ====================
export const xrplNftProjects: XRPLProject[] = [
  {
    name: "xSPECTAR",
    description: "Premium metaverse and NFT experience on XRPL with virtual real estate and exclusive collectibles.",
    links: ["https://xspectar.com/", "https://twitter.com/AMMaboratory"],
    location: "Global",
  },
  {
    name: "Bored Apes XRP",
    description: "Popular ape-themed NFT collection on XRPL with active community and trading.",
    links: ["https://xrp.cafe/collection/bored-apes-xrp", "https://twitter.com/AMMaboratory"],
    location: "Global",
  },
  {
    name: "XRPL Punks",
    description: "Punk-style avatar NFTs on the XRP Ledger, inspired by iconic crypto art.",
    links: ["https://xrp.cafe/collection/xrpl-punks", "https://twitter.com/AMMaboratory"],
    location: "Global",
  },
  {
    name: "Equilibrium Games",
    description: "Gaming NFTs and play-to-earn ecosystem built on XRPL.",
    links: ["https://equilibrium-games.com/", "https://twitter.com/AMMaboratory"],
    location: "Global",
  },
  {
    name: "XRPL Attendify",
    description: "Mint and distribute NFTs for event attendance verification. Open-source ExpressJS API.",
    links: ["https://github.com/AMMaboratory/AttendifyXRPL"],
    location: "Global",
  },
  {
    name: "Scarface Lion",
    description: "Original 777 Scarface Lion NFTs inspired by a legendary lion. Community-driven collection.",
    links: ["https://xrp.cafe/collection/scarface-lion"],
    location: "Global",
  },
  {
    name: "XRPL EXPO",
    description: "Collaborative NFT collection among verified XRPL artists with staking and DeFi features.",
    links: ["https://opulencex.io/"],
    location: "Global",
  },
  {
    name: "Sana Art NFTs",
    description: "Art NFTs unlocking perks and access to Sana Land metaverse. Mint for 1 XRP.",
    links: ["https://xrp.cafe/collection/sana-art"],
    location: "Global",
  },
  {
    name: "XRP Aliens",
    description: "Alien-themed generative NFT collection with unique traits on XRPL.",
    links: ["https://xrp.cafe/collection/xrp-aliens"],
    location: "Global",
  },
  {
    name: "Ledger City",
    description: "Virtual city NFT project with land ownership and building on XRPL.",
    links: ["https://ledgercity.io/"],
    location: "Global",
  },
];

// ==================== MEME COINS ====================
export const xrplMemeProjects: XRPLProject[] = [
  {
    name: "XMEME",
    description: "OG XRPL meme coin, community-owned shape-shifting token pioneering memecoins on XRPL DEX.",
    links: ["https://xmagnetic.org/tokens/XMEME+r4UPddYeGeZgDhSGPkooURsQtmGda4oYQW", "https://twitter.com/xmemecoinxrpl"],
    location: "Global",
  },
  {
    name: "ARMY",
    description: "Community-driven XRPL meme coin focused on holder growth and engagement.",
    links: ["https://xpmarket.com/token/ARMY", "https://xmagnetic.org/"],
    location: "Global",
  },
  {
    name: "FUZZY",
    description: "Top XRPL meme coin leveraging fast transactions and low fees for viral trading.",
    links: ["https://xpmarket.com/", "https://firstledger.net/"],
    location: "Global",
  },
  {
    name: "PHNIX",
    description: "Phoenix-themed XRPL meme coin with strong 2026 performance and active community.",
    links: ["https://xpmarket.com/", "https://xmagnetic.org/"],
    location: "Global",
  },
  {
    name: "XRP Lions (LION)",
    description: "Lion-themed meme project with X Spaces, collaborations, and community events.",
    links: ["https://twitter.com/XRP_LIONS", "https://xmagnetic.org/"],
    location: "Global",
  },
  {
    name: "Big Balls XRP",
    description: "Meme project with bold branding and XRPL community focus.",
    links: ["https://twitter.com/BigBallsXRPL", "https://xpmarket.com/"],
    location: "Global",
  },
  {
    name: "DROP",
    description: "XRPL memecoin with airdrop mechanics and holding incentives.",
    links: ["https://xpmarket.com/", "https://firstledger.net/"],
    location: "Global",
  },
  {
    name: "Bored Seal ($SEALED)",
    description: "Meme NFT hybrid project on XRPL, legacy from Ethereum with cross-chain community.",
    links: ["https://twitter.com/boredseal_nft", "https://xrp.cafe/"],
    location: "Global",
  },
  {
    name: "SLT (Salt)",
    description: "Salt-themed meme coin on XRPL with active trading community.",
    links: ["https://xpmarket.com/", "https://xmagnetic.org/"],
    location: "Global",
  },
  {
    name: "ATM XRPL",
    description: "Meme project with community collaborations and regular engagement events.",
    links: ["https://twitter.com/ATM_xrpl", "https://xpmarket.com/"],
    location: "Global",
  },
];

// ==================== WALLETS ====================
export const xrplWallets: XRPLProject[] = [
  {
    name: "Xaman (formerly XUMM)",
    description: "Leading self-custody XRPL wallet with 500K+ users, biometric security, and xApp ecosystem.",
    links: ["https://xaman.app/", "https://twitter.com/AMMaboratory"],
    location: "Netherlands",
    coordinates: { lat: 52.1326, lng: 5.2913 },
  },
  {
    name: "GemWallet",
    description: "Non-custodial browser extension for XRPL with developer APIs. Chrome and Firefox support.",
    links: ["https://gemwallet.app/", "https://twitter.com/AMMaboratory"],
    location: "Global",
  },
  {
    name: "Crossmark",
    description: "Browser-first XRPL wallet with Cards feature, custom network support, and built-in ecosystem apps.",
    links: ["https://crossmark.io/", "https://twitter.com/AMMaboratory"],
    location: "Global",
  },
  {
    name: "Anodos Wallet",
    description: "First passkey-secured XRPL wallet with instant setup via device biometrics. Part of Anodos DeFi platform.",
    links: ["https://anodos.finance/", "https://twitter.com/AnodosFinance"],
    location: "Greece",
    coordinates: { lat: 37.9838, lng: 23.7275 },
  },
  {
    name: "Ledger",
    description: "Hardware wallet supporting XRPL with industry-leading security for cold storage.",
    links: ["https://www.ledger.com/", "https://www.ledger.com/coin/wallet/ripple"],
    location: "Paris, France",
    coordinates: { lat: 48.8566, lng: 2.3522 },
  },
  {
    name: "Trezor",
    description: "Open-source hardware wallet with XRP support and advanced security features.",
    links: ["https://trezor.io/", "https://trezor.io/learn/a/ripple-xrp"],
    location: "Prague, Czech Republic",
    coordinates: { lat: 50.0755, lng: 14.4378 },
  },
  {
    name: "Solo Wallet",
    description: "Sologenic ecosystem wallet for SOLO, XRP, and tokenized assets on iOS/Android.",
    links: ["https://www.sologenic.com/", "https://twitter.com/AMMaboratory"],
    location: "Global",
  },
  {
    name: "D'CENT Wallet",
    description: "Biometric hardware wallet with secure XRPL support and offline key storage.",
    links: ["https://dcentwallet.com/", "https://store.dcentwallet.com/"],
    location: "South Korea",
    coordinates: { lat: 37.5665, lng: 126.978 },
  },
  {
    name: "Bifrost Wallet",
    description: "Multi-chain wallet by TowoLabs supporting XRPL, Ethereum, and other networks.",
    links: ["https://bifrostwallet.com/", "https://twitter.com/AMMaboratory"],
    location: "Global",
  },
  {
    name: "Tangem",
    description: "NFC card wallet integrated with Xaman for cold storage without seed phrases.",
    links: ["https://tangem.com/", "https://twitter.com/AMMaboratory"],
    location: "Switzerland",
    coordinates: { lat: 47.3769, lng: 8.5417 },
  },
];

// ==================== EDUCATION ====================
export const xrplEducation: XRPLProject[] = [
  {
    name: "IOV Foundation NY (YouTube)",
    description: "Educational YouTube channel by @deathranger14 covering XRPL technology, blockchain fundamentals, and community updates.",
    links: ["https://www.youtube.com/@IOVFoundationNY", "https://twitter.com/IOVFoundationNY", "https://twitter.com/deathranger14"],
    location: "New York, USA",
    coordinates: { lat: 40.7128, lng: -74.0060 },
  },
  {
    name: "XRPL Learning Portal",
    description: "Official learn.xrpl.org with beginner to advanced courses, DeFi Island 3D experience, and progress tracking.",
    links: ["https://learn.xrpl.org/", "https://learn.xrpl.org/course/intro-to-the-xrpl/"],
    location: "Global (Online)",
  },
  {
    name: "XRPL.org Documentation",
    description: "Comprehensive official documentation for XRPL developers with tutorials, references, and guides.",
    links: ["https://xrpl.org/docs/", "https://xrpl.org/docs/tutorials/"],
    location: "Global (Online)",
  },
  {
    name: "EasyA XRPL Challenges",
    description: "15 bite-sized XRPL coding challenges with 140K+ builders. Partner program with Ripple.",
    links: ["https://www.easya.io/challenges", "https://www.easya.io/challenges/xrpledger"],
    location: "Global (Online)",
  },
  {
    name: "XRPL Commons Training",
    description: "Free 2-day hands-on training in Paris covering asset issuance, transfers, and XRPL development.",
    links: ["https://www.xrpl-commons.org/learn/training", "https://docs.xrpl-commons.org/"],
    location: "Paris, France",
    coordinates: { lat: 48.8566, lng: 2.3522 },
  },
  {
    name: "Udemy: XRP Ledger Bootcamp",
    description: "Complete XRPL developer bootcamp covering fundamentals to advanced topics.",
    links: ["https://www.udemy.com/course/the-complete-xrp-ledger-developer-bootcamp-stage-1/"],
    location: "Global (Online)",
  },
  {
    name: "Udemy: Complete Guide to XRP & Ripple",
    description: "Comprehensive course on XRP, Ripple technology, and the XRPL ecosystem.",
    links: ["https://www.udemy.com/course/the-complete-guide-to-xrp-ripple/"],
    location: "Global (Online)",
  },
  {
    name: "XRPL GitHub Resources",
    description: "Official XRPL GitHub with SDKs, libraries, and example code for all major languages.",
    links: ["https://github.com/XRPLF", "https://github.com/ripple"],
    location: "Global (Online)",
  },
  {
    name: "Ripple Developer Portal",
    description: "Resources for building on XRPL including APIs, tools, and integration guides.",
    links: ["https://xrpl.org/", "https://xrpl.org/resources/dev-tools/"],
    location: "Global (Online)",
  },
  {
    name: "XRPL EVM Sidechain Docs",
    description: "Documentation for XRPL's EVM-compatible sidechain enabling Solidity smart contracts.",
    links: ["https://docs.xrplevm.org/", "https://xrplevm.org/"],
    location: "Global (Online)",
  },
  {
    name: "awesome-xrpl GitHub",
    description: "Community-curated list of XRPL resources, tools, libraries, and projects.",
    links: ["https://github.com/AMMaboratory/awesome-xrpl"],
    location: "Global (Online)",
  },
];

// ==================== COMBINED CATEGORIES ====================
export const xrplCategories = {
  marketplaces: { name: 'Marketplaces', data: xrplMarketplaces, icon: '🏪', color: 'cyber-green' },
  community: { name: 'Community', data: xrplCommunityConnectors, icon: '🤝', color: 'cyber-magenta' },
  events: { name: 'Events & Hackathons', data: xrplCommunityEvents, icon: '📅', color: 'cyber-cyan' },
  nfts: { name: 'NFT Projects', data: xrplNftProjects, icon: '🎨', color: 'cyber-purple' },
  memes: { name: 'Meme Coins', data: xrplMemeProjects, icon: '🐸', color: 'cyber-yellow' },
  wallets: { name: 'Wallets', data: xrplWallets, icon: '👛', color: 'cyber-blue' },
  education: { name: 'Education', data: xrplEducation, icon: '📚', color: 'cyber-orange' },
};

// Get all projects with location data for map markers
export const getAllProjectsWithLocations = () => {
  const allProjects: (XRPLProject & { category: string })[] = [];
  
  Object.entries(xrplCategories).forEach(([key, category]) => {
    category.data.forEach(project => {
      if (project.coordinates) {
        allProjects.push({ ...project, category: key });
      }
    });
  });
  
  return allProjects;
};

// Get all projects
export const getAllProjects = () => {
  const allProjects: (XRPLProject & { category: string })[] = [];
  
  Object.entries(xrplCategories).forEach(([key, category]) => {
    category.data.forEach(project => {
      allProjects.push({ ...project, category: key });
    });
  });
  
  return allProjects;
};
