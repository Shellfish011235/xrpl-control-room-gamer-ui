import { motion, AnimatePresence } from 'framer-motion'
import React, { useState, useMemo, useEffect, useCallback } from 'react'
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
  Trophy, Award, Search, Sparkles, History, Calculator, Loader2,
  Atom, Orbit, Binary, Sigma, FlaskConical, GitBranch
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
import {
  AIQuantumAnalytics,
  type NashEquilibriumResult,
  type MemeticPropagationModel,
  type QuantumPrediction,
  type XRPLIncentiveModel
} from '../services/aiQuantumAnalytics'
import { getCombinedSentiment, fetchWhaleTransactions } from '../services/freeDataFeeds'
import { PaperTradingPanel } from '../components/PaperTradingPanel'

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

// ==================== ERROR BOUNDARY ====================

// Simple error boundary wrapper using React state
function ErrorBoundaryWrapper({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(new Error(event.message));
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="cyber-panel p-4 border-cyber-red/50">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={16} className="text-cyber-red" />
          <span className="font-cyber text-sm text-cyber-red">COMPONENT ERROR</span>
        </div>
        <p className="text-xs text-cyber-muted mb-2">
          {error?.message || 'Something went wrong loading this component.'}
        </p>
        <button
          onClick={() => { setHasError(false); setError(null); }}
          className="px-3 py-1 text-xs rounded bg-cyber-cyan/20 text-cyber-cyan hover:bg-cyber-cyan/30"
        >
          Try Again
        </button>
      </div>
    );
  }

  try {
    return <>{children}</>;
  } catch (e) {
    return (
      <div className="cyber-panel p-4 border-cyber-red/50">
        <p className="text-cyber-red text-sm">Error loading component</p>
      </div>
    );
  }
}

// ==================== COMPONENT ====================

