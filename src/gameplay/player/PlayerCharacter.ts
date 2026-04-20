import Phaser from 'phaser';
import { CharacterConfig, StatModifier, StatType } from '../../data/types';
import { IPlayerCharacter } from '../../core/interfaces/IPlayerCharacter';
import { eventBus } from '../../core/events/EventBus';
import { GameEventNames } from '../../core/events/GameEvents';

export class PlayerCharacter implements IPlayerCharacter {
  readonly config: CharacterConfig;
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly position: Phaser.Math.Vector2;

  currentHP: number;
  maxHP: number;

  private scene: Phaser.Scene;
  private mapWidth: number;
  private mapHeight: number;
  private modifiers: StatModifier[] = [];
  private baseStats: Map<StatType, number> = new Map();
  private isDead: boolean = false;

  constructor(scene: Phaser.Scene, config: CharacterConfig, mapWidth: number, mapHeight: number) {
    this.scene = scene;
    this.config = config;
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;

    // Init base stats
    this.baseStats.set('maxHP', config.baseHP);
    this.baseStats.set('moveSpeed', config.baseMoveSpeed);
    this.baseStats.set('attackPower', config.baseAttackPower);
    this.baseStats.set('pickupRange', config.basePickupRange);

    this.maxHP = config.baseHP;
    this.currentHP = this.maxHP;

    // Create sprite at map center
    this.sprite = scene.add.sprite(mapWidth / 2, mapHeight / 2, 'player');
    this.sprite.setDepth(10);

    // Enable physics
    scene.physics.add.existing(this.sprite);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);

    this.position = new Phaser.Math.Vector2(this.sprite.x, this.sprite.y);
  }

  move(direction: Phaser.Math.Vector2): void {
    if (this.isDead) return;

    const speed = this.getEffectiveStat('moveSpeed');
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    if (direction.x !== 0 || direction.y !== 0) {
      body.setVelocity(direction.x * speed, direction.y * speed);
      // Flip sprite based on movement direction
      if (direction.x !== 0) {
        this.sprite.setFlipX(direction.x < 0);
      }
    } else {
      body.setVelocity(0, 0);
    }
  }

  update(_delta: number): void {
    // Sync position
    this.position.set(this.sprite.x, this.sprite.y);

    // Clamp to map bounds
    const halfW = this.sprite.width / 2;
    const halfH = this.sprite.height / 2;
    this.sprite.x = Phaser.Math.Clamp(this.sprite.x, halfW, this.mapWidth - halfW);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, halfH, this.mapHeight - halfH);
    this.position.set(this.sprite.x, this.sprite.y);
  }

  takeDamage(damage: number): void {
    if (this.isDead) return;

    this.currentHP = Math.max(0, this.currentHP - damage);

    eventBus.emit(GameEventNames.PLAYER_DAMAGED, {
      damage,
      remainingHP: this.currentHP,
    });

    // Flash red
    this.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.sprite.clearTint();
    });

    if (this.currentHP <= 0) {
      this.isDead = true;
      eventBus.emit(GameEventNames.GAME_OVER, {
        survivalTime: 0,
        killCount: 0,
        gold: 0,
        maxLevel: 1,
      });
    }
  }

  applyStatModifier(modifier: StatModifier): void {
    this.modifiers.push(modifier);
    this.recalculateStats();
  }

  removeStatModifier(modifier: StatModifier): void {
    const idx = this.modifiers.indexOf(modifier);
    if (idx !== -1) {
      this.modifiers.splice(idx, 1);
      this.recalculateStats();
    }
  }

  getEffectiveStat(statName: string): number {
    const base = this.baseStats.get(statName as StatType) ?? 0;
    let flat = 0;
    let percent = 0;

    for (const mod of this.modifiers) {
      if (mod.stat === statName) {
        if (mod.type === 'flat') flat += mod.value;
        else percent += mod.value;
      }
    }

    return (base + flat) * (1 + percent);
  }

  private recalculateStats(): void {
    this.maxHP = this.getEffectiveStat('maxHP');
    if (this.currentHP > this.maxHP) {
      this.currentHP = this.maxHP;
    }
  }
}
