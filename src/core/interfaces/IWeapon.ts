// === core/interfaces/IWeapon.ts ===
import Phaser from 'phaser';
import { WeaponConfig, WeaponLevelData } from '../../data/types';
import { IPassiveItem } from './IPassiveItem';

export interface IWeapon {
  readonly id: string;
  readonly config: WeaponConfig;
  level: number;
  readonly maxLevel: number;

  attack(origin: Phaser.Math.Vector2, direction: Phaser.Math.Vector2): void;
  levelUp(): void;
  canEvolve(passives: ReadonlyArray<IPassiveItem>): boolean;
  evolve(): IWeapon;
  getLevelData(): WeaponLevelData;
  destroy(): void;
}
