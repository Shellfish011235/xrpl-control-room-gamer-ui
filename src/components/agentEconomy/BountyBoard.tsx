/**
 * Bounty board: list bounties, Post Bounty modal, Discord feed.
 * OpenClaw + Discord bridge — Moltbook-style XRPL agent economy.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Plus,
  RefreshCw,
  MessageSquare,
  X,
  Trophy,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useBountyStore } from '../../store/bountyStore';
import { postBounty, fetchDiscordActivity, isBridgeConfigured } from '../../services/discordBridgeService';
import { DiscordActivityFeed } from './DiscordActivityFeed';
import type { BountyStatus } from '../../store/bountyStore';

const POLL_INTERVAL_MS = 15000;

function statusColor(s: BountyStatus) {
  switch (s) {
    case 'open':
      return 'text-cyber-green';
    case 'claimed':
    case 'in-progress':
      return 'text-cyber-yellow';
    case 'completed':
      return 'text-cyber-cyan';
    case 'expired':
      return 'text-cyber-muted';
    default:
      return 'text-cyber-text';
  }
}

export function BountyBoard() {
  const {
    bounties,
    discordActivity,
    reputation,
    lastFetchAt,
    setBounties,
    appendDiscordActivity,
    setBridgeConnected,
    setLastFetchAt,
    addBounty,
    addReputationCompletion,
    updateBountyStatus,
  } = useBountyStore();

  const [postModalOpen, setPostModalOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newReward, setNewReward] = useState('0.01');
  const [celebrationTx, setCelebrationTx] = useState<string | null>(null);

  // When activity shows bounty_complete with txHash, celebrate and update reputation
  useEffect(() => {
    const complete = discordActivity.find(
      (a) => a.type === 'bounty_complete' && a.txHash && a.bountyId
    );
    if (!complete?.txHash || celebrationTx === complete.txHash) return;
    setCelebrationTx(complete.txHash);
    const bounty = bounties.find((b) => b.id === complete.bountyId);
    if (bounty) {
      updateBountyStatus(bounty.id, 'completed', { txHash: complete.txHash, completedAt: complete.timestamp });
      addReputationCompletion(bounty.rewardXRP);
    }
    const t = setTimeout(() => setCelebrationTx(null), 5000);
    return () => clearTimeout(t);
  }, [discordActivity, bounties, celebrationTx, updateBountyStatus, addReputationCompletion]);

  const fetchActivity = useCallback(async () => {
    setRefreshing(true);
    const result = await fetchDiscordActivity();
    setBridgeConnected(result.success && isBridgeConfigured());
    if (result.success) {
      if (result.activity?.length) appendDiscordActivity(result.activity);
      if (result.bounties?.length) setBounties(result.bounties);
      setLastFetchAt(Date.now());
    }
    setRefreshing(false);
  }, [appendDiscordActivity, setBounties, setBridgeConnected, setLastFetchAt]);

  useEffect(() => {
    fetchActivity();
    const t = setInterval(fetchActivity, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [fetchActivity]);

  const handlePostBounty = async () => {
    const reward = parseFloat(newReward);
    if (!newTitle.trim() || reward <= 0) {
      setPostError('Title and reward (XRP > 0) required.');
      return;
    }
    setPostError(null);
    setPosting(true);

    const res = await postBounty({
      title: newTitle.trim(),
      description: newDesc.trim(),
      rewardXRP: reward,
    });

    setPosting(false);
    if (res.success) {
      addBounty({
        title: newTitle.trim(),
        description: newDesc.trim(),
        rewardXRP: reward,
        status: 'open',
      });
      setNewTitle('');
      setNewDesc('');
      setNewReward('0.01');
      setPostModalOpen(false);
      fetchActivity();
    } else {
      setPostError(res.error || 'Failed to post bounty.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Reputation bar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-cyber-darker/50 border border-cyber-border">
        <div className="flex items-center gap-3">
          <Trophy size={18} className="text-cyber-yellow" />
          <span className="text-xs text-cyber-muted">Reputation</span>
          <span className="text-sm font-cyber text-cyber-text">
            {reputation.completedBounties} completed · {reputation.totalXRPEarned.toFixed(2)} XRP earned
          </span>
        </div>
        {!isBridgeConfigured() && (
          <span className="text-[10px] text-cyber-yellow bg-cyber-yellow/10 px-2 py-1 rounded border border-cyber-yellow/30">
            Demo mode (set VITE_DISCORD_BRIDGE_URL for live)
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setPostModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyber-glow/20 border border-cyber-glow/50 text-cyber-glow hover:bg-cyber-glow/30 transition-colors text-sm font-cyber"
        >
          <Plus size={16} /> Post bounty
        </button>
        <button
          type="button"
          onClick={fetchActivity}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-cyber-border text-cyber-muted hover:text-cyber-text hover:border-cyber-cyan/40 transition-colors text-sm"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
        {lastFetchAt && (
          <span className="text-[10px] text-cyber-muted">
            Updated {new Date(lastFetchAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Bounty list */}
      <div className="space-y-2">
        <h3 className="text-xs font-cyber text-cyber-muted uppercase tracking-wider">Bounties</h3>
        {bounties.length === 0 ? (
          <p className="text-cyber-muted text-sm p-4 rounded-xl border border-cyber-border bg-cyber-darker/30">
            No bounties yet. Post one to have OpenClaw (or other agents) pick it up from Discord.
          </p>
        ) : (
          <div className="space-y-2">
            {bounties.map((b) => (
              <motion.div
                key={b.id}
                layout
                className="p-4 rounded-xl border border-cyber-border bg-cyber-darker/40 hover:border-cyber-glow/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Zap size={14} className="text-cyber-yellow shrink-0" />
                      <span className="font-cyber text-cyber-text">{b.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColor(b.status)} border border-current/30`}>
                        {b.status}
                      </span>
                    </div>
                    <p className="text-xs text-cyber-muted mt-1 line-clamp-2">{b.description}</p>
                    <p className="text-[10px] text-cyber-cyan mt-2">{b.rewardXRP} XRP reward</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Bounty completed celebration */}
      <AnimatePresence>
        {celebrationTx && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl border-2 border-cyber-green/60 bg-cyber-darker shadow-lg shadow-cyber-green/20 flex items-center gap-3"
          >
            <CheckCircle size={28} className="text-cyber-green shrink-0" />
            <div>
              <p className="font-cyber text-cyber-green text-sm">Bounty completed</p>
              <p className="text-[10px] text-cyber-muted font-mono">Tx: {celebrationTx.slice(0, 12)}…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discord feed */}
      <div className="space-y-2">
        <h3 className="text-xs font-cyber text-cyber-muted uppercase tracking-wider flex items-center gap-2">
          <MessageSquare size={12} /> Live feed
        </h3>
        <DiscordActivityFeed items={discordActivity} maxHeight="220px" />
      </div>

      {/* Post Bounty modal */}
      <AnimatePresence>
        {postModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            onClick={() => !posting && setPostModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="cyber-panel p-6 max-w-md w-full rounded-xl border border-cyber-glow/30"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-cyber text-cyber-glow">Post bounty</h3>
                <button
                  type="button"
                  onClick={() => !posting && setPostModalOpen(false)}
                  className="p-1.5 rounded text-cyber-muted hover:text-cyber-text"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-xs text-cyber-muted mb-4">
                Sends to OpenClaw via Discord (or stores locally if bridge not configured).
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-cyber-muted uppercase mb-1">Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Analyze XRP flow for wallet rXXX"
                    className="w-full px-3 py-2 rounded-lg bg-cyber-darker border border-cyber-border text-cyber-text text-sm placeholder:text-cyber-muted/50 focus:border-cyber-glow"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-cyber-muted uppercase mb-1">Description</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Task details for the agent…"
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-cyber-darker border border-cyber-border text-cyber-text text-sm placeholder:text-cyber-muted/50 focus:border-cyber-glow resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-cyber-muted uppercase mb-1">Reward (XRP)</label>
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={newReward}
                    onChange={(e) => setNewReward(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-cyber-darker border border-cyber-border text-cyber-text text-sm focus:border-cyber-glow"
                  />
                </div>
                {postError && (
                  <div className="flex items-center gap-2 text-cyber-red text-xs">
                    <AlertCircle size={14} /> {postError}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handlePostBounty}
                    disabled={posting}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-glow/20 text-cyber-glow border border-cyber-glow/50 hover:bg-cyber-glow/30 disabled:opacity-50 text-sm font-cyber"
                  >
                    {posting ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                    {posting ? 'Posting…' : 'Post bounty'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostModalOpen(false)}
                    disabled={posting}
                    className="px-4 py-2 rounded-lg border border-cyber-border text-cyber-muted hover:text-cyber-text text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BountyBoard;
