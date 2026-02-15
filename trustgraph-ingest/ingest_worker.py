"""
XRPL WebSocket ingest worker: subscribe to ledgers/transactions, batch and POST to TrustGraph /ingest/batch.
Keeps the graph current for the Ledger Knowledge Agent.
"""
import asyncio
import json
import os
import signal
import sys
import httpx

try:
    import websockets
except ImportError:
    print("Install websockets: pip install websockets", file=sys.stderr)
    sys.exit(1)

TRUSTGRAPH_URL = os.environ.get("TRUSTGRAPH_URL", "http://localhost:8000")
XRPL_WS_URL = os.environ.get("XRPL_WS_URL", "wss://s1.ripple.com")
INGEST_BATCH_SIZE = int(os.environ.get("INGEST_BATCH_SIZE", "50"))
INGEST_LEDGER_SUBSCRIPTION = os.environ.get("INGEST_LEDGER_SUBSCRIPTION", "true").lower() == "true"

batch: list = []
shutdown = False


def _normalize_tx(msg: dict) -> dict | None:
    """Normalize from ledger stream or tx response to TrustGraph ingest shape. Returns None if not Payment/TrustSet."""
    if "transaction" in msg:
        t = dict(msg["transaction"])
        t["ledger_index"] = msg.get("ledger_index")
        t["hash"] = msg.get("hash") or t.get("hash")
    else:
        t = dict(msg)
    if t.get("TransactionType") not in ("Payment", "TrustSet"):
        return None
    return t


async def flush_batch():
    global batch
    if not batch:
        return
    to_send = batch[:INGEST_BATCH_SIZE]
    batch = batch[INGEST_BATCH_SIZE:]
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            r = await client.post(f"{TRUSTGRAPH_URL.rstrip('/')}/ingest/batch", json={"transactions": to_send})
            r.raise_for_status()
            print(f"[ingest] flushed {len(to_send)} txs -> TrustGraph")
        except Exception as e:
            print(f"[ingest] batch POST failed: {e}", file=sys.stderr)
            batch = to_send + batch


async def handle_ledger(ws, message: dict):
    """On ledgerClosed, fetch transactions and add to batch."""
    if message.get("type") != "ledgerClosed" or not INGEST_LEDGER_SUBSCRIPTION:
        return
    ledger_index = message.get("ledger_index")
    if not ledger_index:
        return
    # In production, call XRPL ledger_data to fetch tx list and then account_tx or ledger entries.
    # Here we only subscribe to ledger stream; rippled does not send full txs in ledgerClosed.
    # So we subscribe to transactions stream instead (below).
    pass


async def handle_tx(ws, message: dict):
    """On transaction, normalize and add to batch; flush periodically."""
    global batch
    if message.get("type") != "transaction":
        return
    tx = _normalize_tx(message)
    if tx:
        batch.append(tx)
    if len(batch) >= INGEST_BATCH_SIZE:
        await flush_batch()


async def run_websocket():
    async with websockets.connect(
        XRPL_WS_URL,
        ping_interval=20,
        ping_timeout=10,
        close_timeout=5,
    ) as ws:
        # Subscribe to transactions stream for incremental ingest
        await ws.send(json.dumps({
            "id": 1,
            "command": "subscribe",
            "streams": ["transactions"],
        }))
        resp = await ws.recv()
        print("[ingest] subscribed to XRPL transactions stream", json.loads(resp).get("status"))

        while not shutdown:
            try:
                raw = await asyncio.wait_for(ws.recv(), timeout=30.0)
                msg = json.loads(raw)
                await handle_tx(ws, msg)
            except asyncio.TimeoutError:
                await flush_batch()
            except websockets.ConnectionClosed as e:
                print("[ingest] connection closed", e, file=sys.stderr)
                break
        await flush_batch()


def main():
    global shutdown
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    def sig(*_):
        nonlocal shutdown
        shutdown = True

    signal.signal(signal.SIGTERM, sig)
    signal.signal(signal.SIGINT, sig)

    print(f"[ingest] TrustGraph={TRUSTGRAPH_URL} XRPL={XRPL_WS_URL} batch_size={INGEST_BATCH_SIZE}")
    while not shutdown:
        try:
            loop.run_until_complete(run_websocket())
        except Exception as e:
            print(f"[ingest] error: {e}", file=sys.stderr)
        if shutdown:
            break
        print("[ingest] reconnecting in 10s...")
        loop.run_until_complete(asyncio.sleep(10))
    loop.close()


if __name__ == "__main__":
    main()
