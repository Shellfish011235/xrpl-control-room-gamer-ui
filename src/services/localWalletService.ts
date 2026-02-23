/**
 * In-app (Control Room) wallet – session-only, no persisted seed.
 * Use for generate/import and local signing; seed lives in memory only, lost on refresh.
 * See docs/WALLET-BUILD-OUT-ROADMAP.md and docs/XRPL-WALLET-SECURITY-AND-REPOS.md.
 */

import { Wallet } from 'xrpl';
import { getAccountInfo, getServerInfo, submitSignedTx } from './xrplService';

let sessionWallet: Wallet | null = null;

export interface LocalWalletResult {
  address: string;
  /** Present only after generate(); user must backup. Lost on refresh. */
  seed?: string;
}

/**
 * Generate a new wallet. Seed is shown once; stored in memory only.
 */
export function generate(): LocalWalletResult {
  const wallet = Wallet.generate();
  sessionWallet = wallet;
  const seed = wallet.seed;
  return {
    address: wallet.classicAddress,
    seed: seed ?? undefined,
  };
}

/**
 * Import from secret (seed). Kept in memory only; never persisted.
 */
export function importFromSeed(seed: string): LocalWalletResult {
  const wallet = Wallet.fromSeed(seed.trim());
  sessionWallet = wallet;
  return { address: wallet.classicAddress };
}

/**
 * Current in-app wallet address, or null if none.
 */
export function getAddress(): string | null {
  return sessionWallet?.classicAddress ?? null;
}

/**
 * Whether a Control Room wallet is active this session.
 */
export function hasSessionWallet(): boolean {
  return sessionWallet != null;
}

/**
 * Clear the session wallet (e.g. Lock). Seed is discarded.
 */
export function clear(): void {
  sessionWallet = null;
}

/**
 * Sign a transaction and submit to the ledger. Tx must have Account set.
 * Fills Fee, Sequence, LastLedgerSequence using ledger.
 */
export async function signAndSubmit(tx: Record<string, unknown>): Promise<{ hash: string }> {
  if (!sessionWallet) throw new Error('No Control Room wallet in session. Create or import one first.');
  const account = tx.Account as string;
  if (!account) throw new Error('Transaction missing Account');

  const [accountInfo, serverInfo] = await Promise.all([
    getAccountInfo(account),
    getServerInfo(),
  ]);

  const prepared = {
    ...tx,
    Fee: tx.Fee ?? '12',
    Sequence: tx.Sequence ?? accountInfo.sequence,
    LastLedgerSequence: (tx.LastLedgerSequence as number) ?? serverInfo.ledgerIndex + 75,
  };

  const signed = sessionWallet.sign(prepared as any);
  const { hash } = await submitSignedTx(signed.tx_blob);
  return { hash };
}

/**
 * Sign a transaction and return the signed blob (caller submits).
 */
export async function signOnly(tx: Record<string, unknown>): Promise<{ hash: string; tx_blob: string }> {
  if (!sessionWallet) throw new Error('No Control Room wallet in session.');
  const account = tx.Account as string;
  if (!account) throw new Error('Transaction missing Account');
  if (account !== sessionWallet.classicAddress) {
    throw new Error('Transaction Account does not match session wallet. Refusing to sign.');
  }
  const txType = tx.TransactionType as string;
  if (!txType || typeof txType !== 'string') {
    throw new Error('Transaction missing TransactionType. Refusing to sign.');
  }

  const [accountInfo, serverInfo] = await Promise.all([
    getAccountInfo(account),
    getServerInfo(),
  ]);

  const prepared = {
    ...tx,
    Fee: tx.Fee ?? '12',
    Sequence: tx.Sequence ?? accountInfo.sequence,
    LastLedgerSequence: (tx.LastLedgerSequence as number) ?? serverInfo.ledgerIndex + 75,
  };

  return sessionWallet.sign(prepared as any);
}
