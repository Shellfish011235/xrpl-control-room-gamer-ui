/**
 * Wraps React.lazy() to retry dynamic imports on failure and show a fallback
 * when the chunk fails to load (e.g. after a new Vercel deploy — old chunk URL is 404).
 */

import { lazy } from 'react'

const CHUNK_LOAD_ERROR = 'Loading chunk'
const RETRIES = 1

function ChunkLoadFallback() {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center"
      style={{ background: '#050810', color: '#e0e7ff' }}
    >
      <p className="text-cyber-muted max-w-md text-sm">
        This page failed to load — often after a site update. Refreshing loads the latest version.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-lg border border-cyber-cyan/50 bg-cyber-cyan/10 px-4 py-2 text-sm font-medium text-cyber-cyan hover:bg-cyber-cyan/20"
      >
        Refresh page
      </button>
    </div>
  )
}

/**
 * Lazy-load a module with retry. On chunk load failure (e.g. 404 after deploy),
 * retries once then shows a "Refresh page" fallback instead of crashing.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  retriesLeft: number = RETRIES
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await importFn()
    } catch (err) {
      const isChunkError =
        err instanceof Error &&
        (err.message.includes(CHUNK_LOAD_ERROR) ||
          err.message.includes('Failed to fetch') ||
          err.message.includes('Importing a module script failed') ||
          (err as Error & { name?: string }).name === 'ChunkLoadError')
      if (isChunkError && retriesLeft > 0) {
        await new Promise((r) => setTimeout(r, 500))
        return importFn()
      }
      return {
        default: ChunkLoadFallback as unknown as T,
      }
    }
  })
}
