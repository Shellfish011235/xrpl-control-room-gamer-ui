/**
 * Xaman payment initiation helper (corrected reference implementation).
 * Uses the project's xumm package and xrplService (no direct xrpl import — avoids Vite resolution issues).
 *
 * - Opens sign URL in new tab via browserSignUrl (https://xumm.app/sign/{uuid}).
 * - getCurrentLedger uses xrplService.getServerInfo() (HTTP JSON-RPC).
 */

import { xamanService } from './xamanService';
import { getServerInfo } from '../xrplService';

export interface AgentContext {
  updateUI: (message: string) => void;
}

/**
 * Get current validated ledger index (for LastLedgerSequence). Uses project xrplService (no xrpl package).
 */
export async function getCurrentLedger(_network: 'mainnet' | 'testnet' = 'mainnet'): Promise<number> {
  const info = await getServerInfo();
  return info.ledgerIndex;
}

/**
 * Initiate a payment: create Xaman payload, open sign URL, subscribe for status, submit when signed.
 * Uses existing xamanService (must be initialized with API key). For UI integration, pass agentContext.updateUI.
 */
export async function initiatePayment(
  sender: string,
  destination: string,
  amountXRP: number,
  agentContext: AgentContext,
  options: { network?: 'mainnet' | 'testnet'; timeoutMs?: number } = {}
): Promise<{ txHash?: string; status: 'signed' | 'rejected' | 'expired' | 'error' }> {
  const { network = 'mainnet', timeoutMs = 60_000 } = options;

  try {
    // Ensure Xaman session has sender
    await xamanService.connect(sender);

    agentContext.updateUI('Creating sign request...');

    const signingRequest = await xamanService.requestPaymentSignature(
      { destination, amount: amountXRP, currency: 'XRP' },
      sender
    );

    // Open sign page in new tab (desktop-safe)
    const signUrl = signingRequest.browserSignUrl ?? `https://xumm.app/sign/${signingRequest.id}`;
    window.open(signUrl, '_blank', 'noopener,noreferrer');

    agentContext.updateUI('Awaiting approval in Xaman... Open the tab or scan the QR to sign.');

    return new Promise((resolve) => {
      const onSigned = () => {
        cleanup();
        const txHash = signingRequest.txHash;
        if (txHash) {
          agentContext.updateUI(`Payment sent! Tx: ${txHash}`);
          resolve({ txHash, status: 'signed' });
        } else {
          resolve({ status: 'signed' });
        }
      };
      const onRejected = () => {
        cleanup();
        agentContext.updateUI('Transaction rejected in Xaman.');
        resolve({ status: 'rejected' });
      };
      const onExpired = () => {
        cleanup();
        agentContext.updateUI('Sign request expired. You can try again.');
        resolve({ status: 'expired' });
      };

      const cleanup = () => {
        xamanService.off('signingSigned', onSigned);
        xamanService.off('signingRejected', onRejected);
        xamanService.off('signingExpired', onExpired);
      };

      xamanService.on('signingSigned', onSigned);
      xamanService.on('signingRejected', onRejected);
      xamanService.on('signingExpired', onExpired);

      setTimeout(() => {
        cleanup();
        agentContext.updateUI('Timeout — check Xaman app & retry if needed.');
        resolve({ status: 'expired' });
      }, timeoutMs);
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    agentContext.updateUI(`Failed: ${msg}. Check API key and allowed origins at apps.xumm.dev.`);
    return { status: 'error' };
  }
}
