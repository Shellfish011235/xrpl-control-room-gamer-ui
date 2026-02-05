/**
 * Utility functions for the XRPL Control Room
 */

import { type ClassValue, clsx } from 'clsx';

// ==================== CLASS UTILITIES ====================

/**
 * Merge class names with clsx (Tailwind-friendly)
 * Usage: cn('base-class', condition && 'conditional-class', 'another-class')
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

// ==================== NUMBER FORMATTING ====================

/**
 * Format a number as currency
 */
export function formatCurrency(
  value: number,
  currency = 'USD',
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: value >= 1 ? 2 : 4,
    maximumFractionDigits: value >= 1 ? 2 : 6,
  }).format(value);
}

/**
 * Format a large number with abbreviations (K, M, B, T)
 */
export function formatCompact(value: number): string {
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 2,
  });
  return formatter.format(value);
}

/**
 * Format a percentage
 */
export function formatPercent(
  value: number,
  includeSign = true
): string {
  const sign = includeSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

// ==================== STRING UTILITIES ====================

/**
 * Truncate a string (useful for wallet addresses, hashes)
 */
export function truncate(
  str: string,
  startChars = 6,
  endChars = 4
): string {
  if (str.length <= startChars + endChars) return str;
  return `${str.slice(0, startChars)}...${str.slice(-endChars)}`;
}

/**
 * Decode hex string to UTF-8
 */
export function hexToString(hex: string): string {
  try {
    const bytes = new Uint8Array(
      hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    );
    return new TextDecoder().decode(bytes).replace(/\0/g, '');
  } catch {
    return '';
  }
}

// ==================== ASYNC UTILITIES ====================

/**
 * Sleep for a given duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        onRetry?.(attempt, error);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Create a debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Create a throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ==================== VALIDATION ====================

/**
 * Check if a string is a valid XRPL address
 */
export function isValidXRPLAddress(address: string): boolean {
  return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(address);
}

/**
 * Check if a string is a valid IPFS CID
 */
export function isValidIpfsCid(cid: string): boolean {
  // CIDv0: starts with Qm, 46 chars
  // CIDv1: starts with bafy/bafk, variable length
  return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|ba[a-z2-7]{57,})$/i.test(cid);
}

// ==================== DATE/TIME ====================

/**
 * Format a date relative to now (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | number): string {
  const now = Date.now();
  const timestamp = typeof date === 'number' ? date : date.getTime();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

/**
 * Format seconds into MM:SS or HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}
