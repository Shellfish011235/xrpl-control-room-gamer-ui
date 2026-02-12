// Mock rule-based agents driven by XP/achievements (Phase 1)
// Maps profile (level, xp, skillPoints) to strategy and risk limits for paper trading.

export type ProfileStrategy = 'conservative' | 'moderate' | 'aggressive';

export interface ProfileAgentConfig {
  level: number;
  xp: number;
  skillPoints: number;
  /** Optional: achievement IDs unlocked (e.g. 'first_trade', 'win_streak_5') */
  achievements?: string[];
}

export interface AgentStrategyFromProfile {
  strategy: ProfileStrategy;
  maxTradePercent: number;
  minConfidence: number;
  allowAutoTrade: boolean;
  reason: string;
}

/**
 * Map profile to agent behavior. Higher level/XP = more aggressive options.
 * Achievements can unlock moderate/aggressive or increase size.
 */
export function getAgentStrategyFromProfile(config: ProfileAgentConfig): AgentStrategyFromProfile {
  const { level, xp, skillPoints, achievements = [] } = config;

  // Level 1–4: conservative only
  if (level < 5) {
    return {
      strategy: 'conservative',
      maxTradePercent: 5,
      minConfidence: 75,
      allowAutoTrade: true,
      reason: `Level ${level}: Conservative mode. Level up to unlock moderate strategy.`,
    };
  }

  // Level 5–9: moderate unlocked
  if (level < 10) {
    return {
      strategy: 'moderate',
      maxTradePercent: 8,
      minConfidence: 70,
      allowAutoTrade: true,
      reason: `Level ${level}: Moderate strategy. Level 10+ unlocks aggressive.`,
    };
  }

  // Level 10+: aggressive available; skillPoints can push size
  const hasHighXP = xp >= 10000;
  const maxTradePercent = hasHighXP ? 12 : 10;
  return {
    strategy: 'aggressive',
    maxTradePercent: achievements.includes('win_streak_5') ? Math.min(15, maxTradePercent + 3) : maxTradePercent,
    minConfidence: 65,
    allowAutoTrade: true,
    reason: `Level ${level}: Aggressive strategy${achievements.includes('win_streak_5') ? ' (win streak bonus)' : ''}.`,
  };
}
