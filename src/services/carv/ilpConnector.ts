// CARV - Interledger Protocol Connector
// Handles ILP STREAM payments for cross-network transfers

import { SignedPIE, RouteResult, CARVEvent, CARVEventHandler } from './types';

// ==================== TYPES ====================

export interface ILPConfig {
  mode: 'test' | 'live';
  connectorUrl?: string; // ILP connector endpoint
  accountId?: string;
  sharedSecret?: string;
}

export interface ILPPaymentPointer {
  host: string;
  path: string;
  fullPointer: string; // $wallet.example.com/alice
}

export interface ILPQuote {
  sourceAmount: string;
  destinationAmount: string;
  sourceAsset: { code: string; scale: number };
  destinationAsset: { code: string; scale: number };
  expiresAt: string;
}

export interface ILPStreamReceipt {
  streamId: string;
  totalSent: string;
  totalDelivered: string;
  packets: number;
  duration: number;
}

export interface OpenPaymentsGrant {
  access_token: string;
  grant_id: string;
  expires_in: number;
  manage: string;
}

// ==================== ILP CONNECTOR CLASS ====================

export class ILPConnector {
  private config: ILPConfig;
  private eventHandlers: Set<CARVEventHandler> = new Set();
  private streamConnections: Map<string, any> = new Map();

  constructor(config: ILPConfig = { mode: 'test' }) {
    this.config = config;
  }

  // ==================== PAYMENT POINTER RESOLUTION ====================

  /**
   * Parse a payment pointer ($wallet.example.com/user)
   */
  parsePaymentPointer(pointer: string): ILPPaymentPointer {
    // Remove leading $ if present
    const cleaned = pointer.startsWith('$') ? pointer.slice(1) : pointer;
    
    // Split host and path
    const [host, ...pathParts] = cleaned.split('/');
    const path = '/' + pathParts.join('/');

    return {
      host,
      path: path || '/',
      fullPointer: '$' + cleaned,
    };
  }

  /**
   * Resolve payment pointer to SPSP endpoint
   */
  async resolvePaymentPointer(pointer: string): Promise<{
    destinationAccount: string;
    sharedSecret: string;
  } | null> {
    const parsed = this.parsePaymentPointer(pointer);
    
    // SPSP endpoint URL
    const spspUrl = `https://${parsed.host}${parsed.path}`;

    try {
      const response = await fetch(spspUrl, {
        headers: {
          'Accept': 'application/spsp4+json',
        },
      });

      if (!response.ok) {
        throw new Error(`SPSP resolution failed: ${response.status}`);
      }

      const data = await response.json();

      return {
        destinationAccount: data.destination_account,
        sharedSecret: data.shared_secret,
      };
    } catch (error) {
      console.error('[ILP] SPSP resolution error:', error);
      
      // In test mode, return mock data
      if (this.config.mode === 'test') {
        return {
          destinationAccount: `test.mock.${parsed.host}.${Date.now()}`,
          sharedSecret: Buffer.from('test-secret-' + Date.now()).toString('base64'),
        };
      }
      
      return null;
    }
  }

  // ==================== QUOTING ====================

  /**
   * Get quote for ILP payment
   */
  async getQuote(
    sourceAmount: string,
    sourceAsset: string,
    destinationPointer: string
  ): Promise<ILPQuote | null> {
    // In production, this would query the ILP connector for a real quote
    // For now, simulate a quote with realistic exchange rate

    const parsed = this.parsePaymentPointer(destinationPointer);
    
    // Simulate exchange rate (XRP -> USD as example)
    const rates: Record<string, number> = {
      'XRP-USD': 0.52,
      'USD-XRP': 1.92,
      'XRP-EUR': 0.48,
      'EUR-XRP': 2.08,
      'XRP-XRP': 1.0,
      'USD-USD': 1.0,
    };

    const destAsset = this.guessDestinationAsset(parsed.host);
    const rateKey = `${sourceAsset}-${destAsset}`;
    const rate = rates[rateKey] || 1.0;

    const sourceNum = parseFloat(sourceAmount);
    const destNum = sourceNum * rate * 0.998; // 0.2% fee

    return {
      sourceAmount: sourceAmount,
      destinationAmount: destNum.toFixed(6),
      sourceAsset: { code: sourceAsset, scale: 6 },
      destinationAsset: { code: destAsset, scale: 6 },
      expiresAt: new Date(Date.now() + 60000).toISOString(), // 1 minute
    };
  }

  // ==================== STREAM PAYMENTS ====================

