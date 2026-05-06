// XRPL/ILP Streaming Micropayments Engine
// "ILP enables payments at the speed of packets. Every millisecond can carry value."
// 
// XRPL Micropayment Advantages:
// - 3-5 second finality (vs 10min BTC, 12sec ETH)
// - ~0.00001 XRP fee ($0.00003 at $3/XRP)
// - Payment Channels: instant off-ledger, settle on-chain when done
// - Native ILP support for cross-currency streaming
// - No smart contract gas fees

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface MicropaymentStream {
  id: string;
  type: 'ilp_stream' | 'payment_channel' | 'direct_payment';
  
  // Parties
  sender: {
    address: string;
    name?: string;
    type: 'user' | 'agent' | 'service' | 'api';
  };
  receiver: {
    address: string;
    name?: string;
    type: 'user' | 'agent' | 'service' | 'api';
  };
  
  // Stream config
  config: {
    currency: string;
    ratePerSecond: number;      // Amount per second in drops/smallest unit
    ratePerRequest?: number;    // For API metering
    maxAmount?: number;         // Cap
    minAmount?: number;         // Minimum before settle
  };
  
  // State
  state: {
    status: 'pending' | 'active' | 'paused' | 'completed' | 'failed';
    startedAt: number | null;
    totalSent: number;
    totalPackets: number;
    lastPaymentAt: number | null;
    channelBalance?: number;    // For payment channels
  };
  
  // Use case
  useCase: MicropaymentUseCase;
  
  // Metrics
  metrics: {
    avgLatency: number;
    successRate: number;
    throughput: number;         // Payments per second
  };
}

export type MicropaymentUseCase = 
  | 'content_streaming'       // Video/music per-second billing
  | 'api_metering'           // Pay-per-API-call
  | 'ai_agent_payment'       // Machine-to-machine
  | 'gaming_microtx'         // In-game purchases
  | 'iot_data'               // Sensor data monetization
  | 'web_monetization'       // Browser streaming
  | 'bandwidth_payment'      // Pay for network resources
  | 'compute_payment';       // Pay for compute cycles

export interface PaymentPacket {
  id: string;
  streamId: string;
  timestamp: number;
  amount: number;
  currency: string;
  fulfilled: boolean;
  latencyMs: number;
  ilpCondition?: string;
  ilpFulfillment?: string;
}

export interface XRPLPaymentChannel {
  id: string;
  channelId: string;          // On-ledger channel ID
  sourceAddress: string;
  destinationAddress: string;
  amount: number;             // Total channel capacity
  balance: number;            // Current balance
  settleDelay: number;        // Seconds before channel can close
  publicKey: string;
  cancelAfter?: number;
  expiration?: number;
  status: 'open' | 'pending_close' | 'closed';
  claims: ChannelClaim[];
}

export interface ChannelClaim {
  id: string;
  amount: number;
  signature: string;
  timestamp: number;
  verified: boolean;
}

export interface CostComparison {
  network: string;
  feePerTx: number;           // In USD
  finality: number;           // Seconds
  tps: number;
  minViableTx: number;        // USD - minimum tx where fee < 1%
  micropaymentScore: number;  // 0-100
}

// =============================================================================
// MICROPAYMENT STORE
// =============================================================================

const _simulationIntervalIds: ReturnType<typeof setInterval>[] = [];

interface MicropaymentState {
  streams: MicropaymentStream[];
  packets: PaymentPacket[];
  channels: XRPLPaymentChannel[];
  
  // Simulation state
  isSimulating: boolean;
  simulationSpeed: number;
  
  // Stats
  totalVolume: number;
  totalPackets: number;
  activeStreams: number;
  
  // Actions
  createStream: (stream: Omit<MicropaymentStream, 'id' | 'state' | 'metrics'>) => MicropaymentStream;
  startStream: (id: string) => void;
  pauseStream: (id: string) => void;
  stopStream: (id: string) => void;
  recordPacket: (packet: Omit<PaymentPacket, 'id'>) => void;
  
  // Payment channels
  openChannel: (channel: Omit<XRPLPaymentChannel, 'id' | 'claims' | 'status'>) => XRPLPaymentChannel;
  claimChannel: (channelId: string, amount: number, signature: string) => void;
  closeChannel: (channelId: string) => void;
  
  // Simulation
  startSimulation: () => void;
  stopSimulation: () => void;
  setSimulationSpeed: (speed: number) => void;
  
