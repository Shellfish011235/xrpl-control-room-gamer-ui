/**
 * Validate URLs before persisting to localStorage or using in fetch/WebSocket.
 * Reduces SSRF-style abuse from crafted query params or pasted values (browser context).
 */

const MAX_URL_LEN = 2048

function allowPrivateHosts(): boolean {
  return typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV)
}

/** RFC1918 / common non-public host hints (hostname only, lowercase). */
function isBlockedHostname(host: string): boolean {
  if (allowPrivateHosts()) return false
  const h = host.toLowerCase()
  if (h === 'localhost' || h.endsWith('.localhost')) return true
  if (h === '0.0.0.0') return true
  const ipv4 = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (ipv4) {
    const [, a, b] = ipv4.map(Number)
    if (a === 10) return true
    if (a === 127) return true
    if (a === 0) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a >= 224) return true
  }
  if (h.includes(':') && !h.includes('.')) {
    if (h === '[::1]' || h.startsWith('fc') || h.startsWith('fd')) return true
  }
  return false
}

export type UrlValidationResult = { ok: true; normalized: string } | { ok: false; reason: string }

function parseUrl(raw: string): URL | null {
  const t = raw.trim()
  if (!t || t.length > MAX_URL_LEN) return null
  try {
    if (t.startsWith('/')) {
      if (typeof window !== 'undefined') {
        return new URL(t, window.location.origin)
      }
      return new URL(`https://placeholder.invalid${t.startsWith('/') ? t : `/${t}`}`)
    }
    return new URL(t)
  } catch {
    return null
  }
}

/** HTTP/HTTPS snapshot URL or same-origin path starting with /. */
export function validateIlpHttpSnapshotInput(raw: string): UrlValidationResult {
  const t = raw.trim()
  if (!t) return { ok: false, reason: 'Empty URL' }
  if (t.length > MAX_URL_LEN) return { ok: false, reason: 'URL too long' }

  if (t.startsWith('/')) {
    if (!/^\/[\w\-./?#&=%+~:@!$'()*,;[\]]*$/i.test(t)) {
      return { ok: false, reason: 'Path contains invalid characters' }
    }
    return { ok: true, normalized: t }
  }

  const u = parseUrl(t)
  if (!u) return { ok: false, reason: 'Invalid URL' }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return { ok: false, reason: 'Only http(s) or same-origin paths allowed' }
  }
  if (import.meta.env.PROD && u.protocol === 'http:') {
    return { ok: false, reason: 'Use https:// for remote snapshot URLs in production' }
  }
  if (isBlockedHostname(u.hostname)) {
    return { ok: false, reason: 'Private/local hosts are not allowed for stored ILP snapshot URLs' }
  }
  return { ok: true, normalized: u.toString() }
}

/** WebSocket URL for ILP operator feed. */
export function validateIlpWebSocketInput(raw: string): UrlValidationResult {
  const t = raw.trim()
  if (!t) return { ok: false, reason: 'Empty URL' }
  if (t.length > MAX_URL_LEN) return { ok: false, reason: 'URL too long' }

  const u = parseUrl(t)
  if (!u) return { ok: false, reason: 'Invalid URL' }
  if (u.protocol !== 'ws:' && u.protocol !== 'wss:') {
    return { ok: false, reason: 'WebSocket URL must start with ws:// or wss://' }
  }
  if (import.meta.env.PROD && u.protocol !== 'wss:') {
    return { ok: false, reason: 'Only wss:// allowed in production builds' }
  }
  if (isBlockedHostname(u.hostname)) {
    return { ok: false, reason: 'Private/local hosts are not allowed for stored WebSocket URLs' }
  }
  return { ok: true, normalized: u.toString() }
}
