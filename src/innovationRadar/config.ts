/**
 * Configurable RSS URLs and poll interval.
 * Use env VITE_RSS_FEEDS (JSON array of URLs) or default list.
 */

const DEFAULT_FEEDS: { url: string; label: string }[] = [
  { url: 'https://xrpl.org/blog/feed.xml', label: 'XRPL.org Blog' },
  { url: 'https://ripple.com/insights/feed/', label: 'Ripple Insights' },
  { url: 'https://xrplcommons.org/feed/', label: 'XRPL Commons' },
  { url: 'https://dev.to/feed/tag/xrpl', label: 'DEV Community (XRPL)' },
];

function getEnvFeeds(): { url: string; label: string }[] {
  try {
    const env = typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env as Record<string, string>).VITE_RSS_FEEDS;
    if (typeof env === 'string' && env) {
      const parsed = JSON.parse(env) as string[] | { url: string; label: string }[];
      if (Array.isArray(parsed)) {
        return parsed.map((e) => (typeof e === 'string' ? { url: e, label: new URL(e).hostname } : e));
      }
    }
  } catch {
    // ignore
  }
  return [];
}

export function getRssFeeds(): { url: string; label: string }[] {
  const env = getEnvFeeds();
  return env.length > 0 ? env : DEFAULT_FEEDS;
}

/** Optional CORS proxy: set VITE_RSS_PROXY e.g. "https://api.allorigins.win/raw?url=" */
export function getRssProxy(): string {
  try {
    const env = typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env as Record<string, string>).VITE_RSS_PROXY;
    return typeof env === 'string' ? env : '';
  } catch {
    return '';
  }
}

/** Poll interval in ms (5–15 min). Env VITE_RADAR_POLL_MS or default 10 min */
export function getPollIntervalMs(): number {
  try {
    const env = typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env as Record<string, string>).VITE_RADAR_POLL_MS;
    if (typeof env === 'string') {
      const n = parseInt(env, 10);
      if (Number.isFinite(n) && n >= 300_000 && n <= 900_000) return n;
    }
  } catch {
    // ignore
  }
  return 10 * 60 * 1000; // 10 min
}