  // Queries
  getStreamsByUseCase: (useCase: MicropaymentUseCase) => MicropaymentStream[];
  getRecentPackets: (count: number) => PaymentPacket[];
  getStreamMetrics: (id: string) => MicropaymentStream['metrics'] | null;
}

export const useMicropaymentStore = create<MicropaymentState>((set, get) => ({
  streams: [],
  packets: [],
  channels: [],
  isSimulating: false,
  simulationSpeed: 1,
  totalVolume: 0,
  totalPackets: 0,
  activeStreams: 0,

  createStream: (partial) => {
    const stream: MicropaymentStream = {
      ...partial,
      id: `stream-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      state: {
        status: 'pending',
        startedAt: null,
        totalSent: 0,
        totalPackets: 0,
        lastPaymentAt: null,
      },
      metrics: {
        avgLatency: 0,
        successRate: 1,
        throughput: 0,
      },
    };

    set(state => ({ streams: [...state.streams, stream] }));
    return stream;
  },

  startStream: (id) => {
    set(state => ({
      streams: state.streams.map(s => 
        s.id === id 
          ? { ...s, state: { ...s.state, status: 'active', startedAt: Date.now() } }
          : s
      ),
      activeStreams: state.activeStreams + 1,
    }));
  },

  pauseStream: (id) => {
    set(state => ({
      streams: state.streams.map(s => 
        s.id === id 
          ? { ...s, state: { ...s.state, status: 'paused' } }
          : s
      ),
      activeStreams: Math.max(0, state.activeStreams - 1),
    }));
  },

  stopStream: (id) => {
    set(state => ({
      streams: state.streams.map(s => 
        s.id === id 
          ? { ...s, state: { ...s.state, status: 'completed' } }
          : s
      ),
      activeStreams: Math.max(0, state.activeStreams - 1),
    }));
  },

  recordPacket: (partial) => {
    const packet: PaymentPacket = {
      ...partial,
      id: `pkt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };

    set(state => {
      // Update stream stats
      const streams = state.streams.map(s => {
        if (s.id !== packet.streamId) return s;
        
        const newTotalPackets = s.state.totalPackets + 1;
        const newTotalSent = s.state.totalSent + packet.amount;
        const newAvgLatency = (s.metrics.avgLatency * s.state.totalPackets + packet.latencyMs) / newTotalPackets;
        
        return {
          ...s,
          state: {
            ...s.state,
            totalPackets: newTotalPackets,
            totalSent: newTotalSent,
            lastPaymentAt: packet.timestamp,
          },
          metrics: {
            ...s.metrics,
            avgLatency: newAvgLatency,
            successRate: packet.fulfilled ? s.metrics.successRate : s.metrics.successRate * 0.99,
          },
        };
      });

      // Keep last 1000 packets
      const packets = [...state.packets, packet].slice(-1000);

      return {
        streams,
        packets,
        totalPackets: state.totalPackets + 1,
        totalVolume: state.totalVolume + packet.amount,
      };
    });
  },

  openChannel: (partial) => {
    const channel: XRPLPaymentChannel = {
      ...partial,
      id: `chan-${Date.now()}`,
      status: 'open',
      claims: [],
    };

    set(state => ({ channels: [...state.channels, channel] }));
    return channel;
  },

  claimChannel: (channelId, amount, signature) => {
    set(state => ({
      channels: state.channels.map(c => 
        c.id === channelId
          ? {
              ...c,
              balance: c.balance - amount,
              claims: [...c.claims, {
                id: `claim-${Date.now()}`,
                amount,
                signature,
                timestamp: Date.now(),
                verified: true,
              }],
            }
          : c
      ),
    }));
  },

  closeChannel: (channelId) => {
    set(state => ({
      channels: state.channels.map(c => 
        c.id === channelId ? { ...c, status: 'pending_close' } : c
      ),
    }));
  },

  startSimulation: () => {
    const streams = createDemoStreams();
    const intervalIds: ReturnType<typeof setInterval>[] = [];
    streams.forEach(stream => {
      const id = setInterval(() => {
        const state = get();
        const s = state.streams.find(x => x.id === stream.id);
        if (!s || s.state.status !== 'active') return;
        get().recordPacket({
          streamId: s.id,
          timestamp: Date.now(),
          amount: Math.max(1, Math.floor((s.config.ratePerSecond || 100) / 10)),
          currency: s.config.currency,
          fulfilled: Math.random() > 0.002,
          latencyMs: 5 + Math.random() * 25,
        });
      }, 100);
      intervalIds.push(id);
    });
    _simulationIntervalIds.push(...intervalIds);
    set({ isSimulating: true });
  },

  stopSimulation: () => {
    _simulationIntervalIds.forEach(id => clearInterval(id));
    _simulationIntervalIds.length = 0;
    set({ isSimulating: false });
  },

  setSimulationSpeed: (speed) => {
    set({ simulationSpeed: speed });
  },

  getStreamsByUseCase: (useCase) => {
    return get().streams.filter(s => s.useCase === useCase);
  },

  getRecentPackets: (count) => {
    return get().packets.slice(-count);
  },

  getStreamMetrics: (id) => {
    const stream = get().streams.find(s => s.id === id);
    return stream?.metrics || null;
  },
}));

