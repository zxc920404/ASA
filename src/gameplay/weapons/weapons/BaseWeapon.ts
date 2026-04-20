import Phaser from 'phaser';
import { WeaponConfig, WeaponLevelData } from '../../../data/types';
import { IWeapon } from '../../../core/interfaces/IWeapon';
import { IPassiveItem } from '../../../core/interfaces/IPassiveItem';

export abstract class BaseWeapon implements IWeapon {
  readonly id: string;
  readonly config: WeaponConfig;
  readonly maxLevel: number;
  level: number = 1;

  protected scene: Phaser.Scene;
  protected timer: number = 0;

  constructor(scene: Phaser.Scene, config: WeaponConfig) {
    this.scene = scene;
    this.id = config.weaponId;
    this.config = config;
    this.maxLevel = config.maxLevel;
  }

  getLevelData(): WeaponLevelData {
    return this.config.levelData[this.level - 1];
  }

  levelUp(): void {
    if (this.level < this.maxLevel) {
      this.level++;
    }
  }

  canEvolve(passives: ReadonlyArray<IPassiveItem>): boolean {
    if (this.level < this.maxLevel) return false;
    if (!this.config.evolutionPassiveId) return false;
    return passives.some(p => p.id === this.config.evolutionPassiveId);
  }

  evolve(): IWeapon {
    // Placeholder — actual evolved weapon creation handled by WeaponSystem
    return this;
  }

  /** Returns true if attack fired this tick */
  tryAttack(delta: number, origin: Phaser.Math.Vector2, direction: Phaser.Math.Vector2, hasTarget: boolean): boolean {
    if (!hasTarget) return false;
    this.timer += delta / 1000;
    const ld = this.getLevelData();
    if (this.timer >= ld.attackInterval) {
      this.timer = 0;
      this.attack(origin, direction);
      return true;
    }
    return false;
  }

  abstract attack(origin: Phaser.Math.Vector2, direction: Phaser.Math.Vector2): void;

  destroy(): void {
    // Override in subclasses if needed
  }
}
