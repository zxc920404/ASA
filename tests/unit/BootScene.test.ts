import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BootScene } from '../../src/scenes/BootScene';

describe('BootScene', () => {
  let scene: BootScene;
  let mockLoad: any;
  let mockAdd: any;
  let mockMake: any;

  beforeEach(() => {
    // Create mock objects
    mockLoad = {
      atlas: vi.fn(),
      image: vi.fn(),
      tilemapTiledJSON: vi.fn(),
      audio: vi.fn(),
      json: vi.fn(),
      on: vi.fn(),
    };

    mockAdd = {
      text: vi.fn().mockReturnValue({
        setOrigin: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
        setText: vi.fn(),
      }),
      graphics: vi.fn().mockReturnValue({
        lineStyle: vi.fn().mockReturnThis(),
        strokeRect: vi.fn().mockReturnThis(),
        fillStyle: vi.fn().mockReturnThis(),
        fillRect: vi.fn().mockReturnThis(),
        strokeCircle: vi.fn().mockReturnThis(),
        fillCircle: vi.fn().mockReturnThis(),
        clear: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
        generateTexture: vi.fn(),
      }),
    };

    mockMake = {
      graphics: vi.fn().mockReturnValue({
        fillStyle: vi.fn().mockReturnThis(),
        fillRect: vi.fn().mockReturnThis(),
        fillCircle: vi.fn().mockReturnThis(),
        lineStyle: vi.fn().mockReturnThis(),
        strokeCircle: vi.fn().mockReturnThis(),
        generateTexture: vi.fn(),
        destroy: vi.fn(),
      }),
    };

    // Create scene instance with mocked dependencies
    scene = new BootScene();
    (scene as any).load = mockLoad;
    (scene as any).add = mockAdd;
    (scene as any).make = mockMake;
    (scene as any).scale = { width: 800, height: 600 };
    (scene as any).scene = { start: vi.fn() };
  });

  describe('preload()', () => {
    it('should load texture atlas', () => {
      scene.preload();

      expect(mockLoad.atlas).toHaveBeenCalledWith(
        'game-atlas',
        'assets/sprites/game-atlas.png',
        'assets/sprites/game-atlas.json'
      );
    });

    it('should load background images', () => {
      scene.preload();

      expect(mockLoad.image).toHaveBeenCalledWith(
        'grass_bg',
        'assets/sprites/grass_battle_bg.png'
      );
    });

    it('should load tilemap JSON files', () => {
      scene.preload();

      expect(mockLoad.tilemapTiledJSON).toHaveBeenCalledWith(
        'map-forest',
        'assets/tilemaps/forest.json'
      );
      expect(mockLoad.tilemapTiledJSON).toHaveBeenCalledWith(
        'map-cemetery',
        'assets/tilemaps/cemetery.json'
      );
    });

    it('should load tileset images', () => {
      scene.preload();

      expect(mockLoad.image).toHaveBeenCalledWith(
        'tileset-forest',
        'assets/tilemaps/tileset-forest.png'
      );
      expect(mockLoad.image).toHaveBeenCalledWith(
        'tileset-cemetery',
        'assets/tilemaps/tileset-cemetery.png'
      );
    });

    it('should load BGM audio files', () => {
      scene.preload();

      expect(mockLoad.audio).toHaveBeenCalledWith(
        'bgm-forest',
        'assets/audio/bgm/forest.mp3'
      );
      expect(mockLoad.audio).toHaveBeenCalledWith(
        'bgm-cemetery',
        'assets/audio/bgm/cemetery.mp3'
      );
      expect(mockLoad.audio).toHaveBeenCalledWith(
        'bgm-menu',
        'assets/audio/bgm/menu.mp3'
      );
    });

    it('should load weapon SFX audio files', () => {
      scene.preload();

      const weaponSounds = ['knife', 'wand', 'whip', 'axe', 'garlic', 'holywater'];
      weaponSounds.forEach((weapon) => {
        expect(mockLoad.audio).toHaveBeenCalledWith(
          `sfx-${weapon}`,
          `assets/audio/sfx/${weapon}.mp3`
        );
      });
    });

    it('should load enemy SFX audio files', () => {
      scene.preload();

      expect(mockLoad.audio).toHaveBeenCalledWith(
        'sfx-enemy-hit',
        'assets/audio/sfx/enemy-hit.mp3'
      );
      expect(mockLoad.audio).toHaveBeenCalledWith(
        'sfx-enemy-death',
        'assets/audio/sfx/enemy-death.mp3'
      );
    });

    it('should load player SFX audio files', () => {
      scene.preload();

      expect(mockLoad.audio).toHaveBeenCalledWith(
        'sfx-player-hit',
        'assets/audio/sfx/player-hit.mp3'
      );
      expect(mockLoad.audio).toHaveBeenCalledWith(
        'sfx-player-death',
        'assets/audio/sfx/player-death.mp3'
      );
    });

    it('should load UI SFX audio files', () => {
      scene.preload();

      expect(mockLoad.audio).toHaveBeenCalledWith(
        'sfx-levelup',
        'assets/audio/sfx/levelup.mp3'
      );
      expect(mockLoad.audio).toHaveBeenCalledWith(
        'sfx-pickup',
        'assets/audio/sfx/pickup.mp3'
      );
      expect(mockLoad.audio).toHaveBeenCalledWith(
        'sfx-button-click',
        'assets/audio/sfx/button-click.mp3'
      );
      expect(mockLoad.audio).toHaveBeenCalledWith(
        'sfx-weapon-evolve',
        'assets/audio/sfx/weapon-evolve.mp3'
      );
    });

    it('should load all JSON configuration files', () => {
      scene.preload();

      const configFiles = [
        'weapons-config',
        'enemies-config',
        'characters-config',
        'waves-config',
        'pool-config',
        'passive-items-config',
      ];

      configFiles.forEach((config) => {
        const fileName = config.replace('-config', '');
        expect(mockLoad.json).toHaveBeenCalledWith(
          config,
          `data/${fileName}.json`
        );
      });
    });

    it('should register error handler for failed loads', () => {
      scene.preload();

      expect(mockLoad.on).toHaveBeenCalledWith('loaderror', expect.any(Function));
    });

    it('should create loading bar UI', () => {
      scene.preload();

      // Should create title text
      expect(mockAdd.text).toHaveBeenCalledWith(
        400,
        220,
        'Vampire Survivors',
        expect.any(Object)
      );

      // Should create loading text
      expect(mockAdd.text).toHaveBeenCalledWith(
        400,
        260,
        'Loading...',
        expect.any(Object)
      );

      // Should create graphics for progress bar
      expect(mockAdd.graphics).toHaveBeenCalled();
    });

    it('should register progress event handlers', () => {
      scene.preload();

      expect(mockLoad.on).toHaveBeenCalledWith('progress', expect.any(Function));
      expect(mockLoad.on).toHaveBeenCalledWith('fileprogress', expect.any(Function));
      expect(mockLoad.on).toHaveBeenCalledWith('complete', expect.any(Function));
    });
  });

  describe('create()', () => {
    it('should transition to MainMenu scene', () => {
      scene.create();

      expect((scene as any).scene.start).toHaveBeenCalledWith('MainMenu');
    });
  });
});
