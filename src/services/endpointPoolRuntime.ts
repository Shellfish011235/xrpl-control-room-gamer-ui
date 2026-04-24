/** Injected at init by xrplEndpointManager; consumed by policy hook to avoid import cycles. */
let poolSize = 2;
export function setPoolSize(n: number): void {
  poolSize = Math.max(1, n);
}
export function getPoolSize(): number {
  return poolSize;
}
