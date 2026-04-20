import Phaser from 'phaser';
import { WeaponConfig } from '../../../data/types';
import { BaseWeapon } from './BaseWeapon';
import { ObjectPoolManager } from '../../../core/pool/ObjectPoolManager';

/** Random direction projectile weapon (e.g. Axe) */
export class RandomWeapon extends BaseWeapon {
  private poolManager: ObjectPoolManager;

  constructor(scene: Phaser.Scene, config: WeaponConfig, poolManager: ObjectPoolManager) {
    super(scene, config);
    this.poolManager = poolManager;
  }

  attack(origin: Phaser.Math.Vector2, _direction: Phaser.Math.Vector2): void {
    const ld = this.getLevelData();
    const speed = 350;

    for (let i = 0; i < ld.projectileCount; i++) {
      const angle = Math.random() * Math.PI * 2;
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
