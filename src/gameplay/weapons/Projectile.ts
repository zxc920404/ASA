import Phaser from 'phaser';
import { PoolableObject } from '../../core/pool/ObjectPool';

/** Poolable projectile used by all weapon types */
export class Projectile implements PoolableObject {
  readonly gameObject: Phaser.GameObjects.GameObject;
  readonly sprite: Phaser.GameObjects.Sprite;
  damage: number = 0;
  aoeRadius: number = 0;
  private lifetime: number = 0;
  private maxLifetime: number = 1;
  private isActive: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.sprite = scene.add.sprite(0, 0, 'projectile');
    this.sprite.setVisible(false);
    this.sprite.setActive(false);
    scene.physics.add.existing(this.sprite);
    (this.sprite.body as Phaser.Physics.Arcade.Body).setCircle(6);
    this.gameObject = this.sprite;
  }

  activate(x: number, y: number, damage: number = 10, vx: number = 0, vy: number = 0, lifetime: number = 1, aoeRadius: number = 0): void {
    this.isActive = true;
    this.damage = damage;
    this.lifetime = 0;
    this.maxLifetime = lifetime;
    this.aoeRadius = aoeRadius;

    this.sprite.setPosition(x, y);
    this.sprite.setVisible(true);
    this.sprite.setActive(true);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setVelocity(vx, vy);

    if (aoeRadius > 0) {
      body.setCircle(aoeRadius);
      this.sprite.setScale(aoeRadius / 16);
    } else {
      body.setCircle(6);
      this.sprite.setScale(1);
    }
  }

  deactivate(): void {
    this.isActive = false;
    this.sprite.setVisible(false);
    this.sprite.setActive(false);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    body.setVelocity(0, 0);
  }

  update(delta: number): boolean {
    if (!this.isActive) return false;
    this.lifetime += delta / 1000;
    if (this.lifetime >= this.maxLifetime) {
      return true; // Should be despawned
    }
    return false;
  }

  get active(): boolean { return this.isActive; }
}
