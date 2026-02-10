// Micropayment Stream Visualizer
// Real-time visualization of streaming payments flowing through ILP/XRPL
// "Watch value flow at the speed of packets"

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play, Pause, Zap, DollarSign, Clock, Activity,
  TrendingUp, Radio, ArrowRight, Circle, Cpu
} from 'lucide-react';
import {
  useMicropaymentStore,
  type MicropaymentStream,
  type PaymentPacket,
  USE_CASE_INFO,
} from '../../services/micropayments/streamingPayments';

// =============================================================================
// TYPES
// =============================================================================

interface StreamVisualizerProps {
  height?: number;
  showStats?: boolean;
  onStreamSelect?: (stream: MicropaymentStream) => void;
}

// =============================================================================
// STREAM VISUALIZER
// =============================================================================

export function StreamVisualizer({
  height = 400,
  showStats = true,
  onStreamSelect,
}: StreamVisualizerProps) {
  const {
    streams,
    packets,
    totalVolume,
    totalPackets,
    activeStreams,
    isSimulating,
    startSimulation,
    stopSimulation,
  } = useMicropaymentStore();

  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  // Get recent packets for animation
  const recentPackets = useMemo(() => {
    return packets.slice(-100);
  }, [packets]);

  // ==========================================================================
  // CANVAS ANIMATION - Flowing particles representing payments
  // ==========================================================================

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      life: number;
      streamId: string;
    }> = [];

    const animate = () => {
      ctx.fillStyle = 'rgba(10, 15, 26, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add new particles for recent packets
      const now = Date.now();
      recentPackets
        .filter(p => now - p.timestamp < 500)
        .forEach(packet => {
          const stream = streams.find(s => s.id === packet.streamId);
          if (!stream) return;

          // Random start position on left
          const startY = Math.random() * canvas.height;
          
          particles.push({
            x: 0,
            y: startY,
            vx: 3 + Math.random() * 2,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.min(8, 2 + packet.amount / 100),
            color: getStreamColor(stream.useCase),
            life: 1,
            streamId: packet.streamId,
          });
        });

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.01;

        if (p.life <= 0 || p.x > canvas.width) {
          particles.splice(i, 1);
          continue;
        }

        // Draw particle with glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fill();

        // Glow effect
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.globalAlpha = p.life * 0.3;
        ctx.fill();

        ctx.globalAlpha = 1;
      }

      // Draw stream lanes
      const activeStreamsList = streams.filter(s => s.state.status === 'active');
      const laneHeight = canvas.height / Math.max(1, activeStreamsList.length);

      activeStreamsList.forEach((stream, i) => {
        const y = (i + 0.5) * laneHeight;
        
        // Lane line
        ctx.strokeStyle = getStreamColor(stream.useCase);
        ctx.globalAlpha = 0.2;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        // Sender label (left)
        ctx.fillStyle = '#888';
        ctx.font = '10px monospace';
        ctx.fillText(stream.sender.name || stream.sender.address.slice(0, 8), 10, y - 5);

        // Receiver label (right)
        const receiverName = stream.receiver.name || stream.receiver.address.slice(0, 8);
        ctx.fillText(receiverName, canvas.width - ctx.measureText(receiverName).width - 10, y - 5);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationRef.current);
  }, [streams, recentPackets]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="bg-cyber-darker rounded-lg border border-cyber-border overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-cyber-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-cyber-yellow" />
            <span className="font-cyber text-cyber-yellow text-sm">MICROPAYMENT STREAMS</span>
          </div>
          <button
            onClick={() => isSimulating ? stopSimulation() : startSimulation()}
            className={`flex items-center gap-1 px-3 py-1 rounded text-xs transition-colors ${
              isSimulating
                ? 'bg-cyber-red/20 text-cyber-red hover:bg-cyber-red/30'
                : 'bg-cyber-green/20 text-cyber-green hover:bg-cyber-green/30'
            }`}
          >
            {isSimulating ? <Pause size={12} /> : <Play size={12} />}
            {isSimulating ? 'Stop' : 'Start Demo'}
          </button>
        </div>

        {/* Quick Stats */}
        {showStats && (
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2 rounded bg-cyber-border/30 text-center">
              <p className="text-lg font-cyber text-cyber-cyan">{activeStreams}</p>
              <p className="text-[8px] text-cyber-muted">ACTIVE</p>
            </div>
            <div className="p-2 rounded bg-cyber-border/30 text-center">
              <p className="text-lg font-cyber text-cyber-green">{totalPackets.toLocaleString()}</p>
              <p className="text-[8px] text-cyber-muted">PACKETS</p>
            </div>
            <div className="p-2 rounded bg-cyber-border/30 text-center">
              <p className="text-lg font-cyber text-cyber-yellow">
                {formatMicroAmount(totalVolume)}
              </p>
              <p className="text-[8px] text-cyber-muted">VOLUME</p>
            </div>
            <div className="p-2 rounded bg-cyber-border/30 text-center">
              <p className="text-lg font-cyber text-cyber-purple">
                {(totalPackets / Math.max(1, activeStreams)).toFixed(0)}
              </p>
              <p className="text-[8px] text-cyber-muted">PKT/STREAM</p>
            </div>
          </div>
        )}
      </div>

      {/* Canvas Visualization */}
      <div className="relative" style={{ height: height - 120 }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={height - 120}
          className="w-full h-full"
        />

        {/* Overlay: No streams message (hides as soon as demo creates streams) */}
        {streams.length === 0 && !isSimulating && (
          <div className="absolute inset-0 flex items-center justify-center bg-cyber-darker/80">
            <div className="text-center">
              <Radio size={32} className="text-cyber-muted mx-auto mb-2 opacity-50" />
              <p className="text-sm text-cyber-muted">No active streams</p>
              <p className="text-xs text-cyber-muted mt-1">Click &quot;Start Demo&quot; to create demo streams and see micropayments flow</p>
            </div>
          </div>
        )}
        {streams.length === 0 && isSimulating && (
          <div className="absolute inset-0 flex items-center justify-center bg-cyber-darker/60">
            <div className="text-center">
              <Activity size={24} className="text-cyber-green mx-auto mb-2 animate-pulse" />
              <p className="text-sm text-cyber-green">Starting demo streams…</p>
            </div>
          </div>
        )}
      </div>

      {/* Stream List */}
      <div className="border-t border-cyber-border max-h-40 overflow-y-auto">
        {streams.map(stream => (
          <div
            key={stream.id}
            className={`p-2 border-b border-cyber-border/50 hover:bg-cyber-border/20 cursor-pointer transition-colors ${
              selectedStreamId === stream.id ? 'bg-cyber-cyan/10' : ''
            }`}
            onClick={() => {
              setSelectedStreamId(stream.id);
              onStreamSelect?.(stream);
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{USE_CASE_INFO[stream.useCase]?.icon || '💸'}</span>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-cyber-text">{stream.sender.name || 'Sender'}</span>
                    <ArrowRight size={10} className="text-cyber-muted" />
                    <span className="text-xs text-cyber-text">{stream.receiver.name || 'Receiver'}</span>
                  </div>
                  <p className="text-[9px] text-cyber-muted">
                    {USE_CASE_INFO[stream.useCase]?.name || stream.useCase}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Circle
                    size={6}
                    fill={stream.state.status === 'active' ? '#00FF88' : '#666'}
                    className={stream.state.status === 'active' ? 'text-cyber-green' : 'text-cyber-muted'}
                  />
                  <span className="text-[9px] text-cyber-muted capitalize">{stream.state.status}</span>
                </div>
                <p className="text-xs text-cyber-cyan font-mono">
                  {formatMicroAmount(stream.state.totalSent)} {stream.config.currency}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function getStreamColor(useCase: string): string {
  const colors: Record<string, string> = {
    content_streaming: '#00D4FF',
    api_metering: '#A855F7',
    ai_agent_payment: '#00FF88',
    gaming_microtx: '#FFD700',
    iot_data: '#FF6B35',
    web_monetization: '#00FFCC',
    bandwidth_payment: '#FF4444',
    compute_payment: '#4FFFFF',
  };
  return colors[useCase] || '#888888';
}

function formatMicroAmount(drops: number): string {
  if (drops >= 1_000_000) {
    return (drops / 1_000_000).toFixed(2) + 'M';
  }
  if (drops >= 1_000) {
    return (drops / 1_000).toFixed(1) + 'K';
  }
  return drops.toFixed(0);
}

export default StreamVisualizer;
