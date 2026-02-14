import { useEffect, useMemo, useRef, useState } from "react";

type XRPLAmount =
  | string
  | { currency: string; issuer: string; value: string };

type XRPLTx = {
  TransactionType?: string;
  Account?: string;
  Destination?: string;
  Amount?: XRPLAmount;
  hash?: string;
  Fee?: string;
  Sequence?: number;
};

type StreamMessage = {
  transaction?: XRPLTx;
};

type Lane = "Payments" | "AMM/DEX" | "NFTs" | "Trustlines" | "Other";

type Blip = {
  id: string;
  lane: Lane;
  col: number;
  born: number;
  life: number;
  strength: number;
  tx: XRPLTx;
};

function pnow() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function safeParse(s: string): StreamMessage | null {
  try { return JSON.parse(s) as StreamMessage; } catch { return null; }
}

function classifyLane(tx?: XRPLTx): Lane {
  const t = tx?.TransactionType ?? "Other";
  if (t === "Payment") return "Payments";
  if (t === "OfferCreate" || t === "OfferCancel") return "AMM/DEX";
  if (t === "AMMCreate" || t === "AMMDeposit" || t === "AMMWithdraw" || t === "AMMBid" || t === "AMMVote") return "AMM/DEX";
  if (t === "NFTokenMint" || t === "NFTokenBurn" || t === "NFTokenCreateOffer" || t === "NFTokenAcceptOffer") return "NFTs";
  if (t === "TrustSet") return "Trustlines";
  return "Other";
}

function estimateStrength(tx?: XRPLTx): number {
  const a = tx?.Amount;
  if (!a) return 0.35;
  if (typeof a === "string") {
    const n = Number(a);
    if (!Number.isFinite(n)) return 0.4;
    const xrp = n / 1_000_000;
    const s = Math.min(1, Math.max(0.2, Math.log10(xrp + 1) / 6));
    return s;
  }
  if (typeof a === "object" && a.value) {
    const n = Number(a.value);
    if (!Number.isFinite(n)) return 0.5;
    const s = Math.min(1, Math.max(0.25, Math.log10(n + 1) / 6));
    return s;
  }
  return 0.4;
}

function formatAmount(a?: XRPLAmount): string {
  if (!a) return "—";
  if (typeof a === "string") {
    const n = Number(a);
    if (!Number.isFinite(n)) return a;
    const xrp = n / 1_000_000;
    return `${xrp.toLocaleString(undefined, { maximumFractionDigits: 6 })} XRP`;
  }
  return `${a.value} ${a.currency} (${a.issuer.slice(0, 6)}…${a.issuer.slice(-4)})`;
}

function hashToCol(id: string, cols: number): number {
  let seed = 0;
  for (let i = 0; i < id.length; i++) seed = (seed + id.charCodeAt(i) * (i + 1)) % 10_000;
  return seed % cols;
}

