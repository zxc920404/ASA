// === core/interfaces/IEnemy.ts ===
import Phaser from 'phaser';
import { EnemyConfig } from '../../data/types';

export interface IEnemy {
  readonly id: string;
  readonly config: EnemyConfig;
  currentHP: number;
  readonly sprite: Phaser.GameObjects.Sprite;

  takeDamage(damage: number): void;
  setTarget(target: Phaser.Math.Vector2): void;
  activate(x: number, y: number, statMultiplier: number): void;
  deactivate(): void;
  update(delta: number): void;
}
