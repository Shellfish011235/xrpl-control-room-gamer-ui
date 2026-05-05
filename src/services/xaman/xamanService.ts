// Xaman (XUMM) SDK Integration - Browser Version
// Uses the official 'xumm' package which works directly in browsers
// No backend required! Only needs API Key (not the secret)
//
// HOW IT WORKS:
// 1. Initialize Xumm SDK with just your API Key
// 2. Call xumm.payload.create() to create signing requests
// 3. SDK returns QR code and deep links automatically
// 4. Subscribe to real-time updates via WebSocket
// 5. User signs in Xaman app, transaction auto-submits

import { Xumm } from 'xumm';
import { xrpToDrops } from '../xrplService';
import { devLog, devError, devWarn, isDevLogEnabled, summarizeTxForLog } from '../../lib/secureLog';

// ==================== TYPES ====================

export interface XamanSession {
  address: string;
  networkId: number;
  networkType: 'mainnet' | 'testnet' | 'devnet';
  userToken?: string;
  isConnected: boolean;
  connectedAt: Date;
}

export interface SigningRequest {
  id: string;
  type: 'Payment' | 'OfferCreate' | 'TrustSet' | 'NFTokenCreateOffer' | 'other';
  payload: XRPLTransaction;
  status: 'pending' | 'signed' | 'rejected' | 'expired';
  qrCodeUrl?: string;
  /** Open this URL in a browser tab to sign (desktop-safe). Always https://xumm.app/sign/{id} for real payloads. */
  browserSignUrl?: string;
  deepLink?: string;
  websocketUrl?: string;
  createdAt: Date;
  expiresAt: Date;
  signedTxBlob?: string;
  txHash?: string;
}

export interface XRPLTransaction {
  TransactionType: string;
  Account?: string;
  Destination?: string;
  Amount?: string | IssuedCurrencyAmount;
  Fee?: string;
  Sequence?: number;
  DestinationTag?: number;
  Memos?: Array<{
    Memo: {
      MemoType?: string;
      MemoData?: string;
    };
  }>;
  TakerGets?: string | IssuedCurrencyAmount;
  TakerPays?: string | IssuedCurrencyAmount;
  LimitAmount?: IssuedCurrencyAmount;
  [key: string]: unknown;
}

export interface IssuedCurrencyAmount {
  currency: string;
  issuer: string;
  value: string;
}

export interface PaymentDetails {
  destination: string;
  amount: number | string;
  currency: string;
  issuer?: string;
  destinationTag?: number;
  memo?: string;
}

export interface TradeDetails {
  sell: {
    currency: string;
    issuer?: string;
    amount: string;
  };
  buy: {
    currency: string;
    issuer?: string;
    amount: string;
  };
}

// ==================== XAMAN SERVICE ====================

class XamanService {
  private xumm: Xumm | null = null;
  private session: XamanSession | null = null;
  private pendingRequests: Map<string, SigningRequest> = new Map();
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();
  
  // API Key - only need API Key for browser SDK (not the secret!)
  private apiKey: string | null = null;
  
  // No demo — signing requires API key (live/functional only)
  private demoMode: boolean = false;

  constructor() {
    // Try to load saved API key
    this.loadSavedCredentials();
  }

  /**
   * Initialize with API Key
   * For browser SDK, you only need the API Key (not the secret)
   * Get it from https://apps.xumm.dev
   */
  async initialize(apiKey: string): Promise<void> {
    this.apiKey = apiKey;
    this.demoMode = false;
    
    try {
      // Initialize the Xumm SDK
      this.xumm = new Xumm(apiKey);
      
      // Save for later
      localStorage.setItem('xaman-api-key', apiKey);
      
      devLog('[Xaman] ✅ SDK initialized successfully');
    } catch (error) {
      devError('[Xaman] Failed to initialize SDK:', error);
      throw error;
    }
  }

  /**
   * Load saved API key from localStorage
   */
  loadSavedCredentials(): boolean {
    try {
      const apiKey = localStorage.getItem('xaman-api-key');
      
      if (apiKey) {
        this.initialize(apiKey);
        return true;
      }
    } catch (e) {
      devWarn('[Xaman] Could not load credentials from localStorage');
    }
    return false;
  }

  /**
   * Set API credentials (for backwards compatibility)
   */
  setApiCredentials(apiKey: string, _apiSecret?: string): void {
    // For browser SDK, we only need the API Key
    this.initialize(apiKey);
  }

