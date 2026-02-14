import { useEffect, useRef } from "react";

type Ripple = {
  x: number;
  y: number;
  start: number;
  strength: number;
};

type Star = {
  x: number;
  y: number;
  driftX: number;
  driftY: number;
};

const MAX_RIPPLES = 400;

export default function RippleConstellationView() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const starsRef = useRef<Star[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.offsetWidth || 900;
    const height = 520;

    canvas.width = width;
    canvas.height = height;

    // Generate starfield
    starsRef.current = Array.from({ length: 90 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      driftX: (Math.random() - 0.5) * 0.04,
      driftY: (Math.random() - 0.5) * 0.04,
    }));

    const ws = new WebSocket("wss://s1.ripple.com/");

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          command: "subscribe",
          streams: ["transactions"],
        })
      );
    };

    ws.onmessage = () => {
      const now = performance.now();
      const w = canvas.offsetWidth || width;
      const h = height;

      ripplesRef.current.push({
        x: Math.random() * w,
        y: Math.random() * h,
        start: now,
        strength: Math.random() * 1.5 + 0.5,
      });

      if (ripplesRef.current.length > MAX_RIPPLES) {
        ripplesRef.current = ripplesRef.current.slice(-MAX_RIPPLES);
      }
    };

    function draw() {
      const w = canvas.offsetWidth || width;
      const h = height;

      if (canvas.width !== w) {
        canvas.width = w;
        canvas.height = h;
      }

      const now = performance.now();
      ctx.fillStyle = "#06080f";
      ctx.fillRect(0, 0, w, h);

      // Draw stars
      starsRef.current.forEach((star) => {
        star.x += star.driftX;
        star.y += star.driftY;

        if (star.x < 0) star.x = w;
        if (star.x > w) star.x = 0;
        if (star.y < 0) star.y = h;
        if (star.y > h) star.y = 0;

        ctx.beginPath();
        ctx.fillStyle = "rgba(170,200,255,0.75)";
        ctx.arc(star.x, star.y, 1.3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw ripples
      ripplesRef.current = ripplesRef.current.filter((ripple) => {
        const age = now - ripple.start;
        const radius = age * 0.12 * ripple.strength;
        const alpha = 1 - age / 2200;

        if (alpha <= 0) return false;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(120,255,200,${alpha})`;
        ctx.lineWidth = 2;
        ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Constellation lines
        starsRef.current.forEach((star) => {
          const dx = star.x - ripple.x;
          const dy = star.y - ripple.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < radius && dist > radius - 25) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(120,200,255,${alpha * 0.5})`;
            ctx.moveTo(ripple.x, ripple.y);
            ctx.lineTo(star.x, star.y);
            ctx.stroke();
          }
        });

        return true;
      });

      rafRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      ws.close();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/10 bg-[rgba(10,12,16,0.6)]"
      style={{ borderRadius: 18 }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "520px", display: "block" }}
      />
    </div>
  );
}
