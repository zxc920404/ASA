import Phaser from 'phaser';
import { WeaponConfig } from '../../../data/types';
import { BaseWeapon } from './BaseWeapon';
import { ObjectPoolManager } from '../../../core/pool/ObjectPoolManager';

/**
 * 範圍武器（天雷引、飛花摘葉）
 * 在玩家周圍隨機位置生成 AoE 傷害區域。
 */
export class AreaWeapon extends BaseWeapon {
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

      for (let i = 0; i < count; i++) {
        // 在攻擊範圍內隨機位置
        const angle = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * range * 0.7;
        const x = origin.x + Math.cos(angle) * dist;
        const y = origin.y + Math.sin(angle) * dist;

        // AoE 投射物：靜止、有範圍、可穿透
        pool.spawn(x, y, ld.damage, 0, 0, 1.2, 40);
      }
    } catch {
      // Pool not registered
    }
  }
}
