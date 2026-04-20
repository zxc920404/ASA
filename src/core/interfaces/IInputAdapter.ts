// === core/interfaces/IInputAdapter.ts ===
import Phaser from 'phaser';

export interface IInputAdapter {
  getMovementInput(): Phaser.Math.Vector2;
  isPointerDown(): boolean;
  getPointerPosition(): Phaser.Math.Vector2;
  update(delta: number): void;
  destroy(): void;
}
