// XRPL Payment Channel Manager
// Manage off-ledger instant micropayment channels
// "100,000+ TPS with only 2 on-chain transactions: open and close"

import React, { useState, useMemo } from 'react';
import {
  Layers, Plus, ArrowRight, Clock, DollarSign,
  Lock, Unlock, RefreshCw, AlertTriangle, Check,
  Zap, TrendingUp, X
} from 'lucide-react';
import {
  useMicropaymentStore,
  type XRPLPaymentChannel,
} from '../../services/micropayments/streamingPayments';

// =============================================================================
// TYPES
// =============================================================================

interface PaymentChannelManagerProps {
  onChannelSelect?: (channel: XRPLPaymentChannel) => void;
  showCreateForm?: boolean;
}

// =============================================================================
// PAYMENT CHANNEL MANAGER
// =============================================================================

export function PaymentChannelManager({
  onChannelSelect,
  showCreateForm = true,
}: PaymentChannelManagerProps) {
  const { channels, openChannel, claimChannel, closeChannel } = useMicropaymentStore();
  
  const [showForm, setShowForm] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    destinationAddress: '',
    amount: 1000000, // 1 XRP in drops
    settleDelay: 3600, // 1 hour
  });

  // Channel stats
  const stats = useMemo(() => {
    const totalCapacity = channels.reduce((s, c) => s + c.amount, 0);
    const totalBalance = channels.reduce((s, c) => s + c.balance, 0);
    const openChannels = channels.filter(c => c.status === 'open').length;
    const totalClaims = channels.reduce((s, c) => s + c.claims.length, 0);

    return { totalCapacity, totalBalance, openChannels, totalClaims };
  }, [channels]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleCreateChannel = () => {
    if (!formData.destinationAddress) return;

    openChannel({
      channelId: `CHANNEL_${Date.now()}`,
      sourceAddress: 'rYourAddress...', // Would come from wallet
      destinationAddress: formData.destinationAddress,
      amount: formData.amount,
      balance: formData.amount,
      settleDelay: formData.settleDelay,
      publicKey: 'ED...',
    });

    setShowForm(false);
    setFormData({ destinationAddress: '', amount: 1000000, settleDelay: 3600 });
  };

  const handleClaim = (channel: XRPLPaymentChannel, amount: number) => {
    // In real implementation, this would require cryptographic signature
    const mockSignature = `SIG_${Date.now()}`;
    claimChannel(channel.id, amount, mockSignature);
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="bg-cyber-darker rounded-lg border border-cyber-border overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-cyber-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-cyber-purple" />
            <span className="font-cyber text-cyber-purple text-sm">PAYMENT CHANNELS</span>
          </div>
          {showCreateForm && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-cyber-purple/20 text-cyber-purple hover:bg-cyber-purple/30 transition-colors"
            >
              <Plus size={12} />
              New Channel
            </button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2 rounded bg-cyber-border/30 text-center">
            <p className="text-lg font-cyber text-cyber-cyan">{stats.openChannels}</p>
            <p className="text-[8px] text-cyber-muted">OPEN</p>
          </div>
          <div className="p-2 rounded bg-cyber-border/30 text-center">
            <p className="text-lg font-cyber text-cyber-green">
              {(stats.totalCapacity / 1000000).toFixed(1)}
            </p>
            <p className="text-[8px] text-cyber-muted">XRP CAPACITY</p>
          </div>
          <div className="p-2 rounded bg-cyber-border/30 text-center">
            <p className="text-lg font-cyber text-cyber-yellow">
              {(stats.totalBalance / 1000000).toFixed(1)}
            </p>
            <p className="text-[8px] text-cyber-muted">XRP AVAILABLE</p>
          </div>
          <div className="p-2 rounded bg-cyber-border/30 text-center">
            <p className="text-lg font-cyber text-cyber-purple">{stats.totalClaims}</p>
            <p className="text-[8px] text-cyber-muted">CLAIMS</p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="p-3 bg-cyber-cyan/5 border-b border-cyber-cyan/30">
        <p className="text-[10px] text-cyber-cyan font-cyber mb-2">HOW PAYMENT CHANNELS WORK:</p>
        <div className="grid grid-cols-3 gap-2 text-[9px] text-cyber-text">
          <div className="flex items-start gap-1">
            <div className="w-4 h-4 rounded-full bg-cyber-cyan/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-cyber-cyan text-[8px]">1</span>
            </div>
            <span>Open channel on-chain (one tx)</span>
          </div>
          <div className="flex items-start gap-1">
            <div className="w-4 h-4 rounded-full bg-cyber-cyan/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-cyber-cyan text-[8px]">2</span>
            </div>
            <span>Send 100k+ micropayments off-chain (instant, free)</span>
          </div>
          <div className="flex items-start gap-1">
            <div className="w-4 h-4 rounded-full bg-cyber-cyan/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-cyber-cyan text-[8px]">3</span>
            </div>
            <span>Close channel on-chain (one tx)</span>
          </div>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="p-3 border-b border-cyber-border bg-cyber-border/10">
          <p className="text-xs text-cyber-text mb-2">Create New Channel</p>
          <div className="space-y-2">
            <div>
              <label className="text-[9px] text-cyber-muted">Destination Address</label>
              <input
                type="text"
                value={formData.destinationAddress}
                onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })}
                placeholder="rXXXXX..."
                className="w-full mt-1 px-2 py-1 rounded bg-cyber-darker border border-cyber-border text-xs text-cyber-text focus:border-cyber-cyan focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] text-cyber-muted">Amount (drops)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
                  className="w-full mt-1 px-2 py-1 rounded bg-cyber-darker border border-cyber-border text-xs text-cyber-text focus:border-cyber-cyan focus:outline-none"
                />
                <p className="text-[8px] text-cyber-muted mt-0.5">
                  = {(formData.amount / 1000000).toFixed(2)} XRP
                </p>
              </div>
              <div>
                <label className="text-[9px] text-cyber-muted">Settle Delay (seconds)</label>
                <input
                  type="number"
                  value={formData.settleDelay}
                  onChange={(e) => setFormData({ ...formData, settleDelay: parseInt(e.target.value) || 0 })}
                  className="w-full mt-1 px-2 py-1 rounded bg-cyber-darker border border-cyber-border text-xs text-cyber-text focus:border-cyber-cyan focus:outline-none"
                />
                <p className="text-[8px] text-cyber-muted mt-0.5">
                  = {Math.floor(formData.settleDelay / 3600)}h {Math.floor((formData.settleDelay % 3600) / 60)}m
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateChannel}
                disabled={!formData.destinationAddress}
                className="flex-1 py-1.5 rounded bg-cyber-purple text-white text-xs hover:bg-cyber-purple/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Channel
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 rounded bg-cyber-border text-cyber-muted text-xs hover:text-cyber-text transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Channel List */}
      <div className="max-h-60 overflow-y-auto">
        {channels.length === 0 ? (
          <div className="p-6 text-center">
            <Layers size={24} className="text-cyber-muted mx-auto mb-2 opacity-50" />
            <p className="text-xs text-cyber-muted">No payment channels</p>
            <p className="text-[9px] text-cyber-muted mt-1">
              Create a channel to enable instant off-chain micropayments
            </p>
          </div>
        ) : (
          <div className="divide-y divide-cyber-border/50">
            {channels.map(channel => {
              const usedPercent = ((channel.amount - channel.balance) / channel.amount) * 100;
              const isSelected = selectedChannel === channel.id;

              return (
                <div
                  key={channel.id}
                  className={`p-3 hover:bg-cyber-border/20 cursor-pointer transition-colors ${
                    isSelected ? 'bg-cyber-purple/10' : ''
                  }`}
                  onClick={() => {
                    setSelectedChannel(channel.id);
                    onChannelSelect?.(channel);
                  }}
                >
                  {/* Channel Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {channel.status === 'open' ? (
                        <Unlock size={12} className="text-cyber-green" />
                      ) : (
                        <Lock size={12} className="text-cyber-red" />
                      )}
                      <span className="text-xs font-mono text-cyber-text">
                        {channel.channelId.slice(0, 16)}...
                      </span>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                      channel.status === 'open' 
                        ? 'bg-cyber-green/20 text-cyber-green' 
                        : 'bg-cyber-red/20 text-cyber-red'
                    }`}>
                      {channel.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Addresses */}
                  <div className="flex items-center gap-1 text-[9px] text-cyber-muted mb-2">
                    <span>{channel.sourceAddress.slice(0, 8)}...</span>
                    <ArrowRight size={10} />
                    <span>{channel.destinationAddress.slice(0, 8)}...</span>
                  </div>

                  {/* Balance Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-[8px] text-cyber-muted mb-1">
                      <span>Balance</span>
                      <span>
                        {(channel.balance / 1000000).toFixed(4)} / {(channel.amount / 1000000).toFixed(4)} XRP
                      </span>
                    </div>
                    <div className="h-1.5 bg-cyber-border rounded overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyber-purple to-cyber-cyan transition-all"
                        style={{ width: `${100 - usedPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  {isSelected && channel.status === 'open' && (
                    <div className="flex gap-2 mt-2 pt-2 border-t border-cyber-border/50">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClaim(channel, 1000); // Claim 1000 drops
                        }}
                        className="flex-1 py-1 rounded bg-cyber-green/20 text-cyber-green text-[9px] hover:bg-cyber-green/30 transition-colors"
                      >
                        Claim 0.001 XRP
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          closeChannel(channel.id);
                        }}
                        className="flex-1 py-1 rounded bg-cyber-red/20 text-cyber-red text-[9px] hover:bg-cyber-red/30 transition-colors"
                      >
                        Close Channel
                      </button>
                    </div>
                  )}

                  {/* Claims History */}
                  {isSelected && channel.claims.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-cyber-border/50">
                      <p className="text-[8px] text-cyber-muted mb-1">Recent Claims:</p>
                      <div className="space-y-1">
                        {channel.claims.slice(-3).map(claim => (
                          <div key={claim.id} className="flex justify-between text-[8px]">
                            <span className="text-cyber-text">
                              {(claim.amount / 1000000).toFixed(6)} XRP
                            </span>
                            <span className="text-cyber-muted">
                              {new Date(claim.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-cyber-border text-center">
        <p className="text-[8px] text-cyber-muted italic">
          "100,000+ TPS with only 2 on-chain transactions: open and close"
        </p>
      </div>
    </div>
  );
}

export default PaymentChannelManager;
