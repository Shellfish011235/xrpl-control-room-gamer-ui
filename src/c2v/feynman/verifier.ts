/**
 * FEYNMAN ensemble verifier – dual-model coherence check.
 * Reduces LLM self-trust: secondary model re-scores explanation for coherence/hallucination risk.
 * Rule: If primaryScore < 0.7 AND secondaryScore < 0.65 → reject.
 *       If |primaryScore - secondaryScore| > 0.3 → reject (model disagreement).
 *
 * Wire to Hugging Face Inference API, Groq, or local Ollama via VITE_ENSEMBLE_VERIFIER_URL.
 */

export interface VerificationResult {
  passed: boolean;
  reason: string;
  primaryScore: number;
  secondaryScore: number;
  latencyMs?: number;
}

const PRIMARY_LOW_THRESHOLD = 0.7;
const SECONDARY_LOW_THRESHOLD = 0.65;
const DISAGREEMENT_DELTA = 0.3;

/**
 * Call secondary model to rate coherence/hallucination risk (0–1).
 * When VITE_ENSEMBLE_VERIFIER_URL is set, POST { explanation } and expect { score: number }.
 * Otherwise use stub: return 0.85 for plausible-looking explanations, 0.4 for very short/suspicious.
 */
async function getSecondaryScore(explanation: string): Promise<number> {
  const url = typeof import.meta.env.VITE_ENSEMBLE_VERIFIER_URL === 'string'
    ? import.meta.env.VITE_ENSEMBLE_VERIFIER_URL.trim()
    : '';

  if (url) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          explanation,
          prompt: `Rate coherence and hallucination risk of this payment explanation (0-1, 1=coherent and safe): ${explanation.slice(0, 500)}`,
        }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = (await res.json()) as { score?: number };
      const score = typeof data.score === 'number' ? data.score : parseFloat(String(data.score));
      return Number.isFinite(score) ? Math.max(0, Math.min(1, score)) : 0.5;
    } catch (e) {
      console.warn('[FEYNMAN verifier] secondary model failed, using fallback', e);
      return 0.5; // Neutral on failure so we don't block; primary rules still apply
    }
  }

  // Stub: plausible if explanation has reasonable length and structure; flag very short or adversarial-sounding
  const trimmed = explanation.trim().toLowerCase();
  if (trimmed.length < 15) return 0.4;
  const adversarial = /ignore\s+(previous|instructions)|bypass|override|disregard|jailbreak/i.test(explanation);
  if (adversarial) return 0.35;
  if (trimmed.length > 80 && (trimmed.includes('xrp') || trimmed.includes('pay') || trimmed.includes(' to '))) return 0.85;
  return 0.75;
}

/**
 * Verify explanation with primary (e.g. from main LLM or guardrails) and secondary model.
 * Use in proposal pipeline; flagged items get verification.passed = false and show "REVIEW REQUIRED" in UI.
 */
export async function verifyExplanation(
  explanation: string,
  primaryScore: number
): Promise<VerificationResult> {
  const start = Date.now();
  const secondaryScore = await getSecondaryScore(explanation);

  const clampedPrimary = Math.max(0, Math.min(1, primaryScore));
  const clampedSecondary = Math.max(0, Math.min(1, secondaryScore));

  let passed = true;
  let reason = 'Explanation verified';

  if (clampedPrimary < PRIMARY_LOW_THRESHOLD && clampedSecondary < SECONDARY_LOW_THRESHOLD) {
    passed = false;
    reason = 'Incoherent explanation across models — possible hallucination';
  } else if (Math.abs(clampedPrimary - clampedSecondary) > DISAGREEMENT_DELTA) {
    passed = false;
    reason = 'Model disagreement on explanation quality';
  } else if (clampedPrimary < PRIMARY_LOW_THRESHOLD) {
    passed = false;
    reason = 'Primary coherence score too low';
  }

  return {
    passed,
    reason,
    primaryScore: clampedPrimary,
    secondaryScore: clampedSecondary,
    latencyMs: Date.now() - start,
  };
}
