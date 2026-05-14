import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload(): void {
    this.createLoadingBar();
    this.generatePlaceholderTextures();

    // === Texture Atlas (Sprite Atlas) ===
    // Load game atlas if available, otherwise use placeholder textures
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn(`Failed to load: ${file.key} from ${file.url}`);
    });

    // Main game atlas containing all sprites
    this.load.atlas(
      'game-atlas',
      'assets/sprites/game-atlas.png',
      'assets/sprites/game-atlas.json'
    );

    // === Background Images ===
    // Grass battle background for large explorable map
    this.load.image('grass_bg', 'assets/sprites/grass_battle_bg.png');

    // === Tilemap JSON ===
    // Forest map
    this.load.tilemapTiledJSON('map-forest', 'assets/tilemaps/forest.json');
    this.load.image('tileset-forest', 'assets/tilemaps/tileset-forest.png');

    // Cemetery map
    this.load.tilemapTiledJSON('map-cemetery', 'assets/tilemaps/cemetery.json');
    this.load.image('tileset-cemetery', 'assets/tilemaps/tileset-cemetery.png');

    // === Audio Files ===
    // Background Music (BGM)
    this.load.audio('bgm-forest', 'assets/audio/bgm/forest.mp3');
    this.load.audio('bgm-cemetery', 'assets/audio/bgm/cemetery.mp3');
    this.load.audio('bgm-menu', 'assets/audio/bgm/menu.mp3');

    // Sound Effects (SFX)
    // Weapon sounds
    this.load.audio('sfx-knife', 'assets/audio/sfx/knife.mp3');
    this.load.audio('sfx-wand', 'assets/audio/sfx/wand.mp3');
    this.load.audio('sfx-whip', 'assets/audio/sfx/whip.mp3');
    this.load.audio('sfx-axe', 'assets/audio/sfx/axe.mp3');
    this.load.audio('sfx-garlic', 'assets/audio/sfx/garlic.mp3');
    this.load.audio('sfx-holywater', 'assets/audio/sfx/holywater.mp3');

    // Enemy sounds
    this.load.audio('sfx-enemy-hit', 'assets/audio/sfx/enemy-hit.mp3');
    this.load.audio('sfx-enemy-death', 'assets/audio/sfx/enemy-death.mp3');

    // Player sounds
    this.load.audio('sfx-player-hit', 'assets/audio/sfx/player-hit.mp3');
    this.load.audio('sfx-player-death', 'assets/audio/sfx/player-death.mp3');

    // UI sounds
    this.load.audio('sfx-levelup', 'assets/audio/sfx/levelup.mp3');
    this.load.audio('sfx-pickup', 'assets/audio/sfx/pickup.mp3');
    this.load.audio('sfx-button-click', 'assets/audio/sfx/button-click.mp3');
    this.load.audio('sfx-weapon-evolve', 'assets/audio/sfx/weapon-evolve.mp3');

    // === JSON Configuration Files ===
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
