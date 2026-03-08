/**
 * ILP Intelligence — API client for Stage 1 + Stage 2.
 * GET /api/ilp/intel with fallback to mock when API unavailable.
 */

import type { ILPIntelApiResponse, ILPIntelPayload } from './types';
import { MOCK_ILP_INTEL_PAYLOAD } from './mock';

const DEFAULT_INTEL_URL = '/api/ilp/intel';

export interface FetchILPIntelOptions {
  url?: string;
  /** Skip network and return mock immediately */
  mockOnly?: boolean;
}

/**
 * Fetch ILP Intelligence payload. On failure or when mockOnly, returns mock (clearly labeled).
 */
export async function fetchILPIntel(options: FetchILPIntelOptions = {}): Promise<ILPIntelPayload> {
  const { url = DEFAULT_INTEL_URL, mockOnly = false } = options;

  if (mockOnly) {
    return MOCK_ILP_INTEL_PAYLOAD;
  }

  try {
    const res = await fetch(url, { method: 'GET' });
    const data = (await res.json()) as ILPIntelApiResponse;
    if (data.ok && data.payload) {
      return data.payload;
    }
  } catch {
    // Network or parse error: fallback to mock
  }

  return MOCK_ILP_INTEL_PAYLOAD;
}
