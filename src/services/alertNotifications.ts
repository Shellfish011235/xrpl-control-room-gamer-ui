/**
 * In-app alerts, channel settings (browser / Telegram / Discord), and trigger history.
 * Persisted locally; delivery to external channels is best-effort from the browser.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect, useMemo } from 'react';

export type AlertChannel = 'in_app' | 'browser' | 'telegram' | 'discord';

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

export interface Alert {
  id: string;
  name: string;
  description?: string;
  category: AlertCategory;
  asset?: string;
  indicator: string;
  condition: { type: string; value: number };
  channels: AlertChannel[];
  severity: 'info' | 'warning' | 'critical';
  cooldownMinutes: number;
  enabled: boolean;
  triggerCount: number;
  lastTriggeredAt?: number;
}

export interface AlertTrigger {
  id: string;
  alertId?: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  dismissed: boolean;
  severity: 'info' | 'warning' | 'critical';
  asset?: string;
}

export type BrowserPermission = 'default' | 'granted' | 'denied';

export interface ChannelConfig {
  browser: { enabled: boolean; permission: BrowserPermission };
  telegram: { enabled: boolean; botToken: string; chatId: string };
  discord: { enabled: boolean; webhookUrl: string };
  email: { enabled: boolean };
}

const defaultChannelConfig: ChannelConfig = {
  browser: { enabled: false, permission: 'default' },
  telegram: { enabled: false, botToken: '', chatId: '' },
  discord: { enabled: false, webhookUrl: '' },
  email: { enabled: false },
};

type AlertStore = {
  alerts: Alert[];
  triggers: AlertTrigger[];
  channelConfig: ChannelConfig;
  addAlert: (data: Omit<Alert, 'id' | 'triggerCount'> & Partial<Pick<Alert, 'triggerCount'>>) => void;
  updateAlert: (id: string, partial: Partial<Alert>) => void;
  deleteAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
  updateChannelConfig: (partial: Partial<{
    browser: Partial<ChannelConfig['browser']>;
    telegram: Partial<ChannelConfig['telegram']>;
    discord: Partial<ChannelConfig['discord']>;
    email: Partial<ChannelConfig['email']>;
  }>) => void;
  clearTriggers: () => void;
  markTriggerRead: (id: string) => void;
  dismissTrigger: (id: string) => void;
  getUnreadCount: () => number;
};

export const useAlertStore = create<AlertStore>()(
  persist(
    (set, get) => ({
      alerts: [],
      triggers: [],
      channelConfig: defaultChannelConfig,

      addAlert: (data) => {
        const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const alert: Alert = {
          id,
          triggerCount: data.triggerCount ?? 0,
          name: data.name,
          description: data.description,
          category: data.category,
          asset: data.asset,
          indicator: data.indicator ?? 'price',
          condition: data.condition ?? { type: 'above', value: 0 },
          channels: data.channels ?? ['in_app'],
          severity: data.severity ?? 'info',
          cooldownMinutes: data.cooldownMinutes ?? 60,
          enabled: data.enabled ?? true,
        };
        set((s) => ({ alerts: [...s.alerts, alert] }));
      },

      updateAlert: (id, partial) =>
        set((s) => ({
          alerts: s.alerts.map((a) => (a.id === id ? { ...a, ...partial } : a)),
        })),

      deleteAlert: (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),

      toggleAlert: (id) =>
        set((s) => ({
          alerts: s.alerts.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
        })),

      updateChannelConfig: (partial) =>
        set((s) => {
          const c = s.channelConfig;
          return {
            channelConfig: {
              browser: partial.browser ? { ...c.browser, ...partial.browser } : c.browser,
              telegram: partial.telegram ? { ...c.telegram, ...partial.telegram } : c.telegram,
              discord: partial.discord ? { ...c.discord, ...partial.discord } : c.discord,
              email: partial.email ? { ...c.email, ...partial.email } : c.email,
            },
          };
        }),

      clearTriggers: () => set({ triggers: [] }),

      markTriggerRead: (id) =>
        set((s) => ({
          triggers: s.triggers.map((t) => (t.id === id ? { ...t, read: true } : t)),
        })),

      dismissTrigger: (id) =>
        set((s) => ({
          triggers: s.triggers.map((t) => (t.id === id ? { ...t, dismissed: true, read: true } : t)),
        })),

      getUnreadCount: () => get().triggers.filter((t) => !t.read && !t.dismissed).length,
    }),
    {
      name: 'xrpl-control-room-alerts',
      partialize: (s) => ({
        alerts: s.alerts,
        triggers: s.triggers,
        channelConfig: s.channelConfig,
      }),
    }
  )
);

export function useAlertNotifications() {
  const triggers = useAlertStore((s) => s.triggers);
  const markRead = useAlertStore((s) => s.markTriggerRead);
  const dismiss = useAlertStore((s) => s.dismissTrigger);

  const unreadTriggers = useMemo(() => triggers.filter((t) => !t.read && !t.dismissed), [triggers]);
  const unreadCount = unreadTriggers.length;

  return { unreadCount, unreadTriggers, markRead, dismiss };
}

/** Sync browser notification permission into channel config once on load. */
export function useAlertInitialization(): void {
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const permission = Notification.permission as BrowserPermission;
    useAlertStore.getState().updateChannelConfig({
      browser: { permission },
    });
  }, []);
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  const result = await Notification.requestPermission();
  const permission = result as BrowserPermission;
  const granted = result === 'granted';
  useAlertStore.getState().updateChannelConfig({
    browser: { permission, enabled: granted },
  });
  return granted;
}

export const alertEngine = {
  async sendTestTelegram(cfg: { botToken: string; chatId: string }): Promise<{ ok: boolean; error?: string }> {
    try {
      const botToken = cfg.botToken?.trim();
      const chatId = cfg.chatId?.trim();
      if (!botToken || !chatId) return { ok: false, error: 'Missing token or chat ID' };

      const url = `https://api.telegram.org/bot${encodeURIComponent(botToken)}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: 'XRPL Control Room: test message from Alerts.',
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { description?: string };
      if (!res.ok) return { ok: false, error: data.description || res.statusText };
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
    }
  },

  async sendTestDiscord(cfg: { webhookUrl: string }): Promise<{ ok: boolean; error?: string }> {
    try {
      const webhookUrl = cfg.webhookUrl?.trim();
      if (!webhookUrl) return { ok: false, error: 'Missing webhook URL' };

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'XRPL Control Room: test message from Alerts.' }),
      });
      if (!res.ok) return { ok: false, error: res.statusText };
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
    }
  },
};
