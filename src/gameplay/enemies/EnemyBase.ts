import Phaser from 'phaser';
import { EnemyConfig } from '../../data/types';
import { PoolableObject } from '../../core/pool/ObjectPool';
import { eventBus } from '../../core/events/EventBus';
import { GameEventNames, EnemyKilledEvent, EnemyDamagedEvent } from '../../core/events/GameEvents';

export class EnemyBase implements PoolableObject {
  readonly id: string;
  readonly config: EnemyConfig;
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly gameObject: Phaser.GameObjects.GameObject;

  currentHP: number = 0;
  private maxHP: number = 0;
  private damage: number = 0;
  private speed: number = 0;
  private target: Phaser.Math.Vector2 | null = null;
  private scene: Phaser.Scene;
  private isActive: boolean = false;
  private contactCooldown: number = 0;

  constructor(scene: Phaser.Scene, config: EnemyConfig) {
    this.scene = scene;
    this.id = config.enemyId;
    this.config = config;

    this.sprite = scene.add.sprite(0, 0, 'enemy');
    this.sprite.setVisible(false);
    this.sprite.setActive(false);

    scene.physics.add.existing(this.sprite);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCircle(config.bodySize);
    body.setOffset(
      (this.sprite.width - config.bodySize * 2) / 2,
      (this.sprite.height - config.bodySize * 2) / 2,
    );
    body.pushable = true;
    body.immovable = false;

    this.gameObject = this.sprite;
  }

  activate(x: number, y: number, statMultiplier: number = 1): void {
    this.isActive = true;
    this.maxHP = this.config.baseHP * statMultiplier;
    this.currentHP = this.maxHP;
    this.damage = this.config.baseDamage * statMultiplier;
    this.speed = this.config.moveSpeed;
    this.contactCooldown = 0;

    this.sprite.setPosition(x, y);
    this.sprite.setVisible(true);
    this.sprite.setActive(true);
    (this.sprite.body as Phaser.Physics.Arcade.Body).enable = true;
  }

  deactivate(): void {
    this.isActive = false;
    this.sprite.setVisible(false);
    this.sprite.setActive(false);
    (this.sprite.body as Phaser.Physics.Arcade.Body).enable = false;
    (this.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
  }

  setTarget(target: Phaser.Math.Vector2): void {
    this.target = target;
  }

  update(delta: number): void {
    if (!this.isActive || !this.target) return;

    // Move toward player
    const dx = this.target.x - this.sprite.x;
    const dy = this.target.y - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 1) {
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      body.setVelocity((dx / dist) * this.speed, (dy / dist) * this.speed);
      this.sprite.setFlipX(dx < 0);
    }

    if (this.contactCooldown > 0) {
      this.contactCooldown -= delta / 1000;
    }
  }

  takeDamage(amount: number): void {
    if (!this.isActive) return;
    this.currentHP -= amount;

    // Emit damage event for DamageTextManager
    const dmgEvent: EnemyDamagedEvent = {
      position: { x: this.sprite.x, y: this.sprite.y },
      damage: amount,
      enemyId: this.id,
    };
    eventBus.emit(GameEventNames.ENEMY_DAMAGED, dmgEvent);

    // Flash white
    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (this.isActive) this.sprite.clearTint();
    });

    if (this.currentHP <= 0) {
      this.die();
    }
  }

  /** Returns contact damage if cooldown allows, else 0 */
  getContactDamage(): number {
    if (this.contactCooldown > 0) return 0;
    this.contactCooldown = 0.5; // 0.5s cooldown between hits
    return this.damage;
  }

  private die(): void {
    const event: EnemyKilledEvent = {
      position: { x: this.sprite.x, y: this.sprite.y },
      enemyId: this.id,
      xpValue: this.config.xpValue,
    };
    eventBus.emit(GameEventNames.ENEMY_KILLED, event);
    // Deactivation handled by spawner via pool despawn
  }
}
