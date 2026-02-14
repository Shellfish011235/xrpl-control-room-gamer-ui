import { useEffect, useRef, useState } from 'react';

export type LedgerTxType = 'Payment' | 'AMM/DEX' | 'NFTs' | 'Trustlines' | 'Other';

export interface LivePulse {
  id: string;
  type: LedgerTxType;
  timestamp: number;
  coordinates: [number, number];
}

function classifyTxType(tx: { transaction?: { TransactionType?: string } }): LedgerTxType {
  const t = tx?.transaction?.TransactionType ?? 'Other';
  if (t === 'Payment') return 'Payment';
  if (t === 'OfferCreate' || t === 'OfferCancel') return 'AMM/DEX';
  if (['AMMCreate', 'AMMDeposit', 'AMMWithdraw', 'AMMBid', 'AMMVote'].includes(t)) return 'AMM/DEX';
  if (['NFTokenMint', 'NFTokenBurn', 'NFTokenCreateOffer', 'NFTokenAcceptOffer'].includes(t)) return 'NFTs';
  if (t === 'TrustSet') return 'Trustlines';
  return 'Other';
}

// Rotate through these [lng, lat] so pulses appear in different regions
const PULSE_COORDINATES: [number, number][] = [
  [-74, 40.7],   // NYC
  [8.5, 51.5],   // Frankfurt
  [139.7, 35.7], // Tokyo
  [-0.1, 51.5],  // London
  [103.8, 1.35], // Singapore
  [-87.6, 41.9], // Chicago
  [151.2, -33.8],// Sydney
  [-99.1, 19.4], // Mexico City
];

const PULSE_MAX_AGE_MS = 900;
const TICK_MS = 60;
const WSS_URL = 'wss://s1.ripple.com/';

function shortId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function useLiveLedgerStream() {
  const [connected, setConnected] = useState(false);
  const [tps, setTps] = useState(0);
  const [pulses, setPulses] = useState<LivePulse[]>([]);

  const pulsesRef = useRef<LivePulse[]>([]);
  const coordIndexRef = useRef(0);
  const tpsCountRef = useRef(0);
  const tpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const ws = new WebSocket(WSS_URL);

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ command: 'subscribe', streams: ['transactions'] }));
    };

    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (evt) => {
      tpsCountRef.current += 1;
      let data: { transaction?: { TransactionType?: string } };
      try {
        data = JSON.parse(evt.data as string);
      } catch {
        return;
      }
      if (!data?.transaction) return;
      const type = classifyTxType(data);
      const coords = PULSE_COORDINATES[coordIndexRef.current % PULSE_COORDINATES.length];
      coordIndexRef.current += 1;
      pulsesRef.current.push({
        id: shortId(),
        type,
        timestamp: Date.now(),
        coordinates: [...coords],
      });
      if (pulsesRef.current.length > 80) {
        pulsesRef.current = pulsesRef.current.slice(-80);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  // TPS: reset count every second
  useEffect(() => {
    tpsIntervalRef.current = setInterval(() => {
      setTps(tpsCountRef.current);
      tpsCountRef.current = 0;
    }, 1000);
    return () => {
      if (tpsIntervalRef.current) clearInterval(tpsIntervalRef.current);
    };
  }, []);

  // Flush pulses to state periodically; keep only recent
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const recent = pulsesRef.current.filter((p) => now - p.timestamp < PULSE_MAX_AGE_MS);
      setPulses(recent);
    };
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, []);

  return { connected, tps, pulses };
}
