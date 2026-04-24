import { DEFAULT_XRPL_PUBLIC_ENDPOINTS } from '../config/xrplPublicEndpoints';

/**
 * Hot-swappable URL providers (set at runtime by xrplEndpointManager).
 * Prevents import cycles: xrplWebsocket / xrplClient read through this, manager registers impl.
 */
const fallbackW = () => DEFAULT_XRPL_PUBLIC_ENDPOINTS[0]!.ws;
const fallbackR = () => DEFAULT_XRPL_PUBLIC_ENDPOINTS[0]!.rpc;

let pickWs: () => string = fallbackW;
let pickRpc: () => string = fallbackR;

export function registerXrplUrlPicks(getWs: () => string, getRpc: () => string): void {
  pickWs = getWs;
  pickRpc = getRpc;
}

export function getPickedRpcUrl(): string {
  return pickRpc();
}

export function getPickedWsUrl(): string {
  return pickWs();
}
