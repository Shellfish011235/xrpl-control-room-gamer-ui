import { useEffect, useRef, useState } from "react";

type TxType =
  | "Payment"
  | "AMM/DEX"
  | "NFTs"
  | "Trustlines"
  | "Other";

function classifyTxType(tx: { transaction?: { TransactionType?: string } }): TxType {
  const t = tx?.transaction?.TransactionType ?? "Other";
  if (t === "Payment") return "Payment";
  if (t === "OfferCreate" || t === "OfferCancel") return "AMM/DEX";
  if (
    t === "AMMCreate" ||
    t === "AMMDeposit" ||
    t === "AMMWithdraw" ||
    t === "AMMBid" ||
    t === "AMMVote"
  )
    return "AMM/DEX";
  if (
    t === "NFTokenMint" ||
    t === "NFTokenBurn" ||
    t === "NFTokenCreateOffer" ||
    t === "NFTokenAcceptOffer"
  )
    return "NFTs";
  if (t === "TrustSet") return "Trustlines";
  return "Other";
}

type RecentTx = { type: TxType; hash: string };

const TYPE_LABELS: Record<TxType, string> = {
  Payment: "Payments",
  "AMM/DEX": "AMM/DEX",
  NFTs: "NFTs",
  Trustlines: "Trustlines",
  Other: "Other",
};

const ROLLING_SECONDS = 10;
const MAX_RECENT = 10;

export default function LedgerHeartbeat() {
  const [connected, setConnected] = useState(false);
  const [tps, setTps] = useState(0);
  const [counts, setCounts] = useState<Record<TxType, number>>({
    Payment: 0,
    "AMM/DEX": 0,
    NFTs: 0,
    Trustlines: 0,
    Other: 0,
  });
  const [recent, setRecent] = useState<RecentTx[]>([]);
  const rollingRef = useRef<Array<{ at: number; type: TxType }>>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // TPS + rolling counts every second
  useEffect(() => {
    let thisSecond = 0;
    const interval = setInterval(() => {
      setTps(thisSecond);
      const now = Date.now();
      const cutoff = now - ROLLING_SECONDS * 1000;
      rollingRef.current = rollingRef.current.filter((e) => e.at > cutoff);
      const next: Record<TxType, number> = {
        Payment: 0,
        "AMM/DEX": 0,
        NFTs: 0,
        Trustlines: 0,
        Other: 0,
      };
      rollingRef.current.forEach((e) => {
        next[e.type]++;
      });
      setCounts(next);
      thisSecond = 0;
    }, 1000);
    (window as unknown as { __ledgerCount?: (type: TxType) => void }).__ledgerCount = (
      type: TxType
    ) => {
      thisSecond++;
      rollingRef.current.push({ at: Date.now(), type });
    };
    return () => {
      clearInterval(interval);
      delete (window as unknown as { __ledgerCount?: (type: TxType) => void }).__ledgerCount;
    };
  }, []);

  // XRPL stream
  useEffect(() => {
    const ws = new WebSocket("wss://s1.ripple.com/");
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ command: "subscribe", streams: ["transactions"] }));
    };
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (evt) => {
      let data: { transaction?: { TransactionType?: string; hash?: string } };
      try {
        data = JSON.parse(evt.data as string);
      } catch {
        return;
      }
      const tx = data?.transaction;
      if (!tx) return;

      const type = classifyTxType({ transaction: tx });
      const count = (window as unknown as { __ledgerCount?: (type: TxType) => void }).__ledgerCount;
      count?.(type);

      const hash = tx.hash ?? "";
      setRecent((prev) => [{ type, hash }, ...prev].slice(0, MAX_RECENT));
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, []);

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-cyber-muted">XRPL ledger</span>
          <span
            className={`text-xs ${connected ? "text-cyber-green" : "text-cyber-muted"}`}
          >
            {connected ? "Live" : "Connecting…"}
          </span>
        </div>
        <div className="mb-6 flex items-baseline gap-2">
          <span className="text-3xl font-bold tabular-nums text-cyber-glow">{tps}</span>
          <span className="text-sm text-cyber-muted">tx/s</span>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-5">
          {(Object.keys(TYPE_LABELS) as TxType[]).map((type) => (
            <div key={type} className="flex justify-between gap-2 text-sm">
              <span className="text-cyber-muted">{TYPE_LABELS[type]}</span>
              <span className="tabular-nums text-cyber-text">{counts[type]}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-cyber-muted">
          Counts over last {ROLLING_SECONDS}s
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="mb-3 text-sm font-medium text-cyber-muted">Recent</div>
        <ul className="space-y-2">
          {recent.length === 0 ? (
            <li className="text-xs text-cyber-muted">Waiting for transactions…</li>
          ) : (
            recent.map((r, i) => (
              <li key={`${r.hash}-${i}`} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-cyber-text">{TYPE_LABELS[r.type]}</span>
                {r.hash ? (
                  <a
                    href={`https://livenet.xrpl.org/transactions/${r.hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs text-cyber-glow hover:underline"
                  >
                    {r.hash.slice(0, 8)}…{r.hash.slice(-4)}
                  </a>
                ) : (
                  <span className="font-mono text-xs text-cyber-muted">—</span>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
