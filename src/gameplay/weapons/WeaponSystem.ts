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

  /**
   * Evolve a weapon into its evolved form.
   * Creates an enhanced config from the weapon's max-level data:
   * damage x2, attackInterval x0.7, projectileCount +2.
   * Returns the evolved weapon, or null if evolution is not possible.
   */
  evolveWeapon(weaponId: string): BaseWeapon | null {
    const idx = this.weapons.findIndex(w => w.id === weaponId);
    if (idx === -1) return null;

    const weapon = this.weapons[idx];
    if (!weapon.canEvolve(this.passives)) return null;

    const originalConfig = weapon.config;
    const maxLevelData = originalConfig.levelData[originalConfig.maxLevel - 1];

    // Build evolved level data: single level with enhanced stats
    const evolvedLevelData = {
      level: 1,
      damage: maxLevelData.damage * 2,
      projectileCount: maxLevelData.projectileCount + 2,
      attackRange: maxLevelData.attackRange,
      attackInterval: Math.round(maxLevelData.attackInterval * 0.7 * 1000) / 1000,
      description: `${originalConfig.displayName} 進化型態`,
    };

    const evolvedConfig: WeaponConfig = {
      weaponId: originalConfig.evolvedWeaponId,
      displayName: `${originalConfig.displayName}・進化`,
      atlasFrame: originalConfig.atlasFrame,
      projectileFrame: originalConfig.projectileFrame,
      baseDamage: evolvedLevelData.damage,
      attackInterval: evolvedLevelData.attackInterval,
      attackRange: evolvedLevelData.attackRange,
      maxLevel: 1,
      attackPattern: originalConfig.attackPattern,
      levelData: [evolvedLevelData],
      evolutionPassiveId: '',
      evolvedWeaponId: '',
    };

    // Destroy old weapon and create evolved one
    weapon.destroy();
    const evolvedWeapon = this.createWeapon(evolvedConfig);
    if (evolvedWeapon) {
      this.weapons[idx] = evolvedWeapon;
    }
    return evolvedWeapon;
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
