import { useState, useEffect, useCallback } from 'react';
import { getConnectionState, onStateChange, connect } from '../lib/xrplWebsocket';
import { getSourceLabel, subscribeEndpoint } from '../services/xrplEndpointManager';
import { useXrplEndpointStore } from '../store/xrplEndpointStore';
import { Link } from 'react-router-dom';
import { redactUrlLikeText } from '../lib/endpointDisplay';

/**
 * Top bar: node online state, active source, RTT. Updates on WS + endpoint store changes.
 */
export function XrplEndpointStatusBar() {
  const [wsSt, setWsSt] = useState(getConnectionState);
  const latency = useXrplEndpointStore((s) => s.latencyMs);
  const lastErr = useXrplEndpointStore((s) => s.lastError);
  const [source, setSource] = useState(getSourceLabel);
  const tick = useCallback(() => {
    setWsSt(getConnectionState());
    setSource(getSourceLabel());
  }, []);

  useEffect(() => {
    connect();
    const u1 = onStateChange(tick);
    const u2 = subscribeEndpoint(tick);
    return () => {
      u1();
      u2();
    };
  }, [tick]);

  useEffect(() => {
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, [tick]);

  const online = wsSt === 'connected';
  const line1 = `NODE: ${online ? 'ONLINE' : wsSt === 'connecting' ? '…' : 'OFFLINE'}`;
  const line2 = `SOURCE: ${source.toUpperCase().replace(/\s/g, ' ').slice(0, 22)}`;
  const line3 = latency != null ? `LATENCY: ${latency}ms` : 'LATENCY: —';

  return (
    <div className="hidden lg:flex flex-col items-end text-[9px] font-cyber leading-tight text-cyber-muted border border-cyber-border/50 rounded-md px-2 py-1 bg-cyber-darker/60 min-w-[120px]">
      <span
        className={online ? 'text-cyber-green' : 'text-cyber-red/90'}
        title={lastErr ? redactUrlLikeText(lastErr) : undefined}
      >
        {line1}
      </span>
      <span className="text-cyber-cyan/90 truncate max-w-[160px]" title={getSourceLabel()}>
        {line2}
      </span>
      <span className="text-cyber-text/80">{line3}</span>
      <Link
        to="/settings/node"
        className="text-cyber-glow/80 hover:text-cyber-glow text-[8px] mt-0.5"
      >
        endpoint settings
      </Link>
    </div>
  );
}
