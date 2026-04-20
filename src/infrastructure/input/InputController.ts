import Phaser from 'phaser';
import { IInputAdapter } from '../../core/interfaces/IInputAdapter';
import { TouchInputAdapter } from './TouchInputAdapter';
import { KeyboardMouseAdapter } from './KeyboardMouseAdapter';

export class InputController {
  private adapter: IInputAdapter;

  constructor(scene: Phaser.Scene) {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.adapter = isTouch
      ? new TouchInputAdapter(scene)
      : new KeyboardMouseAdapter(scene);
  }

  getMovement(): Phaser.Math.Vector2 {
    return this.adapter.getMovementInput();
  }

  isPointerDown(): boolean {
    return this.adapter.isPointerDown();
  }

  getPointerPosition(): Phaser.Math.Vector2 {
    return this.adapter.getPointerPosition();
  }

  update(delta: number): void {
    this.adapter.update(delta);
  }

  destroy(): void {
    this.adapter.destroy();
  }
}