export default function SectorRadar() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const blipsRef = useRef<Blip[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const [connected, setConnected] = useState(false);
  const [tps, setTps] = useState(0);
  const [burst, setBurst] = useState(false);

  const [enabled, setEnabled] = useState<Record<Lane, boolean>>({
    Payments: true,
    "AMM/DEX": true,
    NFTs: true,
    Trustlines: true,
    Other: true,
  });

  const [selected, setSelected] = useState<XRPLTx | null>(null);

  const size = useMemo(() => ({ w: 980, h: 560 }), []);
  const lanes: Lane[] = useMemo(() => ["Payments", "AMM/DEX", "NFTs", "Trustlines", "Other"], []);
  const cols = 30;

  // TPS meter
  useEffect(() => {
    let count = 0;
    const int = setInterval(() => {
      setTps(count);
      setBurst(count >= 35);
      count = 0;
    }, 1000);
    (window as unknown as { __inc?: () => void }).__inc = () => count++;
    return () => {
      clearInterval(int);
      delete (window as unknown as { __inc?: () => void }).__inc;
    };
  }, []);

  // XRPL stream
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
      const msg = safeParse(String(evt.data));
      const tx = msg?.transaction;
      if (!tx) return;

      const inc = (window as unknown as { __inc?: () => void }).__inc;
      inc?.();

      const lane = classifyLane(tx);
      if (!enabled[lane]) return;

      const strength = estimateStrength(tx);
      const id = (tx.hash ?? `${Date.now()}-${Math.random()}`).slice(0, 24);
      const col = hashToCol(id, cols);
      const born = pnow();
      const life = 1600 + Math.random() * 1700;

      blipsRef.current.push({ id, lane, col, born, life, strength, tx });

      if (blipsRef.current.length > 800) {
        blipsRef.current.splice(0, blipsRef.current.length - 800);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [cols, enabled]);

  // Draw + click picking
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    canvas.style.width = `${size.w}px`;
    canvas.style.height = `${size.h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pad = 16;
    const headerH = 56;
    const inspectorW = 320;

    const plotX = pad;
    const plotY = headerH;
    const plotW = size.w - pad * 2 - inspectorW - 12;
    const plotH = size.h - headerH - pad;

    const laneH = plotH / lanes.length;
    const colW = plotW / cols;

    let lastBlipPositions: Array<{ x: number; y: number; r: number; tx: XRPLTx }> = [];

    function laneColor(lane: Lane, alpha: number) {
      if (lane === "Payments") return `rgba(165, 255, 210, ${alpha})`;
      if (lane === "AMM/DEX") return `rgba(170, 205, 255, ${alpha})`;
      if (lane === "NFTs") return `rgba(235, 185, 255, ${alpha})`;
      if (lane === "Trustlines") return `rgba(255, 225, 165, ${alpha})`;
      return `rgba(230, 230, 235, ${alpha})`;
    }

    const draw = () => {
      const t = pnow();
      lastBlipPositions = [];

      ctx.clearRect(0, 0, size.w, size.h);
      ctx.fillStyle = "#0a0c10";
      ctx.fillRect(0, 0, size.w, size.h);

      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.font = "700 16px system-ui";
      ctx.fillText("XRPL Ops Radar v1 (Sector Grid)", pad, 28);

      ctx.font = "12px system-ui";
      ctx.fillStyle = "rgba(255,255,255,0.70)";
      ctx.fillText(`Status: ${connected ? "Connected" : "Disconnected"}`, pad, 48);
      ctx.fillText(`Tx/sec: ${tps}${burst ? "  (BURST)" : ""}`, pad + 170, 48);

      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.lineWidth = 1;
      ctx.strokeRect(plotX, plotY, plotW, plotH);

      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      for (let c = 1; c < cols; c++) {
        const x = plotX + c * colW;
        ctx.beginPath();
        ctx.moveTo(x, plotY);
        ctx.lineTo(x, plotY + plotH);
        ctx.stroke();
      }

      for (let i = 0; i < lanes.length; i++) {
        const y = plotY + i * laneH;
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.beginPath();
        ctx.moveTo(plotX, y);
        ctx.lineTo(plotX + plotW, y);
        ctx.stroke();

        ctx.fillStyle = enabled[lanes[i]] ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.25)";
        ctx.font = "12px system-ui";
        ctx.fillText(lanes[i], plotX + 8, y + 18);
      }

      const blips = blipsRef.current;
      for (let i = blips.length - 1; i >= 0; i--) {
        const b = blips[i];
        const age = t - b.born;
        if (age >= b.life) {
          blips.splice(i, 1);
          continue;
        }

        const p = age / b.life;
        const fade = Math.max(0, 1 - p);

        const laneIndex = lanes.indexOf(b.lane);
        const x = plotX + b.col * colW + colW / 2;
        const y = plotY + laneIndex * laneH + laneH / 2;

        const baseR = 3 + b.strength * 7;
        const pulse = baseR + Math.sin(p * Math.PI * 4) * 1.1;

        ctx.beginPath();
        ctx.strokeStyle = laneColor(b.lane, 0.10 + fade * 0.55);
        ctx.lineWidth = 2;
        ctx.arc(x, y, pulse + 2.2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = laneColor(b.lane, 0.18 + fade * 0.65);
        const coreR = Math.max(2.1, baseR * 0.45);
        ctx.arc(x, y, coreR, 0, Math.PI * 2);
        ctx.fill();

        lastBlipPositions.push({ x, y, r: pulse + 5, tx: b.tx });
      }

      const ix = plotX + plotW + 12;
      const iy = plotY;
      const iw = inspectorW;
      const ih = plotH;

      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.strokeRect(ix, iy, iw, ih);

      ctx.fillStyle = "rgba(255,255,255,0.07)";
      ctx.fillRect(ix, iy, iw, 40);

      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "700 13px system-ui";
      ctx.fillText("Tx Inspector", ix + 12, iy + 25);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      for (let i = lastBlipPositions.length - 1; i >= 0; i--) {
        const b = lastBlipPositions[i];
        const dx = mx - b.x;
        const dy = my - b.y;
        if (dx * dx + dy * dy <= b.r * b.r) {
          setSelected(b.tx);
          return;
        }
      }
    };

    canvas.addEventListener("click", onClick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("click", onClick);
    };
  }, [cols, lanes, size.h, size.w, connected, tps, burst, enabled]);

  return (
    <div style={{ width: size.w }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
        {lanes.map((lane) => (
          <label key={lane} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, opacity: enabled[lane] ? 0.9 : 0.55 }}>
            <input
              type="checkbox"
              checked={enabled[lane]}
              onChange={(ev) => setEnabled((p) => ({ ...p, [lane]: ev.target.checked }))}
            />
            {lane}
          </label>
        ))}
        <button
          onClick={() => { blipsRef.current = []; setSelected(null); }}
          style={{
            marginLeft: "auto",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "inherit",
            borderRadius: 10,
            padding: "6px 10px",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          Clear
        </button>
      </div>

      <div style={{ position: "relative" }}>
        <div
          style={{
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <canvas ref={canvasRef} />
        </div>

        <div
          style={{
            position: "absolute",
            top: 56,
            right: 16,
            width: 320,
            height: 560 - 56 - 16,
            padding: 12,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              height: "100%",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 12,
              background: "rgba(10,12,16,0.65)",
              backdropFilter: "blur(6px)",
              padding: 12,
              pointerEvents: "auto",
              overflow: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Tx Inspector</div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "inherit",
                  borderRadius: 10,
                  padding: "4px 8px",
                  cursor: "pointer",
                  fontSize: 12,
                  opacity: 0.85,
                }}
              >
                Close
              </button>
            </div>

            {!selected ? (
              <div style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.5 }}>
                Click a blip to inspect the transaction.<br />
                This is designed as an ops instrument panel, not a demo clone.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10, fontSize: 12 }}>
                <Field label="Type" value={selected.TransactionType ?? "—"} />
                <Field label="Account" value={selected.Account ?? "—"} mono />
                <Field label="Destination" value={selected.Destination ?? "—"} mono />
                <Field label="Amount" value={formatAmount(selected.Amount)} />
                <Field label="Fee (drops)" value={selected.Fee ?? "—"} />
                <Field label="Sequence" value={selected.Sequence?.toString() ?? "—"} />
                <Field label="Hash" value={selected.hash ?? "—"} mono />
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 10, opacity: 0.7, fontSize: 12, lineHeight: 1.5 }}>
        Next upgrades: Amendment/Capability panel + Innovation Radar module + corridor overlays.
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div style={{ opacity: 0.7 }}>{label}</div>
      <div style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)", fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" : undefined }}>
        {value}
      </div>
    </div>
  );
}
