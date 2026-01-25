// Alert Notification Service
// Multi-channel alert system for institutional-grade monitoring
// Supports in-app, browser push, Telegram, Discord, and email

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ==================== TYPES ====================

export type AlertChannel = 'in_app' | 'browser' | 'telegram' | 'discord' | 'email';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertCategory = 
  | 'price' 
  | 'technical' 
  | 'volume' 
  | 'whale' 
  | 'liquidation' 
  | 'risk' 
  | 'sentiment' 
  | 'news'
  | 'signal'
  | 'trade';

export interface AlertCondition {
  type: 'above' | 'below' | 'crosses_above' | 'crosses_below' | 'change_percent' | 'equals';
  value: number;
  compareValue?: number; // For change_percent
}

export interface Alert {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  
  // Trigger configuration
  category: AlertCategory;
  asset?: string;           // Optional - some alerts are market-wide
  indicator?: string;       // e.g., 'RSI', 'MACD', 'price'
  condition: AlertCondition;
  
  // Delivery
  channels: AlertChannel[];
  severity: AlertSeverity;
  
  // Timing
  cooldownMinutes: number;  // Minimum time between alerts
  lastTriggered?: number;
  triggerCount: number;
  
  // Metadata
  createdAt: number;
  updatedAt: number;
}

export interface AlertTrigger {
  id: string;
  alertId: string;
  alertName: string;
  
  // Trigger details
  category: AlertCategory;
  asset?: string;
  severity: AlertSeverity;
  
  // Message
  title: string;
  message: string;
  value: number;
  threshold: number;
  
  // Status
  deliveredTo: AlertChannel[];
  failedChannels: AlertChannel[];
  
  timestamp: number;
  read: boolean;
  dismissed: boolean;
}

export interface ChannelConfig {
  telegram: {
    enabled: boolean;
    botToken: string;
    chatId: string;
  };
  discord: {
    enabled: boolean;
    webhookUrl: string;
  };
  email: {
    enabled: boolean;
    address: string;
  };
  browser: {
    enabled: boolean;
    permission: 'granted' | 'denied' | 'default';
  };
}

// ==================== PRESET ALERTS ====================

export const PRESET_ALERTS: Omit<Alert, 'id' | 'createdAt' | 'updatedAt' | 'lastTriggered' | 'triggerCount'>[] = [
  {
    name: 'XRP Price Alert - $5',
    description: 'Alert when XRP crosses $5',
    enabled: false,
    category: 'price',
    asset: 'XRP',
    indicator: 'price',
    condition: { type: 'crosses_above', value: 5 },
    channels: ['in_app', 'browser'],
    severity: 'info',
    cooldownMinutes: 60,
  },
  {
    name: 'BTC Drops 10%',
    description: 'Alert on major BTC drop',
    enabled: true,
    category: 'price',
    asset: 'BTC',
    indicator: 'price_change_24h',
    condition: { type: 'below', value: -10 },
    channels: ['in_app', 'browser'],
    severity: 'critical',
    cooldownMinutes: 30,
  },
  {
    name: 'RSI Oversold (XRP)',
    description: 'XRP RSI below 30',
    enabled: false,
    category: 'technical',
    asset: 'XRP',
    indicator: 'RSI',
    condition: { type: 'below', value: 30 },
    channels: ['in_app'],
    severity: 'info',
    cooldownMinutes: 240,
  },
  {
    name: 'RSI Overbought (XRP)',
    description: 'XRP RSI above 70',
    enabled: false,
    category: 'technical',
    asset: 'XRP',
    indicator: 'RSI',
    condition: { type: 'above', value: 70 },
    channels: ['in_app'],
    severity: 'warning',
    cooldownMinutes: 240,
  },
  {
    name: 'Whale Transaction',
    description: 'Large transaction detected (>$10M)',
    enabled: true,
    category: 'whale',
    indicator: 'transaction_size',
    condition: { type: 'above', value: 10000000 },
    channels: ['in_app', 'browser'],
    severity: 'info',
    cooldownMinutes: 15,
  },
  {
    name: 'Mass Liquidations',
    description: 'Liquidations exceed $100M/hour',
    enabled: true,
    category: 'liquidation',
    indicator: 'hourly_liquidations',
    condition: { type: 'above', value: 100000000 },
    channels: ['in_app', 'browser'],
    severity: 'critical',
    cooldownMinutes: 30,
  },
  {
    name: 'Portfolio Drawdown',
    description: 'Portfolio drops 15% from peak',
    enabled: true,
    category: 'risk',
    indicator: 'drawdown',
    condition: { type: 'above', value: 15 },
    channels: ['in_app', 'browser'],
    severity: 'critical',
    cooldownMinutes: 60,
  },
  {
    name: 'Sentiment Shift',
    description: 'Market sentiment changes significantly',
    enabled: false,
    category: 'sentiment',
    indicator: 'sentiment_change',
    condition: { type: 'change_percent', value: 20 },
    channels: ['in_app'],
    severity: 'warning',
    cooldownMinutes: 120,
  },
  {
    name: 'Strong Buy Signal',
    description: 'Quant engine generates strong buy',
    enabled: true,
    category: 'signal',
    indicator: 'signal_strength',
    condition: { type: 'above', value: 80 },
    channels: ['in_app', 'browser'],
    severity: 'info',
    cooldownMinutes: 60,
  },
];

