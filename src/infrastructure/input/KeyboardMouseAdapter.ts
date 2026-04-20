import Phaser from 'phaser';
import { IInputAdapter } from '../../core/interfaces/IInputAdapter';

export class KeyboardMouseAdapter implements IInputAdapter {
  private scene: Phaser.Scene;
  private keys: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private direction: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const kb = scene.input.keyboard!;
    this.keys = {
      W: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  getMovementInput(): Phaser.Math.Vector2 {
    return this.direction;
  }

  isPointerDown(): boolean {
    return this.scene.input.activePointer.isDown;
  }

  getPointerPosition(): Phaser.Math.Vector2 {
    const p = this.scene.input.activePointer;
    return new Phaser.Math.Vector2(p.worldX, p.worldY);
  }

  update(_delta: number): void {
    let x = 0;
    let y = 0;
    if (this.keys.W.isDown) y -= 1;
    if (this.keys.S.isDown) y += 1;
    if (this.keys.A.isDown) x -= 1;
    if (this.keys.D.isDown) x += 1;

    if (x !== 0 || y !== 0) {
      this.direction.set(x, y).normalize();
    } else {
      this.direction.set(0, 0);
    }
  }

  destroy(): void {
    // Phaser handles keyboard cleanup
  }
}
