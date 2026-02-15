/**
 * RSS poller: fetches configurable feeds every 5–15 min, emits events compatible with event store.
 * Uses fetch + DOMParser (no rss-parser dependency).
 */

import type { RadarFeedItem } from './types';
import { getRssFeeds, getRssProxy, getPollIntervalMs } from './config';
import { keywordRelevance, signalFromHeadline } from './signals';
import { publishRadarEvent } from './events';
import { pushRadarEvent } from './eventStore';

/** Parse RSS/Atom XML into items with title, link, description, publishedAt */
function parseFeedXml(xml: string, feedUrl: string): Array<{ title: string; link?: string; guid?: string; pubDate?: string; content?: string; contentSnippet?: string }> {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const items: Array<{ title: string; link?: string; guid?: string; pubDate?: string; content?: string; contentSnippet?: string }> = [];

  // RSS 2.0: <item>
  const rssItems = doc.querySelectorAll('item');
  if (rssItems.length > 0) {
    rssItems.forEach((el) => {
      const title = el.querySelector('title')?.textContent?.trim() ?? '';
      const link = el.querySelector('link')?.textContent?.trim() || undefined;
      const guid = el.querySelector('guid')?.textContent?.trim() || undefined;
      const pubDate = el.querySelector('pubDate')?.textContent?.trim() || undefined;
      const desc = el.querySelector('description')?.textContent?.trim() ?? '';
      items.push({ title, link, guid, pubDate, content: desc, contentSnippet: desc.slice(0, 500) });
    });
    return items;
  }

  // Atom: <entry>
  const entries = doc.querySelectorAll('entry');
  entries.forEach((el) => {
    const title = el.querySelector('title')?.textContent?.trim() ?? '';
    const linkEl = el.querySelector('link');
    const link = linkEl?.getAttribute('href')?.trim() || linkEl?.textContent?.trim() || undefined;
    const id = el.querySelector('id')?.textContent?.trim() || undefined;
    const updated = el.querySelector('updated')?.textContent?.trim() || el.querySelector('published')?.textContent?.trim();
    const summary = el.querySelector('summary')?.textContent?.trim() ?? el.querySelector('content')?.textContent?.trim() ?? '';
    items.push({
      title,
      link,
      guid: id,
      pubDate: updated,
      content: summary,
      contentSnippet: summary.slice(0, 500),
    });
  });

  return items;
}

function toFeedItem(
  entry: { title: string; link?: string; guid?: string; pubDate?: string; content?: string; contentSnippet?: string },
  sourceLabel: string,
  feedUrl: string
): RadarFeedItem {
  const title = entry.title ?? '';
  const link = entry.link ?? entry.guid;
  const pubDate = entry.pubDate ? new Date(entry.pubDate).getTime() : Date.now();
  const id = entry.guid ?? entry.link ?? `${feedUrl}_${title}_${pubDate}`;
  const text = [title, entry.contentSnippet ?? entry.content ?? ''].join(' ');
  return {
    id: String(id).slice(0, 256),
    source: 'rss',
    sourceLabel,
    title,
    link,
    description: entry.contentSnippet ?? entry.content?.slice(0, 500),
    publishedAt: pubDate,
    raw: entry as unknown as Record<string, unknown>,
  };
}

async function fetchFeedUrl(url: string, proxy: string): Promise<string> {
  const target = proxy ? `${proxy}${encodeURIComponent(url)}` : url;
  const res = await fetch(target, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export class RSSPoller {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastCounts: number[] = [];
  private readonly pollIntervalMs: number;

  constructor() {
    this.pollIntervalMs = getPollIntervalMs();
  }

  start(): void {
    if (this.intervalId) return;
    this.tick();
    this.intervalId = setInterval(() => this.tick(), this.pollIntervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async tick(): Promise<void> {
    const feeds = getRssFeeds();
    const proxy = getRssProxy();
    let totalNew = 0;

    for (const { url, label } of feeds) {
      try {
        const xml = await fetchFeedUrl(url, proxy);
        const entries = parseFeedXml(xml, url).slice(0, 15);

        for (const entry of entries) {
          const item = toFeedItem(entry, label, url);
          const text = [item.title, item.description ?? ''].join(' ');
          const { score, matched } = keywordRelevance(text);
          const relevanceScore = Math.min(1, score + 0.2);

          const added = pushRadarEvent({ type: 'RADAR_HEADLINE', item, relevanceScore });
          if (added) {
            totalNew++;
            publishRadarEvent({ type: 'RADAR_HEADLINE', item, relevanceScore });
            const signal = signalFromHeadline(item, relevanceScore, matched);
            if (matched.length > 0) {
              pushRadarEvent({ type: 'RADAR_TREND', signal });
              publishRadarEvent({ type: 'RADAR_TREND', signal });
            }
          }
        }
      } catch (e) {
        console.warn(`[InnovationRadar] feed ${label} failed:`, e);
      }
    }

    this.lastCounts.push(totalNew);
    if (this.lastCounts.length > 20) this.lastCounts.shift();
    publishRadarEvent({ type: 'RADAR_TICK', feedsPolled: feeds.length, newItems: totalNew });
  }
}
