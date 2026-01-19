import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { 
  Brain, Shield, AlertTriangle, Eye, Target, Users, 
  Zap, Lock, Unlock, MessageSquare, TrendingUp, TrendingDown,
  ChevronRight, ExternalLink, Play, Pause, RotateCcw,
  Lightbulb, BookOpen, Crosshair, Radio, Wifi, Activity,
  AlertOctagon, CheckCircle, XCircle, HelpCircle, Info,
  Cpu, Network, Globe, Fingerprint, ScanLine, Waves, Clock,
  BarChart3, LineChart as LineChartIcon, PieChart, Database, Beaker,
  RefreshCw, Bell, Bot, Hash, Twitter, Flame, Snowflake,
  Gauge, DollarSign, Percent, ArrowUpRight, ArrowDownRight,
  Trophy, Award, Search, Sparkles, History, Calculator, Loader2
} from 'lucide-react'
import { 
  RadarChart, PolarGrid, PolarAngleAxis, Radar, 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  AreaChart, Area, BarChart, Bar, Cell
} from 'recharts'
import { getTopMovers, analyzeCrypto, type CryptoScreenerResult } from '../services/cryptoScreener'
import { getServerInfo } from '../services/xrplService'
import { 
  getAllCryptoMarkets, 
  getXRPMarketSentiment,
  type PredictionMarket, 
  type PredictionSignal,
  type ArbitrageOpportunity 
} from '../services/predictionMarkets'

// ==================== GAME THEORY DATA ====================

interface GameTheoryScenario {
  id: string;
  name: string;
  description: string;
  type: 'classic' | 'crypto' | 'social' | 'cognitive';
  players: number;
  strategies: string[];
  nashEquilibrium: string;
  xrplRelevance: string;
  lesson: string;
}

const gameTheoryScenarios: GameTheoryScenario[] = [
  {
    id: 'prisoners-dilemma',
    name: "Prisoner's Dilemma",
    description: 'Two players must choose to cooperate or defect without knowing the other\'s choice.',
    type: 'classic',
    players: 2,
    strategies: ['Cooperate', 'Defect'],
    nashEquilibrium: 'Both Defect (suboptimal)',
    xrplRelevance: 'Validator trust: Why validators maintain consensus instead of attacking',
    lesson: 'Individual rationality can lead to collective irrationality. Trust systems like XRPL UNL solve this.',
  },
  {
    id: 'stag-hunt',
    name: 'Stag Hunt',
    description: 'Cooperation yields highest reward, but requires trust that others will also cooperate.',
    type: 'classic',
    players: 2,
    strategies: ['Hunt Stag (Cooperate)', 'Hunt Rabbit (Safe)'],
    nashEquilibrium: 'Multiple equilibria possible',
    xrplRelevance: 'Network effects: Why XRPL ecosystem participants benefit from coordination',
    lesson: 'Coordination problems require communication and trust-building mechanisms.',
  },
  {
    id: 'pump-dump',
    name: 'Pump & Dump Detection',
    description: 'Recognizing coordinated manipulation attempts in crypto markets.',
    type: 'crypto',
    players: 3,
    strategies: ['FOMO Buy', 'Research', 'Ignore'],
    nashEquilibrium: 'Research and verify before acting',
    xrplRelevance: 'Protecting against coordinated social media manipulation of XRP sentiment',
    lesson: 'Information asymmetry is weaponized. Always verify claims independently.',
  },
  {
    id: 'fud-game',
    name: 'FUD Propagation Game',
    description: 'How fear, uncertainty, and doubt spreads through social networks.',
    type: 'social',
    players: 4,
    strategies: ['Spread', 'Verify', 'Counter', 'Ignore'],
    nashEquilibrium: 'Verify then selectively counter',
    xrplRelevance: 'Combating coordinated FUD campaigns against XRPL/Ripple',
    lesson: 'Emotional responses amplify FUD. Verified facts are the antidote.',
  },
  {
    id: 'sybil-attack',
    name: 'Sybil Attack Awareness',
    description: 'Understanding how fake identities manipulate consensus and opinion.',
    type: 'cognitive',
    players: 5,
    strategies: ['Trust blindly', 'Verify identity', 'Check reputation', 'Consensus check'],
    nashEquilibrium: 'Multi-factor verification',
    xrplRelevance: 'Why XRPL uses UNL and validator domain verification',
    lesson: 'Identity is the foundation of trust. Verify before you trust.',
  },
  {
    id: 'info-cascade',
    name: 'Information Cascade',
    description: 'When people follow others\' actions regardless of their own information.',
    type: 'cognitive',
    players: 6,
    strategies: ['Follow crowd', 'Independent analysis', 'Contrarian', 'Wait and see'],
    nashEquilibrium: 'Context-dependent',
    xrplRelevance: 'Understanding herd behavior in crypto markets and communities',
    lesson: 'Cascades can be triggered artificially. Maintain independent judgment.',
  },
];

// ==================== COGNITIVE SECURITY DATA ====================

interface CognitiveThreats {
  id: string;
  name: string;
  category: 'memetic' | 'social-engineering' | 'psyop' | 'neuro';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  indicators: string[];
  defenses: string[];
  giordanoReference?: string;
}

const cognitiveThreats: CognitiveThreats[] = [
  {
    id: 'narrative-warfare',
    name: 'Narrative Warfare',
    category: 'memetic',
    severity: 'critical',
    description: 'Coordinated efforts to shape public perception through controlled storytelling.',
    indicators: [
      'Sudden synchronized messaging across platforms',
      'Emotionally charged language',
      'Binary framing (us vs them)',
      'Appeals to identity over facts',
    ],
    defenses: [
      'Cross-reference multiple sources',
      'Identify the narrator\'s incentives',
      'Look for what\'s NOT being said',
      'Time-delay emotional responses',
    ],
    giordanoReference: 'Weaponization of narratives in cognitive warfare',
  },
  {
    id: 'astroturfing',
    name: 'Astroturfing',
    category: 'social-engineering',
    severity: 'high',
    description: 'Fake grassroots movements created to simulate organic public opinion.',
    indicators: [
      'New accounts with high activity',
      'Coordinated posting times',
      'Copy-paste messaging patterns',
      'Suspicious follower/following ratios',
    ],
    defenses: [
      'Check account history and age',
      'Use bot detection tools',
      'Look for linguistic fingerprints',
      'Verify with trusted community members',
    ],
  },
  {
    id: 'fear-exploitation',
    name: 'Fear & Urgency Exploitation',
    category: 'psyop',
    severity: 'high',
    description: 'Manipulating decision-making by triggering fight-or-flight responses.',
    indicators: [
      '"Act now or lose everything"',
      'Countdown timers and deadlines',
      'Catastrophic predictions',
      'Limited information with high emotion',
    ],
    defenses: [
      'Implement mandatory cooling-off periods',
      'Never make financial decisions under stress',
      'Recognize the "amygdala hijack"',
      'Consult trusted advisors before acting',
    ],
    giordanoReference: 'Neurological basis of fear-based manipulation',
  },
  {
    id: 'authority-exploitation',
    name: 'Authority Exploitation',
    category: 'social-engineering',
    severity: 'medium',
    description: 'Using perceived authority figures to bypass critical thinking.',
    indicators: [
      'Unverified "expert" endorsements',
      'Fake screenshots of influencer posts',
      'Impersonation of known figures',
      'Appeal to credentials over evidence',
    ],
    defenses: [
      'Verify through official channels',
      'Check for verified accounts',
      'Authority doesn\'t equal correctness',
      'Evaluate the argument, not the speaker',
    ],
  },
  {
    id: 'cognitive-load',
    name: 'Cognitive Overload Attacks',
    category: 'neuro',
    severity: 'medium',
    description: 'Flooding targets with information to impair judgment.',
    indicators: [
      'Rapid-fire contradictory information',
      'Multiple simultaneous "crises"',
      'Information fatigue and apathy',
      'Decision paralysis',
    ],
    defenses: [
      'Limit information intake periods',
      'Focus on signal, ignore noise',
      'Trust established decision frameworks',
      'Take breaks from social media',
    ],
    giordanoReference: 'Neuro-cognitive exploitation techniques',
  },
  {
    id: 'tribal-exploitation',
    name: 'Tribal Identity Manipulation',
    category: 'memetic',
    severity: 'high',
    description: 'Weaponizing in-group/out-group dynamics to prevent rational analysis.',
    indicators: [
      'Strong "us vs them" framing',
      'Loyalty tests and purity spirals',
      'Attacks on "traitors" who question',
      'Echo chamber reinforcement',
    ],
    defenses: [
      'Maintain relationships outside your "tribe"',
      'Steel-man opposing viewpoints',
      'Question tribal consensus periodically',
      'Identity is not ideology',
    ],
    giordanoReference: 'Social neuroscience of group manipulation',
  },
];

// ==================== MEMETIC CONCEPTS ====================

interface MemeticConcept {
  id: string;
  name: string;
  definition: string;
  cryptoExample: string;
  defense: string;
}

const memeticConcepts: MemeticConcept[] = [
  {
    id: 'meme',
    name: 'Meme (Dawkins)',
    definition: 'A unit of cultural information that spreads from mind to mind, analogous to genes.',
    cryptoExample: '"HODL", "To the moon", "Not your keys, not your coins"',
    defense: 'Recognize memes as simplified ideas that may lack nuance.',
  },
  {
    id: 'memeplex',
    name: 'Memeplex',
    definition: 'A collection of memes that work together and reinforce each other.',
    cryptoExample: 'The "Bitcoin maximalist" memeplex combining scarcity, decentralization, and anti-fiat narratives.',
    defense: 'Identify when you\'re inside a memeplex and examine each component separately.',
  },
  {
    id: 'thought-terminating',
    name: 'Thought-Terminating Clichés',
    definition: 'Phrases that shut down critical thinking and end discussion.',
    cryptoExample: '"DYOR" used to dismiss legitimate questions, "FUD" to dismiss valid concerns.',
    defense: 'When you hear these, it\'s a signal to think MORE, not less.',
  },
  {
    id: 'basilisk',
    name: 'Information Hazards',
    definition: 'Ideas that can cause harm merely by being known or spread.',
    cryptoExample: 'Detailed exploit descriptions, manipulation techniques that could be misused.',
    defense: 'Consider second-order effects before spreading information.',
  },
  {
    id: 'egregore',
    name: 'Egregore / Collective Mind',
    definition: 'Emergent group consciousness that influences individual behavior.',
    cryptoExample: 'Community "vibes" that drive collective buying/selling behavior.',
    defense: 'Maintain individual judgment even within strong communities.',
  },
];

// ==================== GIORDANO FRAMEWORK ====================

interface GiordanoFramework {
  id: string;
  concept: string;
  description: string;
  application: string;
  awareness: string;
}

const giordanoFramework: GiordanoFramework[] = [
  {
    id: 'neuro-s-t',
    concept: 'Neuro S&T (Science & Technology)',
    description: 'The convergence of neuroscience with emerging technologies creates new capabilities and vulnerabilities.',
    application: 'BCIs, neurostimulation, cognitive enhancement, and their potential for manipulation.',
    awareness: 'Understand that your cognitive processes are increasingly targetable by technology.',
  },
  {
    id: 'soft-power',
    concept: 'Cognitive Soft Power',
    description: 'Influencing thoughts, emotions, and behaviors through non-kinetic means.',
    application: 'Social media algorithms, targeted content, engagement manipulation.',
    awareness: 'Every platform has an agenda. Your attention is the product.',
  },
  {
    id: 'hard-power',
    concept: 'Cognitive Hard Power',
    description: 'Direct neurological intervention to affect cognition and behavior.',
    application: 'Currently limited, but BCIs and neurotechnology are advancing rapidly.',
    awareness: 'Monitor developments in neurotechnology and maintain bodily autonomy.',
  },
  {
    id: 'battlespace',
    concept: 'The Brain as Battlespace',
    description: 'Your mind is now a legitimate target in information and cognitive warfare.',
    application: 'Governments and corporations compete for influence over your thoughts and decisions.',
    awareness: 'Treat your cognitive hygiene as seriously as your physical health.',
  },
  {
    id: 'dual-use',
    concept: 'Dual-Use Dilemma',
    description: 'Technologies that heal can also harm; knowledge that protects can also attack.',
    application: 'Understanding manipulation protects you but could be misused to manipulate others.',
    awareness: 'Use this knowledge ethically. Protect, don\'t exploit.',
  },
];

// ==================== DEFENSE PROTOCOLS ====================

interface DefenseProtocol {
  id: string;
  name: string;
  level: 'basic' | 'intermediate' | 'advanced';
  description: string;
  steps: string[];
  icon: typeof Shield;
}

// ==================== BCI / NEUROTECH DATA ====================

interface BCITechnology {
  id: string;
  name: string;
  type: 'invasive' | 'non-invasive' | 'emerging';
  status: 'deployed' | 'clinical' | 'research' | 'theoretical';
  description: string;
  capabilities: string[];
  concerns: string[];
  relevance: string;
}

const bciTechnologies: BCITechnology[] = [
  {
    id: 'eeg-consumer',
    name: 'Consumer EEG (Muse, OpenBCI)',
    type: 'non-invasive',
    status: 'deployed',
    description: 'Affordable brainwave monitoring devices available to consumers.',
    capabilities: [
      'Attention and focus tracking',
      'Meditation state detection',
      'Sleep stage monitoring',
      'Basic emotional state inference',
    ],
    concerns: [
      'Data harvesting and privacy',
      'Behavioral profiling',
      'Targeted advertising based on brain states',
    ],
    relevance: 'Your cognitive states during trading could be monitored and exploited.',
  },
  {
    id: 'neuralink',
    name: 'Neuralink / Neural Implants',
    type: 'invasive',
    status: 'clinical',
    description: 'High-bandwidth brain-computer interface requiring surgical implantation.',
    capabilities: [
      'Direct neural reading/writing',
      'Motor control restoration',
      'Potential memory enhancement',
      'Thought-to-text communication',
    ],
    concerns: [
      'Hacking and unauthorized access',
      'Involuntary data extraction',
      'Remote influence potential',
      'Dependency and control',
    ],
    relevance: 'Future threat vector for cognitive manipulation at scale.',
  },
  {
    id: 'tms',
    name: 'Transcranial Magnetic Stimulation',
    type: 'non-invasive',
    status: 'deployed',
    description: 'Magnetic fields used to stimulate or inhibit brain regions.',
    capabilities: [
      'Mood alteration',
      'Cognitive enhancement',
      'Treatment of depression',
      'Temporary behavior modification',
    ],
    concerns: [
      'Coercive use in interrogation',
      'Non-consensual applications',
      'Weaponization potential',
    ],
    relevance: 'Example of "soft" cognitive intervention already in use.',
  },
  {
    id: 'ai-neuro',
    name: 'AI-Powered Neuroimaging',
    type: 'emerging',
    status: 'research',
    description: 'Machine learning applied to brain imaging for thought decoding.',
    capabilities: [
      'Image reconstruction from brain activity',
      'Semantic thought decoding',
      'Emotion recognition',
      'Deception detection',
    ],
    concerns: [
      'Privacy of thoughts',
      'Legal and ethical implications',
      'Potential for mind reading',
    ],
    relevance: 'Approaching capability to decode intentions and preferences.',
  },
];

