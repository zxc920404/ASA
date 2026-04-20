// === core/pool/ObjectPoolManager.ts ===
import { ObjectPool, PoolableObject, PoolConfig } from './ObjectPool';
import { PoolStats } from './PoolStats';

export class ObjectPoolManager {
  private pools: Map<string, ObjectPool<any>> = new Map();

  register<T extends PoolableObject>(
    config: PoolConfig,
    factory: () => T
  ): ObjectPool<T> {
    const pool = new ObjectPool<T>(config, factory);
    pool.preAllocate();
    this.pools.set(config.poolId, pool);
    return pool;
  }

  getPool<T extends PoolableObject>(poolId: string): ObjectPool<T> {
    const pool = this.pools.get(poolId);
    if (!pool) throw new Error(`Pool not found: ${poolId}`);
    return pool as ObjectPool<T>;
  }

  getAllStats(): Map<string, PoolStats> {
    const result = new Map<string, PoolStats>();
    this.pools.forEach((pool, id) => result.set(id, pool.getStats()));
    return result;
  }

  clearAll(): void {
    this.pools.forEach(pool => pool.clear());
  }
}
