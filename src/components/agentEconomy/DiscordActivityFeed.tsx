/**
 * Live Discord activity feed (OpenClaw bridge).
 * Neon terminal-style scroll with message types and timestamps.
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Bot, CheckCircle, Zap } from 'lucide-react';
import type { DiscordActivityItem } from '../../store/bountyStore';

interface DiscordActivityFeedProps {
  items: DiscordActivityItem[];
  maxHeight?: string;
  className?: string;
}

function iconForType(type: DiscordActivityItem['type']) {
  switch (type) {
    case 'bounty_post':
      return <Zap size={12} className="text-cyber-yellow shrink-0" />;
    case 'bounty_accept':
    case 'bounty_complete':
      return <CheckCircle size={12} className="text-cyber-green shrink-0" />;
    case 'agent_message':
      return <Bot size={12} className="text-cyber-cyan shrink-0" />;
    default:
      return <MessageSquare size={12} className="text-cyber-muted shrink-0" />;
  }
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay ? d.toLocaleTimeString() : d.toLocaleString();
}

export function DiscordActivityFeed({ items, maxHeight = '240px', className = '' }: DiscordActivityFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && items.length > 0) {
      scrollRef.current.scrollTop = 0;
    }
  }, [items.length]);

  return (
    <div
      className={`rounded-xl border border-cyber-border bg-cyber-darker/60 overflow-hidden ${className}`}
      style={{ boxShadow: 'inset 0 0 20px rgba(0, 255, 136, 0.03)' }}
    >
      <div className="px-3 py-2 border-b border-cyber-border flex items-center gap-2 bg-cyber-darker/40">
        <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
        <span className="text-[10px] font-cyber text-cyber-muted uppercase tracking-wider">
          Discord · OpenClaw feed
        </span>
      </div>
      <div
        ref={scrollRef}
        className="overflow-y-auto p-2 space-y-1.5 font-mono text-xs"
        style={{ maxHeight, WebkitOverflowScrolling: 'touch' }}
      >
        <AnimatePresence initial={false}>
          {items.length === 0 ? (
            <p className="text-cyber-muted text-[11px] p-3">No activity yet. Post a bounty or connect the bridge.</p>
          ) : (
            items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2 p-2 rounded-lg bg-cyber-darker/40 border border-cyber-border/50 hover:border-cyber-cyan/30 transition-colors"
              >
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  {iconForType(item.type)}
                  <div className="min-w-0 flex-1">
                    {item.authorName && (
                      <span className="text-cyber-cyan font-medium mr-2">{item.authorName}</span>
                    )}
                    <span className="text-cyber-text break-words">{item.content}</span>
                    <div className="text-[10px] text-cyber-muted mt-0.5">{formatTime(item.timestamp)}</div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default DiscordActivityFeed;
