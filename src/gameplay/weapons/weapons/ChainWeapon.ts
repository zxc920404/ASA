import Phaser from 'phaser';
import { WeaponConfig } from '../../../data/types';
import { BaseWeapon } from './BaseWeapon';
import { ObjectPoolManager } from '../../../core/pool/ObjectPoolManager';

/**
 * 連鎖武器（醉拳、鐵布衫）
 * 朝面對方向依序生成多個打擊點，每個打擊點有 AoE 範圍。
 */
export class ChainWeapon extends BaseWeapon {
  private poolManager: ObjectPoolManager;

  constructor(scene: Phaser.Scene, config: WeaponConfig, poolManager: ObjectPoolManager) {
    super(scene, config);
    this.poolManager = poolManager;
  }

  attack(origin: Phaser.Math.Vector2, direction: Phaser.Math.Vector2): void {
    const ld = this.getLevelData();
    const dir = direction.length() > 0 ? direction.clone().normalize() : new Phaser.Math.Vector2(1, 0);
    const range = ld.attackRange;
    const count = Math.max(1, ld.projectileCount);

    try {
      const pool = this.poolManager.getPool('projectile');

      for (let i = 0; i < count; i++) {
        const dist = (range / count) * (i + 1);
        const x = origin.x + dir.x * dist;
        const y = origin.y + dir.y * dist;

        // 每個打擊點有 AoE 範圍，生命週期稍長確保碰撞檢測
        pool.spawn(x, y, ld.damage, 0, 0, 0.5, 30);
      }
    } catch {
      // Pool not registered
    }
  }
}
