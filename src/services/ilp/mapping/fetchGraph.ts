/**
 * ILP Mapping — Client fetch for graph API
 * GET /api/ilp/graph with fallback to mock when API unavailable (e.g. local dev).
 */

import type { ILPGraphApiResponse, ILPGraphPayload } from './graphPayload';
import { buildMockGraphPayload } from './mockGraphData';

const DEFAULT_GRAPH_URL = '/api/ilp/graph';

export interface FetchILPGraphOptions {
  /** Base URL for API (default /api/ilp/graph) */
  url?: string;
  /** Use cache (add ?cache=yes); default true */
  cache?: boolean;
  /** If true, skip network and return mock immediately */
  mockOnly?: boolean;
}

/**
 * Fetch ILP graph from API. On failure, returns mock payload so UI always has data.
 */
export async function fetchILPGraph(
  options: FetchILPGraphOptions = {}
): Promise<ILPGraphPayload> {
  const { url = DEFAULT_GRAPH_URL, cache = true, mockOnly = false } = options;

  if (mockOnly) {
    return buildMockGraphPayload();
  }

  try {
    const qs = cache ? '' : '?cache=no';
    const res = await fetch(`${url}${qs}`, { method: 'GET' });
    const data = (await res.json()) as ILPGraphApiResponse;
    if (data.ok && data.payload) {
      return data.payload;
    }
  } catch {
    // Network or parse error: fallback to mock
  }

  return buildMockGraphPayload();
}
