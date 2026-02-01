/**
 * OpenClaw XRPL Micropayment Plugin
 * 
 * Drop this into any OpenClaw installation to enable micropayments.
 * Every agent transaction sends 3% fee to your wallet.
 * 
 * YOUR WALLET: ra7Zj3GMAvuY7QEAJr1YADJ6Ss43Rxyo64
 * 
 * Usage:
 *   import { OpenClawPayments } from 'openclaw-xrpl-plugin';
 *   const payments = new OpenClawPayments();
 *   await payments.init();
 *   await payments.payForSkill('premium-search', 0.001);
 */

import { Client, Wallet, xrpToDrops, dropsToXrp } from 'xrpl';

// =============================================================================
// CONFIGURATION
// =============================================================================

export const CONFIG = {
  // YOUR WALLET - receives 3% of every transaction
  FEE_WALLET: 'ra7Zj3GMAvuY7QEAJr1YADJ6Ss43Rxyo64',
  FEE_PERCENT: 0.03,
  
  // Network
  TESTNET: 'wss://s.altnet.rippletest.net:51233',
  MAINNET: 'wss://xrplcluster.com',
  
  // Safety
  USE_TESTNET: true,  // SET TO false ONLY AFTER AUDIT
  MAX_TX_PER_MINUTE: 100,
  MAX_AMOUNT_PER_TX: 100,
};

// =============================================================================
// TYPES
// =============================================================================

export interface PaymentResult {
  success: boolean;
  txHash?: string;
  fee?: number;
  error?: string;
}

export interface SkillConfig {
  name: string;
  price: number;  // XRP
  creator?: string;  // Creator's wallet (defaults to FEE_WALLET)
}

// =============================================================================
// MAIN CLASS
// =============================================================================

export class OpenClawPayments {
  private client: Client;
  private wallet: Wallet | null = null;
  private connected: boolean = false;
  private txCount: number = 0;
  private lastMinuteReset: number = Date.now();
  
  constructor(useMainnet: boolean = false) {
    if (useMainnet && CONFIG.USE_TESTNET) {
      throw new Error('Mainnet disabled. Set CONFIG.USE_TESTNET = false after security audit.');
    }
    
    const network = useMainnet ? CONFIG.MAINNET : CONFIG.TESTNET;
    this.client = new Client(network);
    
    console.log(`[OpenClaw XRPL] Initialized on ${useMainnet ? 'MAINNET' : 'TESTNET'}`);
    console.log(`[OpenClaw XRPL] Fee wallet: ${CONFIG.FEE_WALLET}`);
  }
  
  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------
  
  async init(): Promise<string> {
    await this.client.connect();
    this.connected = true;
    
    // Generate agent wallet
    this.wallet = Wallet.generate();
    
    // Fund on testnet
    if (CONFIG.USE_TESTNET) {
      try {
        await this.client.fundWallet(this.wallet);
        console.log(`[OpenClaw XRPL] Agent wallet funded: ${this.wallet.address}`);
      } catch (e) {
        console.warn('[OpenClaw XRPL] Could not auto-fund wallet');
      }
    }
    
    return this.wallet.address;
  }
  
  // ---------------------------------------------------------------------------
  // PAYMENTS
  // ---------------------------------------------------------------------------
  
  async payForSkill(skillName: string, priceXRP: number, creatorWallet?: string): Promise<PaymentResult> {
    // Safety checks
    if (!this.connected || !this.wallet) {
      return { success: false, error: 'Not initialized. Call init() first.' };
    }
    
    // Rate limiting
    if (!this.checkRateLimit()) {
      return { success: false, error: 'Rate limit exceeded. Max 100 tx/minute.' };
    }
    
    // Amount check
    if (priceXRP > CONFIG.MAX_AMOUNT_PER_TX) {
      return { success: false, error: `Amount ${priceXRP} exceeds max ${CONFIG.MAX_AMOUNT_PER_TX} XRP` };
    }
    
    try {
      // Calculate fee split
      const yourFee = priceXRP * CONFIG.FEE_PERCENT;
      const creatorAmount = priceXRP - yourFee;
      const recipient = creatorWallet || CONFIG.FEE_WALLET;
      
      console.log(`[OpenClaw XRPL] Paying for skill: ${skillName}`);
      console.log(`  Creator (${recipient}): ${creatorAmount.toFixed(6)} XRP`);
      console.log(`  Platform fee: ${yourFee.toFixed(6)} XRP`);
      
      // Pay creator (if different from fee wallet)
      if (recipient !== CONFIG.FEE_WALLET) {
        await this.client.submitAndWait({
          TransactionType: 'Payment',
          Account: this.wallet.address,
          Destination: recipient,
          Amount: xrpToDrops(creatorAmount.toString()),
        }, { wallet: this.wallet });
      }
      
      // Pay platform fee
      const feeTx = await this.client.submitAndWait({
        TransactionType: 'Payment',
        Account: this.wallet.address,
        Destination: CONFIG.FEE_WALLET,
        Amount: xrpToDrops((recipient === CONFIG.FEE_WALLET ? priceXRP : yourFee).toString()),
      }, { wallet: this.wallet });
      
      this.txCount++;
      
      return {
        success: true,
        txHash: feeTx.result.hash,
        fee: yourFee,
      };
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[OpenClaw XRPL] Payment failed: ${message}`);
      return { success: false, error: message };
    }
  }
  
  // ---------------------------------------------------------------------------
  // SKILL WRAPPER
  // ---------------------------------------------------------------------------
  
  /**
   * Wrap any function to require payment before execution
   */
  paidSkill<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    config: SkillConfig
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      const result = await this.payForSkill(config.name, config.price, config.creator);
      
      if (!result.success) {
        throw new Error(`Payment failed: ${result.error}`);
      }
      
      return fn(...args);
    };
  }
  
  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------
  
  private checkRateLimit(): boolean {
    const now = Date.now();
    if (now - this.lastMinuteReset > 60000) {
      this.txCount = 0;
      this.lastMinuteReset = now;
    }
    return this.txCount < CONFIG.MAX_TX_PER_MINUTE;
  }
  
  async getBalance(): Promise<string> {
    if (!this.wallet) return '0';
    
    try {
      const response = await this.client.request({
        command: 'account_info',
        account: this.wallet.address,
      });
      return dropsToXrp(response.result.account_data.Balance);
    } catch {
      return '0';
    }
  }
  
  async disconnect(): Promise<void> {
    await this.client.disconnect();
    this.connected = false;
  }
  
  getWalletAddress(): string | null {
    return this.wallet?.address || null;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default OpenClawPayments;
