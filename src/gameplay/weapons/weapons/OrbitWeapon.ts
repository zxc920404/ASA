import Phaser from 'phaser';
import { WeaponConfig } from '../../../data/types';
import { BaseWeapon } from './BaseWeapon';
import { ObjectPoolManager } from '../../../core/pool/ObjectPoolManager';

/**
 * 環繞武器（太極環、烈焰掌）
 * 在玩家周圍生成環繞的投射物，持續傷害接觸的敵人。
 * projectileCount 決定環繞數量，attackRange 決定環繞半徑。
 */
export class OrbitWeapon extends BaseWeapon {
  private poolManager: ObjectPoolManager;

  constructor(scene: Phaser.Scene, config: WeaponConfig, poolManager: ObjectPoolManager) {
    super(scene, config);
    this.poolManager = poolManager;
  }

  attack(origin: Phaser.Math.Vector2, _direction: Phaser.Math.Vector2): void {
    const ld = this.getLevelData();
    const range = ld.attackRange;
    const count = Math.max(1, ld.projectileCount);

    try {
      const pool = this.poolManager.getPool('projectile');

      // 生成環繞投射物，均勻分布在圓周上
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i + (Date.now() * 0.003); // 旋轉動畫
        const x = origin.x + Math.cos(angle) * range;
        const y = origin.y + Math.sin(angle) * range;

        // AoE 投射物：靜止、短生命週期、有 aoeRadius 可穿透打多敵
        pool.spawn(x, y, ld.damage, 0, 0, 0.35, range * 0.4);
      }
    } catch {
      // Pool not registered
    }
  }
}
