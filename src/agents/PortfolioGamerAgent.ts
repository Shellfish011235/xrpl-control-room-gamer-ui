/**
 * PortfolioGamerAgent – Input portfolio/NFT data → sim results + visual params for PortfolioArena.
 * Skills: @xrpl-expert @three-js @cyberpunk-ui @performance-optimizer
 * Predicts win/loss scenarios via simple volatility; outputs Three.js params (neon fighters, storms).
 */

export interface PortfolioAsset {
  symbol: string;
  balance: number;
  valueUsd: number;
  change24h?: number;
}

export interface PortfolioGamerInput {
  assets: PortfolioAsset[];
  nftCount?: number;
  totalValueUsd: number;
}

export interface SimResult {
  winProbability: number;
  lossProbability: number;
  volatilityScore: number;
  suggestion: string;
}

export interface VisualParams {
  /** 0–1 intensity for particle effects */
  particleIntensity: number;
  /** Hue shift for neon (0–360) */
  neonHue: number;
  /** Number of "fighter" entities (derived from NFT count or assets) */
  fighterCount: number;
  /** Storm intensity 0–1 (amendments / risk) */
  stormIntensity: number;
}

export interface PortfolioGamerOutput {
  sim: SimResult;
  visual: VisualParams;
}

function simpleVolatility(assets: PortfolioAsset[]): number {
  if (!assets.length) return 0;
  const changes = assets.map((a) => Math.abs(a.change24h ?? 0));
  return Math.min(1, changes.reduce((s, c) => s + c, 0) / 100);
}

/**
 * Input portfolio data → sim results + visual params for 3D arena.
 */
export function runPortfolioGamerSim(input: PortfolioGamerInput): PortfolioGamerOutput {
  const vol = simpleVolatility(input.assets);
  const winProbability = Math.max(0.2, Math.min(0.8, 0.5 + (input.totalValueUsd > 0 ? 0.1 : 0)));
  const lossProbability = 1 - winProbability;
  const fighterCount = Math.min(12, (input.nftCount ?? 0) + Math.min(6, input.assets.length));

  return {
    sim: {
      winProbability,
      lossProbability,
      volatilityScore: vol,
      suggestion: vol > 0.5 ? 'High volatility — defensive positioning suggested.' : 'Arena ready.',
    },
    visual: {
      particleIntensity: Math.min(1, vol * 1.5),
      neonHue: 180 + vol * 60,
      fighterCount,
      stormIntensity: vol * 0.7,
    },
  };
}
