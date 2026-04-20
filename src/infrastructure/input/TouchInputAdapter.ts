import Phaser from 'phaser';
import { IInputAdapter } from '../../core/interfaces/IInputAdapter';

export class TouchInputAdapter implements IInputAdapter {
  private scene: Phaser.Scene;
  private joystickBase: Phaser.GameObjects.Image;
  private joystickThumb: Phaser.GameObjects.Image;
  private joystickRadius: number = 60;
  private deadZoneRatio: number = 0.15;
  private direction: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
  private isActive: boolean = false;
  private activePointerId: number = -1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.joystickBase = scene.add.image(0, 0, 'joystick-base')
      .setScrollFactor(0).setDepth(1000).setAlpha(0.5).setVisible(false);
    this.joystickThumb = scene.add.image(0, 0, 'joystick-thumb')
      .setScrollFactor(0).setDepth(1001).setAlpha(0.7).setVisible(false);

    this.setupTouchListeners();
  }

  getMovementInput(): Phaser.Math.Vector2 {
    return this.direction;
  }

  isPointerDown(): boolean {
    return this.isActive;
  }

  getPointerPosition(): Phaser.Math.Vector2 {
    const p = this.scene.input.activePointer;
    return new Phaser.Math.Vector2(p.x, p.y);
  }

  update(_delta: number): void {
    // Joystick updates happen in pointer events
  }

  destroy(): void {
    this.joystickBase?.destroy();
    this.joystickThumb?.destroy();
  }

  private setupTouchListeners(): void {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.x < this.scene.scale.width / 2 && !this.isActive) {
        this.isActive = true;
        this.activePointerId = pointer.id;
        this.joystickBase.setPosition(pointer.x, pointer.y).setVisible(true);
        this.joystickThumb.setPosition(pointer.x, pointer.y).setVisible(true);
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isActive || pointer.id !== this.activePointerId) return;

      const dx = pointer.x - this.joystickBase.x;
      const dy = pointer.y - this.joystickBase.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.joystickRadius * this.deadZoneRatio) {
        this.direction.set(0, 0);
        this.joystickThumb.setPosition(this.joystickBase.x, this.joystickBase.y);
        return;
      }

      const clampedDist = Math.min(distance, this.joystickRadius);
      const angle = Math.atan2(dy, dx);
      this.joystickThumb.setPosition(
        this.joystickBase.x + Math.cos(angle) * clampedDist,
        this.joystickBase.y + Math.sin(angle) * clampedDist,
      );
      this.direction.set(Math.cos(angle), Math.sin(angle)).normalize();
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.activePointerId) {
        this.isActive = false;
        this.activePointerId = -1;
        this.direction.set(0, 0);
        this.joystickBase.setVisible(false);
        this.joystickThumb.setVisible(false);
      }
    });
  }
}
