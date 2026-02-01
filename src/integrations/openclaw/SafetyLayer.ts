// OpenClaw XRPL Safety Layer
// "Move fast, but NEVER skip safety"
//
// PROTOCOLS:
// 1. Kill switch - instantly halt all payments
// 2. Rate limiting - prevent abuse
// 3. Audit logging - track every transaction
// 4. Consent flow - user must approve
// 5. Testnet mode - ALWAYS test first

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// SAFETY CONFIGURATION
// =============================================================================

export const SAFETY_CONFIG = {
  // Rate Limits
  MAX_TX_PER_MINUTE: 100,
  MAX_TX_PER_HOUR: 1000,
  MAX_TX_PER_DAY: 10000,
  MAX_AMOUNT_PER_TX: 100,      // XRP
  MAX_AMOUNT_PER_DAY: 10000,   // XRP
  
  // Timeouts
  TX_TIMEOUT_MS: 30000,        // 30 seconds
  RETRY_DELAY_MS: 1000,        // 1 second
  MAX_RETRIES: 3,
  
  // Alerts
  ALERT_THRESHOLD_XRP: 100,    // Alert if single tx > this
  ALERT_THRESHOLD_DAILY: 1000, // Alert if daily volume > this
  
  // Mode
  TESTNET_ONLY: true,          // SET TO FALSE ONLY AFTER FULL AUDIT
};

// =============================================================================
// TYPES
// =============================================================================

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  action: 'payment' | 'channel_open' | 'channel_close' | 'claim' | 'kill_switch' | 'rate_limit' | 'error';
  status: 'success' | 'failed' | 'blocked' | 'pending';
  amount?: number;
  recipient?: string;
  txHash?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface RateLimitState {
  txThisMinute: number;
  txThisHour: number;
  txThisDay: number;
  amountThisDay: number;
  lastMinuteReset: number;
  lastHourReset: number;
  lastDayReset: number;
}

export interface SafetyState {
  // Kill Switch
  killSwitchActive: boolean;
  killSwitchReason: string | null;
  killSwitchTimestamp: number | null;
  
  // Rate Limiting
  rateLimit: RateLimitState;
  
  // Audit Log
  auditLog: AuditLogEntry[];
  
  // Consent
  userConsentGiven: boolean;
  consentTimestamp: number | null;
  
  // Mode
  isTestnet: boolean;
  
  // Actions
  activateKillSwitch: (reason: string) => void;
  deactivateKillSwitch: () => void;
  checkRateLimit: (amount: number) => { allowed: boolean; reason?: string };
  recordTransaction: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
  giveConsent: () => void;
  revokeConsent: () => void;
  exportAuditLog: () => string;
  clearOldLogs: (olderThanDays: number) => void;
}

// =============================================================================
// SAFETY STORE
// =============================================================================