  /**
   * Clear saved credentials
   */
  clearCredentials(): void {
    this.apiKey = null;
    this.xumm = null;
    this.demoMode = false;
    try {
      localStorage.removeItem('xaman-api-key');
    } catch (e) {
      // Ignore
    }
    devLog('[Xaman] Credentials cleared. Add API key in Settings to sign.');
  }

  /**
   * Get masked API key for display
   */
  getMaskedApiKey(): string | null {
    if (!this.apiKey) return null;
    if (this.apiKey.length <= 8) return '••••••••';
    return `${this.apiKey.slice(0, 4)}••••${this.apiKey.slice(-4)}`;
  }

  /**
   * Check if SDK is configured
   */
  hasApiCredentials(): boolean {
    return !!(this.apiKey && this.xumm);
  }

  // ==================== CONNECTION ====================

  /**
   * Connect with an XRPL address
   */
  async connect(address?: string): Promise<XamanSession> {
    if (address) {
      this.session = {
        address,
        networkId: 0,
        networkType: 'mainnet',
        isConnected: true,
        connectedAt: new Date(),
      };
      
      this.emit('connected', this.session);
      return this.session;
    }

    throw new Error('Please enter your XRPL address manually.');
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    this.session = null;
    this.pendingRequests.clear();
    this.emit('disconnected', null);
  }

  isConnected(): boolean {
    return this.session?.isConnected ?? false;
  }

  getSession(): XamanSession | null {
    return this.session;
  }

  getAddress(): string | null {
    return this.session?.address ?? null;
  }

  // ==================== TRANSACTION SIGNING ====================

  /**
   * Create a payment signing request.
   * If sourceAccount is provided, use it (e.g. from wallet store); otherwise require session.
   */
  async requestPaymentSignature(payment: PaymentDetails, sourceAccount?: string): Promise<SigningRequest> {
    const account = sourceAccount ?? this.session?.address;
    if (!account) {
      throw new Error('No payer address. Connect Xaman or add a wallet in the app.');
    }

    const tx: XRPLTransaction = {
      TransactionType: 'Payment',
      Account: account,
      Destination: payment.destination,
      Amount: this.formatAmount(payment.amount, payment.currency, payment.issuer),
    };

    if (payment.destinationTag !== undefined) {
      tx.DestinationTag = payment.destinationTag;
    }

    if (payment.memo) {
      tx.Memos = [{
        Memo: {
          MemoType: this.stringToHex('text/plain'),
          MemoData: this.stringToHex(payment.memo),
        },
      }];
    }

    return this.createSigningRequest('Payment', tx);
  }

  /**
   * Create a DEX offer signing request
   */
  async requestTradeSignature(trade: TradeDetails): Promise<SigningRequest> {
    if (!this.session) {
      throw new Error('Not connected to Xaman. Please connect first.');
    }

    const tx: XRPLTransaction = {
      TransactionType: 'OfferCreate',
      Account: this.session.address,
      TakerGets: this.formatAmount(trade.buy.amount, trade.buy.currency, trade.buy.issuer),
      TakerPays: this.formatAmount(trade.sell.amount, trade.sell.currency, trade.sell.issuer),
    };

    return this.createSigningRequest('OfferCreate', tx);
  }

  /**
   * Request signature for any XRPL transaction (e.g. PaymentChannelCreate, PaymentChannelClaim).
   * Use for payment channels and other transaction types not covered by the helpers above.
   */
  async requestCustomTransactionSignature(
    tx: XRPLTransaction,
    sourceAccount?: string
  ): Promise<SigningRequest> {
    const account = sourceAccount ?? this.session?.address;
    if (!account) {
      throw new Error('No payer address. Connect Xaman or add a wallet in the app.');
    }
    const payload = { ...tx, Account: account };
    const type = (payload.TransactionType as SigningRequest['type']) || 'other';
    return this.createSigningRequest(type, payload);
  }

  /**
   * Create a TrustSet signing request
   */
  async requestTrustlineSignature(
    currency: string,
    issuer: string,
    limit: string = '1000000000'
  ): Promise<SigningRequest> {
    if (!this.session) {
      throw new Error('Not connected to Xaman. Please connect first.');
    }

    const tx: XRPLTransaction = {
      TransactionType: 'TrustSet',
      Account: this.session.address,
      LimitAmount: {
        currency,
        issuer,
        value: limit,
      },
    };

    return this.createSigningRequest('TrustSet', tx);
  }

