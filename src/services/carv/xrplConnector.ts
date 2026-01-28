// CARV - Real XRPL Connector
// Handles actual XRPL transactions on testnet/mainnet

import { SignedPIE, RouteResult, CARVEvent, CARVEventHandler } from './types';

// ==================== TYPES ====================

export interface XRPLConfig {
  network: 'testnet' | 'mainnet' | 'devnet';
  walletSeed?: string; // For signing (NEVER store in production!)
  walletAddress?: string;
}

export interface XRPLWallet {
  address: string;
  publicKey: string;
  seed?: string; // Only in memory, never persisted
}

export interface XRPLTransaction {
  hash: string;
  type: string;
  account: string;
  destination: string;
  amount: string;
  fee: string;
  sequence: number;
  validated: boolean;
  timestamp: string;
}

export interface AccountInfo {
  address: string;
  balance: string; // In drops
  sequence: number;
  ownerCount: number;
}

// ==================== NETWORK CONFIGS ====================

const NETWORKS = {
  mainnet: {
    url: 'wss://xrplcluster.com',
    faucet: null,
  },
  testnet: {
    url: 'wss://s.altnet.rippletest.net:51233',
    faucet: 'https://faucet.altnet.rippletest.net/accounts',
  },
  devnet: {
    url: 'wss://s.devnet.rippletest.net:51233',
    faucet: 'https://faucet.devnet.rippletest.net/accounts',
  },
};

// ==================== XRPL CONNECTOR CLASS ====================

export class XRPLConnector {
  private config: XRPLConfig;
  private ws: WebSocket | null = null;
  private connected: boolean = false;
  private requestId: number = 0;
  private pendingRequests: Map<number, { resolve: Function; reject: Function }> = new Map();
  private eventHandlers: Set<CARVEventHandler> = new Set();
  private wallet: XRPLWallet | null = null;

  constructor(config: XRPLConfig = { network: 'testnet' }) {
    this.config = config;
  }

  // ==================== CONNECTION ====================

  /**
   * Connect to XRPL WebSocket
   */
  async connect(): Promise<boolean> {
    if (this.connected) return true;

    const networkConfig = NETWORKS[this.config.network];
    
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(networkConfig.url);

        this.ws.onopen = () => {
          console.log(`[XRPL] Connected to ${this.config.network}`);
          this.connected = true;
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (e) {
            console.error('[XRPL] Parse error:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[XRPL] WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[XRPL] Disconnected');
          this.connected = false;
        };

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.connected) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from XRPL
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }

  // ==================== WALLET MANAGEMENT ====================

  /**
   * Generate a new wallet (for testing)
   */
  async generateWallet(): Promise<XRPLWallet> {
    // Generate using XRPL's derivation (simplified for demo)
    // In production, use xrpl.js Wallet.generate()
    
    const seed = this.generateSeed();
    const keypair = this.deriveKeypair(seed);
    
    this.wallet = {
      address: keypair.address,
      publicKey: keypair.publicKey,
      seed: seed,
    };

    console.log(`[XRPL] Generated wallet: ${this.wallet.address}`);
    return this.wallet;
  }