// =============================================================================
// COST COMPARISON DATA
// =============================================================================

export const NETWORK_COSTS: CostComparison[] = [
  {
    network: 'XRPL',
    feePerTx: 0.00003,        // ~0.00001 XRP at $3
    finality: 4,
    tps: 1500,
    minViableTx: 0.003,       // Fee is 1% at $0.003
    micropaymentScore: 98,
  },
  {
    network: 'XRPL Payment Channel',
    feePerTx: 0.000001,       // Off-chain, only settle fee
    finality: 0.001,          // Instant
    tps: 100000,
    minViableTx: 0.0001,
    micropaymentScore: 100,
  },
  {
    // TigerBeetle: distributed double-entry ledger (OLTP), not a public L1 — figures are reference
    // throughput/latency benchmarks; “fee” = illustrative marginal infra cost per transfer, not gas.
    network: 'TigerBeetle (ledger DB)',
    feePerTx: 0.000002,
    finality: 0.001,          // ~1ms class commit (deployment-dependent)
    tps: 1_000_000,           // Stress-test class throughput (hardware-dependent)
    minViableTx: 0.0002,
    micropaymentScore: 99,
  },
  {
    network: 'ILP (via XRPL)',
    feePerTx: 0.00005,
    finality: 0.5,
    tps: 50000,
    minViableTx: 0.005,
    micropaymentScore: 95,
  },
  {
    network: 'Lightning Network',
    feePerTx: 0.0001,
    finality: 1,
    tps: 25000,
    minViableTx: 0.01,
    micropaymentScore: 90,
  },
  {
    network: 'Solana',
    feePerTx: 0.00025,
    finality: 0.4,
    tps: 4000,
    minViableTx: 0.025,
    micropaymentScore: 75,
  },
  {
    network: 'Polygon',
    feePerTx: 0.001,
    finality: 2,
    tps: 7000,
    minViableTx: 0.1,
    micropaymentScore: 60,
  },
  {
    network: 'Arbitrum',
    feePerTx: 0.01,
    finality: 0.3,
    tps: 4000,
    minViableTx: 1.0,
    micropaymentScore: 40,
  },
  {
    network: 'Ethereum L1',
    feePerTx: 0.12,
    finality: 12,
    tps: 15,
    minViableTx: 5,
    micropaymentScore: 15,
  },
  {
    network: 'Bitcoin',
    feePerTx: 1.0,
    finality: 600,
    tps: 7,
    minViableTx: 100,
    micropaymentScore: 2,
  },
];

// =============================================================================
// USE CASE DEFINITIONS
// =============================================================================

