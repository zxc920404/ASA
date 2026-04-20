import Phaser from 'phaser';
import { eventBus } from '../../core/events/EventBus';
import { GameEventNames } from '../../core/events/GameEvents';

export class PauseMenuUI {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container | null = null;
  private escKey: Phaser.Input.Keyboard.Key | null = null;
  private isPaused: boolean = false;
  private onResume: () => void;
  private onRestart: () => void;
  private onMainMenu: () => void;

  private onPause: (() => void) | undefined;

  constructor(
    scene: Phaser.Scene,
    callbacks: {
      onResume: () => void;
      onRestart: () => void;
      onMainMenu: () => void;
      onPause?: () => void;
    },
  ) {
    this.scene = scene;
    this.onResume = callbacks.onResume;
    this.onRestart = callbacks.onRestart;
    this.onMainMenu = callbacks.onMainMenu;
    this.onPause = callbacks.onPause;
    this.setupInput();
  }

  private setupInput(): void {
    if (this.scene.input.keyboard) {
      this.escKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      this.escKey.on('down', () => this.toggle());
    }
  }

  toggle(): void {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  pause(): void {
    if (this.isPaused) return;
    this.isPaused = true;
    this.scene.physics.pause();
    this.onPause?.();
    this.showPanel();
    eventBus.emit(GameEventNames.GAME_PAUSED, {});
  }

  resume(): void {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.hidePanel();
    this.scene.physics.resume();
    this.onResume();
    eventBus.emit(GameEventNames.GAME_RESUMED, {});
  }

  get paused(): boolean {
    return this.isPaused;
  }

  private showPanel(): void {
    const { width, height } = this.scene.cameras.main;
    const cx = width / 2;
    const cy = height / 2;

    this.container = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(500);

    // Dim overlay
    const overlay = this.scene.add.rectangle(cx, cy, width, height, 0x000000, 0.7);
    overlay.setInteractive(); // Block clicks through
    this.container.add(overlay);

    // Title
    const title = this.scene.add.text(cx, cy - 100, '⏸ 暫停', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(title);

    // Buttons
    const buttons = [
      { text: '▶  繼續遊戲', action: () => this.resume() },
      { text: '🔄  重新開始', action: () => { this.hidePanel(); this.onRestart(); } },
      { text: '🏠  返回主選單', action: () => { this.hidePanel(); this.onMainMenu(); } },
    ];

    buttons.forEach((btn, i) => {
      const y = cy - 20 + i * 60;
      const bg = this.scene.add.rectangle(cx, y, 240, 48, 0x333366, 0.9)
        .setStrokeStyle(1, 0x6666aa)
        .setInteractive({ useHandCursor: true });
      const label = this.scene.add.text(cx, y, btn.text, {
        fontSize: '20px',
        color: '#ddddff',
      }).setOrigin(0.5);

      bg.on('pointerover', () => bg.setFillStyle(0x4444aa, 1));
      bg.on('pointerout', () => bg.setFillStyle(0x333366, 0.9));
      bg.on('pointerdown', btn.action);

      this.container!.add([bg, label]);
    });
  }

  private hidePanel(): void {
    if (this.container) {
      this.container.destroy(true);
      this.container = null;
    }
  }

  destroy(): void {
    this.hidePanel();
    if (this.escKey) {
      this.escKey.removeAllListeners();
    }
  }
}
