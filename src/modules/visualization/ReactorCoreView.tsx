import { useEffect, useRef, useState } from "react";

type TxType = "Payment" | "AMM/DEX" | "NFTs" | "Trustlines" | "Other";

function classifyTxType(tx: { transaction?: { TransactionType?: string } }): TxType {
  const t = tx?.transaction?.TransactionType ?? "Other";
  if (t === "Payment") return "Payment";
  if (t === "OfferCreate" || t === "OfferCancel") return "AMM/DEX";
  if (["AMMCreate", "AMMDeposit", "AMMWithdraw", "AMMBid", "AMMVote"].includes(t)) return "AMM/DEX";
  if (["NFTokenMint", "NFTokenBurn", "NFTokenCreateOffer", "NFTokenAcceptOffer"].includes(t)) return "NFTs";
  if (t === "TrustSet") return "Trustlines";
  return "Other";
}

type Pulse = { type: TxType; start: number };
type Vec2 = { x: number; y: number };

const PULSE_DURATION_MS = 500;
const FACET_RADIUS = 85;
const CORE_RADIUS = 28;
const FACET_ORB = 14;

const COLORS: Record<TxType, string> = {
  Payment: "100, 255, 180",
  "AMM/DEX": "100, 180, 255",
  NFTs: "220, 140, 255",
  Trustlines: "255, 200, 100",
  Other: "200, 200, 220",
};

const LABELS: Record<TxType, string> = {
  Payment: "Payments",
  "AMM/DEX": "AMM",
  NFTs: "NFTs",
  Trustlines: "Trust",
  Other: "Other",
};

function pentagonPoints(cx: number, cy: number, r: number): Vec2[] {
  const points: Vec2[] = [];
  for (let i = 0; i < 5; i++) {
    const angle = Math.PI / 2 + (i * 2 * Math.PI) / 5;
    points.push({ x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) });
  }
  return points;
}

export default function ReactorCoreView() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const pulsesRef = useRef<Pulse[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [tps, setTps] = useState(0);

  useEffect(() => {
    let count = 0;
    const t = setInterval(() => {
      setTps(count);
      count = 0;
    }, 1000);
    (window as unknown as { __reactorInc?: () => void }).__reactorInc = () => count++;
    return () => {
      clearInterval(t);
      delete (window as unknown as { __reactorInc?: () => void }).__reactorInc;
    };
  }, []);

  useEffect(() => {
    const ws = new WebSocket("wss://s1.ripple.com/");
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ command: "subscribe", streams: ["transactions"] }));
    };
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (evt) => {
      const inc = (window as unknown as { __reactorInc?: () => void }).__reactorInc;
      inc?.();
      let data: { transaction?: { TransactionType?: string } };
      try {
        data = JSON.parse(evt.data as string);
      } catch {
        return;
      }
      if (!data?.transaction) return;
      const type = classifyTxType(data);
      pulsesRef.current.push({ type, start: performance.now() });
      if (pulsesRef.current.length > 120) {
        pulsesRef.current = pulsesRef.current.slice(-120);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = 560;
    const h = 420;
    const cx = w / 2;
    const cy = h / 2;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const facets = pentagonPoints(cx, cy, FACET_RADIUS);
    const types: TxType[] = ["Payment", "AMM/DEX", "NFTs", "Trustlines", "Other"];

    function draw() {
      const now = performance.now();

      ctx.fillStyle = "#060910";
      ctx.fillRect(0, 0, w, h);

      // Core glow (subtle pulse)
      const corePulse = 0.92 + 0.08 * Math.sin(now * 0.003);
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, CORE_RADIUS * 2.5);
      coreGrad.addColorStop(0, `rgba(0, 212, 255, ${0.4 * corePulse})`);
      coreGrad.addColorStop(0.5, `rgba(0, 180, 220, ${0.15 * corePulse})`);
      coreGrad.addColorStop(1, "rgba(0, 212, 255, 0)");
      ctx.beginPath();
      ctx.arc(cx, cy, CORE_RADIUS * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, CORE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(8, 12, 24, 0.9)";
      ctx.fill();
      ctx.strokeStyle = "rgba(0, 212, 255, 0.5)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Facet orbs + thin beams to core
      facets.forEach((p, i) => {
        const type = types[i];
        const [r, g, b] = COLORS[type].split(", ").map(Number);

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.12)`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(p.x, p.y, FACET_ORB, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.25)`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.6)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = "11px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(LABELS[type], p.x, p.y + FACET_ORB + 14);
      });

      // Pulses: facet -> core
      pulsesRef.current = pulsesRef.current.filter((pulse) => {
        const age = now - pulse.start;
        if (age >= PULSE_DURATION_MS) return false;

        const progress = age / PULSE_DURATION_MS;
        const facet = facets[types.indexOf(pulse.type)];
        const x = facet.x + (cx - facet.x) * progress;
        const y = facet.y + (cy - facet.y) * progress;
        const alpha = 1 - progress;
        const [r, g, b] = COLORS[pulse.type].split(", ").map(Number);

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.9})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        return true;
      });

      rafRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="overflow-hidden rounded-2xl border border-white/10"
        style={{ background: "#060910" }}
      >
        <canvas ref={canvasRef} />
      </div>
      <div className="flex items-center gap-4 text-xs text-cyber-muted">
        <span className={connected ? "text-cyber-green" : ""}>
          {connected ? "Live" : "Connecting…"}
        </span>
        <span className="tabular-nums">{tps} tx/s</span>
      </div>
    </div>
  );
}
