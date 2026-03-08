/**
 * Hidden analytics — API client. GET /api/analytics/hidden
 * Falls back to mock when API unavailable. TODO: Wire to real analytics backend.
 */

import type { HiddenAnalyticsPayload, HiddenAnalyticsApiResponse } from './types';
import { MOCK_HIDDEN_ANALYTICS_PAYLOAD } from './mock';

const DEFAULT_URL = '/api/analytics/hidden';

export interface FetchHiddenAnalyticsOptions {
  url?: string;
  mockOnly?: boolean;
}

export async function fetchHiddenAnalytics(
  options: FetchHiddenAnalyticsOptions = {}
): Promise<HiddenAnalyticsPayload> {
  const { url = DEFAULT_URL, mockOnly = false } = options;

  if (mockOnly) {
    return MOCK_HIDDEN_ANALYTICS_PAYLOAD;
  }

  try {
    const res = await fetch(url, { method: 'GET' });
    const data = (await res.json()) as HiddenAnalyticsApiResponse;
    if (data.ok && data.payload) {
      return data.payload;
    }
  } catch {
    // Fallback to mock
  }

  return MOCK_HIDDEN_ANALYTICS_PAYLOAD;
}
