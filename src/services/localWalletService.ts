/**
 * Control Room: no custody. No seed generation, no import, no in-app signing.
 * "Connect Wallet" only (Xaman / watch-only address). See compliance: docs.
 */

export interface LocalWalletResult {
  address: string;
}

/**
 * No-op: wallet creation removed for compliance. Use "Connect Wallet" (Xaman or watch-only).
 */
export function getAddress(): string | null {
  return null;
}

/**
 * Always false. No in-app wallet; connect via Xaman or add watch-only address.
 */
export function hasSessionWallet(): boolean {
  return false;
}

/**
 * No-op. No session wallet to clear.
 */
export function clear(): void {}
