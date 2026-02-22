/**
 * Agent Hub Page – OpenClaw-style persistent agent orchestration.
 * /agents: dashboard, Wake, heartbeat, memory viz. Tie to Memetic Lab.
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Bot, Brain, ChevronRight } from 'lucide-react';
import { AgentHub } from '../components/AgentHub';

export default function Agents() {
  return (
    <div className="min-h-screen pt-20 pb-8 px-4 lg:px-8">
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

      <p className="text-xs text-cyber-muted mb-6">
        Autonomous sims only. All actions require user confirm via Xaman.
        To train or improve agents: edit skills in <code className="bg-cyber-darker px-1 rounded">src/agents/skills/registry.ts</code>, agents in <code className="bg-cyber-darker px-1 rounded">src/store/agentStore.ts</code>, and optional AI via <code className="bg-cyber-darker px-1 rounded">VITE_AI_API_URL</code>. Full guide: <code className="bg-cyber-darker px-1 rounded">docs/AGENT-HUB-TRAINING.md</code>.
      </p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <AgentHub />
      </motion.div>
    </div>
  );
}
