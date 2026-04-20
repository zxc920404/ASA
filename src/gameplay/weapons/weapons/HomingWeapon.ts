import Phaser from 'phaser';
import { WeaponConfig } from '../../../data/types';
import { BaseWeapon } from './BaseWeapon';
import { ObjectPoolManager } from '../../../core/pool/ObjectPoolManager';

/** Homing projectile weapon (e.g. Magic Wand) */
export class HomingWeapon extends BaseWeapon {
  private poolManager: ObjectPoolManager;

  constructor(scene: Phaser.Scene, config: WeaponConfig, poolManager: ObjectPoolManager) {
    super(scene, config);
    this.poolManager = poolManager;
  }

  attack(origin: Phaser.Math.Vector2, direction: Phaser.Math.Vector2): void {
    const ld = this.getLevelData();
    const dir = direction.length() > 0 ? direction.clone().normalize() : new Phaser.Math.Vector2(1, 0);
    const speed = 300;

    for (let i = 0; i < ld.projectileCount; i++) {
      const angle = Math.atan2(dir.y, dir.x) + (i - (ld.projectileCount - 1) / 2) * 0.3;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      try {
        const pool = this.poolManager.getPool('projectile');
        pool.spawn(origin.x, origin.y, ld.damage, vx, vy, ld.attackRange / speed);
      } catch {
        // Pool not registered
      }
    }
  }
}