export const useSafetyStore = create<SafetyState>()(
  persist(
    (set, get) => ({
      // Initial State
      killSwitchActive: false,
      killSwitchReason: null,
      killSwitchTimestamp: null,
      
      rateLimit: {
        txThisMinute: 0,
        txThisHour: 0,
        txThisDay: 0,
        amountThisDay: 0,
        lastMinuteReset: Date.now(),
        lastHourReset: Date.now(),
        lastDayReset: Date.now(),
      },
      
      auditLog: [],
      userConsentGiven: false,
      consentTimestamp: null,
      isTestnet: SAFETY_CONFIG.TESTNET_ONLY,

      // =======================================================================
      // KILL SWITCH
      // =======================================================================
      
      activateKillSwitch: (reason: string) => {
        const timestamp = Date.now();
        set({
          killSwitchActive: true,
          killSwitchReason: reason,
          killSwitchTimestamp: timestamp,
        });
        
        // Log the kill switch activation
        get().recordTransaction({
          action: 'kill_switch',
          status: 'success',
          metadata: { reason, activated: true },
        });
        
        console.error(`[KILL SWITCH ACTIVATED] ${reason} at ${new Date(timestamp).toISOString()}`);
      },
      
      deactivateKillSwitch: () => {
        set({
          killSwitchActive: false,
          killSwitchReason: null,
          killSwitchTimestamp: null,
        });
        
        get().recordTransaction({
          action: 'kill_switch',
          status: 'success',
          metadata: { activated: false },
        });
        
        console.log('[KILL SWITCH DEACTIVATED]');
      },

      // =======================================================================
      // RATE LIMITING
      // =======================================================================
      
      checkRateLimit: (amount: number) => {
        const state = get();
        const now = Date.now();
        let rateLimit = { ...state.rateLimit };
        
        // Reset counters if time windows have passed
        if (now - rateLimit.lastMinuteReset > 60000) {
          rateLimit.txThisMinute = 0;
          rateLimit.lastMinuteReset = now;
        }
        if (now - rateLimit.lastHourReset > 3600000) {
          rateLimit.txThisHour = 0;
          rateLimit.lastHourReset = now;
        }
        if (now - rateLimit.lastDayReset > 86400000) {
          rateLimit.txThisDay = 0;
          rateLimit.amountThisDay = 0;
          rateLimit.lastDayReset = now;
        }
        
        // Check kill switch first
        if (state.killSwitchActive) {
          return { allowed: false, reason: `Kill switch active: ${state.killSwitchReason}` };
        }
        
        // Check consent
        if (!state.userConsentGiven) {
          return { allowed: false, reason: 'User consent not given' };
        }
        
        // Check rate limits
        if (rateLimit.txThisMinute >= SAFETY_CONFIG.MAX_TX_PER_MINUTE) {
          get().recordTransaction({
            action: 'rate_limit',
            status: 'blocked',
            metadata: { reason: 'minute_limit', current: rateLimit.txThisMinute },
          });
          return { allowed: false, reason: `Rate limit: ${SAFETY_CONFIG.MAX_TX_PER_MINUTE} tx/minute exceeded` };
        }
        
        if (rateLimit.txThisHour >= SAFETY_CONFIG.MAX_TX_PER_HOUR) {
          return { allowed: false, reason: `Rate limit: ${SAFETY_CONFIG.MAX_TX_PER_HOUR} tx/hour exceeded` };
        }
        
        if (rateLimit.txThisDay >= SAFETY_CONFIG.MAX_TX_PER_DAY) {
          return { allowed: false, reason: `Rate limit: ${SAFETY_CONFIG.MAX_TX_PER_DAY} tx/day exceeded` };
        }
        
        // Check amount limits
        if (amount > SAFETY_CONFIG.MAX_AMOUNT_PER_TX) {
          return { allowed: false, reason: `Amount ${amount} XRP exceeds max ${SAFETY_CONFIG.MAX_AMOUNT_PER_TX} XRP per tx` };
        }
        
        if (rateLimit.amountThisDay + amount > SAFETY_CONFIG.MAX_AMOUNT_PER_DAY) {
          return { allowed: false, reason: `Daily limit of ${SAFETY_CONFIG.MAX_AMOUNT_PER_DAY} XRP would be exceeded` };
        }
        
        // Update counters
        rateLimit.txThisMinute++;
        rateLimit.txThisHour++;
        rateLimit.txThisDay++;
        rateLimit.amountThisDay += amount;
        
        set({ rateLimit });
        
        return { allowed: true };
      },

      // =======================================================================
      // AUDIT LOGGING
      // =======================================================================
      
      recordTransaction: (entry) => {
        const logEntry: AuditLogEntry = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          ...entry,
        };
        
        set(state => ({
          auditLog: [logEntry, ...state.auditLog].slice(0, 10000), // Keep last 10k entries
        }));
        
        // Console log for debugging
        console.log(`[AUDIT] ${logEntry.action}: ${logEntry.status}`, logEntry);
        
        // Alert on high-value transactions
        if (entry.amount && entry.amount > SAFETY_CONFIG.ALERT_THRESHOLD_XRP) {
          console.warn(`[ALERT] High-value transaction: ${entry.amount} XRP`);
        }
      },
      
      exportAuditLog: () => {
        const state = get();
        return JSON.stringify(state.auditLog, null, 2);
      },
      
      clearOldLogs: (olderThanDays: number) => {
        const cutoff = Date.now() - (olderThanDays * 86400000);
        set(state => ({
          auditLog: state.auditLog.filter(entry => entry.timestamp > cutoff),
        }));
      },

      // =======================================================================
      // CONSENT
      // =======================================================================
      
      giveConsent: () => {
        set({
          userConsentGiven: true,
          consentTimestamp: Date.now(),
        });
        get().recordTransaction({
          action: 'payment',
          status: 'success',
          metadata: { type: 'consent_given' },
        });
      },
      
      revokeConsent: () => {
        set({
          userConsentGiven: false,
          consentTimestamp: null,
        });
        get().recordTransaction({
          action: 'payment',
          status: 'success',
          metadata: { type: 'consent_revoked' },
        });
      },
    }),
    {
      name: 'openclaw-safety-store',
    }
  )
);