  /**
   * Send STREAM payment
   */
  async sendStream(
    destinationPointer: string,
    amount: string,
    asset: string
  ): Promise<ILPStreamReceipt | null> {
    const startTime = Date.now();
    
    console.log(`[ILP] Starting STREAM to ${destinationPointer} for ${amount} ${asset}`);

    // Resolve payment pointer
    const spspInfo = await this.resolvePaymentPointer(destinationPointer);
    if (!spspInfo) {
      throw new Error('Could not resolve payment pointer');
    }

    // Get quote
    const quote = await this.getQuote(amount, asset, destinationPointer);
    if (!quote) {
      throw new Error('Could not get quote');
    }

    // In production, this would:
    // 1. Open ILP STREAM connection
    // 2. Send packets until amount is fulfilled
    // 3. Handle packet acknowledgments
    // 4. Close stream

    // Simulate STREAM payment
    const streamId = `stream_${Date.now().toString(36)}`;
    
    // Simulate packet sending
    const sourceNum = parseFloat(amount);
    let totalSent = 0;
    let totalDelivered = 0;
    let packets = 0;

    // Simulate chunked delivery
    const chunkSize = Math.max(sourceNum / 10, 0.001);
    
    while (totalSent < sourceNum) {
      const chunk = Math.min(chunkSize, sourceNum - totalSent);
      totalSent += chunk;
      totalDelivered += chunk * 0.998; // Simulated rate with fees
      packets++;
      
      // Simulate network latency
      await this.delay(50 + Math.random() * 100);
    }

    const duration = Date.now() - startTime;

    const receipt: ILPStreamReceipt = {
      streamId,
      totalSent: totalSent.toFixed(6),
      totalDelivered: totalDelivered.toFixed(6),
      packets,
      duration,
    };

    console.log(`[ILP] STREAM complete: ${packets} packets in ${duration}ms`);

    return receipt;
  }

  // ==================== OPEN PAYMENTS (Web Monetization) ====================

  /**
   * Create incoming payment (receiver side)
   */
  async createIncomingPayment(
    walletAddress: string,
    amount?: { value: string; assetCode: string; assetScale: number }
  ): Promise<{ id: string; incomingAmount?: any; receivedAmount: any; completed: boolean } | null> {
    // Open Payments API endpoint
    const parsed = this.parsePaymentPointer(walletAddress);
    
    // In production, this would:
    // 1. Get wallet address metadata
    // 2. Create incoming payment at the resource server
    
    // Simulate incoming payment creation
    return {
      id: `incoming_${Date.now().toString(36)}`,
      incomingAmount: amount,
      receivedAmount: { value: '0', assetCode: amount?.assetCode || 'XRP', assetScale: 9 },
      completed: false,
    };
  }

  /**
   * Create outgoing payment grant request
   */
  async requestOutgoingPaymentGrant(
    clientWalletAddress: string,
    receiverWalletAddress: string,
    amount: { value: string; assetCode: string }
  ): Promise<OpenPaymentsGrant | null> {
    // In production, this would:
    // 1. Discover authorization server from receiver's wallet
    // 2. Request grant for outgoing payment
    // 3. Handle user interaction if needed
    // 4. Return access token

    // Simulate grant
    return {
      access_token: `token_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`,
      grant_id: `grant_${Date.now().toString(36)}`,
      expires_in: 3600,
      manage: `https://${this.parsePaymentPointer(receiverWalletAddress).host}/grants`,
    };
  }

  // ==================== PIE EXECUTION ====================

  /**
   * Execute payment from PIE via ILP
   */
  async executeFromPIE(signedPie: SignedPIE): Promise<RouteResult> {
    const pie = signedPie.pie;
    const amount = pie.amount;
    const asset = pie.asset;

    // Determine if payee is a payment pointer
    const isPaymentPointer = pie.payee.startsWith('$') || pie.payee.includes('.');
    
    try {
      if (isPaymentPointer) {
        // Use STREAM protocol
        const receipt = await this.sendStream(pie.payee, amount, asset);
        
        if (!receipt) {
          return {
            success: false,
            venue: 'ilp',
            error: 'STREAM payment failed',
          };
        }

        return {
          success: true,
          venue: 'ilp',
          tx_hash: receipt.streamId,
          fee_paid: (parseFloat(receipt.totalSent) - parseFloat(receipt.totalDelivered)).toFixed(6),
          fill_percent: (parseFloat(receipt.totalDelivered) / parseFloat(amount)) * 100,
          settlement_time: new Date().toISOString(),
        };
      } else {
        // Assume it's an ILP address, send direct
        // This would use ILP SEND for direct connector routing
        
        console.log(`[ILP] Direct send to ${pie.payee}`);
        
        // Simulate direct send
        await this.delay(1000 + Math.random() * 500);

        return {
          success: true,
          venue: 'ilp',
          tx_hash: `ilp_direct_${Date.now().toString(36)}`,
          fee_paid: (parseFloat(amount) * 0.002).toFixed(6),
          fill_percent: 100,
          settlement_time: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        success: false,
        venue: 'ilp',
        error: error instanceof Error ? error.message : 'ILP error',
      };
    }
  }

  // ==================== UTILITIES ====================

  private guessDestinationAsset(host: string): string {
    // Guess asset from host domain
    if (host.includes('usd') || host.endsWith('.us')) return 'USD';
    if (host.includes('eur') || host.endsWith('.eu')) return 'EUR';
    if (host.includes('xrp') || host.includes('ripple')) return 'XRP';
    return 'USD'; // Default
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== CONFIGURATION ====================

  getConfig(): ILPConfig {
    return { ...this.config };
  }

  setMode(mode: 'test' | 'live'): void {
    this.config.mode = mode;
  }

  // ==================== EVENTS ====================

  subscribe(handler: CARVEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  private emitEvent(event: CARVEvent): void {
    this.eventHandlers.forEach(handler => handler(event));
  }
}

// ==================== SINGLETON ====================

let ilpConnector: ILPConnector | null = null;

export function getILPConnector(config?: ILPConfig): ILPConnector {
  if (!ilpConnector) {
    ilpConnector = new ILPConnector(config);
  }
  return ilpConnector;
}

export function resetILPConnector(): void {
  ilpConnector = null;
}

export default ILPConnector;
