import Phaser from 'phaser';
import { WeaponConfig } from '../../data/types';
import { IWeapon } from '../../core/interfaces/IWeapon';
import { IPassiveItem } from '../../core/interfaces/IPassiveItem';
import { ObjectPoolManager } from '../../core/pool/ObjectPoolManager';
import { BaseWeapon } from './weapons/BaseWeapon';
import { ProjectileWeapon } from './weapons/ProjectileWeapon';
import { AreaWeapon } from './weapons/AreaWeapon';
import { OrbitWeapon } from './weapons/OrbitWeapon';
import { HomingWeapon } from './weapons/HomingWeapon';
import { ChainWeapon } from './weapons/ChainWeapon';
import { RandomWeapon } from './weapons/RandomWeapon';

export const MAX_WEAPONS = 6;
export const MAX_PASSIVES = 6;

export class WeaponSystem {
  private scene: Phaser.Scene;
  private poolManager: ObjectPoolManager;
  private weapons: BaseWeapon[] = [];
  private passives: IPassiveItem[] = [];
  private playerPos: Phaser.Math.Vector2;
  private getEnemies: () => { sprite: Phaser.GameObjects.Sprite }[];
  private attackPowerMultiplier: () => number;

  constructor(
    scene: Phaser.Scene,
    poolManager: ObjectPoolManager,
    playerPos: Phaser.Math.Vector2,
    getEnemies: () => { sprite: Phaser.GameObjects.Sprite }[],
    attackPowerMultiplier: () => number,
  ) {
    this.scene = scene;
    this.poolManager = poolManager;
    this.playerPos = playerPos;
    this.getEnemies = getEnemies;
    this.attackPowerMultiplier = attackPowerMultiplier;
  }

  addWeapon(config: WeaponConfig): IWeapon | null {
    if (this.weapons.length >= MAX_WEAPONS) return null;
    const weapon = this.createWeapon(config);
    if (weapon) this.weapons.push(weapon);
    return weapon;
  }

  addPassive(passive: IPassiveItem): boolean {
    if (this.passives.length >= MAX_PASSIVES) return false;
    this.passives.push(passive);
    return true;
  }

  getWeapons(): ReadonlyArray<IWeapon> { return this.weapons; }
  getPassives(): ReadonlyArray<IPassiveItem> { return this.passives; }

  getWeaponById(id: string): BaseWeapon | undefined {
    return this.weapons.find(w => w.id === id);
  }

  getPassiveById(id: string): IPassiveItem | undefined {
    return this.passives.find(p => p.id === id);
  }

  update(delta: number): void {
    const enemies = this.getEnemies();
    const hasTarget = enemies.length > 0;

    // Find nearest enemy direction
    let direction = new Phaser.Math.Vector2(1, 0);
    if (hasTarget) {
      let minDist = Infinity;
      for (const enemy of enemies) {
        const dx = enemy.sprite.x - this.playerPos.x;
        const dy = enemy.sprite.y - this.playerPos.y;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          minDist = dist;
          direction.set(dx, dy).normalize();
        }
      }
    }

    for (const weapon of this.weapons) {
      weapon.tryAttack(delta, this.playerPos, direction, hasTarget);
    }
  }

  /** Calculate final damage: baseDamage * attackPower multiplier */
  calculateDamage(baseDamage: number): number {
    return baseDamage * this.attackPowerMultiplier();
  }

  private createWeapon(config: WeaponConfig): BaseWeapon | null {
    switch (config.attackPattern) {
      case 'projectile': return new ProjectileWeapon(this.scene, config, this.poolManager);
      case 'area':       return new AreaWeapon(this.scene, config, this.poolManager);
      case 'orbit':      return new OrbitWeapon(this.scene, config, this.poolManager);
      case 'homing':     return new HomingWeapon(this.scene, config, this.poolManager);
      case 'chain':      return new ChainWeapon(this.scene, config, this.poolManager);
      case 'random':     return new RandomWeapon(this.scene, config, this.poolManager);
      default: return null;
    }
  }
}
