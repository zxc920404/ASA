import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MapSelectScene } from '../../src/scenes/MapSelectScene';

describe('MapSelectScene', () => {
  let scene: MapSelectScene;
  let mockScale: any;
  let mockAdd: any;
  let mockChildren: any;

  beforeEach(() => {
    scene = new MapSelectScene();

    // Mock scale
    mockScale = {
      width: 800,
      height: 600,
      on: vi.fn(),
      removeAllListeners: vi.fn(),
    };

    // Mock add
    mockAdd = {
      graphics: vi.fn(() => ({
        fillGradientStyle: vi.fn().mockReturnThis(),
        fillRect: vi.fn().mockReturnThis(),
        lineStyle: vi.fn().mockReturnThis(),
        lineBetween: vi.fn().mockReturnThis(),
        fillRoundedRect: vi.fn().mockReturnThis(),
        strokeRoundedRect: vi.fn().mockReturnThis(),
      })),
      text: vi.fn(() => ({
        setOrigin: vi.fn().mockReturnThis(),
      })),
      rectangle: vi.fn(() => ({
        setStrokeStyle: vi.fn().mockReturnThis(),
        setInteractive: vi.fn().mockReturnThis(),
        setFillStyle: vi.fn().mockReturnThis(),
        on: vi.fn().mockReturnThis(),
      })),
    };

    // Mock children
    mockChildren = {
      removeAll: vi.fn(),
    };

    // Mock scene
    mockScene = {
      start: vi.fn(),
    };

    // Assign mocks to scene
    (scene as any).scale = mockScale;
    (scene as any).add = mockAdd;
    (scene as any).children = mockChildren;
    (scene as any).scene = mockScene;
  });

  describe('init', () => {
    it('should initialize with provided characterId', () => {
      scene.init({ characterId: 'char_flame_master' });
      expect((scene as any).characterId).toBe('char_flame_master');
    });

    it('should default to forest map', () => {
      scene.init({ characterId: 'char_blue_swordsman' });
      expect((scene as any).selectedMapId).toBe('forest');
    });

    it('should use default characterId if not provided', () => {
      scene.init({} as any);
      expect((scene as any).characterId).toBe('char_blue_swordsman');
    });
  });

  describe('create', () => {
    it('should call drawAll on create', () => {
      const drawAllSpy = vi.spyOn(scene as any, 'drawAll').mockImplementation(() => {});
      scene.create();
      expect(drawAllSpy).toHaveBeenCalled();
    });

    it('should register resize listener', () => {
      vi.spyOn(scene as any, 'drawAll').mockImplementation(() => {});
      scene.create();
      expect(mockScale.on).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  describe('map data', () => {
    it('should have forest map available', () => {
      const maps = (scene as any).maps;
      const forestMap = maps.find((m: any) => m.mapId === 'forest');
      expect(forestMap).toBeDefined();
      expect(forestMap.displayName).toContain('森林');
    });

    it('should have cemetery map available', () => {
      const maps = (scene as any).maps;
      const cemeteryMap = maps.find((m: any) => m.mapId === 'cemetery');
      expect(cemeteryMap).toBeDefined();
      expect(cemeteryMap.displayName).toContain('墓地');
    });

    it('should have exactly 2 maps', () => {
      const maps = (scene as any).maps;
      expect(maps).toHaveLength(2);
    });
  });

  describe('startGame', () => {
    let mockScene: any;

    beforeEach(() => {
      mockScene = {
        start: vi.fn(),
      };
      (scene as any).scene = mockScene;
      (scene as any).characterId = 'char_blue_swordsman';
      (scene as any).selectedMapId = 'cemetery';
    });

    it('should start Game scene with characterId and mapId', () => {
      (scene as any).startGame();
      expect(mockScene.start).toHaveBeenCalledWith('Game', {
        characterId: 'char_blue_swordsman',
        mapId: 'cemetery',
      });
    });

    it('should remove resize listeners before starting game', () => {
      (scene as any).startGame();
      expect(mockScale.removeAllListeners).toHaveBeenCalledWith('resize');
    });
  });

  describe('responsive design', () => {
    it('should handle different screen widths', () => {
      mockScale.width = 400;
      mockScale.height = 800;
      
      const drawAllSpy = vi.spyOn(scene as any, 'drawAll').mockImplementation(() => {});
      scene.create();
      
      // Trigger resize
      const resizeCallback = mockScale.on.mock.calls.find(
        (call: any) => call[0] === 'resize'
      )?.[1];
      
      if (resizeCallback) {
        resizeCallback();
        expect(drawAllSpy).toHaveBeenCalledTimes(2); // Once on create, once on resize
      }
    });
  });
});
