// === core/interfaces/IPlayerCharacter.ts ===
import Phaser from 'phaser';
import { CharacterConfig, StatModifier } from '../../data/types';

export interface IPlayerCharacter {
  readonly config: CharacterConfig;
  currentHP: number;
  maxHP: number;
  readonly position: Phaser.Math.Vector2;
  readonly sprite: Phaser.GameObjects.Sprite;

  move(direction: Phaser.Math.Vector2): void;
  takeDamage(damage: number): void;
  applyStatModifier(modifier: StatModifier): void;
  removeStatModifier(modifier: StatModifier): void;
  getEffectiveStat(statName: string): number;
}
