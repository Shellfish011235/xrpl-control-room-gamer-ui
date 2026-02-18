/**
 * FEYNMAN ensemble voter – 2–3 diverse models, majority vote.
 * Reduces single-LLM dependency and poisoning. Target: <100ms added overhead.
 *
 * Implementation: Stub returns single-voter result; wire to Hugging Face or multi-API
 * (e.g. Llama-3 + OpenAI + local) for real ensemble.
 */

import type { FeynmanExplainOutput, EnsembleVoteResult } from './types';
import { runGuardrails } from './guardrails';

/**
 * Single "model" vote using guardrails as deterministic verifier.
 * In production: call 2–3 different models (HF, API, local), then majority vote.
 */
function voteWithGuardrails(output: FeynmanExplainOutput): { modelId: string; accept: boolean; confidence?: number } {
  const result = runGuardrails(output);
  return {
    modelId: 'guardrails-v1',
    accept: result.pass,
    confidence: result.pass ? 1 : 0,
  };
}

/**
 * Ensemble vote on FEYNMAN explain output.
 * Current: 1 voter (guardrails). Extend with Hugging Face / multi-API for 2–3 models.
 */
export async function ensembleVote(
  output: FeynmanExplainOutput,
  options?: { maxLatencyMs?: number }
): Promise<EnsembleVoteResult> {
  const start = Date.now();
  const maxLatencyMs = options?.maxLatencyMs ?? 100;

  const votes: EnsembleVoteResult['votes'] = [];
  votes.push(voteWithGuardrails(output));

  // TODO: Add 2nd and 3rd model (e.g. Hugging Face inference API, local Llama)
  // const vote2 = await callModel2(output); votes.push(vote2);
  // const vote3 = await callModel3(output); votes.push(vote3);

  const acceptCount = votes.filter((v) => v.accept).length;
  const majorityAccept = acceptCount > votes.length / 2;
  const latencyMs = Date.now() - start;
  if (latencyMs > maxLatencyMs) {
    console.warn(`[FEYNMAN] ensemble vote exceeded ${maxLatencyMs}ms (${latencyMs}ms)`);
  }

  return {
    accept: majorityAccept,
    votes,
    majorityAccept,
    latencyMs,
  };
}