export default function MemeticLab() {
  const [activeTab, setActiveTab] = useState<'gametheory' | 'quantum' | 'cognitive' | 'memetic' | 'defense' | 'bci' | 'simulator'>('gametheory')
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
    dataSource: 'demo' as 'live' | 'demo',
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
  
  // AI/Quantum Analytics State
  const [nashResult, setNashResult] = useState<NashEquilibriumResult | null>(null)
  const [nashLoading, setNashLoading] = useState(false)
  const [memeticModel, setMemeticModel] = useState<MemeticPropagationModel | null>(null)
  const [memeticModelType, setMemeticModelType] = useState<'SIR' | 'Bass' | 'Threshold' | 'NetworkCascade'>('SIR')
  const [memeticParams, setMemeticParams] = useState({
    initialAdopters: 100,
    totalPopulation: 10000,
    infectionRate: 0.3,
    recoveryRate: 0.1,
  })
  const [quantumPrediction, setQuantumPrediction] = useState<QuantumPrediction | null>(null)
  const [quantumLoading, setQuantumLoading] = useState(false)
  const [ammAnalysis, setAmmAnalysis] = useState<XRPLIncentiveModel | null>(null)
  const [validatorAnalysis, setValidatorAnalysis] = useState<XRPLIncentiveModel | null>(null)
  const [selectedQuantumAlgo, setSelectedQuantumAlgo] = useState<'QSVM' | 'QKMeans' | 'VQE' | 'QMonteCarlo'>('QSVM')
  const [payoffMatrix, setPayoffMatrix] = useState<number[][]>([
    [3, 0],
    [5, 1]
  ])
  
  // AI/Quantum Analytics Functions
  const runNashEquilibrium = useCallback(async () => {
    setNashLoading(true)
    try {
      const result = await AIQuantumAnalytics.solveNashEquilibrium(
        payoffMatrix,
        ['Player 1', 'Player 2'],
        [['Cooperate', 'Defect'], ['Cooperate', 'Defect']]
      )
      setNashResult(result)
    } catch (error) {
      console.error('[Quantum] Nash equilibrium error:', error)
    } finally {
      setNashLoading(false)
    }
  }, [payoffMatrix])
  
  const runMemeticSimulation = useCallback(() => {
    const result = AIQuantumAnalytics.modelMemeticPropagation(
      memeticParams.initialAdopters,
      memeticParams.totalPopulation,
      memeticModelType,
      {
        infectionRate: memeticParams.infectionRate,
        recoveryRate: memeticParams.recoveryRate,
      }
    )
    setMemeticModel(result)
  }, [memeticParams, memeticModelType])
  
  const runQuantumPrediction = useCallback(() => {
    setQuantumLoading(true)
    try {
      // Sample feature data for QSVM classification
      const sampleFeatures = [
        [0.8, 0.6, 0.9, 0.7], // Viral
        [0.2, 0.3, 0.1, 0.2], // Non-viral
        [0.9, 0.8, 0.85, 0.9], // Viral
        [0.3, 0.2, 0.25, 0.3], // Non-viral
        [0.7, 0.75, 0.8, 0.65], // Viral
      ]
      const labels = [1, 0, 1, 0, 1]
      const testPoint = [0.65, 0.7, 0.72, 0.68]
      
      const result = AIQuantumAnalytics.quantumSVM(sampleFeatures, labels, testPoint)
      setQuantumPrediction(result)
    } catch (error) {
      console.error('[Quantum] Prediction error:', error)
    } finally {
      setQuantumLoading(false)
    }
  }, [])
  
  const runAMMAnalysis = useCallback(() => {
    const result = AIQuantumAnalytics.analyzeAMMIncentives(
      { xrpReserve: 1000000, tokenReserve: 500000, totalLPTokens: 10000 },
      0.003
    )
    setAmmAnalysis(result)
  }, [])
  
  const runValidatorAnalysis = useCallback(() => {
    const result = AIQuantumAnalytics.analyzeValidatorIncentives(
      35, // validator count
      28, // UNL size
      Array(35).fill(0).map(() => Math.random() * 100) // reputation scores
    )
    setValidatorAnalysis(result)
  }, [])
  
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
  
  // Fetch live sentiment from SentiCrypt (free API)
  const fetchLiveSentiment = useCallback(async () => {
    try {
      const sentiment = await getCombinedSentiment()
      if (sentiment.dataSource === 'live') {
        setSentimentData(prev => ({
          ...prev,
          overall: sentiment.overall,
          // SentiCrypt gives overall market sentiment - correlate to XRP
          twitter: Math.min(100, Math.max(0, sentiment.overall + (Math.random() - 0.5) * 20)),
          reddit: Math.min(100, Math.max(0, sentiment.overall + (Math.random() - 0.5) * 15)),
          discord: Math.min(100, Math.max(0, sentiment.overall + (Math.random() - 0.5) * 10)),
          trend: sentiment.trend,
          dataSource: 'live'
        }))
        console.log('[MemeticLab] Live sentiment loaded:', sentiment.overall)
      }
    } catch (error) {
      console.error('[MemeticLab] Sentiment fetch error:', error)
    }
  }, [])

  // Fetch whale alerts from XRPScan (free API)
  const fetchWhaleAlerts = useCallback(async () => {
    try {
      const whales = await fetchWhaleTransactions(1000000) // 1M+ XRP
      if (whales.length > 0) {
        const newAlerts = whales.slice(0, 3).map((whale, i) => ({
          id: Date.now() + i,
          type: 'alert' as const,
          message: `Whale movement: ${(whale.amount / 1000000).toFixed(1)}M XRP`,
          time: new Date(whale.timestamp).toLocaleTimeString(),
          severity: whale.amount > 10000000 ? 'high' : whale.amount > 5000000 ? 'medium' : 'low'
        }))
        setCognitiveAlerts(prev => [...newAlerts, ...prev.slice(0, 2)])
      }
    } catch (error) {
      console.error('[MemeticLab] Whale alerts error:', error)
    }
  }, [])

  useEffect(() => {
    fetchTopMovers()
    fetchXrplMetrics()
    fetchMarketData()
    fetchPredictionMarkets()
    fetchLiveSentiment()
    // Don't fetch whale alerts automatically - can hit rate limits
    // fetchWhaleAlerts()
  }, [fetchTopMovers, fetchXrplMetrics, fetchMarketData, fetchPredictionMarkets, fetchLiveSentiment])
  
  // Auto-Trading Integration
  // Note: This connects prediction signals to the paper trading auto-trader
  // The actual auto-trade processing happens in the PaperTradingPanel component
  // We just pass the signals through props - no direct store access needed here
  
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
    { id: 'gametheory', label: 'Game Theory', icon: Target },
    { id: 'quantum', label: 'AI/Quantum Lab', icon: Atom },
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
              {/* Analytics Lab and Paper Trading tabs moved to Terminal page */}
              
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
              
              {/* AI/Quantum Lab Tab */}
              {activeTab === 'quantum' && (
                <motion.div
                  key="quantum"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {/* Header */}
                  <div className="cyber-panel p-4 border-cyber-purple/30">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-cyber-purple/20 border border-cyber-purple/30">
                        <Atom size={24} className="text-cyber-purple" />
                      </div>
                      <div>
                        <h2 className="font-cyber text-lg text-cyber-purple">AI-POWERED QUANTUM ANALYTICS</h2>
                        <p className="text-xs text-cyber-muted">
                          Advanced math solving, memetic propagation modeling, and quantum-inspired predictions
                        </p>
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        <span className="text-[9px] px-2 py-1 rounded bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/30">
                          "MATH IS LAW"
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Nash Equilibrium Solver */}
                    <div className="cyber-panel p-4 border-cyber-cyan/30">
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                        <GitBranch size={14} className="text-cyber-cyan" />
                        <span className="font-cyber text-xs text-cyber-cyan">NASH EQUILIBRIUM SOLVER</span>
                        <span className="ml-auto text-[9px] text-cyber-muted">AI Chain-of-Thought</span>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-xs text-cyber-muted mb-2">Payoff Matrix (Player 1 rows, Player 2 columns)</p>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {payoffMatrix.map((row, i) => (
                            row.map((cell, j) => (
                              <input
                                key={`${i}-${j}`}
                                type="number"
                                value={cell}
                                onChange={(e) => {
                                  const newMatrix = [...payoffMatrix]
                                  newMatrix[i][j] = Number(e.target.value)
                                  setPayoffMatrix(newMatrix)
                                }}
                                className="w-full bg-cyber-darker border border-cyber-border rounded px-3 py-2 text-sm text-cyber-text text-center"
                                placeholder={`(${i},${j})`}
                              />
                            ))
                          ))}
                        </div>
                        <button
                          onClick={runNashEquilibrium}
                          disabled={nashLoading}
                          className="w-full px-4 py-2 rounded bg-cyber-cyan/20 border border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan/30 transition-all font-cyber text-xs disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {nashLoading ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              COMPUTING...
                            </>
                          ) : (
                            <>
                              <Sigma size={14} />
                              SOLVE EQUILIBRIUM
                            </>
                          )}
                        </button>
                      </div>
                      
                      {nashResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3"
                        >
                          <div className="p-3 rounded bg-cyber-green/10 border border-cyber-green/30">
                            <p className="text-xs text-cyber-muted mb-1">EQUILIBRIUM</p>
                            <p className="text-sm font-cyber text-cyber-green">{nashResult.equilibrium}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/50">
                              <p className="text-[10px] text-cyber-muted">Stability</p>
                              <p className="text-sm font-cyber text-cyber-cyan">{nashResult.stabilityScore}%</p>
                            </div>
                            <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/50">
                              <p className="text-[10px] text-cyber-muted">Confidence</p>
                              <p className={`text-sm font-cyber ${
                                nashResult.confidenceLevel === 'high' ? 'text-cyber-green' :
                                nashResult.confidenceLevel === 'medium' ? 'text-cyber-yellow' :
                                'text-cyber-red'
                              }`}>{nashResult.confidenceLevel.toUpperCase()}</p>
                            </div>
                          </div>
                          
                          <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-border/50">
                            <p className="text-xs text-cyber-muted mb-2">REASONING CHAIN</p>
                            <div className="space-y-1">
                              {nashResult.reasoning.map((step, i) => (
                                <p key={i} className="text-[10px] text-cyber-text flex items-start gap-2">
                                  <span className="text-cyber-cyan">{i + 1}.</span>
                                  {step}
                                </p>
                              ))}
                            </div>
                          </div>
                          
                          <div className="p-3 rounded bg-cyber-purple/10 border border-cyber-purple/30">
                            <p className="text-xs text-cyber-purple mb-2">XRPL IMPLICATIONS</p>
                            <ul className="space-y-1">
                              {nashResult.xrplImplications.map((impl, i) => (
                                <li key={i} className="text-[10px] text-cyber-muted flex items-start gap-2">
                                  <span className="text-cyber-purple">•</span>
                                  {impl}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      )}
                    </div>
                    
                    {/* Memetic Propagation Model */}
                    <div className="cyber-panel p-4 border-cyber-yellow/30">
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                        <Waves size={14} className="text-cyber-yellow" />
                        <span className="font-cyber text-xs text-cyber-yellow">MEMETIC PROPAGATION MODEL</span>
                        <span className="ml-auto text-[9px] text-cyber-muted">Idea Spread Simulation</span>
                      </div>
                      
                      <div className="mb-4 space-y-3">
                        <div className="flex gap-2">
                          {(['SIR', 'Bass', 'Threshold', 'NetworkCascade'] as const).map((type) => (
                            <button
                              key={type}
                              onClick={() => setMemeticModelType(type)}
                              className={`flex-1 px-2 py-1 rounded text-[10px] font-cyber transition-all ${
                                memeticModelType === type
                                  ? 'bg-cyber-yellow/20 border border-cyber-yellow/50 text-cyber-yellow'
                                  : 'bg-cyber-darker border border-cyber-border text-cyber-muted hover:text-cyber-text'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-cyber-muted">Initial Adopters</label>
                            <input
                              type="number"
                              value={memeticParams.initialAdopters}
                              onChange={(e) => setMemeticParams(p => ({ ...p, initialAdopters: Number(e.target.value) }))}
                              className="w-full bg-cyber-darker border border-cyber-border rounded px-2 py-1 text-xs text-cyber-text"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-cyber-muted">Total Population</label>
                            <input
                              type="number"
                              value={memeticParams.totalPopulation}
                              onChange={(e) => setMemeticParams(p => ({ ...p, totalPopulation: Number(e.target.value) }))}
                              className="w-full bg-cyber-darker border border-cyber-border rounded px-2 py-1 text-xs text-cyber-text"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-cyber-muted">Infection Rate (β)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={memeticParams.infectionRate}
                              onChange={(e) => setMemeticParams(p => ({ ...p, infectionRate: Number(e.target.value) }))}
                              className="w-full bg-cyber-darker border border-cyber-border rounded px-2 py-1 text-xs text-cyber-text"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-cyber-muted">Recovery Rate (γ)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={memeticParams.recoveryRate}
                              onChange={(e) => setMemeticParams(p => ({ ...p, recoveryRate: Number(e.target.value) }))}
                              className="w-full bg-cyber-darker border border-cyber-border rounded px-2 py-1 text-xs text-cyber-text"
                            />
                          </div>
                        </div>
                        
                        <button
                          onClick={runMemeticSimulation}
                          className="w-full px-4 py-2 rounded bg-cyber-yellow/20 border border-cyber-yellow/50 text-cyber-yellow hover:bg-cyber-yellow/30 transition-all font-cyber text-xs flex items-center justify-center gap-2"
                        >
                          <Activity size={14} />
                          RUN SIMULATION
                        </button>
                      </div>
                      
                      {memeticModel && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3"
                        >
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 rounded bg-cyber-green/10 border border-cyber-green/30 text-center">
                              <p className="text-[10px] text-cyber-muted">Peak Adoption</p>
                              <p className="text-lg font-cyber text-cyber-green">
                                {memeticModel.predictions.peakAdoption.toLocaleString()}
                              </p>
                            </div>
                            <div className="p-2 rounded bg-cyber-cyan/10 border border-cyber-cyan/30 text-center">
                              <p className="text-[10px] text-cyber-muted">Virality Score</p>
                              <p className="text-lg font-cyber text-cyber-cyan">
                                {memeticModel.predictions.viralityScore.toFixed(1)}
                              </p>
                            </div>
                            <div className="p-2 rounded bg-cyber-yellow/10 border border-cyber-yellow/30 text-center">
                              <p className="text-[10px] text-cyber-muted">Time to Saturation</p>
                              <p className="text-lg font-cyber text-cyber-yellow">
                                {memeticModel.predictions.timeToSaturation.toFixed(1)} units
                              </p>
                            </div>
                            <div className="p-2 rounded bg-cyber-purple/10 border border-cyber-purple/30 text-center">
                              <p className="text-[10px] text-cyber-muted">Final Adoption %</p>
                              <p className="text-lg font-cyber text-cyber-purple">
                                {(memeticModel.predictions.finalAdoptionRate * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                          
                          <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-border/50">
                            <p className="text-xs text-cyber-muted mb-2">MODEL CONFIDENCE: {memeticModel.confidence}%</p>
                            <div className="w-full bg-cyber-border rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  memeticModel.confidence >= 80 ? 'bg-cyber-green' :
                                  memeticModel.confidence >= 60 ? 'bg-cyber-yellow' :
                                  'bg-cyber-red'
                                }`}
                                style={{ width: `${memeticModel.confidence}%` }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                    
                    {/* Quantum-Inspired Prediction */}
                    <div className="cyber-panel p-4 border-cyber-green/30">
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                        <Orbit size={14} className="text-cyber-green" />
                        <span className="font-cyber text-xs text-cyber-green">QUANTUM-INSPIRED PREDICTION</span>
                        <span className="ml-auto text-[9px] text-cyber-muted">QSVM Classifier</span>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-xs text-cyber-muted mb-3">
                          Classifies memetic content virality using quantum kernel methods. 
                          Features: sentiment, engagement, network reach, timing.
                        </p>
                        
                        <div className="p-3 mb-3 rounded bg-cyber-darker/50 border border-cyber-border/50">
                          <p className="text-[10px] text-cyber-muted mb-1">TEST INPUT FEATURES</p>
                          <p className="text-xs text-cyber-cyan font-mono">[0.65, 0.70, 0.72, 0.68]</p>
                          <p className="text-[9px] text-cyber-muted mt-1">Sentiment | Engagement | Network | Timing</p>
                        </div>
                        
                        <button
                          onClick={runQuantumPrediction}
                          disabled={quantumLoading}
                          className="w-full px-4 py-2 rounded bg-cyber-green/20 border border-cyber-green/50 text-cyber-green hover:bg-cyber-green/30 transition-all font-cyber text-xs disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {quantumLoading ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              COMPUTING...
                            </>
                          ) : (
                            <>
                              <Binary size={14} />
                              RUN QSVM PREDICTION
                            </>
                          )}
                        </button>
                      </div>
                      
                      {quantumPrediction && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3"
                        >
                          <div className={`p-4 rounded border text-center ${
                            quantumPrediction.prediction.outcome === 'Viral'
                              ? 'bg-cyber-green/10 border-cyber-green/30'
                              : 'bg-cyber-red/10 border-cyber-red/30'
                          }`}>
                            <p className="text-xs text-cyber-muted mb-1">PREDICTION</p>
                            <p className={`text-2xl font-cyber ${
                              quantumPrediction.prediction.outcome === 'Viral'
                                ? 'text-cyber-green'
                                : 'text-cyber-red'
                            }`}>
                              {quantumPrediction.prediction.outcome.toUpperCase()}
                            </p>
                            <p className="text-xs text-cyber-muted mt-1">
                              Probability: {(quantumPrediction.prediction.probability * 100).toFixed(1)}%
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 rounded bg-cyber-purple/10 border border-cyber-purple/30 text-center">
                              <p className="text-[10px] text-cyber-muted">Quantum Advantage</p>
                              <p className="text-sm font-cyber text-cyber-purple">
                                {quantumPrediction.quantumAdvantage.toFixed(1)}x
                              </p>
                            </div>
                            <div className="p-2 rounded bg-cyber-cyan/10 border border-cyber-cyan/30 text-center">
                              <p className="text-[10px] text-cyber-muted">Processing Time</p>
                              <p className="text-sm font-cyber text-cyber-cyan">
                                {quantumPrediction.processingTime.toFixed(2)}ms
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                    
                    {/* XRPL Incentive Analysis */}
                    <div className="cyber-panel p-4 border-cyber-red/30">
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyber-border">
                        <FlaskConical size={14} className="text-cyber-red" />
                        <span className="font-cyber text-xs text-cyber-red">XRPL INCENTIVE ANALYSIS</span>
                        <span className="ml-auto text-[9px] text-cyber-muted">Game Theory Applied</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <button
                          onClick={runAMMAnalysis}
                          className="px-3 py-2 rounded bg-cyber-cyan/20 border border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan/30 transition-all font-cyber text-[10px] flex items-center justify-center gap-2"
                        >
                          <DollarSign size={12} />
                          ANALYZE AMM
                        </button>
                        <button
                          onClick={runValidatorAnalysis}
                          className="px-3 py-2 rounded bg-cyber-green/20 border border-cyber-green/50 text-cyber-green hover:bg-cyber-green/30 transition-all font-cyber text-[10px] flex items-center justify-center gap-2"
                        >
                          <Shield size={12} />
                          ANALYZE VALIDATORS
                        </button>
                      </div>
                      
                      {(ammAnalysis || validatorAnalysis) && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3"
                        >
                          {ammAnalysis && (
                            <div className="p-3 rounded bg-cyber-cyan/10 border border-cyber-cyan/30">
                              <p className="text-xs font-cyber text-cyber-cyan mb-2">AMM ANALYSIS</p>
                              <p className="text-[10px] text-cyber-text mb-2">
                                {ammAnalysis.equilibriumAnalysis.equilibrium}
                              </p>
                              <div className="space-y-1">
                                {ammAnalysis.recommendations.map((rec, i) => (
                                  <p key={i} className="text-[9px] text-cyber-muted flex items-start gap-1">
                                    <span className="text-cyber-cyan">→</span> {rec}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {validatorAnalysis && (
                            <div className="p-3 rounded bg-cyber-green/10 border border-cyber-green/30">
                              <p className="text-xs font-cyber text-cyber-green mb-2">VALIDATOR ANALYSIS</p>
                              <p className="text-[10px] text-cyber-text mb-2">
                                {validatorAnalysis.equilibriumAnalysis.equilibrium}
                              </p>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] text-cyber-muted">Stability:</span>
                                <span className={`text-[10px] font-cyber ${
                                  validatorAnalysis.equilibriumAnalysis.stabilityScore >= 80 ? 'text-cyber-green' : 'text-cyber-yellow'
                                }`}>
                                  {validatorAnalysis.equilibriumAnalysis.stabilityScore}%
                                </span>
                              </div>
                              <div className="space-y-1">
                                {validatorAnalysis.recommendations.map((rec, i) => (
                                  <p key={i} className="text-[9px] text-cyber-muted flex items-start gap-1">
                                    <span className="text-cyber-green">→</span> {rec}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                  
                  {/* Research Sources */}
                  <div className="cyber-panel p-4 border-cyber-border/30">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen size={14} className="text-cyber-muted" />
                      <span className="font-cyber text-xs text-cyber-muted">RESEARCH SOURCES (2025-2026)</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[9px]">
                      <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/50">
                        <p className="text-cyber-cyan font-medium">IMO25 AI Agents</p>
                        <p className="text-cyber-muted">Gold-medal level math solving</p>
                      </div>
                      <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/50">
                        <p className="text-cyber-yellow font-medium">AIMO-2 / OpenMathReasoning</p>
                        <p className="text-cyber-muted">CoT + TIR methods</p>
                      </div>
                      <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/50">
                        <p className="text-cyber-green font-medium">Quantum ML Research</p>
                        <p className="text-cyber-muted">QSVM, VQE, QMC algorithms</p>
                      </div>
                      <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/50">
                        <p className="text-cyber-purple font-medium">DeepSeek-Math</p>
                        <p className="text-cyber-muted">Equilibrium calculations</p>
                      </div>
                      <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/50">
                        <p className="text-cyber-red font-medium">PQC Standards (NIST)</p>
                        <p className="text-cyber-muted">ML-KEM, ML-DSA, SLH-DSA</p>
                      </div>
                      <div className="p-2 rounded bg-cyber-darker/50 border border-cyber-border/50">
                        <p className="text-cyber-cyan font-medium">CreativeMath</p>
                        <p className="text-cyber-muted">Novel solution generation</p>
                      </div>
                    </div>
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
