// === core/pool/PoolStats.ts ===
export interface PoolStats {
  preAllocated: number;
  currentActive: number;
  peakActive: number;
  totalExpansions: number;
}