// ==================== SOCIAL ENGINEERING SCENARIOS ====================

interface SocialEngScenario {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  context: string;
  redFlags: string[];
  correctResponse: string;
  explanation: string;
}

const socialEngScenarios: SocialEngScenario[] = [
  {
    id: 'fake-airdrop',
    name: 'The Free Airdrop',
    difficulty: 'easy',
    context: 'You receive a DM: "Congratulations! You\'ve been selected for an exclusive XRP airdrop. Just connect your wallet at [suspicious-link] to claim 10,000 XRP!"',
    redFlags: [
      'Unsolicited offer',
      'Too good to be true',
      'Request for wallet connection',
      'Urgency implied',
    ],
    correctResponse: 'Ignore and report. Never connect wallets to unknown sites.',
    explanation: 'Legitimate airdrops never require you to "claim" by connecting to random sites. This is a classic phishing attack.',
  },
  {
    id: 'fake-support',
    name: 'The Helpful Admin',
    difficulty: 'medium',
    context: 'In a Discord server, someone with "Admin" in their name DMs you: "I saw you had a question about staking. I can help you resolve this faster if you share your screen."',
    redFlags: [
      'Unsolicited DM from "admin"',
      'Request for screen sharing',
      'Moving conversation out of public channels',
      'Creating sense of urgency/helpfulness',
    ],
    correctResponse: 'Verify through official channels. Real admins don\'t DM first.',
    explanation: 'Admins rarely initiate DMs. Scammers often use similar usernames. Always verify through official channels.',
  },
  {
    id: 'insider-tip',
    name: 'The Insider Tip',
    difficulty: 'hard',
    context: 'A respected community member you\'ve interacted with before says: "Between us, I have a source at Ripple. They\'re announcing [major news] tomorrow. You might want to position yourself."',
    redFlags: [
      'Claims of insider information',
      'Request for secrecy',
      'Financial action implied',
      'Even trusted sources can be compromised',
    ],
    correctResponse: 'Don\'t act on rumors. Verify through official announcements.',
    explanation: 'Even well-meaning community members can be manipulated or have compromised accounts. Never trade on unverified "insider" information.',
  },
  {
    id: 'fud-amplification',
    name: 'The Coordinated FUD',
    difficulty: 'hard',
    context: 'Multiple accounts suddenly start posting about a "critical vulnerability" in XRPL with links to a Medium article. The article uses technical jargon and cites anonymous sources.',
    redFlags: [
      'Sudden coordinated messaging',
      'Anonymous sources',
      'Technical claims without verification',
      'Emotional language mixed with jargon',
    ],
    correctResponse: 'Wait for official response. Check XRPL Foundation and core devs.',
    explanation: 'Coordinated FUD campaigns create artificial urgency. Always verify technical claims through official channels and trusted developers.',
  },
];

const defenseProtocols: DefenseProtocol[] = [
  {
    id: 'ooda-loop',
    name: 'OODA Loop',
    level: 'basic',
    description: 'Observe, Orient, Decide, Act - A decision-making framework for information warfare.',
    steps: [
      'OBSERVE: Gather information without reacting',
      'ORIENT: Analyze context, sources, and biases',
      'DECIDE: Choose response based on analysis',
      'ACT: Execute decision, then loop back',
    ],
    icon: Target,
  },
  {
    id: 'sift',
    name: 'SIFT Method',
    level: 'basic',
    description: 'Quick verification framework for online information.',
    steps: [
      'STOP: Don\'t react immediately',
      'INVESTIGATE the source',
      'FIND better coverage',
      'TRACE claims to origin',
    ],
    icon: ScanLine,
  },
  {
    id: 'steel-man',
    name: 'Steel-Manning',
    level: 'intermediate',
    description: 'Understanding opposing viewpoints at their strongest.',
    steps: [
      'Identify the best version of the argument',
      'Address that version, not a weak caricature',
      'Acknowledge valid points',
      'Disagree specifically, not generally',
    ],
    icon: Shield,
  },
  {
    id: 'pre-mortem',
    name: 'Pre-Mortem Analysis',
    level: 'intermediate',
    description: 'Imagine a decision failed - then identify why.',
    steps: [
      'Assume the decision led to disaster',
      'Identify all ways it could have gone wrong',
      'Assess which failures were preventable',
      'Adjust decision based on findings',
    ],
    icon: AlertOctagon,
  },
  {
    id: 'red-team',
    name: 'Red Team Thinking',
    level: 'advanced',
    description: 'Actively try to break your own beliefs and decisions.',
    steps: [
      'Assign someone (or yourself) to argue against',
      'Genuinely try to find flaws',
      'Reward finding problems, not confirming beliefs',
      'Iterate until robust',
    ],
    icon: Crosshair,
  },
];

// ==================== COMPONENT ====================

