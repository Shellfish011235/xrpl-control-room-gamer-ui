import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo } from 'react'
import { 
  Brain, Shield, AlertTriangle, Eye, Target, Users, 
  Zap, Lock, Unlock, MessageSquare, TrendingUp, TrendingDown,
  ChevronRight, ExternalLink, Play, Pause, RotateCcw,
  Lightbulb, BookOpen, Crosshair, Radio, Wifi, Activity,
  AlertOctagon, CheckCircle, XCircle, HelpCircle, Info,
  Cpu, Network, Globe, Fingerprint, ScanLine, Waves, Clock
} from 'lucide-react'
import { 
  RadarChart, PolarGrid, PolarAngleAxis, Radar, 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  AreaChart, Area, BarChart, Bar, Cell
} from 'recharts'

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
  const [activeTab, setActiveTab] = useState<'gametheory' | 'cognitive' | 'memetic' | 'defense' | 'bci' | 'simulator'>('gametheory')
  const [selectedScenario, setSelectedScenario] = useState<GameTheoryScenario | null>(null)
  const [selectedThreat, setSelectedThreat] = useState<CognitiveThreats | null>(null)
  const [selectedBCI, setSelectedBCI] = useState<BCITechnology | null>(null)
  const [currentSimScenario, setCurrentSimScenario] = useState(0)
  const [showSimAnswer, setShowSimAnswer] = useState(false)
  const [simScore, setSimScore] = useState({ correct: 0, total: 0 })
  const [defenseScore, setDefenseScore] = useState(65)
  
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
