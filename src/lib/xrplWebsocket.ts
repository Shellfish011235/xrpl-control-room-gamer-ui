/**
 * XRPL WebSocket manager: configurable URL, reconnect with backoff, ledger/transactions/validations subscriptions.
 * Connection state and last ledger index are exposed for the Node Status widget.
 */

import { getWsUrl, getPublicWsFallbacks, isCustomNode } from '../config/xrplNode';

const MAX_BACKOFF_MS = 30000;
const INITIAL_BACKOFF_MS = 1000;
const BACKOFF_MULTIPLIER = 1.5;

type MessageHandler = (data: unknown) => void;

let ws: WebSocket | null = null;
let url: string = '';
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let backoffMs = INITIAL_BACKOFF_MS;
let connectionStartMs = 0;
const handlers = new Set<MessageHandler>();

let state: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
let lastLedgerIndex: number | null = null;
let lastError: string | null = null;

let wsFallbackIndex = 0;

function getCurrentWsUrl(): string {
  if (isCustomNode()) return getWsUrl();
  const fallbacks = getPublicWsFallbacks();
  return fallbacks[wsFallbackIndex % Math.max(1, fallbacks.length)];
}

function setState(s: typeof state) {
  state = s;
  notifyStateChange();
}

function notifyStateChange() {
  try {
    if (typeof window !== 'undefined' && (window as unknown as { __xrplWsStateChange?: () => void }).__xrplWsStateChange) {
      (window as unknown as { __xrplWsStateChange: () => void }).__xrplWsStateChange();
    }
  } catch (_) {}
}

export function getConnectionState(): 'disconnected' | 'connecting' | 'connected' {
  return state;
}

export function getLastLedgerIndex(): number | null {
  return lastLedgerIndex;
}

export function getLastError(): string | null {
  return lastError;
}

/** Seconds since connection opened (0 if not connected). */
export function getConnectionUptimeSeconds(): number {
  if (state !== 'connected' || !connectionStartMs) return 0;
  return Math.floor((Date.now() - connectionStartMs) / 1000);
}

export function onStateChange(callback: () => void): () => void {
  (window as unknown as { __xrplWsStateChange?: () => void }).__xrplWsStateChange = callback;
  return () => {
    (window as unknown as { __xrplWsStateChange?: () => void }).__xrplWsStateChange = undefined;
  };
}

function handleMessage(event: MessageEvent) {
  try {
    const data = JSON.parse(event.data as string) as unknown;
    if (data && typeof data === 'object' && 'ledger_index' in data && typeof (data as { ledger_index?: number }).ledger_index === 'number') {
      lastLedgerIndex = (data as { ledger_index: number }).ledger_index;
    }
    if (data && typeof data === 'object' && 'type' in data && (data as { type?: string }).type === 'ledgerClosed' && 'ledger_index' in data) {
      lastLedgerIndex = (data as { ledger_index: number }).ledger_index;
    }
    if (data && typeof data === 'object' && 'result' in data) {
      const r = (data as { result?: { ledger_index?: number; ledger?: { ledger_index?: number } } }).result;
      if (r?.ledger_index) lastLedgerIndex = r.ledger_index;
      else if (r?.ledger?.ledger_index) lastLedgerIndex = r.ledger.ledger_index;
    }
    handlers.forEach((h) => {
      try {
        h(data);
      } catch (e) {
        console.warn('[XRPL WS] handler error:', e);
      }
    });
  } catch (e) {
    console.warn('[XRPL WS] parse error:', e);
  }
}

function connectInternal() {
  if (ws?.readyState === WebSocket.OPEN) return;

  url = getCurrentWsUrl();
  setState('connecting');
  lastError = null;

  try {
    ws = new WebSocket(url);
  } catch (e) {
    lastError = e instanceof Error ? e.message : String(e);
    setState('disconnected');
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    backoffMs = INITIAL_BACKOFF_MS;
    connectionStartMs = Date.now();
    setState('connected');
    lastError = null;
    ws?.send(JSON.stringify({ command: 'subscribe', streams: ['ledger'] }));
    // Call subscribe(['transactions']) or subscribe(['validations']) from app if needed.
  };

  ws.onmessage = handleMessage;

  ws.onerror = () => {
    lastError = 'WebSocket error';
  };

  ws.onclose = () => {
    ws = null;
    setState('disconnected');
    if (!reconnectTimer) scheduleReconnect();
  };
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (state === 'disconnected') {
      if (!isCustomNode()) {
        wsFallbackIndex = (wsFallbackIndex + 1) % Math.max(1, getPublicWsFallbacks().length);
      }
      connectInternal();
    }
  }, backoffMs);
  backoffMs = Math.min(MAX_BACKOFF_MS, backoffMs * BACKOFF_MULTIPLIER);
}

/**
 * Connect to the configured WebSocket URL. Idempotent.
 */
export function connect(): void {
  if (ws?.readyState === WebSocket.OPEN) return;
  if (state === 'connecting') return;
  connectInternal();
}

/**
 * Disconnect and stop reconnecting.
 */
export function disconnect(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  backoffMs = INITIAL_BACKOFF_MS;
  if (ws) {
    ws.close();
    ws = null;
  }
  setState('disconnected');
  lastError = null;
}

/**
 * Subscribe to streams (e.g. ['ledger', 'transactions']). Call after connect; sends subscribe command.
 */
export function subscribe(streams: string[]): void {
  if (ws?.readyState !== WebSocket.OPEN || !streams.length) return;
  ws.send(JSON.stringify({ command: 'subscribe', streams }));
}

/**
 * Add a callback for every WebSocket message. Returns unsubscribe.
 */
export function onMessage(handler: MessageHandler): () => void {
  handlers.add(handler);
  return () => handlers.delete(handler);
}