// =============================================================================
// SAFE PAYMENT WRAPPER
// =============================================================================

export async function safePayment<T>(
  paymentFn: () => Promise<T>,
  amount: number,
  description: string
): Promise<{ success: boolean; result?: T; error?: string }> {
  const safety = useSafetyStore.getState();
  
  // Check if we're in testnet mode
  if (SAFETY_CONFIG.TESTNET_ONLY && !safety.isTestnet) {
    safety.recordTransaction({
      action: 'payment',
      status: 'blocked',
      amount,
      error: 'Mainnet disabled - testnet only mode',
      metadata: { description },
    });
    return { success: false, error: 'Mainnet disabled. Set TESTNET_ONLY to false after audit.' };
  }
  
  // Check rate limits and consent
  const rateLimitCheck = safety.checkRateLimit(amount);
  if (!rateLimitCheck.allowed) {
    safety.recordTransaction({
      action: 'payment',
      status: 'blocked',
      amount,
      error: rateLimitCheck.reason,
      metadata: { description },
    });
    return { success: false, error: rateLimitCheck.reason };
  }
  
  // Execute payment with timeout
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Transaction timeout')), SAFETY_CONFIG.TX_TIMEOUT_MS);
    });
    
    const result = await Promise.race([paymentFn(), timeoutPromise]);
    
    safety.recordTransaction({
      action: 'payment',
      status: 'success',
      amount,
      metadata: { description },
    });
    
    return { success: true, result };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    safety.recordTransaction({
      action: 'payment',
      status: 'failed',
      amount,
      error: errorMessage,
      metadata: { description },
    });
    
    // Auto-activate kill switch on repeated failures
    const recentFailures = safety.auditLog
      .filter(e => e.status === 'failed' && e.timestamp > Date.now() - 60000)
      .length;
    
    if (recentFailures >= 5) {
      safety.activateKillSwitch('Auto-triggered: 5+ failures in last minute');
    }
    
    return { success: false, error: errorMessage };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const SafetyProtocols = {
  // Quick checks
  isOperational: () => {
    const state = useSafetyStore.getState();
    return !state.killSwitchActive && state.userConsentGiven;
  },
  
  // Emergency stop
  emergencyStop: (reason: string) => {
    useSafetyStore.getState().activateKillSwitch(reason);
  },
  
  // Resume operations
  resume: () => {
    useSafetyStore.getState().deactivateKillSwitch();
  },
  
  // Get status
  getStatus: () => {
    const state = useSafetyStore.getState();
    return {
      operational: !state.killSwitchActive && state.userConsentGiven,
      killSwitch: state.killSwitchActive,
      killSwitchReason: state.killSwitchReason,
      consent: state.userConsentGiven,
      txToday: state.rateLimit.txThisDay,
      amountToday: state.rateLimit.amountThisDay,
      isTestnet: state.isTestnet,
    };
  },
  
  // Export audit log
  exportLogs: () => useSafetyStore.getState().exportAuditLog(),
};
