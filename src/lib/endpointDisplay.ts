/**
 * Heuristic: treat URLs that point at typical private / local hosts as sensitive for UI.
 */
export function isLikelyPrivateOrLocalUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  let u = url.trim()
  try {
    u = u.replace(/^ws:\/\//i, 'http://').replace(/^wss:\/\//i, 'https://')
    const { hostname } = new URL(u)
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true
    if (hostname.startsWith('10.')) return true
    if (hostname.startsWith('192.168.')) return true
    const m = /^172\.(\d+)\./.exec(hostname)
    if (m) {
      const n = parseInt(m[1]!, 10)
      if (n >= 16 && n <= 31) return true
    }
    return false
  } catch {
    return /localhost|127\.0\.0\.1|192\.168\.|10\.\d|172\.(1[6-9]|2\d|3[01])\./i.test(url)
  }
}

/**
 * Remove http(s)/ws(s) and bare IPv4-looking tokens from user-visible error text so
 * settings screens never echo configured endpoints.
 */
export function redactUrlLikeText(s: string | null | undefined): string {
  if (s == null || s === '') return ''
  let t = s
  t = t.replace(/\bhttps?:\/\/[^\s)'"<>]+/gi, '[endpoint]')
  t = t.replace(/\bwss?:\/\/[^\s)'"<>]+/gi, '[endpoint]')
  t = t.replace(
    /\b(?:(?:25[0-5]|2[0-4]\d|1?\d{1,2})\.){3}(?:25[0-5]|2[0-4]\d|1?\d{1,2})(?::\d{1,5})?\b/g,
    '[ip]'
  )
  return t
}
