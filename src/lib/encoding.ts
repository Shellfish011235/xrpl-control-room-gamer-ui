/**
 * Browser-safe encoding helpers (no Node.js Buffer dependency).
 * Use these instead of Buffer in code that runs in the browser (Vite SPA).
 */

/**
 * Encode a UTF-8 string to hex. Safe for XRPL MemoData and other hex fields.
 */
export function stringToHex(str: string, uppercase = false): string {
  const hex = Array.from(new TextEncoder().encode(str))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return uppercase ? hex.toUpperCase() : hex;
}

/**
 * Encode a string to base64 (ASCII/latin1). For UTF-8 use encodeURIComponent + btoa pattern if needed.
 */
export function stringToBase64(str: string): string {
  return btoa(str);
}
