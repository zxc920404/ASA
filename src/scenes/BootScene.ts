import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload(): void {
    this.createLoadingBar();
    this.generatePlaceholderTextures();

    // Use Phaser's native loader so the scene waits for all JSON to finish
    // before calling create(). This prevents the race condition where
    // create() transitions to MainMenu before data is cached.
    this.load.json('weapons-config', 'data/weapons.json');
    this.load.json('enemies-config', 'data/enemies.json');
    this.load.json('characters-config', 'data/characters.json');
    this.load.json('waves-config', 'data/waves.json');
    this.load.json('pool-config', 'data/pool-config.json');
    this.load.json('passive-items-config', 'data/passive-items.json');
  }

  create(): void {
    this.scene.start('MainMenu');
  }

  private createLoadingBar(): void {
    const { width, height } = this.scale;
    const barBg = this.add.graphics();
    barBg.fillStyle(0x333333, 1);
    barBg.fillRect(width * 0.1, height / 2 - 2, width * 0.8, 34);

    const bar = this.add.graphics();
    const loadingText = this.add.text(width / 2, height / 2 - 30, 'Loading...', {
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.fillStyle(0x00ff00, 1);
      bar.fillRect(width * 0.1 + 2, height / 2, (width * 0.8 - 4) * value, 30);
    });

    this.load.on('complete', () => {
      bar.destroy();
      barBg.destroy();
      loadingText.destroy();
    });
  }

  private generatePlaceholderTextures(): void {
    // Player placeholder (blue square 32x32)
    const playerGfx = this.make.graphics({ x: 0, y: 0 }, false);
    playerGfx.fillStyle(0x4488ff, 1);
    playerGfx.fillRect(0, 0, 32, 32);
    playerGfx.generateTexture('player', 32, 32);
    playerGfx.destroy();

    // Enemy placeholder (red square 24x24)
    const enemyGfx = this.make.graphics({ x: 0, y: 0 }, false);
    enemyGfx.fillStyle(0xff4444, 1);
    enemyGfx.fillRect(0, 0, 24, 24);
    enemyGfx.generateTexture('enemy', 24, 24);
    enemyGfx.destroy();

    // Projectile placeholder (yellow circle 8x8)
    const projGfx = this.make.graphics({ x: 0, y: 0 }, false);
    projGfx.fillStyle(0xffff00, 1);
    projGfx.fillCircle(4, 4, 4);
    projGfx.generateTexture('projectile', 8, 8);
    projGfx.destroy();

    // XP gem placeholder (green diamond 12x12)
    const gemGfx = this.make.graphics({ x: 0, y: 0 }, false);
    gemGfx.fillStyle(0x00ff88, 1);
    gemGfx.fillRect(2, 2, 8, 8);
    gemGfx.generateTexture('xp_gem', 12, 12);
    gemGfx.destroy();

    // Joystick base (circle outline)
    const joyBaseGfx = this.make.graphics({ x: 0, y: 0 }, false);
    joyBaseGfx.lineStyle(2, 0xffffff, 0.5);
    joyBaseGfx.strokeCircle(50, 50, 50);
    joyBaseGfx.generateTexture('joystick-base', 100, 100);
    joyBaseGfx.destroy();

    // Joystick thumb (filled circle)
    const joyThumbGfx = this.make.graphics({ x: 0, y: 0 }, false);
    joyThumbGfx.fillStyle(0xffffff, 0.7);
    joyThumbGfx.fillCircle(20, 20, 20);
    joyThumbGfx.generateTexture('joystick-thumb', 40, 40);
    joyThumbGfx.destroy();
  }
}
