// === core/pool/ObjectPool.ts ===
import { PoolStats } from './PoolStats';

export interface PoolConfig {
  poolId: string;
  preAllocateCount: number;
  maxBatchExpansion: number; // 上限 10
}

export interface PoolableObject {
  activate(x: number, y: number, ...args: any[]): void;
  deactivate(): void;
  readonly gameObject: Phaser.GameObjects.GameObject;
}

export class ObjectPool<T extends PoolableObject> {
  private available: T[] = [];
  private active: Set<T> = new Set();
  private stats: PoolStats;
  private factory: () => T;
  private config: PoolConfig;

  constructor(config: PoolConfig, factory: () => T) {
    this.config = config;
    this.factory = factory;
    this.stats = { preAllocated: 0, currentActive: 0, peakActive: 0, totalExpansions: 0 };
  }

  preAllocate(): void {
    for (let i = 0; i < this.config.preAllocateCount; i++) {
      const obj = this.factory();
      obj.deactivate();
      this.available.push(obj);
    }
    this.stats.preAllocated = this.config.preAllocateCount;
  }

  spawn(x: number, y: number, ...args: any[]): T {
    if (this.available.length === 0) {
      this.expand();
    }
    const obj = this.available.pop()!;
    obj.activate(x, y, ...args);
    this.active.add(obj);
    this.stats.currentActive = this.active.size;
    if (this.active.size > this.stats.peakActive) {
      this.stats.peakActive = this.active.size;
    }
    return obj;
  }

  despawn(obj: T): void {
    obj.deactivate();
    this.active.delete(obj);
    this.available.push(obj);
    this.stats.currentActive = this.active.size;
  }

  private expand(): void {
    const batchSize = Math.min(this.config.maxBatchExpansion, 10);
    for (let i = 0; i < batchSize; i++) {
      const obj = this.factory();
      obj.deactivate();
      this.available.push(obj);
    }
    this.stats.totalExpansions++;
  }

  getStats(): PoolStats {
    return { ...this.stats };
  }

  getActiveObjects(): ReadonlySet<T> {
    return this.active;
  }

  clear(): void {
    this.active.forEach(obj => obj.deactivate());
    this.active.clear();
    this.available = [];
    this.stats.currentActive = 0;
  }
}
