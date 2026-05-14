import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BootScene } from '../../src/scenes/BootScene';

describe('BootScene', () => {
  let scene: BootScene;
  let mockLoad: any;

  beforeEach(() => {
    scene = new BootScene();
    
    // Mock Phaser loader
    mockLoad = {
      atlas: vi.fn(),
      tilemapTiledJSON: vi.fn(),
      image: vi.fn(),
      audio: vi.fn(),
      json: vi.fn(),
      on: vi.fn(),
    };

    // Mock scene properties
    (scene as any).load = mockLoad;
    (scene as any).scale = { width: 800, height: 600 };
    (scene as any).add = {
      graphics: vi.fn(() => ({
        fillStyle: vi.fn(),
        fillRect: vi.fn(),
        lineStyle: vi.fn(),
        strokeCircle: vi.fn(),
        fillCircle: vi.fn(),
        clear: vi.fn(),
        destroy: vi.fn(),
      })),
      text: vi.fn(() => ({
        setOrigin: vi.fn(() => ({ destroy: vi.fn() })),
      })),
    };
    (scene as any).make = {
      graphics: vi.fn(() => ({
        fillStyle: vi.fn(),
        fillRect: vi.fn(),
        fillCircle: vi.fn(),
        lineStyle: vi.fn(),
        strokeCircle: vi.fn(),
        generateTexture: vi.fn(),
        destroy: vi.fn(),
      })),
    };
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

    it('should load tilemap JSON files', () => {
      scene.preload();
      
      expect(mockLoad.tilemapTiledJSON).toHaveBeenCalledWith('map-forest', 'assets/tilemaps/forest.json');
      expect(mockLoad.tilemapTiledJSON).toHaveBeenCalledWith('map-cemetery', 'assets/tilemaps/cemetery.json');
    });

    it('should load tileset images', () => {
      scene.preload();
      
      expect(mockLoad.image).toHaveBeenCalledWith('tileset-forest', 'assets/tilemaps/tileset-forest.png');
      expect(mockLoad.image).toHaveBeenCalledWith('tileset-cemetery', 'assets/tilemaps/tileset-cemetery.png');
    });

    it('should load background music files', () => {
      scene.preload();
      
      expect(mockLoad.audio).toHaveBeenCalledWith('bgm-forest', 'assets/audio/bgm/forest.mp3');
      expect(mockLoad.audio).toHaveBeenCalledWith('bgm-cemetery', 'assets/audio/bgm/cemetery.mp3');
      expect(mockLoad.audio).toHaveBeenCalledWith('bgm-menu', 'assets/audio/bgm/menu.mp3');
    });

    it('should load weapon sound effects', () => {
      scene.preload();
      
      expect(mockLoad.audio).toHaveBeenCalledWith('sfx-knife', 'assets/audio/sfx/knife.mp3');
      expect(mockLoad.audio).toHaveBeenCalledWith('sfx-wand', 'assets/audio/sfx/wand.mp3');
      expect(mockLoad.audio).toHaveBeenCalledWith('sfx-whip', 'assets/audio/sfx/whip.mp3');
      expect(mockLoad.audio).toHaveBeenCalledWith('sfx-axe', 'assets/audio/sfx/axe.mp3');
      expect(mockLoad.audio).toHaveBeenCalledWith('sfx-garlic', 'assets/audio/sfx/garlic.mp3');
      expect(mockLoad.audio).toHaveBeenCalledWith('sfx-holywater', 'assets/audio/sfx/holywater.mp3');
    });

    it('should load enemy sound effects', () => {
      scene.preload();
      
      expect(mockLoad.audio).toHaveBeenCalledWith('sfx-enemy-hit', 'assets/audio/sfx/enemy-hit.mp3');
      expect(mockLoad.audio).toHaveBeenCalledWith('sfx-enemy-death', 'assets/audio/sfx/enemy-death.mp3');
    });

    it('should load player sound effects', () => {
      scene.preload();
      
      expect(mockLoad.audio).toHaveBeenCalledWith('sfx-player-hit', 'assets/audio/sfx/player-hit.mp3');
      expect(mockLoad.audio).toHaveBeenCalledWith('sfx-player-death', 'assets/audio/sfx/player-death.mp3');
    });

    it('should load UI sound effects', () => {
      scene.preload();
      
      expect(mockLoad.audio).toHaveBeenCalledWith('sfx-levelup', 'assets/audio/sfx/levelup.mp3');
      expect(mockLoad.audio).toHaveBeenCalledWith('sfx-pickup', 'assets/audio/sfx/pickup.mp3');
      expect(mockLoad.audio).toHaveBeenCalledWith('sfx-button-click', 'assets/audio/sfx/button-click.mp3');
      expect(mockLoad.audio).toHaveBeenCalledWith('sfx-weapon-evolve', 'assets/audio/sfx/weapon-evolve.mp3');
    });

    it('should load JSON configuration files', () => {
      scene.preload();
      
      expect(mockLoad.json).toHaveBeenCalledWith('weapons-config', 'data/weapons.json');
      expect(mockLoad.json).toHaveBeenCalledWith('enemies-config', 'data/enemies.json');
      expect(mockLoad.json).toHaveBeenCalledWith('characters-config', 'data/characters.json');
      expect(mockLoad.json).toHaveBeenCalledWith('waves-config', 'data/waves.json');
      expect(mockLoad.json).toHaveBeenCalledWith('pool-config', 'data/pool-config.json');
      expect(mockLoad.json).toHaveBeenCalledWith('passive-items-config', 'data/passive-items.json');
    });

    it('should register loaderror event handler', () => {
      scene.preload();
      
      expect(mockLoad.on).toHaveBeenCalledWith('loaderror', expect.any(Function));
    });

    it('should register progress event handler for loading bar', () => {
      scene.preload();
      
      expect(mockLoad.on).toHaveBeenCalledWith('progress', expect.any(Function));
    });

    it('should register fileprogress event handler for loading bar', () => {
      scene.preload();
      
      expect(mockLoad.on).toHaveBeenCalledWith('fileprogress', expect.any(Function));
    });

    it('should register complete event handler for loading bar', () => {
      scene.preload();
      
      expect(mockLoad.on).toHaveBeenCalledWith('complete', expect.any(Function));
    });

    it('should create loading bar UI elements', () => {
      scene.preload();
      
      // Should create graphics for bar border, background, and fill
      expect((scene as any).add.graphics).toHaveBeenCalled();
      
      // Should create text elements (title, loading text, percentage, file text)
      expect((scene as any).add.text).toHaveBeenCalled();
    });
  });
});
