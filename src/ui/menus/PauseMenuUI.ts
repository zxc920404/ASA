import Phaser from 'phaser';
import { eventBus } from '../../core/events/EventBus';
import { GameEventNames } from '../../core/events/GameEvents';

export class PauseMenuUI {
  private scene: Phaser.Scene;
  private panelObjects: Phaser.GameObjects.GameObject[] = [];
  private pauseButton!: Phaser.GameObjects.Text;
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
    this.createPauseButton();
  }

  private setupInput(): void {
    if (this.scene.input.keyboard) {
      this.escKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      this.escKey.on('down', () => this.toggle());
    }
  }

  private createPauseButton(): void {
    const cam = this.scene.cameras.main;
    this.pauseButton = this.scene.add.text(cam.width - 16, 12, '⏸', {
      fontSize: '28px',
      color: '#ffffff',
      backgroundColor: '#00000066',
      padding: { x: 10, y: 6 },
    })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(150)
      .setInteractive({ useHandCursor: true });

    this.pauseButton.on('pointerdown', () => this.toggle());
    this.pauseButton.on('pointerover', () => this.pauseButton.setAlpha(0.7));
    this.pauseButton.on('pointerout', () => this.pauseButton.setAlpha(1));
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
    this.pauseButton.setVisible(false);
    this.showPanel();
    eventBus.emit(GameEventNames.GAME_PAUSED, {});
  }

  resume(): void {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.hidePanel();
    this.pauseButton.setVisible(true);
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

    // Overlay at depth 500 — blocks clicks to game behind it
    const overlay = this.scene.add.rectangle(cx, cy, width, height, 0x000000, 0.7)
      .setScrollFactor(0)
      .setDepth(500)
      .setInteractive();
    // Clicking overlay does nothing (just blocks)
    this.panelObjects.push(overlay);

    // Title at depth 501
    const title = this.scene.add.text(cx, cy - 100, '⏸ 暫停', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(501);
    this.panelObjects.push(title);

    // Buttons at depth 502 — higher than overlay so they receive clicks
    const buttonDefs = [
      { text: '▶  繼續遊戲', action: () => this.resume() },
      { text: '🔄  重新開始', action: () => { this.hidePanel(); this.onRestart(); } },
      { text: '🏠  返回主選單', action: () => { this.hidePanel(); this.onMainMenu(); } },
    ];

    buttonDefs.forEach((btn, i) => {
      const y = cy - 20 + i * 60;

      const bg = this.scene.add.rectangle(cx, y, 240, 48, 0x333366, 0.9)
        .setStrokeStyle(1, 0x6666aa)
        .setScrollFactor(0)
        .setDepth(502)
        .setInteractive({ useHandCursor: true });

      const label = this.scene.add.text(cx, y, btn.text, {
        fontSize: '20px',
        color: '#ddddff',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(503);

      bg.on('pointerover', () => {
        bg.setFillStyle(0x4444aa, 1);
        label.setColor('#ffffff');
      });
      bg.on('pointerout', () => {
        bg.setFillStyle(0x333366, 0.9);
        label.setColor('#ddddff');
      });
      bg.on('pointerdown', () => btn.action());

      this.panelObjects.push(bg, label);
    });
  }

  private hidePanel(): void {
    for (const obj of this.panelObjects) {
      obj.destroy();
    }
    this.panelObjects = [];
  }

  destroy(): void {
    this.hidePanel();
    if (this.escKey) {
      this.escKey.removeAllListeners();
    }
    if (this.pauseButton) {
      this.pauseButton.destroy();
    }
  }
}