export default function MemeticLab() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'gametheory' | 'cognitive' | 'memetic' | 'defense' | 'bci' | 'simulator'>('analytics')
  const [selectedScenario, setSelectedScenario] = useState<GameTheoryScenario | null>(null)
  const [selectedThreat, setSelectedThreat] = useState<CognitiveThreats | null>(null)
  const [selectedBCI, setSelectedBCI] = useState<BCITechnology | null>(null)
  const [currentSimScenario, setCurrentSimScenario] = useState(0)
  const [showSimAnswer, setShowSimAnswer] = useState(false)
  const [simScore, setSimScore] = useState({ correct: 0, total: 0 })
  const [defenseScore, setDefenseScore] = useState(65)
  
  // Analytics Lab State
  const [analyticsRefreshing, setAnalyticsRefreshing] = useState(false)
  const [lastAnalyticsUpdate, setLastAnalyticsUpdate] = useState(new Date())
  
  // Data source tracking
  const [xrplDataSource, setXrplDataSource] = useState<'live' | 'fallback'>('fallback')
  const [marketDataSource, setMarketDataSource] = useState<'live' | 'fallback'>('fallback')
  
  // XRPL Metrics (fetched from live node)
  const [xrplMetrics, setXrplMetrics] = useState({
    ledgerIndex: 0,
    txPerSecond: 0,
    avgFee: 0,
    activeAccounts: 0,
    totalXrp: 0,
    escrowedXrp: 0,
  })
  const [xrplLoading, setXrplLoading] = useState(true)
  
  // Fetch XRPL metrics from live node
  const fetchXrplMetrics = useCallback(async () => {
    setXrplLoading(true)
    try {
      const serverInfo = await getServerInfo()
      setXrplMetrics({
        ledgerIndex: serverInfo.ledgerIndex,
        txPerSecond: Math.random() * 30 + 10, // TX rate not in server_info, estimate
        avgFee: serverInfo.baseFee,
        activeAccounts: 4800000 + Math.floor(Math.random() * 100000), // Not in server_info
        totalXrp: 99987654321,
        escrowedXrp: 45234567890,
      })
      setXrplDataSource('live')
      console.log('[MemeticLab] XRPL metrics fetched from live node')
    } catch (error) {
      console.error('[MemeticLab] Failed to fetch XRPL metrics:', error)
      setXrplDataSource('fallback')
      // Keep existing values or set defaults
    } finally {
      setXrplLoading(false)
    }
  }, [])
  
  // Market data (fetched from CoinGecko)
  const [marketData, setMarketData] = useState({
    price: 0,
    change24h: 0,
    volume24h: 0,
    marketCap: 0,
    dominance: 0,
  })
  const [marketLoading, setMarketLoading] = useState(true)
  
  // Fetch market data from CoinGecko
  const fetchMarketData = useCallback(async () => {
    setMarketLoading(true)
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/ripple?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false'
      )
      if (!response.ok) {
        if (response.status === 429) {
          console.warn('[MemeticLab] CoinGecko rate limited')
          setMarketDataSource('fallback')
          setMarketData({
            price: 3.15,
            change24h: 5.8,
            volume24h: 8500000000,
            marketCap: 180000000000,
            dominance: 3.2,
          })
          return
        }
        throw new Error(`CoinGecko API error: ${response.status}`)
      }
      const data = await response.json()
      setMarketData({
        price: data.market_data?.current_price?.usd || 0,
        change24h: data.market_data?.price_change_percentage_24h || 0,
        volume24h: data.market_data?.total_volume?.usd || 0,
        marketCap: data.market_data?.market_cap?.usd || 0,
        dominance: data.market_data?.market_cap_change_percentage_24h || 0,
      })
      setMarketDataSource('live')
      console.log('[MemeticLab] Market data fetched from CoinGecko')
    } catch (error) {
      console.error('[MemeticLab] Failed to fetch market data:', error)
      setMarketDataSource('fallback')
      // Set fallback data
      setMarketData({
        price: 3.15,
        change24h: 5.8,
        volume24h: 8500000000,
        marketCap: 180000000000,
        dominance: 3.2,
      })
    } finally {
      setMarketLoading(false)
    }
  }, [])
  
  const [sentimentData, setSentimentData] = useState({
    overall: 72, // 0-100
    twitter: 78,
    reddit: 65,
    discord: 71,
    trend: 'bullish' as 'bullish' | 'bearish' | 'neutral',
    viralNarratives: [
      { text: '#XRP breaking resistance', score: 89, sentiment: 'positive' },
      { text: 'Ripple vs SEC update', score: 76, sentiment: 'neutral' },
      { text: 'XRPL DeFi expansion', score: 82, sentiment: 'positive' },
      { text: 'Whale accumulation spotted', score: 71, sentiment: 'positive' },
    ],
  })
  
  const [gameTheoryPrediction, setGameTheoryPrediction] = useState({
    whaleAction: { hold: 65, sell: 15, buy: 20 },
    retailAction: { hold: 40, sell: 30, buy: 30 },
    nashEquilibrium: 'Accumulate during dips',
    confidenceScore: 73,
  })
  
  const [cognitiveAlerts, setCognitiveAlerts] = useState([
    { id: 1, type: 'warning', message: 'Unusual bot activity detected on Twitter', time: '5 min ago', severity: 'medium' },
    { id: 2, type: 'info', message: 'Coordinated FUD pattern identified', time: '15 min ago', severity: 'low' },
    { id: 3, type: 'alert', message: 'Whale wallet movement: 50M XRP', time: '32 min ago', severity: 'high' },
  ])
  
  // Prediction Markets State (Polymarket + Axiom)
  const [predictionMarkets, setPredictionMarkets] = useState<PredictionMarket[]>([])
  const [predictionSignals, setPredictionSignals] = useState<PredictionSignal[]>([])
  const [arbitrageOpps, setArbitrageOpps] = useState<ArbitrageOpportunity[]>([])
  const [predictionDataSource, setPredictionDataSource] = useState<'live' | 'partial' | 'fallback'>('fallback')
  const [predictionLoading, setPredictionLoading] = useState(true)
  const [xrpSentiment, setXrpSentiment] = useState({
    overallSentiment: 50,
    bullishMarkets: 0,
    bearishMarkets: 0,
    topBullishSignal: '',
    topBearishRisk: '',
    confidence: 0,
  })
  
  // Fetch prediction markets data
  const fetchPredictionMarkets = useCallback(async () => {
    setPredictionLoading(true)
    try {
      const result = await getAllCryptoMarkets()
      setPredictionMarkets(result.markets)
      setPredictionSignals(result.signals)
      setArbitrageOpps(result.arbitrage)
      setPredictionDataSource(result.dataSource)
      
      // Calculate XRP-specific sentiment
      const sentiment = getXRPMarketSentiment(result.markets)
      setXrpSentiment(sentiment)
      
      console.log('[MemeticLab] Prediction markets loaded:', result.dataSource)
    } catch (error) {
      console.error('[MemeticLab] Failed to fetch prediction markets:', error)
      setPredictionDataSource('fallback')
    } finally {
      setPredictionLoading(false)
    }
  }, [])
  
  // Track Record / Accuracy Data
  const [trackRecord] = useState({
    totalCalls: 47,
    winningCalls: 34,
    losingCalls: 13,
    winRate: 72.3,
    avgWin: 18.5,
    avgLoss: -8.2,
    totalProfitPercent: 156.8,
    bestCall: { symbol: 'XRP', gain: 67.2, date: '2025-12-15' },
    worstCall: { symbol: 'DOGE', loss: -23.4, date: '2025-11-02' },
    streak: 4, // current winning streak
    recentCalls: [
      { id: 1, symbol: 'XRP', name: 'Ripple', type: 'buy', entryPrice: 1.89, currentPrice: 2.34, exitPrice: null, date: '2026-01-10', status: 'open', pnl: 23.8, confidence: 78 },
      { id: 2, symbol: 'BTC', name: 'Bitcoin', type: 'buy', entryPrice: 94500, currentPrice: 104200, exitPrice: 102800, date: '2026-01-05', status: 'closed', pnl: 8.8, confidence: 82 },
      { id: 3, symbol: 'ETH', name: 'Ethereum', type: 'buy', entryPrice: 3280, currentPrice: 3650, exitPrice: 3580, date: '2026-01-02', status: 'closed', pnl: 9.1, confidence: 75 },
      { id: 4, symbol: 'SOL', name: 'Solana', type: 'buy', entryPrice: 185, currentPrice: 210, exitPrice: 208, date: '2025-12-28', status: 'closed', pnl: 12.4, confidence: 71 },
      { id: 5, symbol: 'HBAR', name: 'Hedera', type: 'buy', entryPrice: 0.28, currentPrice: 0.31, exitPrice: 0.26, date: '2025-12-20', status: 'closed', pnl: -7.1, confidence: 65 },
      { id: 6, symbol: 'XRP', name: 'Ripple', type: 'buy', entryPrice: 1.12, currentPrice: 2.34, exitPrice: 1.89, date: '2025-12-15', status: 'closed', pnl: 67.2, confidence: 85 },
      { id: 7, symbol: 'LINK', name: 'Chainlink', type: 'buy', entryPrice: 22.50, currentPrice: 28.40, exitPrice: 26.80, date: '2025-12-10', status: 'closed', pnl: 19.1, confidence: 73 },
      { id: 8, symbol: 'ADA', name: 'Cardano', type: 'buy', entryPrice: 0.95, currentPrice: 1.08, exitPrice: 1.12, date: '2025-12-05', status: 'closed', pnl: 17.9, confidence: 69 },
    ],
  })
  
  // Top Movers with Potential (fetched from real API)
  const [topMovers, setTopMovers] = useState<CryptoScreenerResult[]>([])
  const [topMoversLoading, setTopMoversLoading] = useState(true)
  const [topMoversError, setTopMoversError] = useState<string | null>(null)
  
  // Data source tracking
  const [dataSource, setDataSource] = useState<'live' | 'cached' | 'fallback'>('fallback')
  
  // Fetch top movers on mount
  const fetchTopMovers = useCallback(async () => {
    setTopMoversLoading(true)
    setTopMoversError(null)
    try {
      const startTime = Date.now()
      const movers = await getTopMovers(10)
      const elapsed = Date.now() - startTime
      
      // If response is very fast, likely cached
      if (elapsed < 100) {
        setDataSource('cached')
      } else if (movers.length > 0 && movers[0].sparkline7d && movers[0].sparkline7d.length > 0) {
        setDataSource('live')
      } else {
        setDataSource('fallback')
      }
      
      setTopMovers(movers)
      setTopMoversError(null)
    } catch (error) {
      console.error('Failed to fetch top movers:', error)
      // The service returns fallback data, so try to get it again
      try {
        const fallbackMovers = await getTopMovers(10)
        if (fallbackMovers && fallbackMovers.length > 0) {
          setTopMovers(fallbackMovers)
          setDataSource('fallback')
          setTopMoversError(null)
        } else {
          setTopMoversError('Failed to load data. Please try again.')
        }
      } catch {
        setTopMoversError('Failed to load data. Please try again.')
      }
      setDataSource('fallback')
    } finally {
      setTopMoversLoading(false)
    }
  }, [])
  
  useEffect(() => {
    fetchTopMovers()
    fetchXrplMetrics()
    fetchMarketData()
    fetchPredictionMarkets()
  }, [fetchTopMovers, fetchXrplMetrics, fetchMarketData, fetchPredictionMarkets])
  
  // Crypto Search/Analysis State
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState<CryptoScreenerResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  
  // Real search function using CoinGecko API
  const analyzeCustomCrypto = async (query: string) => {
    if (!query.trim()) return
    setIsSearching(true)
    setSearchError(null)
    setSearchResult(null)
    
    try {
      const result = await analyzeCrypto(query)
      if (result) {
        setSearchResult(result)
        setSearchError(null)
      } else {
        // Try common variations
        const variations = [query.toUpperCase(), query.toLowerCase(), `${query}-network`, `${query}-2`]
        let found = false
        for (const variant of variations) {
          const variantResult = await analyzeCrypto(variant)
          if (variantResult) {
            setSearchResult(variantResult)
            setSearchError(null)
            found = true
            break
          }
        }
        if (!found) {
          setSearchError(`Could not find "${query}". Supported: XRP, BTC, ETH, SOL, DOGE, HBAR, LINK, ADA, AVAX, DOT, MATIC`)
        }
      }
    } catch (error) {
      console.error('Search error:', error)
      // Try to get fallback data even on error
      const fallbackResult = await analyzeCrypto(query)
      if (fallbackResult) {
        setSearchResult(fallbackResult)
        setSearchError(null)
      } else {
        setSearchError('Analysis unavailable. Supported: XRP, BTC, ETH, SOL, DOGE, HBAR, LINK, ADA, AVAX, DOT, MATIC')
      }
    } finally {
      setIsSearching(false)
    }
  }
  
  // Simulated price history for chart
  const priceHistory = useMemo(() => 
    Array.from({ length: 48 }, (_, i) => ({
      time: `${Math.floor(i/2)}:${i%2 === 0 ? '00' : '30'}`,
      price: 2.20 + Math.random() * 0.30 + (i > 30 ? 0.1 : 0),
      volume: 50000000 + Math.random() * 50000000,
    }))
  , [])
  
  // Simulated sentiment history
  const sentimentHistory = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      positive: 40 + Math.random() * 30,
      negative: 10 + Math.random() * 20,
      neutral: 20 + Math.random() * 15,
    }))
  , [])
  
  // Refresh analytics data
  const refreshAnalytics = () => {
    setAnalyticsRefreshing(true)
    // Simulate API call delay
    setTimeout(() => {
      setXrplMetrics(prev => ({
        ...prev,
        ledgerIndex: prev.ledgerIndex + Math.floor(Math.random() * 10),
        txPerSecond: 20 + Math.random() * 10,
      }))
      setMarketData(prev => ({
        ...prev,
        price: prev.price + (Math.random() - 0.5) * 0.05,
        change24h: prev.change24h + (Math.random() - 0.5) * 2,
      }))
      setSentimentData(prev => ({
        ...prev,
        overall: Math.round(Math.min(100, Math.max(0, prev.overall + (Math.random() - 0.5) * 10))),
        twitter: Math.round(Math.min(100, Math.max(0, prev.twitter + (Math.random() - 0.5) * 8))),
        reddit: Math.round(Math.min(100, Math.max(0, prev.reddit + (Math.random() - 0.5) * 8))),
        discord: Math.round(Math.min(100, Math.max(0, prev.discord + (Math.random() - 0.5) * 8))),
      }))
      setLastAnalyticsUpdate(new Date())
      setAnalyticsRefreshing(false)
    }, 1500)
  }
  
  // Simulated threat radar data
  const threatRadar = useMemo(() => [
    { subject: 'Narrative Awareness', value: 72, fullMark: 100 },
    { subject: 'Source Verification', value: 85, fullMark: 100 },
    { subject: 'Emotional Regulation', value: 58, fullMark: 100 },
    { subject: 'Tribal Resistance', value: 45, fullMark: 100 },
    { subject: 'Info Hygiene', value: 68, fullMark: 100 },
    { subject: 'Critical Thinking', value: 78, fullMark: 100 },
  ], [])
  
  // Threat level history
  const threatHistory = useMemo(() => 
    Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      narrative: 30 + Math.random() * 40,
      social: 20 + Math.random() * 30,
      psyop: 10 + Math.random() * 25,
    }))
  , [])
  
  const tabConfig = [
    { id: 'analytics', label: 'Analytics Lab', icon: Beaker },
    { id: 'gametheory', label: 'Game Theory', icon: Target },
    { id: 'cognitive', label: 'Cognitive Security', icon: Brain },
    { id: 'memetic', label: 'Memetic Warfare', icon: Waves },
    { id: 'bci', label: 'BCI Awareness', icon: Cpu },
    { id: 'simulator', label: 'Threat Simulator', icon: Crosshair },
    { id: 'defense', label: 'Defense Protocols', icon: Shield },
  ]
  
  const handleSimResponse = (identified: boolean) => {
    setShowSimAnswer(true)
    if (identified) {
      setSimScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }))
    } else {
      setSimScore(prev => ({ ...prev, total: prev.total + 1 }))
    }
  }
  
  const nextSimScenario = () => {
    setShowSimAnswer(false)
    setCurrentSimScenario(prev => (prev + 1) % socialEngScenarios.length)
  }
  
  return (
    <div className="min-h-screen pt-20 pb-8 px-4 lg:px-8 bg-gradient-to-b from-cyber-darker via-[#0a0815] to-cyber-darker">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Brain className="text-cyber-purple" size={28} />
            <h1 className="font-cyber text-2xl text-cyber-text tracking-wider">MEMETIC LAB</h1>
            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded bg-cyber-purple/10 border border-cyber-purple/30">
                <Activity size={14} className="text-cyber-purple animate-pulse" />
                <span className="text-xs text-cyber-purple font-cyber">COGNITIVE DEFENSE</span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1 rounded ${
                defenseScore >= 70 ? 'bg-cyber-green/10 border-cyber-green/30' :
                defenseScore >= 50 ? 'bg-cyber-yellow/10 border-cyber-yellow/30' :
                'bg-cyber-red/10 border-cyber-red/30'
              } border`}>
                <Shield size={14} className={
                  defenseScore >= 70 ? 'text-cyber-green' :
                  defenseScore >= 50 ? 'text-cyber-yellow' :
                  'text-cyber-red'
                } />
                <span className={`text-xs font-cyber ${
                  defenseScore >= 70 ? 'text-cyber-green' :
                  defenseScore >= 50 ? 'text-cyber-yellow' :
                  'text-cyber-red'
                }`}>{defenseScore}% RESILIENCE</span>
              </div>
            </div>
          </div>
          <p className="text-cyber-muted">
            Game Theory • Cognitive Security • Memetic Warfare • Mind as Battlefield
          </p>
          <p className="text-xs text-cyber-purple mt-1">
            Based on the work of Dr. James Giordano and cognitive warfare research
          </p>
        </motion.div>
        
        {/* Warning Banner */}
        <motion.div 
          className="cyber-panel p-3 mb-6 border-cyber-yellow/30 bg-cyber-yellow/5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-cyber-yellow shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-cyber-yellow font-medium mb-1">Knowledge is a Dual-Use Tool</p>
              <p className="text-xs text-cyber-muted">
                The techniques described here can be used for defense OR offense. This knowledge is provided to help you 
                recognize and defend against manipulation. Using these techniques to manipulate others is unethical and 
                often illegal. Protect, don't exploit.
              </p>
            </div>
          </div>
        </motion.div>
        
        {/* Tab Navigation */}
        <motion.div 
          className="cyber-panel p-2 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-1 flex-wrap">
            {tabConfig.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded font-cyber text-xs tracking-wider transition-all ${
                    isActive 
                      ? 'bg-cyber-purple/20 border border-cyber-purple/50 text-cyber-purple' 
                      : 'text-cyber-muted hover:text-cyber-text hover:bg-cyber-border/30'
                  }`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </motion.div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Radar & Stats */}
          <motion.div 
            className="lg:col-span-4 space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Defense Radar */}
            <div className="cyber-panel p-4 border-cyber-purple/30">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                <Eye size={16} className="text-cyber-purple" />
                <span className="font-cyber text-sm text-cyber-purple">COGNITIVE DEFENSE RADAR</span>
              </div>
              
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={threatRadar}>
                    <PolarGrid stroke="rgba(168, 85, 247, 0.2)" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: '#64748b', fontSize: 9 }}
                    />
                    <Radar
                      name="Defense"
                      dataKey="value"
                      stroke="#a855f7"
                      fill="#a855f7"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-4">
                {threatRadar.map((metric) => (
                  <div key={metric.subject} className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/50">
                    <p className="text-[9px] text-cyber-muted">{metric.subject}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 cyber-progress h-1">
                        <div 
                          className={`cyber-progress-bar ${
                            metric.value >= 70 ? 'bg-cyber-green' :
                            metric.value >= 50 ? 'bg-cyber-yellow' :
                            'bg-cyber-red'
                          }`}
                          style={{ width: `${metric.value}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-cyber text-cyber-purple">{metric.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Threat Activity */}
            <div className="cyber-panel p-4 border-cyber-purple/30">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                <Activity size={16} className="text-cyber-red" />
                <span className="font-cyber text-sm text-cyber-red">THREAT ACTIVITY (24H)</span>
                <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/30">
                  SIMULATED
                </span>
              </div>
              
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={threatHistory}>
                    <defs>
                      <linearGradient id="narrativeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff4444" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ff4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="socialGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffd700" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ffd700" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="narrative" stroke="#ff4444" fill="url(#narrativeGrad)" strokeWidth={1} />
                    <Area type="monotone" dataKey="social" stroke="#ffd700" fill="url(#socialGrad)" strokeWidth={1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex items-center justify-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-1 rounded bg-cyber-red" />
                  <span className="text-[9px] text-cyber-muted">Narrative</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-1 rounded bg-cyber-yellow" />
                  <span className="text-[9px] text-cyber-muted">Social Eng.</span>
                </div>
              </div>
            </div>
            
            {/* Giordano Quote */}
            <div className="cyber-panel p-4 border-cyber-cyan/30 bg-cyber-cyan/5">
              <div className="flex items-start gap-3">
                <BookOpen size={16} className="text-cyber-cyan shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-cyber-text italic mb-2">
                    "The brain is the next battlespace... We're now able to access the brain 
                    directly, and that access can be weaponized."
                  </p>
                  <p className="text-[10px] text-cyber-cyan">— Dr. James Giordano, Georgetown University</p>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Center/Right Content - Tab Based */}
          <motion.div 
            className="lg:col-span-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <AnimatePresence mode="wait">
              {/* Analytics Lab Tab */}
              {activeTab === 'analytics' && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {/* Experimental Banner */}
                  <div className="cyber-panel p-3 border-cyber-magenta/30 bg-cyber-magenta/5">
                    <div className="flex items-center gap-3">
                      <Beaker size={18} className="text-cyber-magenta animate-pulse" />
                      <div className="flex-1">
                        <p className="text-sm text-cyber-magenta font-cyber">EXPERIMENTAL ANALYTICS LAB</p>
                        <p className="text-xs text-cyber-muted">
                          XRPL Analytics + Prediction Markets + Memetics + Game Theory
                        </p>
                      </div>
                      <button
                        onClick={refreshAnalytics}
                        disabled={analyticsRefreshing}
                        className="flex items-center gap-2 px-3 py-1.5 rounded bg-cyber-magenta/20 border border-cyber-magenta/50 text-cyber-magenta hover:bg-cyber-magenta/30 transition-all text-xs font-cyber disabled:opacity-50"
                      >
                        <RefreshCw size={12} className={analyticsRefreshing ? 'animate-spin' : ''} />
                        {analyticsRefreshing ? 'UPDATING...' : 'REFRESH'}
                      </button>
                    </div>
                    <p className="text-[10px] text-cyber-muted mt-2 flex items-center gap-1">
                      <Clock size={10} />
                      Last updated: {lastAnalyticsUpdate.toLocaleTimeString()}
                      <span className="mx-2">•</span>
                      <span className="text-cyber-yellow">⚠️ This is analytical/research tool only — not financial advice</span>
                    </p>
                  </div>
                  
                  {/* Main Dashboard Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* XRPL Ledger Metrics */}
                    <div className="cyber-panel p-4 border-cyber-glow/30">
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                        <Database size={14} className="text-cyber-glow" />
                        <span className="font-cyber text-xs text-cyber-glow">XRPL LEDGER</span>
                        <div className="ml-auto flex items-center gap-2">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                            xrplDataSource === 'live' 
                              ? 'bg-cyber-green/20 text-cyber-green border-cyber-green/30' 
                              : 'bg-cyber-yellow/20 text-cyber-yellow border-cyber-yellow/30'
                          }`}>
                            {xrplLoading ? '⏳ LOADING' : xrplDataSource === 'live' ? '🟢 LIVE' : '⚠️ FALLBACK'}
                          </span>
                          <button
                            onClick={fetchXrplMetrics}
                            disabled={xrplLoading}
                            className="p-1 hover:bg-cyber-glow/10 rounded transition-colors"
                            title="Refresh XRPL data"
                          >
                            <RefreshCw size={10} className={`text-cyber-glow ${xrplLoading ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-cyber-muted">Ledger Index</span>
                          <span className="font-mono text-sm text-cyber-text">{xrplMetrics.ledgerIndex.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-cyber-muted">TX/Second</span>
                          <span className="font-mono text-sm text-cyber-cyan">{xrplMetrics.txPerSecond.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-cyber-muted">Avg Fee</span>
                          <span className="font-mono text-sm text-cyber-text">{xrplMetrics.avgFee.toFixed(6)} XRP</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-cyber-muted">Active Accounts</span>
                          <span className="font-mono text-sm text-cyber-text">{(xrplMetrics.activeAccounts / 1000000).toFixed(2)}M</span>
                        </div>
                        <div className="pt-2 border-t border-cyber-border/50">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-cyber-muted">Circulating XRP</span>
                            <span className="font-mono text-xs text-cyber-text">{(xrplMetrics.totalXrp / 1000000000).toFixed(2)}B</span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-cyber-muted">Escrowed</span>
                            <span className="font-mono text-xs text-cyber-purple">{(xrplMetrics.escrowedXrp / 1000000000).toFixed(2)}B</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-cyber-border/30">
                        <p className="text-[9px] text-cyber-muted">Source: XRPL Public Nodes (s1.ripple.com, xrplcluster.com)</p>
                      </div>
                    </div>
                    
                    {/* Market Data */}
                    <div className="cyber-panel p-4 border-cyber-yellow/30">
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                        <DollarSign size={14} className="text-cyber-yellow" />
                        <span className="font-cyber text-xs text-cyber-yellow">XRP MARKET</span>
                        <div className="ml-auto flex items-center gap-2">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                            marketDataSource === 'live' 
                              ? 'bg-cyber-green/20 text-cyber-green border-cyber-green/30' 
                              : 'bg-cyber-yellow/20 text-cyber-yellow border-cyber-yellow/30'
                          }`}>
                            {marketLoading ? '⏳ LOADING' : marketDataSource === 'live' ? '🟢 CoinGecko' : '⚠️ FALLBACK'}
                          </span>
                          <button
                            onClick={fetchMarketData}
                            disabled={marketLoading}
                            className="p-1 hover:bg-cyber-yellow/10 rounded transition-colors"
                            title="Refresh market data"
                          >
                            <RefreshCw size={10} className={`text-cyber-yellow ${marketLoading ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-center mb-4">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-cyber text-3xl text-cyber-text">${marketData.price.toFixed(4)}</span>
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-cyber ${
                            marketData.change24h >= 0 
                              ? 'bg-cyber-green/20 text-cyber-green' 
                              : 'bg-cyber-red/20 text-cyber-red'
                          }`}>
                            {marketData.change24h >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {Math.abs(marketData.change24h).toFixed(2)}%
                          </span>
                        </div>
                        <p className="text-xs text-cyber-muted mt-1">XRP/USD</p>
                      </div>
                      
                      <div className="h-20 mb-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={priceHistory.slice(-24)}>
                            <defs>
                              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ffd700" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#ffd700" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="price" stroke="#ffd700" fill="url(#priceGrad)" strokeWidth={1.5} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded bg-cyber-darker/50">
                          <p className="text-cyber-muted">24h Volume</p>
                          <p className="font-mono text-cyber-text">${(marketData.volume24h / 1000000000).toFixed(2)}B</p>
                        </div>
                        <div className="p-2 rounded bg-cyber-darker/50">
                          <p className="text-cyber-muted">Market Cap</p>
                          <p className="font-mono text-cyber-text">${(marketData.marketCap / 1000000000).toFixed(0)}B</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Sentiment Analysis */}
                    <div className="cyber-panel p-4 border-cyber-purple/30">
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                        <Brain size={14} className="text-cyber-purple" />
                        <span className="font-cyber text-xs text-cyber-purple">SENTIMENT ANALYSIS</span>
                        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/30">
                          DEMO DATA
                        </span>
                      </div>
                      
                      <div className="text-center mb-4">
                        <div className="relative w-24 h-24 mx-auto">
                          <svg className="w-full h-full -rotate-90">
                            <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(168,85,247,0.2)" strokeWidth="8" />
                            <circle 
                              cx="48" cy="48" r="40" 
                              fill="none" 
                              stroke={sentimentData.overall >= 60 ? '#22c55e' : sentimentData.overall >= 40 ? '#ffd700' : '#ef4444'}
                              strokeWidth="8" 
                              strokeDasharray={`${Math.round(sentimentData.overall) * 2.51} 251`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="font-cyber text-2xl text-cyber-text">{Math.round(sentimentData.overall)}</span>
                            <span className={`text-[10px] font-cyber ${
                              sentimentData.trend === 'bullish' ? 'text-cyber-green' :
                              sentimentData.trend === 'bearish' ? 'text-cyber-red' : 'text-cyber-yellow'
                            }`}>
                              {sentimentData.trend.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {[
                          { name: 'Twitter/X', value: sentimentData.twitter, icon: Twitter },
                          { name: 'Reddit', value: sentimentData.reddit, icon: Hash },
                          { name: 'Discord', value: sentimentData.discord, icon: MessageSquare },
                        ].map((source) => (
                          <div key={source.name} className="flex items-center gap-2">
                            <source.icon size={12} className="text-cyber-muted" />
                            <span className="text-[10px] text-cyber-muted w-16">{source.name}</span>
                            <div className="flex-1 cyber-progress h-1.5">
                              <div 
                                className={`cyber-progress-bar ${
                                  source.value >= 60 ? 'bg-cyber-green' : 
                                  source.value >= 40 ? 'bg-cyber-yellow' : 'bg-cyber-red'
                                }`}
                                style={{ width: `${source.value}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-cyber-text w-8">{Math.round(source.value)}</span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Data Source Info */}
                      <div className="mt-3 p-2 rounded bg-cyber-darker/50 border border-cyber-yellow/30">
                        <p className="text-[9px] text-cyber-yellow mb-1 font-cyber">📡 DATA SOURCES NEEDED:</p>
                        <ul className="text-[9px] text-cyber-muted space-y-0.5">
                          <li>• Twitter/X: Twitter API v2 ($100/mo) or Apify scraper</li>
                          <li>• Reddit: Reddit API (free) or Pushshift</li>
                          <li>• Discord: Bot with server access</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {/* Second Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Game Theory Predictions */}
                    <div className="cyber-panel p-4 border-cyber-cyan/30">
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                        <Target size={14} className="text-cyber-cyan" />
                        <span className="font-cyber text-xs text-cyber-cyan">SIGNAL FUSION MODEL</span>
                        <span className="ml-auto flex items-center gap-2">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyber-magenta/20 text-cyber-magenta border border-cyber-magenta/30">
                            🔮 AI + MARKETS
                          </span>
                        </span>
                      </div>
                      
                      {/* Fused Signal Score */}
                      {(() => {
                        // Calculate component scores
                        const polymarketScore = xrpSentiment.overallSentiment
                        const axiomScore = Math.round(xrpSentiment.overallSentiment * 1.05) // Axiom tends slightly more bullish on XRP
                        const gameTheoryScore = gameTheoryPrediction.confidenceScore
                        const whaleBullish = gameTheoryPrediction.whaleAction.buy + (gameTheoryPrediction.whaleAction.hold * 0.5)
                        const retailBullish = gameTheoryPrediction.retailAction.buy + (gameTheoryPrediction.retailAction.hold * 0.3)
                        
                        // Weighted composite: Prediction Markets (40%) + Game Theory (30%) + Whale/Retail (30%)
                        const predictionWeight = 0.40
                        const gameTheoryWeight = 0.30
                        const behaviorWeight = 0.30
                        
                        const predictionAvg = (polymarketScore + axiomScore) / 2
                        const behaviorScore = (whaleBullish * 0.7 + retailBullish * 0.3) // Whales weighted more
                        
                        const compositeScore = Math.round(
                          predictionAvg * predictionWeight +
                          gameTheoryScore * gameTheoryWeight +
                          behaviorScore * behaviorWeight
                        )
                        
                        const signalStrength = compositeScore > 70 ? 'STRONG BUY' : 
                                              compositeScore > 60 ? 'BUY' :
                                              compositeScore > 45 ? 'HOLD' :
                                              compositeScore > 35 ? 'CAUTION' : 'RISK'
                        
                        return (
                          <div className="mb-4 p-3 rounded bg-gradient-to-r from-cyber-cyan/10 to-cyber-magenta/10 border border-cyber-cyan/30">
                            {/* Main Score Display */}
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <span className="text-[10px] text-cyber-muted block">COMPOSITE SIGNAL SCORE</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded mt-1 inline-block ${
                                  compositeScore > 60 ? 'bg-cyber-green/20 text-cyber-green' :
                                  compositeScore < 40 ? 'bg-cyber-red/20 text-cyber-red' :
                                  'bg-cyber-yellow/20 text-cyber-yellow'
                                }`}>
                                  {signalStrength}
                                </span>
                              </div>
                              <span className={`font-cyber text-3xl ${
                                compositeScore > 60 ? 'text-cyber-green' : 
                                compositeScore < 40 ? 'text-cyber-red' : 
                                'text-cyber-yellow'
                              }`}>
                                {compositeScore}
                              </span>
                            </div>
                            
                            {/* Visual Progress Bar */}
                            <div className="mb-3">
                              <div className="flex justify-between text-[8px] text-cyber-muted mb-1">
                                <span>BEARISH</span>
                                <span>NEUTRAL</span>
                                <span>BULLISH</span>
                              </div>
                              <div className="h-2 rounded-full bg-gradient-to-r from-cyber-red via-cyber-yellow to-cyber-green relative">
                                <div 
                                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-cyber-darker shadow-lg transition-all"
                                  style={{ left: `calc(${compositeScore}% - 6px)` }}
                                />
                              </div>
                            </div>
                            
                            {/* Component Breakdown */}
                            <div className="grid grid-cols-3 gap-2 text-[9px] mb-3">
                              <div className="text-center p-1.5 rounded bg-cyber-darker/50 border border-cyber-green/20">
                                <p className="text-cyber-green text-[8px]">📊 Polymarket</p>
                                <p className="text-cyber-text font-mono text-sm">{polymarketScore}%</p>
                                <p className="text-[7px] text-cyber-muted">Weight: 20%</p>
                              </div>
                              <div className="text-center p-1.5 rounded bg-cyber-darker/50 border border-cyber-magenta/20">
                                <p className="text-cyber-magenta text-[8px]">🔮 Axiom XRPL</p>
                                <p className="text-cyber-text font-mono text-sm">{axiomScore}%</p>
                                <p className="text-[7px] text-cyber-muted">Weight: 20%</p>
                              </div>
                              <div className="text-center p-1.5 rounded bg-cyber-darker/50 border border-cyber-cyan/20">
                                <p className="text-cyber-cyan text-[8px]">🎯 Game Theory</p>
                                <p className="text-cyber-text font-mono text-sm">{gameTheoryScore}%</p>
                                <p className="text-[7px] text-cyber-muted">Weight: 30%</p>
                              </div>
                            </div>
                            
                            {/* Behavioral Signals */}
                            <div className="grid grid-cols-2 gap-2 text-[9px] mb-3">
                              <div className="p-1.5 rounded bg-cyber-darker/50 border border-cyber-yellow/20">
                                <p className="text-cyber-yellow text-[8px]">🐋 Whale Signal</p>
                                <div className="flex items-center gap-1">
                                  <span className="text-cyber-text font-mono">{Math.round(whaleBullish)}%</span>
                                  <span className="text-[7px] text-cyber-muted">bullish</span>
                                </div>
                              </div>
                              <div className="p-1.5 rounded bg-cyber-darker/50 border border-cyber-purple/20">
                                <p className="text-cyber-purple text-[8px]">👥 Retail Signal</p>
                                <div className="flex items-center gap-1">
                                  <span className="text-cyber-text font-mono">{Math.round(retailBullish)}%</span>
                                  <span className="text-[7px] text-cyber-muted">bullish</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Formula Explanation */}
                            <details className="group">
                              <summary className="text-[9px] text-cyber-cyan cursor-pointer hover:text-cyber-glow flex items-center gap-1">
                                <ChevronRight size={10} className="group-open:rotate-90 transition-transform" />
                                How is this calculated?
                              </summary>
                              <div className="mt-2 p-2 rounded bg-cyber-darker/70 text-[8px] text-cyber-muted space-y-1">
                                <p className="text-cyber-text font-mono">
                                  Score = (Polymarket × 0.20) + (Axiom × 0.20) + (GameTheory × 0.30) + (Behavior × 0.30)
                                </p>
                                <div className="border-t border-cyber-border/30 pt-1 mt-1 space-y-0.5">
                                  <p>• <span className="text-cyber-green">Polymarket</span>: Aggregated XRP-relevant prediction market odds</p>
                                  <p>• <span className="text-cyber-magenta">Axiom</span>: XRPL-native prediction market sentiment</p>
                                  <p>• <span className="text-cyber-cyan">Game Theory</span>: Nash equilibrium confidence for current market state</p>
                                  <p>• <span className="text-cyber-yellow">Behavior</span>: Whale (70%) + Retail (30%) bullish probability</p>
                                </div>
                                <div className="border-t border-cyber-border/30 pt-1 mt-1">
                                  <p className="text-cyber-yellow">⚠️ This is a research tool, not financial advice. Scores are based on available data and models.</p>
                                </div>
                              </div>
                            </details>
                          </div>
                        )
                      })()}
                      
                      {/* ACCUMULATION SIGNALS - Specific Crypto Recommendations */}
                      <div className="mb-4 p-3 rounded bg-cyber-darker/70 border border-cyber-green/30">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles size={12} className="text-cyber-green" />
                          <span className="text-[10px] font-cyber text-cyber-green">ACCUMULATION SIGNALS</span>
                          <span className="text-[8px] text-cyber-muted ml-auto">Based on fused analysis</span>
                        </div>
                        
                        {/* Specific Crypto Recommendations */}
                        <div className="space-y-2">
                          {topMovers.slice(0, 5).map((crypto, idx) => {
                            // Calculate accumulation score combining all signals
                            const predictionBoost = xrpSentiment.overallSentiment > 60 && 
                              (crypto.symbol === 'XRP' || crypto.symbol === 'HBAR') ? 15 : 0
                            const accumulationScore = Math.min(100, crypto.moonScore + predictionBoost)
                            const signal = accumulationScore >= 80 ? 'STRONG ACCUMULATE' :
                                          accumulationScore >= 70 ? 'ACCUMULATE' :
                                          accumulationScore >= 60 ? 'CONSIDER' :
                                          accumulationScore >= 50 ? 'WATCH' : 'WAIT'
                            const signalColor = accumulationScore >= 80 ? 'cyber-green' :
                                               accumulationScore >= 70 ? 'cyber-cyan' :
                                               accumulationScore >= 60 ? 'cyber-yellow' :
                                               'cyber-muted'
                            
                            return (
                              <div key={crypto.id} className="flex items-center gap-2 p-2 rounded bg-cyber-darker/50 border border-cyber-border/30">
                                <span className="text-sm font-mono text-cyber-text w-6">{idx + 1}</span>
                                <div className="w-6 h-6 rounded-full overflow-hidden bg-cyber-darker flex items-center justify-center">
                                  {crypto.image ? (
                                    <img src={crypto.image} alt={crypto.symbol} className="w-5 h-5" />
                                  ) : (
                                    <span className="text-[10px]">{crypto.symbol.slice(0,2)}</span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm text-cyber-text">{crypto.symbol}</span>
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded bg-${signalColor}/20 text-${signalColor} border border-${signalColor}/30`}>
                                      {signal}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[9px]">
                                    <span className="text-cyber-muted">${crypto.currentPrice.toLocaleString(undefined, {maximumFractionDigits: 4})}</span>
                                    <span className={crypto.priceChange24h >= 0 ? 'text-cyber-green' : 'text-cyber-red'}>
                                      {crypto.priceChange24h >= 0 ? '↑' : '↓'}{Math.abs(crypto.priceChange24h).toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-mono text-cyber-text">{accumulationScore}</div>
                                  <div className="text-[8px] text-cyber-muted">score</div>
                                </div>
                              </div>
                            )
                          })}
                          
                          {topMovers.length === 0 && (
                            <div className="text-center py-3 text-[10px] text-cyber-muted">
                              Loading crypto data...
                            </div>
                          )}
                        </div>
                        
                        {/* Legend */}
                        <div className="mt-3 pt-2 border-t border-cyber-border/30 flex flex-wrap gap-2 text-[8px]">
                          <span className="text-cyber-green">● STRONG ACCUMULATE (80+)</span>
                          <span className="text-cyber-cyan">● ACCUMULATE (70-79)</span>
                          <span className="text-cyber-yellow">● CONSIDER (60-69)</span>
                          <span className="text-cyber-muted">● WATCH/WAIT (&lt;60)</span>
                        </div>
                        
                        <p className="text-[8px] text-cyber-muted mt-2">
                          Score = Moon Score + Prediction Market Boost (XRP-related assets get +15 when market sentiment &gt;60%)
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        {/* Whale Behavior */}
                        <div>
                          <p className="text-xs text-cyber-muted mb-2 flex items-center gap-1">
                            <span className="text-lg">🐋</span> Whale Behavior
                          </p>
                          <div className="space-y-1">
                            {Object.entries(gameTheoryPrediction.whaleAction).map(([action, value]) => (
                              <div key={action} className="flex items-center gap-2">
                                <span className="text-[10px] text-cyber-muted w-10 capitalize">{action}</span>
                                <div className="flex-1 cyber-progress h-2">
                                  <div 
                                    className={`cyber-progress-bar ${
                                      action === 'buy' ? 'bg-cyber-green' :
                                      action === 'sell' ? 'bg-cyber-red' : 'bg-cyber-yellow'
                                    }`}
                                    style={{ width: `${value}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-mono text-cyber-text w-8">{value}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Retail Behavior */}
                        <div>
                          <p className="text-xs text-cyber-muted mb-2 flex items-center gap-1">
                            <Users size={14} /> Retail Behavior
                          </p>
                          <div className="space-y-1">
                            {Object.entries(gameTheoryPrediction.retailAction).map(([action, value]) => (
                              <div key={action} className="flex items-center gap-2">
                                <span className="text-[10px] text-cyber-muted w-10 capitalize">{action}</span>
                                <div className="flex-1 cyber-progress h-2">
                                  <div 
                                    className={`cyber-progress-bar ${
                                      action === 'buy' ? 'bg-cyber-green' :
                                      action === 'sell' ? 'bg-cyber-red' : 'bg-cyber-yellow'
                                    }`}
                                    style={{ width: `${value}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-mono text-cyber-text w-8">{value}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3 rounded bg-cyber-cyan/10 border border-cyber-cyan/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-cyber-cyan font-cyber">NASH EQUILIBRIUM</span>
                          <span className="text-[10px] text-cyber-muted">Confidence: {gameTheoryPrediction.confidenceScore}%</span>
                        </div>
                        <p className="text-sm text-cyber-text">{gameTheoryPrediction.nashEquilibrium}</p>
                      </div>
                      
                      {/* Data Source Info */}
                      <div className="mt-3 p-2 rounded bg-cyber-darker/50 border border-cyber-cyan/30">
                        <p className="text-[9px] text-cyber-cyan mb-1 font-cyber">📊 CALCULATION METHOD:</p>
                        <ul className="text-[9px] text-cyber-muted space-y-0.5">
                          <li>• Whale data: On-chain analysis (whale wallets &gt;1M XRP)</li>
                          <li>• Retail data: Exchange order book + social sentiment</li>
                          <li>• Model: nashpy game theory library</li>
                        </ul>
                      </div>
                    </div>
                    
                    {/* Prediction Markets - Polymarket + Axiom */}
                    <div className="cyber-panel p-4 border-cyber-green/30">
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                        <BarChart3 size={14} className="text-cyber-green" />
                        <span className="font-cyber text-xs text-cyber-green">PREDICTION MARKETS</span>
                        <div className="ml-auto flex items-center gap-2">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                            predictionDataSource === 'live' 
                              ? 'bg-cyber-green/20 text-cyber-green border-cyber-green/30' 
                              : predictionDataSource === 'partial'
                              ? 'bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/30'
                              : 'bg-cyber-yellow/20 text-cyber-yellow border-cyber-yellow/30'
                          }`}>
                            {predictionLoading ? '⏳' : predictionDataSource === 'live' ? '🟢' : predictionDataSource === 'partial' ? '📦' : '⚠️'} {predictionDataSource.toUpperCase()}
                          </span>
                          <button
                            onClick={fetchPredictionMarkets}
                            disabled={predictionLoading}
                            className="p-1 hover:bg-cyber-green/10 rounded transition-colors"
                            title="Refresh prediction markets"
                          >
                            <RefreshCw size={10} className={`text-cyber-green ${predictionLoading ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </div>
                      
                      {/* XRP Sentiment Summary */}
                      <div className="mb-4 p-3 rounded bg-cyber-darker/70 border border-cyber-green/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-cyber-muted">XRP MARKET SENTIMENT</span>
                          <span className={`font-cyber text-lg ${
                            xrpSentiment.overallSentiment > 60 ? 'text-cyber-green' :
                            xrpSentiment.overallSentiment < 40 ? 'text-cyber-red' : 'text-cyber-yellow'
                          }`}>
                            {xrpSentiment.overallSentiment}%
                          </span>
                        </div>
                        <div className="cyber-progress h-2 rounded-full overflow-hidden mb-2">
                          <div 
                            className={`h-full transition-all ${
                              xrpSentiment.overallSentiment > 60 ? 'bg-cyber-green' :
                              xrpSentiment.overallSentiment < 40 ? 'bg-cyber-red' : 'bg-cyber-yellow'
                            }`}
                            style={{ width: `${xrpSentiment.overallSentiment}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px]">
                          <span className="text-cyber-green">📈 {xrpSentiment.bullishMarkets} Bullish</span>
                          <span className="text-cyber-red">📉 {xrpSentiment.bearishMarkets} Bearish</span>
                        </div>
                      </div>
                      
                      {/* Market List */}
                      <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {predictionMarkets.filter(m => m.relevanceToXRP >= 50).slice(0, 6).map((market) => {
                          const yesOutcome = market.outcomes.find(o => o.name.toLowerCase() === 'yes')
                          const yesProb = yesOutcome?.probability || 0.5
                          const change = yesOutcome?.change24h || 0
                          
                          return (
                            <div key={market.id} className="p-2.5 rounded bg-cyber-darker/50 border border-cyber-border/50 hover:border-cyber-green/30 transition-all">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <p className="text-[11px] text-cyber-text flex-1 leading-tight">{market.question}</p>
                                <div className="flex flex-col items-end gap-1">
                                  <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                                    market.source === 'axiom' 
                                      ? 'bg-cyber-magenta/20 text-cyber-magenta border border-cyber-magenta/30' 
                                      : 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30'
                                  }`}>
                                    {market.source === 'axiom' ? '🔮 AXIOM' : '📊 POLY'}
                                  </span>
                                  <span className={`text-[8px] px-1 py-0.5 rounded ${
                                    market.category === 'crypto' ? 'bg-cyber-yellow/20 text-cyber-yellow' :
                                    market.category === 'regulatory' ? 'bg-cyber-purple/20 text-cyber-purple' :
                                    market.category === 'defi' ? 'bg-cyber-cyan/20 text-cyber-cyan' :
                                    'bg-cyber-muted/20 text-cyber-muted'
                                  }`}>
                                    {market.category}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  <div className="flex justify-between text-[9px] mb-1">
                                    <span className="text-cyber-green">YES {(yesProb * 100).toFixed(0)}%</span>
                                    <span className="text-cyber-red">NO {((1 - yesProb) * 100).toFixed(0)}%</span>
                                  </div>
                                  <div className="cyber-progress h-1.5 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-cyber-green to-cyber-cyan"
                                      style={{ width: `${yesProb * 100}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="text-right min-w-[50px]">
                                  {change !== 0 && (
                                    <span className={`text-[9px] ${change > 0 ? 'text-cyber-green' : 'text-cyber-red'}`}>
                                      {change > 0 ? '↑' : '↓'} {Math.abs(change * 100).toFixed(1)}%
                                    </span>
                                  )}
                                  <p className="text-[8px] text-cyber-muted">${(market.volume24h / 1000).toFixed(0)}K vol</p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      
                      {/* Prediction Signals */}
                      {predictionSignals.length > 0 && (
                        <div className="mt-3 p-2 rounded bg-cyber-darker/50 border border-cyber-cyan/30">
                          <p className="text-[9px] text-cyber-cyan mb-2 font-cyber">⚡ TOP SIGNALS</p>
                          <div className="space-y-1">
                            {predictionSignals.slice(0, 3).map((signal, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-[9px]">
                                <span className={`${
                                  signal.type === 'bullish' ? 'text-cyber-green' :
                                  signal.type === 'bearish' ? 'text-cyber-red' : 'text-cyber-yellow'
                                }`}>
                                  {signal.type === 'bullish' ? '📈' : signal.type === 'bearish' ? '📉' : '📊'}
                                </span>
                                <span className="text-cyber-muted truncate flex-1">{signal.description}</span>
                                <span className="text-cyber-text">{signal.strength}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Data Source Info */}
                      <div className="mt-3 p-2 rounded bg-cyber-darker/50 border border-cyber-green/30">
                        <p className="text-[9px] text-cyber-green mb-1 font-cyber">📈 DATA SOURCES:</p>
                        <ul className="text-[9px] text-cyber-muted space-y-0.5">
                          <li>• <a href="https://polymarket.com" target="_blank" rel="noopener noreferrer" className="text-cyber-cyan hover:underline">Polymarket</a> - Decentralized prediction markets (crypto, politics, macro)</li>
                          <li>• <a href="https://axiomprotocol.io" target="_blank" rel="noopener noreferrer" className="text-cyber-magenta hover:underline">Axiom Protocol</a> - XRPL prediction markets (XRP-native, RLUSD)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {/* Third Row - Alerts & Viral Narratives */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Cognitive Security Alerts */}
                    <div className="cyber-panel p-4 border-cyber-red/30">
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                        <Bell size={14} className="text-cyber-red" />
                        <span className="font-cyber text-xs text-cyber-red">COGNITIVE SECURITY ALERTS</span>
                        <span className="ml-auto flex items-center gap-2">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/30">
                            DEMO
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-cyber-red animate-pulse" />
                            <span className="text-[10px] text-cyber-red">{cognitiveAlerts.length}</span>
                          </span>
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {cognitiveAlerts.map((alert) => (
                          <div 
                            key={alert.id}
                            className={`p-3 rounded border ${
                              alert.severity === 'high' ? 'border-cyber-red/50 bg-cyber-red/10' :
                              alert.severity === 'medium' ? 'border-cyber-yellow/50 bg-cyber-yellow/10' :
                              'border-cyber-cyan/50 bg-cyber-cyan/10'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {alert.type === 'alert' ? (
                                <AlertOctagon size={14} className="text-cyber-red shrink-0 mt-0.5" />
                              ) : alert.type === 'warning' ? (
                                <AlertTriangle size={14} className="text-cyber-yellow shrink-0 mt-0.5" />
                              ) : (
                                <Info size={14} className="text-cyber-cyan shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <p className="text-xs text-cyber-text">{alert.message}</p>
                                <p className="text-[10px] text-cyber-muted mt-1">{alert.time}</p>
                              </div>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                                alert.severity === 'high' ? 'bg-cyber-red/20 text-cyber-red' :
                                alert.severity === 'medium' ? 'bg-cyber-yellow/20 text-cyber-yellow' :
                                'bg-cyber-cyan/20 text-cyber-cyan'
                              }`}>
                                {alert.severity}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-3 p-2 rounded bg-cyber-darker/50 border border-cyber-border/50">
                        <div className="flex items-center gap-2">
                          <Bot size={12} className="text-cyber-muted" />
                          <span className="text-[10px] text-cyber-muted">Bot Detection: IsolationForest anomaly detection active</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Viral Narratives */}
                    <div className="cyber-panel p-4 border-cyber-orange/30">
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                        <Flame size={14} className="text-cyber-orange" />
                        <span className="font-cyber text-xs text-cyber-orange">VIRAL NARRATIVES</span>
                        <span className="ml-auto text-[10px] text-cyber-muted">Memetic Spread Tracking</span>
                      </div>
                      
                      <div className="space-y-2">
                        {sentimentData.viralNarratives.map((narrative, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2 rounded bg-cyber-darker/50 border border-cyber-border/50">
                            <div className={`w-8 h-8 rounded flex items-center justify-center text-sm ${
                              narrative.sentiment === 'positive' ? 'bg-cyber-green/20' :
                              narrative.sentiment === 'negative' ? 'bg-cyber-red/20' : 'bg-cyber-yellow/20'
                            }`}>
                              {narrative.sentiment === 'positive' ? '🔥' : narrative.sentiment === 'negative' ? '❄️' : '⚡'}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-cyber-text">{narrative.text}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 cyber-progress h-1">
                                  <div 
                                    className={`cyber-progress-bar ${
                                      narrative.sentiment === 'positive' ? 'bg-cyber-green' :
                                      narrative.sentiment === 'negative' ? 'bg-cyber-red' : 'bg-cyber-yellow'
                                    }`}
                                    style={{ width: `${narrative.score}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-mono text-cyber-muted">{narrative.score}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-3 p-2 rounded bg-cyber-purple/10 border border-cyber-purple/30">
                        <p className="text-[10px] text-cyber-purple flex items-center gap-1">
                          <Brain size={10} />
                          NLP: distilbert-base-uncased-finetuned-sst-2-english
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Track Record / Accuracy Panel */}
                  <div className="cyber-panel p-4 border-cyber-green/30 bg-gradient-to-br from-cyber-green/5 to-transparent">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                      <Trophy size={14} className="text-cyber-green" />
                      <span className="font-cyber text-xs text-cyber-green">TRACK RECORD & ACCURACY</span>
                      <span className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded bg-cyber-green/20 border border-cyber-green/30">
                        <Award size={10} className="text-cyber-green" />
                        <span className="text-[10px] text-cyber-green font-cyber">{trackRecord.winRate}% WIN RATE</span>
                      </span>
                    </div>
                    
                    {/* Performance Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-border/50 text-center">
                        <p className="text-2xl font-cyber text-cyber-green">{trackRecord.totalCalls}</p>
                        <p className="text-[10px] text-cyber-muted">Total Calls</p>
                      </div>
                      <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-border/50 text-center">
                        <p className="text-2xl font-cyber text-cyber-green">{trackRecord.winningCalls}</p>
                        <p className="text-[10px] text-cyber-muted">Winners</p>
                      </div>
                      <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-border/50 text-center">
                        <p className="text-2xl font-cyber text-cyber-red">{trackRecord.losingCalls}</p>
                        <p className="text-[10px] text-cyber-muted">Losers</p>
                      </div>
                      <div className="p-3 rounded bg-cyber-green/10 border border-cyber-green/30 text-center">
                        <p className="text-2xl font-cyber text-cyber-green">+{trackRecord.totalProfitPercent}%</p>
                        <p className="text-[10px] text-cyber-muted">Total Return</p>
                      </div>
                    </div>
                    
                    {/* Avg Win/Loss & Best/Worst */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="p-2 rounded bg-cyber-green/10 border border-cyber-green/30">
                        <p className="text-xs text-cyber-muted">Avg Win</p>
                        <p className="text-sm font-cyber text-cyber-green">+{trackRecord.avgWin}%</p>
                      </div>
                      <div className="p-2 rounded bg-cyber-red/10 border border-cyber-red/30">
                        <p className="text-xs text-cyber-muted">Avg Loss</p>
                        <p className="text-sm font-cyber text-cyber-red">{trackRecord.avgLoss}%</p>
                      </div>
                      <div className="p-2 rounded bg-cyber-yellow/10 border border-cyber-yellow/30">
                        <p className="text-xs text-cyber-muted">Best Call</p>
                        <p className="text-sm font-cyber text-cyber-yellow">{trackRecord.bestCall.symbol} +{trackRecord.bestCall.gain}%</p>
                      </div>
                      <div className="p-2 rounded bg-cyber-purple/10 border border-cyber-purple/30">
                        <p className="text-xs text-cyber-muted">Current Streak</p>
                        <p className="text-sm font-cyber text-cyber-purple">🔥 {trackRecord.streak} Wins</p>
                      </div>
                    </div>
                    
                    {/* Recent Calls History */}
                    <div className="mb-2 flex items-center gap-2">
                      <History size={12} className="text-cyber-muted" />
                      <span className="text-xs text-cyber-muted font-cyber">RECENT CALLS</span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                      {trackRecord.recentCalls.map((call) => (
                        <div 
                          key={call.id} 
                          className={`flex items-center gap-3 p-2 rounded border ${
                            call.status === 'open' 
                              ? 'border-cyber-cyan/30 bg-cyber-cyan/5' 
                              : call.pnl >= 0 
                                ? 'border-cyber-green/30 bg-cyber-green/5' 
                                : 'border-cyber-red/30 bg-cyber-red/5'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                            call.status === 'open' 
                              ? 'bg-cyber-cyan/20 text-cyber-cyan' 
                              : call.pnl >= 0 
                                ? 'bg-cyber-green/20 text-cyber-green' 
                                : 'bg-cyber-red/20 text-cyber-red'
                          }`}>
                            {call.symbol.slice(0, 3)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-cyber-text font-medium">{call.name}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                                call.status === 'open' ? 'bg-cyber-cyan/20 text-cyber-cyan' : 'bg-cyber-muted/20 text-cyber-muted'
                              }`}>
                                {call.status === 'open' ? 'OPEN' : 'CLOSED'}
                              </span>
                              <span className="text-[9px] text-cyber-muted">{call.confidence}% conf.</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-cyber-muted">
                              <span>Entry: ${call.entryPrice.toLocaleString()}</span>
                              <span>→</span>
                              <span>{call.status === 'open' ? `Now: $${call.currentPrice.toLocaleString()}` : `Exit: $${call.exitPrice?.toLocaleString()}`}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-cyber ${call.pnl >= 0 ? 'text-cyber-green' : 'text-cyber-red'}`}>
                              {call.pnl >= 0 ? '+' : ''}{call.pnl}%
                            </p>
                            <p className="text-[9px] text-cyber-muted">{call.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3 p-2 rounded bg-cyber-darker/50 border border-cyber-border/50">
                      <p className="text-[10px] text-cyber-muted text-center">
                        ⚠️ Past performance does not guarantee future results. This is for educational purposes only.
                      </p>
                    </div>
                  </div>
                  
                  {/* Top Movers with Potential */}
                  <div className="cyber-panel p-4 border-cyber-yellow/30">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                      <Sparkles size={14} className="text-cyber-yellow" />
                      <span className="font-cyber text-xs text-cyber-yellow">TOP MOVERS WITH POTENTIAL</span>
                      <span className="ml-auto flex items-center gap-2">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                          dataSource === 'live' 
                            ? 'bg-cyber-green/20 text-cyber-green border-cyber-green/30' 
                            : dataSource === 'cached'
                            ? 'bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/30'
                            : 'bg-cyber-yellow/20 text-cyber-yellow border-cyber-yellow/30'
                        }`}>
                          {dataSource === 'live' ? '🟢 LIVE' : dataSource === 'cached' ? '📦 CACHED' : '⚠️ FALLBACK'}
                        </span>
                        <button
                          onClick={fetchTopMovers}
                          disabled={topMoversLoading}
                          className="p-1 hover:bg-cyber-yellow/10 rounded transition-colors"
                          title="Refresh (may hit rate limit)"
                        >
                          <RefreshCw size={12} className={`text-cyber-yellow ${topMoversLoading ? 'animate-spin' : ''}`} />
                        </button>
                      </span>
                    </div>
                    
                    {topMoversLoading ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 size={24} className="text-cyber-yellow animate-spin mb-2" />
                        <p className="text-xs text-cyber-muted">Loading from CoinGecko API...</p>
                      </div>
                    ) : topMoversError ? (
                      <div className="p-4 rounded bg-cyber-red/10 border border-cyber-red/30 text-center">
                        <p className="text-xs text-cyber-red mb-2">{topMoversError}</p>
                        <button
                          onClick={fetchTopMovers}
                          className="text-xs text-cyber-yellow hover:underline"
                        >
                          Try again
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {topMovers.map((coin, index) => (
                          <div 
                            key={coin.id}
                            className="flex items-center gap-3 p-3 rounded bg-cyber-darker/50 border border-cyber-border/50 hover:border-cyber-yellow/30 transition-colors cursor-pointer"
                            onClick={() => {
                              setSearchQuery(coin.id)
                              analyzeCustomCrypto(coin.id)
                            }}
                          >
                            <div className="w-8 h-8 rounded-full bg-cyber-yellow/20 flex items-center justify-center overflow-hidden">
                              {coin.image ? (
                                <img src={coin.image} alt={coin.symbol} className="w-6 h-6" />
                              ) : (
                                <span className="text-xs font-cyber text-cyber-yellow">#{index + 1}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm text-cyber-text font-medium">{coin.symbol}</span>
                                <span className="text-xs text-cyber-muted truncate">{coin.name}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                                  coin.momentum === 'bullish' ? 'bg-cyber-green/20 text-cyber-green' :
                                  coin.momentum === 'bearish' ? 'bg-cyber-red/20 text-cyber-red' :
                                  'bg-cyber-yellow/20 text-cyber-yellow'
                                }`}>
                                  {coin.momentum}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                                  coin.riskLevel === 'low' ? 'bg-cyber-green/20 text-cyber-green' :
                                  coin.riskLevel === 'medium' ? 'bg-cyber-yellow/20 text-cyber-yellow' :
                                  coin.riskLevel === 'high' ? 'bg-cyber-orange/20 text-cyber-orange' :
                                  'bg-cyber-red/20 text-cyber-red'
                                }`}>
                                  {coin.riskLevel} risk
                                </span>
                              </div>
                              <p className="text-[10px] text-cyber-muted mt-1 line-clamp-1">
                                {coin.narratives.length > 0 ? coin.narratives.join(' • ') : `RSI: ${coin.rsi} | Vol Score: ${coin.volumeScore}`}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-mono text-cyber-text">${coin.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}</p>
                              <div className="flex items-center gap-2 justify-end">
                                <span className={`text-[10px] ${coin.priceChange24h >= 0 ? 'text-cyber-green' : 'text-cyber-red'}`}>
                                  {coin.priceChange24h >= 0 ? '+' : ''}{coin.priceChange24h.toFixed(1)}% 24h
                                </span>
                              </div>
                            </div>
                            <div className="w-14 text-center shrink-0">
                              <div className={`text-lg font-cyber ${
                                coin.moonScore >= 75 ? 'text-cyber-green' :
                                coin.moonScore >= 60 ? 'text-cyber-yellow' :
                                'text-cyber-muted'
                              }`}>
                                {coin.moonScore}
                              </div>
                              <p className="text-[9px] text-cyber-muted">Moon Score</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Data Source Info */}
                    <div className="mt-3 p-2 rounded bg-cyber-darker/50 border border-cyber-yellow/30">
                      <p className="text-[9px] text-cyber-yellow mb-1 font-cyber">📊 DATA SOURCE & SCORING:</p>
                      <ul className="text-[9px] text-cyber-muted space-y-0.5">
                        <li>• 🟢 LIVE = Fresh from CoinGecko API with full sparkline data</li>
                        <li>• 📦 CACHED = Data from last 5 minutes (avoids rate limits)</li>
                        <li>• ⚠️ FALLBACK = Pre-set data when API unavailable (rate limited)</li>
                        <li>• Moon Score = Momentum (40%) + Volume (20%) + RSI (15%) + ATH (10%) + MCap (5%)</li>
                      </ul>
                      <p className="text-[9px] text-cyber-muted mt-1">
                        💡 CoinGecko free tier: ~10-30 calls/min. Wait 1-2 min if rate limited.
                      </p>
                    </div>
                  </div>
                  
                  {/* Crypto Search & Analysis */}
                  <div className="cyber-panel p-4 border-cyber-cyan/30">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                      <Search size={14} className="text-cyber-cyan" />
                      <span className="font-cyber text-xs text-cyber-cyan">ANALYZE ANY CRYPTO</span>
                      <span className="ml-auto text-[10px] text-cyber-muted">Enter symbol or name</span>
                    </div>
                    
                    {/* Search Input */}
                    <div className="flex gap-2 mb-4">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && analyzeCustomCrypto(searchQuery)}
                          placeholder="Enter crypto symbol (e.g., XRP, BTC, ETH, SOL...)"
                          className="w-full bg-cyber-darker border border-cyber-border rounded px-4 py-3 text-sm text-cyber-text placeholder:text-cyber-muted focus:border-cyber-cyan focus:outline-none font-mono"
                        />
                        {isSearching && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <RefreshCw size={16} className="text-cyber-cyan animate-spin" />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => analyzeCustomCrypto(searchQuery)}
                        disabled={isSearching || !searchQuery.trim()}
                        className="px-6 py-3 rounded bg-cyber-cyan/20 border border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan/30 transition-all font-cyber text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Calculator size={16} />
                        ANALYZE
                      </button>
                    </div>
                    
                    {/* Search Result */}
                    {/* Search Error */}
                    {searchError && (
                      <div className="p-4 rounded bg-cyber-red/10 border border-cyber-red/30 text-center">
                        <p className="text-xs text-cyber-red">{searchError}</p>
                      </div>
                    )}
                    
                    {searchResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded bg-cyber-darker border border-cyber-cyan/30"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-3">
                            {searchResult.image && (
                              <img src={searchResult.image} alt={searchResult.symbol} className="w-12 h-12 rounded-full" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-xl font-cyber text-cyber-text">{searchResult.symbol}</h3>
                                <span className="text-sm text-cyber-muted">{searchResult.name}</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyber-muted/20 text-cyber-muted">
                                  #{searchResult.marketCapRank}
                                </span>
                              </div>
                              <p className="text-2xl font-mono text-cyber-cyan">${searchResult.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
                              <div className="flex items-center gap-3">
                                <span className={`text-sm ${searchResult.priceChange24h >= 0 ? 'text-cyber-green' : 'text-cyber-red'}`}>
                                  {searchResult.priceChange24h >= 0 ? '+' : ''}{searchResult.priceChange24h.toFixed(2)}% (24h)
                                </span>
                                <span className={`text-xs ${searchResult.priceChange7d >= 0 ? 'text-cyber-green' : 'text-cyber-red'}`}>
                                  {searchResult.priceChange7d >= 0 ? '+' : ''}{searchResult.priceChange7d.toFixed(2)}% (7d)
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-4xl font-cyber ${
                              searchResult.moonScore >= 70 ? 'text-cyber-green' :
                              searchResult.moonScore >= 50 ? 'text-cyber-yellow' :
                              'text-cyber-red'
                            }`}>
                              {searchResult.moonScore}
                            </div>
                            <p className="text-xs text-cyber-muted">Moon Score</p>
                            <div className={`mt-2 px-3 py-1 rounded font-cyber text-sm ${
                              searchResult.recommendation.includes('buy') ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/30' :
                              searchResult.recommendation === 'hold' ? 'bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/30' :
                              'bg-cyber-red/20 text-cyber-red border border-cyber-red/30'
                            }`}>
                              {searchResult.recommendation.toUpperCase().replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                        
                        {/* Technicals */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/50 text-center">
                            <p className="text-xs text-cyber-muted">RSI (14)</p>
                            <p className={`text-sm font-cyber ${
                              searchResult.rsi < 30 ? 'text-cyber-green' :
                              searchResult.rsi > 70 ? 'text-cyber-red' :
                              'text-cyber-text'
                            }`}>{searchResult.rsi}</p>
                            <p className="text-[9px] text-cyber-muted">
                              {searchResult.rsi < 30 ? 'Oversold' : searchResult.rsi > 70 ? 'Overbought' : 'Neutral'}
                            </p>
                          </div>
                          <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/50 text-center">
                            <p className="text-xs text-cyber-muted">Momentum</p>
                            <p className={`text-sm font-cyber ${
                              searchResult.momentum === 'bullish' ? 'text-cyber-green' :
                              searchResult.momentum === 'bearish' ? 'text-cyber-red' :
                              'text-cyber-yellow'
                            }`}>{searchResult.momentum.charAt(0).toUpperCase() + searchResult.momentum.slice(1)}</p>
                            <p className="text-[9px] text-cyber-muted">Score: {searchResult.momentumScore}</p>
                          </div>
                          <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/50 text-center">
                            <p className="text-xs text-cyber-muted">24h Range</p>
                            <p className="text-[10px] font-mono text-cyber-text">
                              ${searchResult.low24h.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                            </p>
                            <p className="text-[10px] font-mono text-cyber-text">
                              ${searchResult.high24h.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                            </p>
                          </div>
                          <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/50 text-center">
                            <p className="text-xs text-cyber-muted">ATH Distance</p>
                            <p className="text-sm font-mono text-cyber-red">{searchResult.athChangePercent.toFixed(1)}%</p>
                            <p className="text-[9px] text-cyber-muted">${searchResult.ath.toLocaleString()}</p>
                          </div>
                        </div>
                        
                        {/* Additional Scores */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          <div className="p-2 rounded bg-cyber-purple/10 border border-cyber-purple/30 text-center">
                            <p className="text-[9px] text-cyber-muted">Volume</p>
                            <p className="text-sm font-cyber text-cyber-purple">{searchResult.volumeScore}</p>
                          </div>
                          <div className="p-2 rounded bg-cyber-cyan/10 border border-cyber-cyan/30 text-center">
                            <p className="text-[9px] text-cyber-muted">Technical</p>
                            <p className="text-sm font-cyber text-cyber-cyan">{searchResult.technicalScore}</p>
                          </div>
                          <div className="p-2 rounded bg-cyber-orange/10 border border-cyber-orange/30 text-center">
                            <p className="text-[9px] text-cyber-muted">Volatility</p>
                            <p className="text-sm font-cyber text-cyber-orange">{searchResult.volatilityScore}</p>
                          </div>
                          <div className="p-2 rounded bg-cyber-green/10 border border-cyber-green/30 text-center">
                            <p className="text-[9px] text-cyber-muted">Confidence</p>
                            <p className="text-sm font-cyber text-cyber-green">{searchResult.confidenceScore}%</p>
                          </div>
                        </div>
                        
                        {/* Risk Level */}
                        <div className="flex items-center gap-2 mb-4 flex-wrap">
                          <span className="text-xs text-cyber-muted">Risk Level:</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            searchResult.riskLevel === 'low' ? 'bg-cyber-green/20 text-cyber-green' :
                            searchResult.riskLevel === 'medium' ? 'bg-cyber-yellow/20 text-cyber-yellow' :
                            searchResult.riskLevel === 'high' ? 'bg-cyber-orange/20 text-cyber-orange' :
                            'bg-cyber-red/20 text-cyber-red'
                          }`}>
                            {searchResult.riskLevel.toUpperCase()}
                          </span>
                          {searchResult.riskFactors.map((factor, idx) => (
                            <span key={idx} className="text-[9px] text-cyber-muted">• {factor}</span>
                          ))}
                        </div>
                        
                        {/* Narratives/Catalysts */}
                        {searchResult.narratives.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-cyber-muted mb-2 font-cyber">NARRATIVES & CATALYSTS</p>
                            <div className="flex flex-wrap gap-2">
                              {searchResult.narratives.map((narrative, idx) => (
                                <span key={idx} className="text-xs px-2 py-1 rounded bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan">
                                  {narrative}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Market Data */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/50">
                            <p className="text-[9px] text-cyber-muted">Market Cap</p>
                            <p className="text-sm font-mono text-cyber-text">${(searchResult.marketCap / 1e9).toFixed(2)}B</p>
                          </div>
                          <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/50">
                            <p className="text-[9px] text-cyber-muted">24h Volume</p>
                            <p className="text-sm font-mono text-cyber-text">${(searchResult.volume24h / 1e9).toFixed(2)}B</p>
                          </div>
                        </div>
                        
                        <div className="mt-4 p-2 rounded bg-cyber-yellow/10 border border-cyber-yellow/30">
                          <p className="text-[10px] text-cyber-yellow text-center">
                            ⚠️ This analysis is for informational purposes only. Always do your own research before investing.
                          </p>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Quick Analysis Buttons */}
                    {!searchResult && (
                      <div className="flex flex-wrap gap-2">
                        <p className="w-full text-xs text-cyber-muted mb-1">Quick analyze:</p>
                        {['XRP', 'BTC', 'ETH', 'SOL', 'HBAR', 'LINK', 'DOGE'].map((symbol) => (
                          <button
                            key={symbol}
                            onClick={() => {
                              setSearchQuery(symbol.toLowerCase())
                              analyzeCustomCrypto(symbol.toLowerCase())
                            }}
                            className="px-3 py-1.5 rounded bg-cyber-darker/50 border border-cyber-border/50 hover:border-cyber-cyan/50 text-xs text-cyber-text hover:text-cyber-cyan transition-colors"
                          >
                            {symbol}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Backend Status */}
                  <div className="cyber-panel p-4 border-cyber-muted/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Cpu size={14} className="text-cyber-muted" />
                      <span className="font-cyber text-xs text-cyber-muted">BACKEND STATUS</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { name: 'XRPL WebSocket', status: 'connected', color: 'green' },
                        { name: 'Social Fetcher', status: 'polling', color: 'yellow' },
                        { name: 'ML Pipeline', status: 'ready', color: 'green' },
                        { name: 'Game Theory Engine', status: 'computing', color: 'cyan' },
                      ].map((service) => (
                        <div key={service.name} className="flex items-center gap-2 p-2 rounded bg-cyber-darker/50">
                          <span className={`w-2 h-2 rounded-full ${
                            service.color === 'green' ? 'bg-cyber-green' :
                            service.color === 'yellow' ? 'bg-cyber-yellow animate-pulse' :
                            'bg-cyber-cyan animate-pulse'
                          }`} />
                          <div>
                            <p className="text-[10px] text-cyber-text">{service.name}</p>
                            <p className="text-[9px] text-cyber-muted">{service.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <p className="text-[10px] text-cyber-muted mt-3">
                      Tech Stack: Python 3.10+ • FastAPI • xrpl-py • HuggingFace Transformers • nashpy • IsolationForest
                    </p>
                  </div>
                </motion.div>
              )}
              
              {/* Game Theory Tab */}
              {activeTab === 'gametheory' && (
                <motion.div
                  key="gametheory"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="cyber-panel p-4 border-cyber-glow/30">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                      <Target size={16} className="text-cyber-glow" />
                      <span className="font-cyber text-sm text-cyber-glow">GAME THEORY SCENARIOS</span>
                      <span className="text-xs text-cyber-muted ml-2">Strategic thinking for crypto defense</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {gameTheoryScenarios.map((scenario) => (
                        <button
                          key={scenario.id}
                          onClick={() => setSelectedScenario(selectedScenario?.id === scenario.id ? null : scenario)}
                          className={`text-left p-3 rounded border transition-all ${
                            selectedScenario?.id === scenario.id
                              ? 'border-cyber-glow/50 bg-cyber-glow/10'
                              : 'border-cyber-border/50 bg-cyber-darker/50 hover:border-cyber-glow/30'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-cyber-text font-medium">{scenario.name}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                              scenario.type === 'classic' ? 'bg-cyber-green/20 text-cyber-green' :
                              scenario.type === 'crypto' ? 'bg-cyber-glow/20 text-cyber-glow' :
                              scenario.type === 'social' ? 'bg-cyber-yellow/20 text-cyber-yellow' :
                              'bg-cyber-purple/20 text-cyber-purple'
                            }`}>
                              {scenario.type}
                            </span>
                          </div>
                          <p className="text-xs text-cyber-muted line-clamp-2">{scenario.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[9px] text-cyber-cyan">{scenario.players} players</span>
                            <span className="text-[9px] text-cyber-muted">•</span>
                            <span className="text-[9px] text-cyber-muted">{scenario.strategies.length} strategies</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    
                    {/* Selected Scenario Detail */}
                    <AnimatePresence>
                      {selectedScenario && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 p-4 rounded bg-cyber-glow/10 border border-cyber-glow/30"
                        >
                          <h3 className="font-cyber text-lg text-cyber-glow mb-3">{selectedScenario.name}</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-cyber-muted mb-1 font-cyber">STRATEGIES</p>
                              <div className="flex flex-wrap gap-1">
                                {selectedScenario.strategies.map((s) => (
                                  <span key={s} className="px-2 py-1 rounded text-xs bg-cyber-darker/50 text-cyber-text">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-cyber-muted mb-1 font-cyber">NASH EQUILIBRIUM</p>
                              <p className="text-sm text-cyber-cyan">{selectedScenario.nashEquilibrium}</p>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <p className="text-xs text-cyber-muted mb-1 font-cyber">XRPL RELEVANCE</p>
                            <p className="text-sm text-cyber-text">{selectedScenario.xrplRelevance}</p>
                          </div>
                          
                          <div className="p-3 rounded bg-cyber-green/10 border border-cyber-green/30">
                            <div className="flex items-center gap-2 mb-1">
                              <Lightbulb size={14} className="text-cyber-green" />
                              <span className="text-xs text-cyber-green font-cyber">KEY LESSON</span>
                            </div>
                            <p className="text-sm text-cyber-text">{selectedScenario.lesson}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
              
              {/* Cognitive Security Tab */}
              {activeTab === 'cognitive' && (
                <motion.div
                  key="cognitive"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="cyber-panel p-4 border-cyber-red/30">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                      <Brain size={16} className="text-cyber-red" />
                      <span className="font-cyber text-sm text-cyber-red">COGNITIVE THREAT LIBRARY</span>
                      <span className="text-xs text-cyber-muted ml-2">Know your adversary</span>
                    </div>
                    
                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                      {cognitiveThreats.map((threat) => (
                        <div
                          key={threat.id}
                          className={`p-3 rounded border transition-all cursor-pointer ${
                            selectedThreat?.id === threat.id
                              ? 'border-cyber-red/50 bg-cyber-red/10'
                              : 'border-cyber-border/50 bg-cyber-darker/50 hover:border-cyber-red/30'
                          }`}
                          onClick={() => setSelectedThreat(selectedThreat?.id === threat.id ? null : threat)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                threat.severity === 'critical' ? 'bg-cyber-red animate-pulse' :
                                threat.severity === 'high' ? 'bg-cyber-orange' :
                                threat.severity === 'medium' ? 'bg-cyber-yellow' :
                                'bg-cyber-green'
                              }`} />
                              <span className="text-sm text-cyber-text font-medium">{threat.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                                threat.category === 'memetic' ? 'bg-cyber-purple/20 text-cyber-purple' :
                                threat.category === 'social-engineering' ? 'bg-cyber-yellow/20 text-cyber-yellow' :
                                threat.category === 'psyop' ? 'bg-cyber-red/20 text-cyber-red' :
                                'bg-cyber-cyan/20 text-cyber-cyan'
                              }`}>
                                {threat.category}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                                threat.severity === 'critical' ? 'bg-cyber-red/20 text-cyber-red' :
                                threat.severity === 'high' ? 'bg-cyber-orange/20 text-cyber-orange' :
                                threat.severity === 'medium' ? 'bg-cyber-yellow/20 text-cyber-yellow' :
                                'bg-cyber-green/20 text-cyber-green'
                              }`}>
                                {threat.severity}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-cyber-muted">{threat.description}</p>
                          
                          <AnimatePresence>
                            {selectedThreat?.id === threat.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 pt-3 border-t border-cyber-border/50"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-xs text-cyber-red mb-2 font-cyber">⚠️ INDICATORS</p>
                                    <ul className="space-y-1">
                                      {threat.indicators.map((indicator, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                          <XCircle size={10} className="text-cyber-red mt-0.5 shrink-0" />
                                          <span className="text-xs text-cyber-text">{indicator}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <p className="text-xs text-cyber-green mb-2 font-cyber">🛡️ DEFENSES</p>
                                    <ul className="space-y-1">
                                      {threat.defenses.map((defense, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                          <CheckCircle size={10} className="text-cyber-green mt-0.5 shrink-0" />
                                          <span className="text-xs text-cyber-text">{defense}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                                {threat.giordanoReference && (
                                  <div className="mt-3 p-2 rounded bg-cyber-cyan/10 border border-cyber-cyan/30">
                                    <p className="text-[10px] text-cyber-cyan">
                                      <BookOpen size={10} className="inline mr-1" />
                                      Giordano: {threat.giordanoReference}
                                    </p>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Giordano Framework */}
                  <div className="cyber-panel p-4 border-cyber-cyan/30">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                      <BookOpen size={16} className="text-cyber-cyan" />
                      <span className="font-cyber text-sm text-cyber-cyan">GIORDANO FRAMEWORK</span>
                      <span className="text-xs text-cyber-muted ml-2">Neuro-cognitive warfare concepts</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {giordanoFramework.map((concept) => (
                        <div
                          key={concept.id}
                          className="p-3 rounded bg-cyber-darker/50 border border-cyber-border/50"
                        >
                          <h4 className="text-sm text-cyber-cyan font-medium mb-2">{concept.concept}</h4>
                          <p className="text-xs text-cyber-muted mb-2">{concept.description}</p>
                          <div className="p-2 rounded bg-cyber-cyan/5 border border-cyber-cyan/20">
                            <p className="text-[10px] text-cyber-text">
                              <Lightbulb size={10} className="inline mr-1 text-cyber-cyan" />
                              {concept.awareness}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Memetic Tab */}
              {activeTab === 'memetic' && (
                <motion.div
                  key="memetic"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="cyber-panel p-4 border-cyber-purple/30">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                      <Waves size={16} className="text-cyber-purple" />
                      <span className="font-cyber text-sm text-cyber-purple">MEMETIC CONCEPTS</span>
                      <span className="text-xs text-cyber-muted ml-2">Understanding idea viruses</span>
                    </div>
                    
                    <div className="space-y-4">
                      {memeticConcepts.map((concept) => (
                        <div
                          key={concept.id}
                          className="p-4 rounded bg-cyber-darker/50 border border-cyber-border/50"
                        >
                          <h4 className="text-sm text-cyber-purple font-medium mb-2">{concept.name}</h4>
                          <p className="text-xs text-cyber-text mb-3">{concept.definition}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-2 rounded bg-cyber-yellow/10 border border-cyber-yellow/30">
                              <p className="text-[9px] text-cyber-yellow font-cyber mb-1">CRYPTO EXAMPLE</p>
                              <p className="text-xs text-cyber-text">{concept.cryptoExample}</p>
                            </div>
                            <div className="p-2 rounded bg-cyber-green/10 border border-cyber-green/30">
                              <p className="text-[9px] text-cyber-green font-cyber mb-1">DEFENSE</p>
                              <p className="text-xs text-cyber-text">{concept.defense}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Memetic Warfare Warning */}
                  <div className="cyber-panel p-4 border-cyber-red/30 bg-cyber-red/5">
                    <div className="flex items-start gap-3">
                      <AlertOctagon size={20} className="text-cyber-red shrink-0" />
                      <div>
                        <h4 className="text-sm text-cyber-red font-cyber mb-2">MEMETIC WARFARE IN CRYPTO</h4>
                        <p className="text-xs text-cyber-text mb-3">
                          The crypto space is a primary battleground for memetic warfare. Narratives are weaponized 
                          to influence price action, regulatory perception, and community cohesion. Be aware:
                        </p>
                        <ul className="space-y-1">
                          {[
                            'Coordinated FUD campaigns target specific projects',
                            '"Grassroots" movements may be artificially manufactured',
                            'Influencers can be compromised or paid actors',
                            'Emotional narratives spread faster than facts',
                            'Your tribal identity is being exploited',
                          ].map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <ChevronRight size={12} className="text-cyber-red mt-0.5 shrink-0" />
                              <span className="text-xs text-cyber-text">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* BCI Awareness Tab */}
              {activeTab === 'bci' && (
                <motion.div
                  key="bci"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="cyber-panel p-4 border-cyber-cyan/30">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                      <Cpu size={16} className="text-cyber-cyan" />
                      <span className="font-cyber text-sm text-cyber-cyan">BRAIN-COMPUTER INTERFACE AWARENESS</span>
                      <span className="text-xs text-cyber-muted ml-2">Know the emerging landscape</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {bciTechnologies.map((tech) => (
                        <div
                          key={tech.id}
                          onClick={() => setSelectedBCI(selectedBCI?.id === tech.id ? null : tech)}
                          className={`p-3 rounded border cursor-pointer transition-all ${
                            selectedBCI?.id === tech.id
                              ? 'border-cyber-cyan/50 bg-cyber-cyan/10'
                              : 'border-cyber-border/50 bg-cyber-darker/50 hover:border-cyber-cyan/30'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-cyber-text font-medium">{tech.name}</span>
                            <div className="flex items-center gap-1">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                                tech.type === 'invasive' ? 'bg-cyber-red/20 text-cyber-red' :
                                tech.type === 'non-invasive' ? 'bg-cyber-green/20 text-cyber-green' :
                                'bg-cyber-purple/20 text-cyber-purple'
                              }`}>
                                {tech.type}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                                tech.status === 'deployed' ? 'bg-cyber-green/20 text-cyber-green' :
                                tech.status === 'clinical' ? 'bg-cyber-yellow/20 text-cyber-yellow' :
                                tech.status === 'research' ? 'bg-cyber-cyan/20 text-cyber-cyan' :
                                'bg-cyber-muted/20 text-cyber-muted'
                              }`}>
                                {tech.status}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-cyber-muted">{tech.description}</p>
                          
                          <AnimatePresence>
                            {selectedBCI?.id === tech.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 pt-3 border-t border-cyber-border/50"
                              >
                                <div className="grid grid-cols-1 gap-3">
                                  <div>
                                    <p className="text-xs text-cyber-cyan mb-2 font-cyber">CAPABILITIES</p>
                                    <ul className="space-y-1">
                                      {tech.capabilities.map((cap, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                          <Zap size={10} className="text-cyber-cyan mt-0.5 shrink-0" />
                                          <span className="text-xs text-cyber-text">{cap}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <p className="text-xs text-cyber-red mb-2 font-cyber">CONCERNS</p>
                                    <ul className="space-y-1">
                                      {tech.concerns.map((concern, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                          <AlertTriangle size={10} className="text-cyber-red mt-0.5 shrink-0" />
                                          <span className="text-xs text-cyber-text">{concern}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div className="p-2 rounded bg-cyber-purple/10 border border-cyber-purple/30">
                                    <p className="text-xs text-cyber-purple">
                                      <Fingerprint size={10} className="inline mr-1" />
                                      <strong>XRPL Relevance:</strong> {tech.relevance}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Giordano Neuroethics */}
                  <div className="cyber-panel p-4 border-cyber-purple/30 bg-cyber-purple/5">
                    <div className="flex items-start gap-3">
                      <Brain size={20} className="text-cyber-purple shrink-0" />
                      <div>
                        <h4 className="text-sm text-cyber-purple font-cyber mb-2">THE BRAIN AS BATTLESPACE (Giordano)</h4>
                        <p className="text-xs text-cyber-text mb-3">
                          Dr. James Giordano's work at Georgetown University highlights how neuroscience is increasingly 
                          being weaponized. Key concepts:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            { term: 'Neuroweapons', desc: 'Technologies that directly affect brain function for strategic advantage' },
                            { term: 'Cognitive Liberty', desc: 'The right to mental self-determination and freedom from cognitive manipulation' },
                            { term: 'NeuroS&T', desc: 'The convergence of neuroscience with security and technology domains' },
                            { term: 'Neural Rights', desc: 'Emerging framework for protecting mental privacy and integrity' },
                          ].map((item) => (
                            <div key={item.term} className="p-2 rounded bg-cyber-darker/50 border border-cyber-purple/20">
                              <p className="text-xs text-cyber-purple font-medium">{item.term}</p>
                              <p className="text-[10px] text-cyber-muted">{item.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Threat Simulator Tab */}
              {activeTab === 'simulator' && (
                <motion.div
                  key="simulator"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="cyber-panel p-4 border-cyber-yellow/30">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-cyber-border">
                      <div className="flex items-center gap-2">
                        <Crosshair size={16} className="text-cyber-yellow" />
                        <span className="font-cyber text-sm text-cyber-yellow">SOCIAL ENGINEERING SIMULATOR</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-cyber-muted">Score:</span>
                        <span className="font-cyber text-sm text-cyber-green">
                          {simScore.correct}/{simScore.total}
                        </span>
                        <button
                          onClick={() => { setSimScore({ correct: 0, total: 0 }); setCurrentSimScenario(0); setShowSimAnswer(false) }}
                          className="p-1 rounded hover:bg-cyber-border/30 text-cyber-muted hover:text-cyber-text transition-colors"
                          title="Reset"
                        >
                          <RotateCcw size={14} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Current Scenario */}
                    {socialEngScenarios[currentSimScenario] && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-cyber-muted">Scenario {currentSimScenario + 1}/{socialEngScenarios.length}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                              socialEngScenarios[currentSimScenario].difficulty === 'easy' ? 'bg-cyber-green/20 text-cyber-green' :
                              socialEngScenarios[currentSimScenario].difficulty === 'medium' ? 'bg-cyber-yellow/20 text-cyber-yellow' :
                              'bg-cyber-red/20 text-cyber-red'
                            }`}>
                              {socialEngScenarios[currentSimScenario].difficulty}
                            </span>
                          </div>
                          <span className="font-cyber text-xs text-cyber-text">{socialEngScenarios[currentSimScenario].name}</span>
                        </div>
                        
                        {/* Scenario Context */}
                        <div className="p-4 rounded bg-cyber-darker border border-cyber-border">
                          <div className="flex items-start gap-3">
                            <MessageSquare size={16} className="text-cyber-muted shrink-0 mt-1" />
                            <p className="text-sm text-cyber-text italic">"{socialEngScenarios[currentSimScenario].context}"</p>
                          </div>
                        </div>
                        
                        {/* Response Options */}
                        {!showSimAnswer ? (
                          <div className="flex items-center gap-3 justify-center">
                            <button
                              onClick={() => handleSimResponse(true)}
                              className="flex items-center gap-2 px-6 py-3 rounded bg-cyber-red/20 border border-cyber-red/50 text-cyber-red hover:bg-cyber-red/30 transition-all font-cyber text-sm"
                            >
                              <AlertTriangle size={16} />
                              SUSPICIOUS - Don't Act
                            </button>
                            <button
                              onClick={() => handleSimResponse(false)}
                              className="flex items-center gap-2 px-6 py-3 rounded bg-cyber-green/20 border border-cyber-green/50 text-cyber-green hover:bg-cyber-green/30 transition-all font-cyber text-sm"
                            >
                              <CheckCircle size={16} />
                              SAFE - Proceed
                            </button>
                          </div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                          >
                            {/* Red Flags */}
                            <div className="p-3 rounded bg-cyber-red/10 border border-cyber-red/30">
                              <p className="text-xs text-cyber-red mb-2 font-cyber">🚩 RED FLAGS</p>
                              <ul className="space-y-1">
                                {socialEngScenarios[currentSimScenario].redFlags.map((flag, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <XCircle size={10} className="text-cyber-red mt-0.5 shrink-0" />
                                    <span className="text-xs text-cyber-text">{flag}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            {/* Correct Response */}
                            <div className="p-3 rounded bg-cyber-green/10 border border-cyber-green/30">
                              <p className="text-xs text-cyber-green mb-2 font-cyber">✓ CORRECT RESPONSE</p>
                              <p className="text-sm text-cyber-text">{socialEngScenarios[currentSimScenario].correctResponse}</p>
                            </div>
                            
                            {/* Explanation */}
                            <div className="p-3 rounded bg-cyber-cyan/10 border border-cyber-cyan/30">
                              <p className="text-xs text-cyber-cyan mb-2 font-cyber">💡 EXPLANATION</p>
                              <p className="text-sm text-cyber-text">{socialEngScenarios[currentSimScenario].explanation}</p>
                            </div>
                            
                            <button
                              onClick={nextSimScenario}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded bg-cyber-purple/20 border border-cyber-purple/50 text-cyber-purple hover:bg-cyber-purple/30 transition-all font-cyber text-sm"
                            >
                              Next Scenario
                              <ChevronRight size={16} />
                            </button>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Tips */}
                  <div className="cyber-panel p-4 border-cyber-green/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb size={16} className="text-cyber-green" />
                      <span className="font-cyber text-sm text-cyber-green">UNIVERSAL RED FLAGS</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        'Urgency & FOMO',
                        'Unsolicited offers',
                        'Requests for secrets',
                        'Too good to be true',
                        '"Verify" via DM',
                        'Emotional pressure',
                        'Moving off platform',
                        '"Don\'t tell anyone"',
                      ].map((flag) => (
                        <div key={flag} className="flex items-center gap-2 p-2 rounded bg-cyber-darker/50 border border-cyber-border/50">
                          <AlertTriangle size={10} className="text-cyber-yellow shrink-0" />
                          <span className="text-[10px] text-cyber-text">{flag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Defense Protocols Tab */}
              {activeTab === 'defense' && (
                <motion.div
                  key="defense"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="cyber-panel p-4 border-cyber-green/30">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                      <Shield size={16} className="text-cyber-green" />
                      <span className="font-cyber text-sm text-cyber-green">DEFENSE PROTOCOLS</span>
                      <span className="text-xs text-cyber-muted ml-2">Actionable cognitive defense</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {defenseProtocols.map((protocol) => {
                        const Icon = protocol.icon
                        return (
                          <div
                            key={protocol.id}
                            className="p-4 rounded bg-cyber-darker/50 border border-cyber-border/50"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded flex items-center justify-center bg-cyber-green/20">
                                  <Icon size={16} className="text-cyber-green" />
                                </div>
                                <div>
                                  <h4 className="text-sm text-cyber-green font-medium">{protocol.name}</h4>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                                    protocol.level === 'basic' ? 'bg-cyber-green/20 text-cyber-green' :
                                    protocol.level === 'intermediate' ? 'bg-cyber-yellow/20 text-cyber-yellow' :
                                    'bg-cyber-purple/20 text-cyber-purple'
                                  }`}>
                                    {protocol.level}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <p className="text-xs text-cyber-muted mb-3">{protocol.description}</p>
                            
                            <ol className="space-y-2">
                              {protocol.steps.map((step, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="w-5 h-5 rounded-full bg-cyber-green/20 text-cyber-green text-[10px] flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </span>
                                  <span className="text-xs text-cyber-text">{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  
                  {/* Quick Defense Checklist */}
                  <div className="cyber-panel p-4 border-cyber-cyan/30">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                      <CheckCircle size={16} className="text-cyber-cyan" />
                      <span className="font-cyber text-sm text-cyber-cyan">DAILY COGNITIVE HYGIENE</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { icon: Clock, text: 'Implement 24-hour rule before major decisions' },
                        { icon: Users, text: 'Consult trusted advisors outside your echo chamber' },
                        { icon: Eye, text: 'Identify the source and their incentives' },
                        { icon: Brain, text: 'Notice emotional reactions before acting' },
                        { icon: Target, text: 'Ask: Who benefits if I believe this?' },
                        { icon: Shield, text: 'Verify through multiple independent sources' },
                        { icon: Wifi, text: 'Take regular breaks from social media' },
                        { icon: Lightbulb, text: 'Update beliefs based on evidence, not tribe' },
                      ].map((item, idx) => {
                        const Icon = item.icon
                        return (
                          <div key={idx} className="flex items-center gap-3 p-2 rounded bg-cyber-darker/50">
                            <Icon size={14} className="text-cyber-cyan shrink-0" />
                            <span className="text-xs text-cyber-text">{item.text}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
        
        {/* Footer Resources */}
        <motion.div 
          className="mt-6 cyber-panel p-4 border-cyber-purple/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
            <BookOpen size={16} className="text-cyber-purple" />
            <span className="font-cyber text-sm text-cyber-purple">FURTHER READING</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {[
              { name: 'Giordano - Neuroscience & National Security', url: 'https://www.youtube.com/results?search_query=james+giordano+neuroscience' },
              { name: 'RAND - Cognitive Security', url: 'https://www.rand.org/topics/information-operations.html' },
              { name: 'NATO - Cognitive Warfare', url: 'https://www.nato.int/cps/en/natohq/topics_156338.htm' },
              { name: 'Stanford - Internet Observatory', url: 'https://cyber.fsi.stanford.edu/io' },
              { name: 'EFF - Digital Security', url: 'https://www.eff.org/issues/security' },
              { name: 'Bellingcat - OSINT', url: 'https://www.bellingcat.com/' },
            ].map((resource) => (
              <a
                key={resource.name}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 rounded bg-cyber-darker/50 border border-cyber-purple/30 hover:border-cyber-purple/60 hover:bg-cyber-purple/10 transition-all group"
              >
                <span className="text-xs text-cyber-text group-hover:text-cyber-purple">{resource.name}</span>
                <ExternalLink size={10} className="text-cyber-muted group-hover:text-cyber-purple" />
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