export const USE_CASE_INFO: Record<MicropaymentUseCase, {
  name: string;
  description: string;
  typicalRate: string;
  xrplAdvantage: string;
  icon: string;
}> = {
  content_streaming: {
    name: 'Content Streaming',
    description: 'Pay-per-second for video, music, articles',
    typicalRate: '$0.001/second',
    xrplAdvantage: 'Fee is 0.003% of payment - 1000x better than ETH',
    icon: '🎬',
  },
  api_metering: {
    name: 'API Metering',
    description: 'Pay-per-call for AI models, data APIs',
    typicalRate: '$0.0001/request',
    xrplAdvantage: 'Payment channels allow 100k+ TPS off-chain',
    icon: '🔌',
  },
  ai_agent_payment: {
    name: 'AI Agent Payments',
    description: 'Machine-to-machine autonomous transactions',
    typicalRate: 'Variable, micro to milli',
    xrplAdvantage: 'ILP enables agents to pay across any currency',
    icon: '🤖',
  },
  gaming_microtx: {
    name: 'Gaming Microtransactions',
    description: 'In-game items, power-ups, rewards',
    typicalRate: '$0.01-$1.00',
    xrplAdvantage: '4s finality means instant item delivery',
    icon: '🎮',
  },
  iot_data: {
    name: 'IoT Data Monetization',
    description: 'Sensors selling data streams',
    typicalRate: '$0.00001/reading',
    xrplAdvantage: 'Only network where fee < data value',
    icon: '📡',
  },
  web_monetization: {
    name: 'Web Monetization',
    description: 'Browser-native content payments',
    typicalRate: '$0.0001/second',
    xrplAdvantage: 'W3C standard uses ILP under the hood',
    icon: '🌐',
  },
  bandwidth_payment: {
    name: 'Bandwidth Payment',
    description: 'Pay for network/CDN resources',
    typicalRate: '$0.00001/MB',
    xrplAdvantage: 'Real-time streaming matches data flow',
    icon: '📶',
  },
  compute_payment: {
    name: 'Compute Payment',
    description: 'Pay for CPU/GPU cycles',
    typicalRate: '$0.0001/second',
    xrplAdvantage: 'Payment channels settle only when compute done',
    icon: '⚡',
  },
};

// =============================================================================
// SIMULATION HELPERS
// =============================================================================

export function createDemoStreams(): MicropaymentStream[] {
  const { createStream, startStream } = useMicropaymentStore.getState();

  const demos: Array<Omit<MicropaymentStream, 'id' | 'state' | 'metrics'>> = [
    {
      type: 'ilp_stream',
      sender: { address: 'rAIAgent1...', name: 'GPT-5 Agent', type: 'agent' },
      receiver: { address: 'rDataAPI...', name: 'Real-Time Data API', type: 'service' },
      config: { currency: 'XRP', ratePerSecond: 1000, ratePerRequest: 100 },
      useCase: 'ai_agent_payment',
    },
    {
      type: 'payment_channel',
      sender: { address: 'rUser123...', name: 'Alice', type: 'user' },
      receiver: { address: 'rStreaming...', name: 'StreamFlix', type: 'service' },
      config: { currency: 'USD', ratePerSecond: 0.001 },
      useCase: 'content_streaming',
    },
    {
      type: 'ilp_stream',
      sender: { address: 'rGameServer...', name: 'Battle Royale', type: 'service' },
      receiver: { address: 'rPlayer42...', name: 'xXProGamerXx', type: 'user' },
      config: { currency: 'XRP', ratePerSecond: 0 },
      useCase: 'gaming_microtx',
    },
    {
      type: 'ilp_stream',
      sender: { address: 'rBrowser...', name: 'Web User', type: 'user' },
      receiver: { address: 'rCreator...', name: 'Content Creator', type: 'user' },
      config: { currency: 'XRP', ratePerSecond: 10 },
      useCase: 'web_monetization',
    },
  ];

  const streams = demos.map(d => {
    const stream = createStream(d);
    startStream(stream.id);
    return stream;
  });

  return streams;
}

export function simulatePacketFlow(streamId: string, durationMs: number = 10000) {
  const { recordPacket, streams } = useMicropaymentStore.getState();
  const stream = streams.find(s => s.id === streamId);
  if (!stream || stream.state.status !== 'active') return;

  const interval = setInterval(() => {
    const latency = 5 + Math.random() * 20; // 5-25ms
    
    recordPacket({
      streamId,
      timestamp: Date.now(),
      amount: stream.config.ratePerSecond / 10, // 10 packets per second
      currency: stream.config.currency,
      fulfilled: Math.random() > 0.001, // 99.9% success rate
      latencyMs: latency,
    });
  }, 100);

  setTimeout(() => clearInterval(interval), durationMs);
}

// =============================================================================
// REACT HOOK
// =============================================================================

import { useEffect, useCallback } from 'react';

export function useMicropaymentSimulation() {
  const store = useMicropaymentStore();

  const startDemo = useCallback(() => {
    const streams = createDemoStreams();
    store.startSimulation();
    
    // Start packet flow for each stream
    streams.forEach(s => simulatePacketFlow(s.id, 60000));
  }, [store]);

  const stopDemo = useCallback(() => {
    store.stopSimulation();
    store.streams.forEach(s => store.stopStream(s.id));
  }, [store]);

  return {
    ...store,
    startDemo,
    stopDemo,
  };
}

export default useMicropaymentStore;
