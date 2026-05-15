import Phaser from 'phaser';
import { IInputAdapter } from '../../core/interfaces/IInputAdapter';
import { touchPerformanceMonitor } from '../../utils/TouchPerformanceBenchmark';

/**
 * TouchInputAdapter - 觸控輸入適配器
 * 
 * 實作浮動虛擬搖桿，支援多點觸控：
 * - 使用 activePointerId 追蹤控制搖桿的觸控點
 * - 其他觸控點不會干擾搖桿操作
 * - 支援同時進行 UI 互動（如點擊按鈕）
 * 
 * 任務 4.2.1: 實作浮動虛擬搖桿
 * 任務 4.2.2: 實作搖桿死區
 * 任務 4.2.3: 支援多點觸控
 */
export class TouchInputAdapter implements IInputAdapter {
  private scene: Phaser.Scene;
  private joystickBase: Phaser.GameObjects.Image;
  private joystickThumb: Phaser.GameObjects.Image;
  private joystickRadius: number = 60;
  private deadZoneRatio: number = 0.15;
  private direction: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
  private isActive: boolean = false;
  private activePointerId: number = -1;
  private enablePerformanceMonitoring: boolean = false; // 開發模式可啟用

  constructor(scene: Phaser.Scene, enablePerformanceMonitoring: boolean = false) {
    this.scene = scene;
    this.enablePerformanceMonitoring = enablePerformanceMonitoring;

    // 手機版降低透明度，不遮擋太多畫面
    this.joystickBase = scene.add.image(0, 0, 'joystick-base')
      .setScrollFactor(0).setDepth(1000).setAlpha(0.35).setVisible(false);
    this.joystickThumb = scene.add.image(0, 0, 'joystick-thumb')
      .setScrollFactor(0).setDepth(1001).setAlpha(0.5).setVisible(false);

    this.setupTouchListeners();

    // 開發模式下輸出性能監控提示
    if (this.enablePerformanceMonitoring && import.meta.env.DEV) {
      console.log('[TouchInputAdapter] Performance monitoring enabled');
    }
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
      // 只在左半螢幕且未啟動時啟動搖桿
      if (pointer.x < this.scene.scale.width / 2 && !this.isActive) {
        const startTime = this.enablePerformanceMonitoring ? performance.now() : 0;

        this.isActive = true;
        this.activePointerId = pointer.id;
        
        // 計算 safe area bottom（避開瀏覽器工具列）
        const safeBottom = 80; // 預留底部空間
        const maxY = this.scene.scale.height - safeBottom;
        
        // 限制搖桿位置不要太靠近底部
        const joystickY = Math.min(pointer.y, maxY);
        
        this.joystickBase.setPosition(pointer.x, joystickY).setVisible(true);
        this.joystickThumb.setPosition(pointer.x, joystickY).setVisible(true);

        if (this.enablePerformanceMonitoring) {
          const endTime = performance.now();
          touchPerformanceMonitor.recordLatency(startTime, endTime);
        }
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isActive || pointer.id !== this.activePointerId) return;

      const startTime = this.enablePerformanceMonitoring ? performance.now() : 0;

      const dx = pointer.x - this.joystickBase.x;
      const dy = pointer.y - this.joystickBase.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 死區判定
      if (distance < this.joystickRadius * this.deadZoneRatio) {
        this.direction.set(0, 0);
        this.joystickThumb.setPosition(this.joystickBase.x, this.joystickBase.y);
        
        if (this.enablePerformanceMonitoring) {
          const endTime = performance.now();
          touchPerformanceMonitor.recordLatency(startTime, endTime);
        }
        return;
      }

      const clampedDist = Math.min(distance, this.joystickRadius);
      const angle = Math.atan2(dy, dx);
      this.joystickThumb.setPosition(
        this.joystickBase.x + Math.cos(angle) * clampedDist,
        this.joystickBase.y + Math.sin(angle) * clampedDist,
      );
      // 已經是單位向量，無需 normalize()
      this.direction.set(Math.cos(angle), Math.sin(angle));

      if (this.enablePerformanceMonitoring) {
        const endTime = performance.now();
        touchPerformanceMonitor.recordLatency(startTime, endTime);
      }
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.activePointerId) {
        const startTime = this.enablePerformanceMonitoring ? performance.now() : 0;

        this.isActive = false;
        this.activePointerId = -1;
        this.direction.set(0, 0);
        this.joystickBase.setVisible(false);
        this.joystickThumb.setVisible(false);

        if (this.enablePerformanceMonitoring) {
          const endTime = performance.now();
          touchPerformanceMonitor.recordLatency(startTime, endTime);
        }
      }
    });
  }
}
