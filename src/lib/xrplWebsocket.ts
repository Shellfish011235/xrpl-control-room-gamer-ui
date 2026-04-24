/**
 * XRPL WebSocket: URL from xrplUrlBridge (set by xrplEndpointManager), reconnect with backoff, ledger subscription.
 * Unintentional closes: manager may advance endpoint (auto) before the next connect attempt.
 */

import { getPickedWsUrl } from './xrplUrlBridge';
import { onBeforeWebsocketRetry } from '../services/xrplWebsocketPolicy';

const MAX_BACKOFF_MS = 30000;
const INITIAL_BACKOFF_MS = 1000;
const BACKOFF_MULTIPLIER = 1.5;

type MessageHandler = (data: unknown) => void;

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let backoffMs = INITIAL_BACKOFF_MS;
let connectionStartMs = 0;
const handlers = new Set<MessageHandler>();

let state: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
let lastLedgerIndex: number | null = null;
let lastError: string | null = null;

function getCurrentWsUrlForConnect(): string {
  return getPickedWsUrl();
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
  } catch (_) {
    /* */
  }
}

export function getConnectionState(): 'disconnected' | 'connecting' | 'connected' {
  return state;
}

export function getWebSocketState(): 'disconnected' | 'connecting' | 'connected' {
  return getConnectionState();
}

export function getLastLedgerIndex(): number | null {
  return lastLedgerIndex;
}

export function getLastError(): string | null {
  return lastError;
}

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

  setState('connecting');
  lastError = null;

  let url: string;
  try {
    url = getCurrentWsUrlForConnect();
  } catch (e) {
    lastError = e instanceof Error ? e.message : String(e);
    setState('disconnected');
    scheduleReconnect();
    return;
  }

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
      onBeforeWebsocketRetry();
      connectInternal();
    }
  }, backoffMs);
  backoffMs = Math.min(MAX_BACKOFF_MS, backoffMs * BACKOFF_MULTIPLIER);
}

/**
 * Intentional disconnect: no failover, no "advance" side effects in policy hook.
 */
export function disconnect(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  backoffMs = INITIAL_BACKOFF_MS;
  if (ws) {
    const old = ws;
    ws = null;
    old.onopen = null;
    old.onmessage = null;
    old.onerror = null;
    old.onclose = null;
    try {
      old.close();
    } catch {
      /* */
    }
  }
  setState('disconnected');
  lastError = null;
}

/**
 * Rebind to current picked URL (pool/index changed). Strips close handlers to avoid a stray failover advance.
 */
export function connectToPickedUrl(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  backoffMs = INITIAL_BACKOFF_MS;
  if (ws) {
    const old = ws;
    ws = null;
    old.onopen = null;
    old.onmessage = null;
    old.onerror = null;
    old.onclose = null;
    try {
      old.close();
    } catch {
      /* */
    }
  }
  setState('disconnected');
  connectInternal();
}

export function reconnectWebSocket(): void {
  connectToPickedUrl();
}

export function setIntentionalDisconnect(_v: boolean): void {
  /* no-op: programmatic reconnect via connectToPickedUrl / disconnect */
}

/**
 * Public connect. Idempotent for non-open.
 */
export function connect(): void {
  if (ws?.readyState === WebSocket.OPEN) return;
  if (state === 'connecting') return;
  connectInternal();
}

export function subscribe(streams: string[]): void {
  if (ws?.readyState !== WebSocket.OPEN || !streams.length) return;
  ws.send(JSON.stringify({ command: 'subscribe', streams }));
}

export function onMessage(handler: MessageHandler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}