  /**
   * Create a signing request using the Xumm SDK
   */
  private async createSigningRequest(
    type: SigningRequest['type'],
    payload: XRPLTransaction
  ): Promise<SigningRequest> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

    // No demo — require API key for signing
    if (!this.xumm) {
      throw new Error('Xaman API key not set. Add your key in Settings (e.g. Profile or Agent panel) to sign transactions.');
    }

    // Real mode - use Xumm SDK
    try {
      devLog('[Xaman] Creating payload via SDK…', summarizeTxForLog(payload as Record<string, unknown>));
      
      // Add timeout for SDK operations
      const PAYLOAD_TIMEOUT = 30000; // 30 seconds to create payload
      
      const createPromise = this.xumm.payload?.createAndSubscribe({
        txjson: payload,
      } as any, (event: any) => {
        devLog('[Xaman] payload event', event?.data?.opened != null ? 'opened' : event?.data?.signed != null ? 'signed/rejected' : 'update');
        
        if (event.data.opened) {
          devLog('[Xaman] User opened the signing request');
          this.emit('signingOpened', { id: event.uuid });
        }
        
        if (event.data.signed !== undefined) {
          devLog('[Xaman] Signing result:', event.data.signed ? 'SIGNED' : 'REJECTED');
          const request = this.pendingRequests.get(event.uuid);
          if (request) {
            if (event.data.signed) {
              request.status = 'signed';
              request.txHash = event.data.txid;
              devLog('[Xaman] Transaction signed (hash redacted in logs)');
              this.emit('signingSigned', request);
            } else {
              request.status = 'rejected';
              devLog('[Xaman] Transaction rejected by user');
              this.emit('signingRejected', request);
            }
          }
          return event; // This resolves the subscription
        }
      });

      // Race against timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout creating Xaman payload')), PAYLOAD_TIMEOUT);
      });

      const result = await Promise.race([createPromise, timeoutPromise]) as any;

      if (!result || !result.created) {
        devError('[Xaman] Failed to create payload - no result');
        throw new Error('Failed to create payload');
      }

      const { created, resolved } = result;
      
      const request: SigningRequest = {
        id: created.uuid,
        type,
        payload,
        status: 'pending',
        qrCodeUrl: created.refs.qr_png,
        browserSignUrl: `https://xumm.app/sign/${created.uuid}`,
        deepLink: created.next.always,
        websocketUrl: created.refs.websocket_status,
        createdAt: now,
        expiresAt,
      };

      this.pendingRequests.set(created.uuid, request);
      this.emit('signingRequested', request);

      devLog('[Xaman] Payload created', created.uuid);

      // Handle the resolved promise in the background with timeout
      const resolvedTimeout = new Promise<null>((resolve) => {
        setTimeout(() => {
          devLog('[Xaman] Resolved promise timeout - checking status');
          resolve(null);
        }, 10 * 60 * 1000); // 10 minute timeout for signing
      });

      Promise.race([resolved, resolvedTimeout]).then((resolvedPayload) => {
        devLog('[Xaman] Resolved payload received');
        if (resolvedPayload) {
          const req = this.pendingRequests.get(created.uuid);
          if (req && req.status === 'pending') {
            if (resolvedPayload.signed) {
              req.status = 'signed';
              req.txHash = resolvedPayload.txid;
              devLog('[Xaman] Payment signed via resolved promise');
              this.emit('signingSigned', req);
            } else {
              req.status = 'rejected';
              devLog('[Xaman] Payment rejected via resolved promise');
              this.emit('signingRejected', req);
            }
          }
        } else {
          // Timeout - mark as expired if still pending
          const req = this.pendingRequests.get(created.uuid);
          if (req && req.status === 'pending') {
            req.status = 'expired';
            devLog('[Xaman] Signing request expired');
            this.emit('signingExpired', req);
          }
        }
      }).catch((err) => {
        devError('[Xaman] Resolved promise error:', err);
        const req = this.pendingRequests.get(created.uuid);
        if (req && req.status === 'pending') {
          req.status = 'rejected';
          this.emit('signingRejected', req);
        }
      });

      return request;
      
    } catch (error) {
      if (isDevLogEnabled()) console.error('[Xaman] SDK error:', error);
      else console.error('[Xaman] SDK error (enable dev mode for details)');
      // If we have credentials, do NOT silently fall back to demo — surface the error so the user can fix it
      const msg = error instanceof Error ? error.message : String(error);
      const isConnectionError = /fetch|network|cors|Failed to fetch|connect|server not found|ECONNREFUSED|timeout/i.test(msg);
      const hint = isConnectionError
        ? ' Add your site URL to Allowed origins at apps.xumm.dev (Your app → Allowed origins).'
        : '';
      throw new Error(`Signing failed: ${msg}.${hint} Check API key and allowed origins at apps.xumm.dev.`);
    }
  }

  /**
   * Create a demo signing request
   */
  private createDemoRequest(
    type: SigningRequest['type'],
    payload: XRPLTransaction,
    now: Date,
    expiresAt: Date
  ): SigningRequest {
    const id = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const request: SigningRequest = {
      id,
      type,
      payload,
      status: 'pending',
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=demo-${id}`,
      browserSignUrl: 'https://xumm.app',
      deepLink: `xumm://xumm.app/sign/${id}`,
      createdAt: now,
      expiresAt,
    };

    this.pendingRequests.set(id, request);
    this.emit('signingRequested', request);

    // Auto-approve after 3 seconds in demo mode
    setTimeout(() => {
      if (request.status === 'pending') {
        request.status = 'signed';
        request.txHash = `DEMO_TX_${id.toUpperCase()}`;
        devLog('[Xaman] Demo: Auto-approved');
        this.emit('signingSigned', request);
      }
    }, 3000);

    return request;
  }

  // ==================== HELPERS ====================

  private formatAmount(
    amount: number | string,
    currency: string,
    issuer?: string
  ): string | IssuedCurrencyAmount {
    const amountStr = typeof amount === 'number' ? amount.toString() : amount;

    if (currency === 'XRP') {
      return xrpToDrops(parseFloat(amountStr));
    }

    if (!issuer) {
      throw new Error(`Issuer required for currency: ${currency}`);
    }

    return {
      currency,
      issuer,
      value: amountStr,
    };
  }

  private stringToHex(str: string): string {
    return Array.from(new TextEncoder().encode(str))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }

  // ==================== EVENT EMITTER ====================

  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.eventListeners.get(event)?.forEach(callback => callback(data));
  }

  // ==================== DEMO MODE ====================

  setDemoMode(enabled: boolean): void {
    this.demoMode = enabled;
  }

  isDemoMode(): boolean {
    return this.demoMode;
  }

  simulateApproval(requestId: string, txHash?: string): void {
    const request = this.pendingRequests.get(requestId);
    if (request && request.status === 'pending') {
      request.status = 'signed';
      request.txHash = txHash || `SIMULATED_${requestId}`;
      this.emit('signingSigned', request);
    }
  }

  simulateRejection(requestId: string): void {
    const request = this.pendingRequests.get(requestId);
    if (request && request.status === 'pending') {
      request.status = 'rejected';
      this.emit('signingRejected', request);
    }
  }

  // Manual confirmation for when we can't detect signing
  confirmDeepLinkSigned(requestId: string, txHash?: string): void {
    const request = this.pendingRequests.get(requestId);
    if (request && request.status === 'pending') {
      request.status = 'signed';
      request.txHash = txHash || `MANUAL_${requestId}`;
      this.emit('signingSigned', request);
    }
  }

  cancelDeepLinkRequest(requestId: string): void {
    const request = this.pendingRequests.get(requestId);
    if (request && request.status === 'pending') {
      request.status = 'rejected';
      this.emit('signingRejected', request);
    }
  }

  isDeepLinkFallback(request: SigningRequest): boolean {
    return request.id.startsWith('demo_') || request.id.startsWith('local_');
  }

  /** Open the sign page in a new tab (desktop-safe). Use browserSignUrl, not deep link, to avoid "server not found". */
  openXamanApp(request: SigningRequest): void {
    const url = request.browserSignUrl ?? (request.id && !request.id.startsWith('demo_')
      ? `https://xumm.app/sign/${request.id}`
      : 'https://xumm.app');
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

// ==================== SINGLETON INSTANCE ====================

export const xamanService = new XamanService();

export default xamanService;
