/**
 * Agent Hub Page – OpenClaw-style persistent agent orchestration.
 * /agents: dashboard, Wake, heartbeat, memory viz. Tie to Memetic Lab.
 */

import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Bot, Brain, ChevronRight } from 'lucide-react';
import { AgentHub } from '../components/AgentHub';
import WalletActionsPanel from '../components/WalletActionsPanel';
import { NIST_AI_RMF_HUB_URL, NIST_AI_RMF_PDF_URL } from '../lib/nistAiRmf';

export default function Agents() {
  const location = useLocation();
  const inToolsHub = location.pathname.startsWith('/tools');
  return (
    <div className={`min-h-screen ${inToolsHub ? 'pt-4' : 'pt-20'} pb-8 px-4 lg:px-8`}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyber-glow/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-cyber-glow" />
          </div>
          <div>
            <h1 className="font-cyber text-xl text-cyber-text">AGENT HUB</h1>
            <p className="text-xs text-cyber-muted">Always-on orchestration · Wake · Heartbeat · Memory</p>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/40">
            BETA
          </span>
        </div>
        <Link
          to="/memetic-lab"
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-cyber-purple/50 text-cyber-purple hover:bg-cyber-purple/10 text-sm"
        >
          <Brain size={16} />
          Memetic Lab
          <ChevronRight size={14} />
        </Link>
      </motion.div>

      <p className="text-xs text-cyber-muted mb-3">
        <strong>Autonomous sims only.</strong> All actions require user confirm via Xaman.
        To train or improve agents: edit skills in <code className="bg-cyber-darker px-1 rounded">src/agents/skills/registry.ts</code>, agents in <code className="bg-cyber-darker px-1 rounded">src/store/agentStore.ts</code>, and optional AI via <code className="bg-cyber-darker px-1 rounded">VITE_AI_API_URL</code>. Full guide: <code className="bg-cyber-darker px-1 rounded">docs/AGENT-HUB-TRAINING.md</code>.
      </p>
      <p className="text-xs text-cyber-muted mb-6">
        AI-assisted flows follow themes from NIST’s voluntary{' '}
        <a
          href={NIST_AI_RMF_PDF_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyber-cyan hover:underline underline-offset-2"
        >
          AI Risk Management Framework (NIST.AI.100-1)
        </a>{' '}
        and{' '}
        <a
          href={NIST_AI_RMF_HUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyber-cyan hover:underline underline-offset-2"
        >
          NIST hub resources
        </a>
        . Open the floating agent button and expand <em className="text-cyber-text/90">AI trust &amp; safety</em> for a plain-language mapping (Govern / Map / Measure / Manage).
      </p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        <WalletActionsPanel />
        <AgentHub />
      </motion.div>
    </div>
  );
}