// ==================== ALERT STORE ====================

interface AlertState {
  alerts: Alert[];
  triggers: AlertTrigger[];
  channelConfig: ChannelConfig;
  
  // Actions
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt' | 'updatedAt' | 'triggerCount'>) => Alert;
  updateAlert: (id: string, updates: Partial<Alert>) => void;
  deleteAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
  
  addTrigger: (trigger: Omit<AlertTrigger, 'id' | 'timestamp' | 'read' | 'dismissed'>) => void;
  markTriggerRead: (id: string) => void;
  dismissTrigger: (id: string) => void;
  clearTriggers: () => void;
  
  updateChannelConfig: (config: Partial<ChannelConfig>) => void;
  
  getUnreadCount: () => number;
  initializePresets: () => void;
}

const generateId = () => `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useAlertStore = create<AlertState>()(
  persist(
    (set, get) => ({
      alerts: [],
      triggers: [],
      channelConfig: {
        telegram: { enabled: false, botToken: '', chatId: '' },
        discord: { enabled: false, webhookUrl: '' },
        email: { enabled: false, address: '' },
        browser: { enabled: false, permission: 'default' },
      },
      
      addAlert: (alertData) => {
        const newAlert: Alert = {
          ...alertData,
          id: generateId(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          triggerCount: 0,
        };
        
        set(state => ({
          alerts: [...state.alerts, newAlert],
        }));
        
        return newAlert;
      },
      
      updateAlert: (id, updates) => {
        set(state => ({
          alerts: state.alerts.map(alert =>
            alert.id === id
              ? { ...alert, ...updates, updatedAt: Date.now() }
              : alert
          ),
        }));
      },
      
      deleteAlert: (id) => {
        set(state => ({
          alerts: state.alerts.filter(alert => alert.id !== id),
        }));
      },
      
      toggleAlert: (id) => {
        set(state => ({
          alerts: state.alerts.map(alert =>
            alert.id === id
              ? { ...alert, enabled: !alert.enabled, updatedAt: Date.now() }
              : alert
          ),
        }));
      },
      
      addTrigger: (triggerData) => {
        const trigger: AlertTrigger = {
          ...triggerData,
          id: `trigger_${Date.now()}`,
          timestamp: Date.now(),
          read: false,
          dismissed: false,
        };
        
        set(state => ({
          triggers: [trigger, ...state.triggers].slice(0, 500), // Keep last 500
        }));
        
        // Update alert trigger count
        set(state => ({
          alerts: state.alerts.map(alert =>
            alert.id === triggerData.alertId
              ? { 
                  ...alert, 
                  triggerCount: alert.triggerCount + 1,
                  lastTriggered: Date.now(),
                }
              : alert
          ),
        }));
      },
      
      markTriggerRead: (id) => {
        set(state => ({
          triggers: state.triggers.map(t =>
            t.id === id ? { ...t, read: true } : t
          ),
        }));
      },
      
      dismissTrigger: (id) => {
        set(state => ({
          triggers: state.triggers.map(t =>
            t.id === id ? { ...t, dismissed: true, read: true } : t
          ),
        }));
      },
      
      clearTriggers: () => {
        set({ triggers: [] });
      },
      
      updateChannelConfig: (config) => {
        set(state => ({
          channelConfig: { ...state.channelConfig, ...config },
        }));
      },
      
      getUnreadCount: () => {
        return get().triggers.filter(t => !t.read && !t.dismissed).length;
      },
      
      initializePresets: () => {
        const state = get();
        if (state.alerts.length === 0) {
          PRESET_ALERTS.forEach(preset => {
            state.addAlert(preset);
          });
        }
      },
    }),
    {
      name: 'xrpl-alerts',
    }
  )
);

// ==================== ALERT ENGINE ====================

class AlertEngine {
  private previousValues: Map<string, number> = new Map();
  private isRunning = false;
  
  /**
   * Check if an alert should trigger
   */
  checkCondition(
    condition: AlertCondition,
    currentValue: number,
    previousValue?: number
  ): boolean {
    switch (condition.type) {
      case 'above':
        return currentValue > condition.value;
      
      case 'below':
        return currentValue < condition.value;
      
      case 'crosses_above':
        return previousValue !== undefined && 
               previousValue <= condition.value && 
               currentValue > condition.value;
      
      case 'crosses_below':
        return previousValue !== undefined && 
               previousValue >= condition.value && 
               currentValue < condition.value;
      
      case 'change_percent':
        if (previousValue === undefined || previousValue === 0) return false;
        const changePercent = ((currentValue - previousValue) / previousValue) * 100;
        return Math.abs(changePercent) >= condition.value;
      
      case 'equals':
        return Math.abs(currentValue - condition.value) < 0.0001;
      
      default:
        return false;
    }
  }
  
  /**
   * Process a market data update and check all alerts
   */
  processUpdate(
    category: AlertCategory,
    asset: string | undefined,
    indicator: string,
    value: number
  ): AlertTrigger[] {
    const store = useAlertStore.getState();
    const triggeredAlerts: AlertTrigger[] = [];
    const key = `${category}_${asset || 'global'}_${indicator}`;
    const previousValue = this.previousValues.get(key);
    
    // Update stored value
    this.previousValues.set(key, value);
    
    // Check each enabled alert
    for (const alert of store.alerts) {
      if (!alert.enabled) continue;
      if (alert.category !== category) continue;
      if (alert.asset && alert.asset !== asset) continue;
      if (alert.indicator !== indicator) continue;
      
      // Check cooldown
      if (alert.lastTriggered) {
        const cooldownMs = alert.cooldownMinutes * 60 * 1000;
        if (Date.now() - alert.lastTriggered < cooldownMs) continue;
      }
      
      // Check condition
      if (this.checkCondition(alert.condition, value, previousValue)) {
        const trigger = this.createTrigger(alert, value);
        triggeredAlerts.push(trigger);
        
        // Add to store
        store.addTrigger(trigger);
        
        // Deliver to channels
        this.deliverAlert(alert, trigger);
      }
    }
    
    return triggeredAlerts;
  }
  
  /**
   * Create a trigger object from an alert
   */
  private createTrigger(alert: Alert, value: number): Omit<AlertTrigger, 'id' | 'timestamp' | 'read' | 'dismissed'> {
    const conditionText = this.getConditionText(alert.condition);
    
    return {
      alertId: alert.id,
      alertName: alert.name,
      category: alert.category,
      asset: alert.asset,
      severity: alert.severity,
      title: alert.name,
      message: `${alert.asset || 'Market'} ${alert.indicator}: ${value.toLocaleString()} ${conditionText}`,
      value,
      threshold: alert.condition.value,
      deliveredTo: [],
      failedChannels: [],
    };
  }
  
  private getConditionText(condition: AlertCondition): string {
    switch (condition.type) {
      case 'above': return `(above ${condition.value})`;
      case 'below': return `(below ${condition.value})`;
      case 'crosses_above': return `(crossed above ${condition.value})`;
      case 'crosses_below': return `(crossed below ${condition.value})`;
      case 'change_percent': return `(changed ${condition.value}%+)`;
      default: return '';
    }
  }
  
  /**
   * Deliver alert to configured channels
   */
  private async deliverAlert(alert: Alert, trigger: Omit<AlertTrigger, 'id' | 'timestamp' | 'read' | 'dismissed'>): Promise<void> {
    const config = useAlertStore.getState().channelConfig;
    const deliveredTo: AlertChannel[] = ['in_app']; // Always delivered in-app
    const failedChannels: AlertChannel[] = [];
    
    for (const channel of alert.channels) {
      try {
        switch (channel) {
          case 'browser':
            if (config.browser.enabled && config.browser.permission === 'granted') {
              await this.sendBrowserNotification(trigger);
              deliveredTo.push('browser');
            }
            break;
          
          case 'telegram':
            if (config.telegram.enabled && config.telegram.botToken && config.telegram.chatId) {
              await this.sendTelegramNotification(trigger, config.telegram);
              deliveredTo.push('telegram');
            }
            break;
          
          case 'discord':
            if (config.discord.enabled && config.discord.webhookUrl) {
              await this.sendDiscordNotification(trigger, config.discord);
              deliveredTo.push('discord');
            }
            break;
          
          case 'email':
            // Email would require backend service
            // Placeholder for future implementation
            break;
        }
      } catch (error) {
        console.error(`[AlertEngine] Failed to deliver to ${channel}:`, error);
        failedChannels.push(channel);
      }
    }
  }
  
  /**
   * Send browser push notification
   */
  private async sendBrowserNotification(trigger: Omit<AlertTrigger, 'id' | 'timestamp' | 'read' | 'dismissed'>): Promise<void> {
    if (!('Notification' in window)) return;
    
    const icon = trigger.severity === 'critical' ? '🚨' : 
                 trigger.severity === 'warning' ? '⚠️' : 'ℹ️';
    
    new Notification(`${icon} ${trigger.title}`, {
      body: trigger.message,
      icon: '/favicon.ico',
      tag: trigger.alertId,
      requireInteraction: trigger.severity === 'critical',
    });
  }
  
  /**
   * Send Telegram notification
   */
  private async sendTelegramNotification(
    trigger: Omit<AlertTrigger, 'id' | 'timestamp' | 'read' | 'dismissed'>,
    config: { botToken: string; chatId: string }
  ): Promise<void> {
    const emoji = trigger.severity === 'critical' ? '🚨' : 
                  trigger.severity === 'warning' ? '⚠️' : 'ℹ️';
    
    const text = `${emoji} *${trigger.title}*\n\n${trigger.message}\n\n_${new Date().toLocaleString()}_`;
    
    // Note: In production, this should go through a backend proxy to protect the bot token
    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
    
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });
  }
  
  /**
   * Send Discord webhook notification
   */
  private async sendDiscordNotification(
    trigger: Omit<AlertTrigger, 'id' | 'timestamp' | 'read' | 'dismissed'>,
    config: { webhookUrl: string }
  ): Promise<void> {
    const color = trigger.severity === 'critical' ? 0xFF0000 : 
                  trigger.severity === 'warning' ? 0xFFFF00 : 0x00FF00;
    
    await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: trigger.title,
          description: trigger.message,
          color,
          timestamp: new Date().toISOString(),
          footer: {
            text: `Memetic Lab Alert • ${trigger.category}`,
          },
        }],
      }),
    });
  }
  
  /**
   * Request browser notification permission
   */
  async requestBrowserPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    
    const permission = await Notification.requestPermission();
    
    useAlertStore.getState().updateChannelConfig({
      browser: {
        enabled: permission === 'granted',
        permission,
      },
    });
    
    return permission === 'granted';
  }
}

// ==================== SINGLETON INSTANCE ====================

export const alertEngine = new AlertEngine();

// ==================== CONVENIENCE EXPORTS ====================

export function processAlertUpdate(
  category: AlertCategory,
  asset: string | undefined,
  indicator: string,
  value: number
): AlertTrigger[] {
  return alertEngine.processUpdate(category, asset, indicator, value);
}

export function requestNotificationPermission(): Promise<boolean> {
  return alertEngine.requestBrowserPermission();
}

// ==================== REACT HOOKS ====================

import { useEffect } from 'react';

export function useAlertNotifications() {
  const { triggers, alerts, getUnreadCount, markTriggerRead, dismissTrigger } = useAlertStore();
  
  const unreadCount = getUnreadCount();
  const unreadTriggers = triggers.filter(t => !t.read && !t.dismissed);
  const criticalTriggers = unreadTriggers.filter(t => t.severity === 'critical');
  
  return {
    triggers,
    unreadTriggers,
    criticalTriggers,
    unreadCount,
    alerts,
    markRead: markTriggerRead,
    dismiss: dismissTrigger,
  };
}

export function useAlertInitialization() {
  const initializePresets = useAlertStore(state => state.initializePresets);
  
  useEffect(() => {
    initializePresets();
  }, [initializePresets]);
}

export default alertEngine;
