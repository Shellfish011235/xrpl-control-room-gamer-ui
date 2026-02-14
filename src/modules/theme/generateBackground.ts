/**
 * Zero-cost dashboard background generator.
 * Uses the user's NFT/profile image + extracted palette to produce a blurred,
 * washed, vignetted image with optional noise and star sparkles.
 */

export type Palette = { primary: string; secondary: string; accent: string };

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export async function generateDashboardBackground(
  imageUrl: string,
  palette: Palette,
  opts?: { width?: number; height?: number }
): Promise<string> {
  const width = opts?.width ?? 1920;
  const height = opts?.height ?? 1080;

  const img = await loadImage(imageUrl);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, width, height);

  // 1) Big blurred base
  const scale = Math.max(width / img.width, height / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = (width - dw) / 2;
  const dy = (height - dh) / 2;

  ctx.save();
  ctx.filter = "blur(28px) saturate(1.2) contrast(1.05)";
  ctx.globalAlpha = 0.85;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();

  // 2) Palette wash gradient
  const g = ctx.createLinearGradient(0, 0, width, height);
  g.addColorStop(0.0, hexToRgba(palette.primary, 0.35));
  g.addColorStop(0.5, hexToRgba(palette.secondary, 0.22));
  g.addColorStop(1.0, hexToRgba(palette.accent, 0.28));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  // 3) Soft vignette for readability
  const v = ctx.createRadialGradient(
    width * 0.5,
    height * 0.45,
    0,
    width * 0.5,
    height * 0.45,
    Math.max(width, height) * 0.7
  );
  v.addColorStop(0.0, "rgba(0,0,0,0.10)");
  v.addColorStop(0.6, "rgba(0,0,0,0.35)");
  v.addColorStop(1.0, "rgba(0,0,0,0.62)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, width, height);

  // 4) Subtle grain/noise (cheap texture)
  addNoise(ctx, width, height, 0.045);

  // 5) Faint "constellation" sparkle layer
  addStars(ctx, width, height, 70, 0.12);

  return canvas.toDataURL("image/png");
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function hexToRgba(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${clamp(a, 0, 1)})`;
}

function addNoise(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  amount: number
): void {
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * (amount * 255);
    d[i] = clamp(d[i] + n, 0, 255);
    d[i + 1] = clamp(d[i + 1] + n, 0, 255);
    d[i + 2] = clamp(d[i + 2] + n, 0, 255);
  }
  ctx.putImageData(imgData, 0, 0);
}

function addStars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  count: number,
  alpha: number
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = Math.random() * 1.6 + 0.3;
    ctx.beginPath();
    ctx.fillStyle = "rgba(180,210,255,0.9)";
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
