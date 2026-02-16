/**
 * Modular skills system (OpenClaw-style).
 * Each skill: name, description, tools, prompt. Agents/orchestrator load these.
 */

import { xrplPathOptimizerSkill } from './xrpl-path-optimizer.skill';
import { nftRaiderSkill } from './nft-raider.skill';
import { bridgeQuerySkill } from './bridge-query.skill';

export { xrplPathOptimizerSkill } from './xrpl-path-optimizer.skill';
export { nftRaiderSkill } from './nft-raider.skill';
export { bridgeQuerySkill } from './bridge-query.skill';

export const ALL_SKILLS = [xrplPathOptimizerSkill, nftRaiderSkill, bridgeQuerySkill];