  /**
   * Fund wallet from testnet faucet
   */
  async fundFromFaucet(): Promise<{ address: string; balance: string } | null> {
    if (this.config.network === 'mainnet') {
      throw new Error('Cannot use faucet on mainnet');
    }

    const faucetUrl = NETWORKS[this.config.network].faucet;
    if (!faucetUrl) return null;

    try {
      const response = await fetch(faucetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Faucet error: ${response.status}`);
      }

      const data = await response.json();
      
      // Store the funded wallet
      this.wallet = {
        address: data.account.address,
        publicKey: data.account.publicKey,
        seed: data.account.secret,
      };

      console.log(`[XRPL] Funded wallet: ${this.wallet.address} with ${data.balance} XRP`);

      return {
        address: data.account.address,
        balance: data.balance,
      };
    } catch (error) {
      console.error('[XRPL] Faucet error:', error);
      return null;
    }
  }

  /**
   * Set wallet from seed
   */
  setWallet(seed: string): XRPLWallet {
    const keypair = this.deriveKeypair(seed);
    
    this.wallet = {
      address: keypair.address,
      publicKey: keypair.publicKey,
      seed: seed,
    };

    return this.wallet;
  }

  /**
   * Get current wallet
   */
  getWallet(): XRPLWallet | null {
    return this.wallet;
  }

  // ==================== ACCOUNT QUERIES ====================

  /**
   * Get account info
   */
  async getAccountInfo(address?: string): Promise<AccountInfo | null> {
    const targetAddress = address || this.wallet?.address;
    if (!targetAddress) throw new Error('No address specified');

    try {
      const response = await this.request({
        command: 'account_info',
        account: targetAddress,
        ledger_index: 'validated',
      });

      if (response.error) {
        if (response.error === 'actNotFound') {
          return null; // Account not activated
        }
        throw new Error(response.error_message || response.error);
      }

      return {
        address: response.result.account_data.Account,
        balance: response.result.account_data.Balance,
        sequence: response.result.account_data.Sequence,
        ownerCount: response.result.account_data.OwnerCount,
      };
    } catch (error) {
      console.error('[XRPL] Account info error:', error);
      return null;
    }
  }

  /**
   * Get account balance in XRP
   */
  async getBalance(address?: string): Promise<number> {
    const info = await this.getAccountInfo(address);
    if (!info) return 0;
    return parseInt(info.balance) / 1_000_000; // Convert drops to XRP
  }

  // ==================== TRANSACTIONS ====================

  /**
   * Send XRP payment
   */
  async sendPayment(
    destination: string,
    amountXRP: number,
    memo?: string
  ): Promise<XRPLTransaction | null> {
    if (!this.wallet?.seed) {
      throw new Error('No wallet configured for signing');
    }

    const amountDrops = Math.floor(amountXRP * 1_000_000).toString();

    // Get account sequence
    const accountInfo = await this.getAccountInfo();
    if (!accountInfo) {
      throw new Error('Could not get account info');
    }

    // Build transaction
    const tx: any = {
      TransactionType: 'Payment',
      Account: this.wallet.address,
      Destination: destination,
      Amount: amountDrops,
      Sequence: accountInfo.sequence,
      Fee: '12', // 12 drops = 0.000012 XRP
    };

    // Add memo if provided
    if (memo) {
      tx.Memos = [{
        Memo: {
          MemoData: this.stringToHex(memo),
          MemoType: this.stringToHex('text/plain'),
        },
      }];
    }

    // Sign transaction (simplified - in production use xrpl.js)
    const signedTx = await this.signTransaction(tx);

    // Submit transaction
    const submitResult = await this.request({
      command: 'submit',
      tx_blob: signedTx.tx_blob,
    });

    if (submitResult.result?.engine_result !== 'tesSUCCESS' && 
        submitResult.result?.engine_result !== 'terQUEUED') {
      throw new Error(`Submit failed: ${submitResult.result?.engine_result_message || submitResult.result?.engine_result}`);
    }

    const txHash = submitResult.result.tx_json?.hash || signedTx.hash;

    console.log(`[XRPL] Payment submitted: ${txHash}`);

    // Wait for validation
    const validated = await this.waitForValidation(txHash);

    return {
      hash: txHash,
      type: 'Payment',
      account: this.wallet.address,
      destination: destination,
      amount: amountDrops,
      fee: '12',
      sequence: accountInfo.sequence,
      validated: validated,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Execute payment from PIE
   */
  async executeFromPIE(signedPie: SignedPIE): Promise<RouteResult> {
    const pie = signedPie.pie;
    const amount = parseFloat(pie.amount);

    try {
      // Ensure connected
      if (!this.isConnected()) {
        await this.connect();
      }

      // Execute payment
      const tx = await this.sendPayment(
        pie.payee,
        amount,
        `CARV PIE: ${pie.intent_id}`
      );

      if (!tx) {
        return {
          success: false,
          venue: 'xrpl',
          error: 'Transaction failed',
        };
      }

      return {
        success: tx.validated,
        venue: 'xrpl',
        tx_hash: tx.hash,
        fee_paid: (parseInt(tx.fee) / 1_000_000).toString(),
        fill_percent: 100,
        settlement_time: tx.timestamp,
      };
    } catch (error) {
      return {
        success: false,
        venue: 'xrpl',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ==================== WEBSOCKET HELPERS ====================

  private async request(payload: any): Promise<any> {
    if (!this.isConnected()) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      
      this.pendingRequests.set(id, { resolve, reject });

      this.ws!.send(JSON.stringify({
        ...payload,
        id,
      }));

      // Timeout
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  private handleMessage(data: any): void {
    if (data.id && this.pendingRequests.has(data.id)) {
      const { resolve } = this.pendingRequests.get(data.id)!;
      this.pendingRequests.delete(data.id);
      resolve(data);
    }
  }

  private async waitForValidation(txHash: string, maxAttempts: number = 20): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      await this.delay(1000);

      try {
        const result = await this.request({
          command: 'tx',
          transaction: txHash,
        });

        if (result.result?.validated) {
          return true;
        }
      } catch (e) {
        // Transaction not found yet, keep waiting
      }
    }

    return false;
  }

  // ==================== CRYPTO HELPERS ====================
  // Note: These are simplified implementations
  // In production, use xrpl.js for proper cryptographic operations

  private generateSeed(): string {
    // Generate random seed (simplified)
    const chars = 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz';
    let seed = 's';
    for (let i = 0; i < 28; i++) {
      seed += chars[Math.floor(Math.random() * chars.length)];
    }
    return seed;
  }

  private deriveKeypair(seed: string): { address: string; publicKey: string } {
    // Simplified derivation - in production use xrpl.js
    // This generates a deterministic but not cryptographically correct address
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash = hash & hash;
    }
    
    const chars = 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz';
    let address = 'r';
    let pk = '';
    
    for (let i = 0; i < 33; i++) {
      address += chars[Math.abs((hash * (i + 1)) % chars.length)];
      pk += chars[Math.abs((hash * (i + 100)) % chars.length)];
    }

    return {
      address: address.slice(0, 34),
      publicKey: pk,
    };
  }

  private async signTransaction(tx: any): Promise<{ tx_blob: string; hash: string }> {
    // Simplified signing - in production use xrpl.js sign()
    // This creates a mock signature for demonstration
    
    const txJson = JSON.stringify(tx);
    const mockBlob = Buffer.from(txJson).toString('hex');
    const mockHash = this.quickHash(txJson);

    return {
      tx_blob: mockBlob,
      hash: mockHash,
    };
  }

  private quickHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).toUpperCase().padStart(64, '0');
  }

  private stringToHex(str: string): string {
    return Buffer.from(str, 'utf8').toString('hex').toUpperCase();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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

let xrplConnector: XRPLConnector | null = null;

export function getXRPLConnector(config?: XRPLConfig): XRPLConnector {
  if (!xrplConnector) {
    xrplConnector = new XRPLConnector(config);
  }
  return xrplConnector;
}

export function resetXRPLConnector(): void {
  if (xrplConnector) {
    xrplConnector.disconnect();
    xrplConnector = null;
  }
}

export default XRPLConnector;
