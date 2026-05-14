import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BootScene } from '../../src/scenes/BootScene';

describe('BootScene - Mobile Responsiveness', () => {
  let scene: BootScene;
  let mockLoad: any;
  let mockGraphics: any;
  let mockText: any;

  beforeEach(() => {
    scene = new BootScene();
    
    mockGraphics = {
      fillStyle: vi.fn().mockReturnThis(),
      fillRect: vi.fn().mockReturnThis(),
      lineStyle: vi.fn().mockReturnThis(),
      strokeRect: vi.fn().mockReturnThis(),
      strokeCircle: vi.fn().mockReturnThis(),
      fillCircle: vi.fn().mockReturnThis(),
      clear: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
      generateTexture: vi.fn(),
    };

    mockText = {
      setOrigin: vi.fn().mockReturnThis(),
      setText: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    };

    mockLoad = {
      atlas: vi.fn(),
      tilemapTiledJSON: vi.fn(),
      image: vi.fn(),
      audio: vi.fn(),
      json: vi.fn(),
      on: vi.fn(),
    };

    (scene as any).load = mockLoad;
    (scene as any).add = {
      graphics: vi.fn(() => mockGraphics),
      text: vi.fn(() => mockText),
    };
    (scene as any).make = {
      graphics: vi.fn(() => mockGraphics),
    };
  });

  describe('Mobile Screen Sizes', () => {
    it('should create responsive loading bar on small mobile screen (360x640)', () => {
      (scene as any).scale = { width: 360, height: 640 };
      
      scene.preload();
      
      // Verify graphics were created (bar, border, background)
      expect((scene as any).add.graphics).toHaveBeenCalled();
      
      // Verify text elements were created
      expect((scene as any).add.text).toHaveBeenCalled();
      
      // Verify progress event handler was registered
      expect(mockLoad.on).toHaveBeenCalledWith('progress', expect.any(Function));
    });

    it('should create responsive loading bar on medium mobile screen (375x812)', () => {
      (scene as any).scale = { width: 375, height: 812 };
      
      scene.preload();
      
      expect((scene as any).add.graphics).toHaveBeenCalled();
      expect((scene as any).add.text).toHaveBeenCalled();
      expect(mockLoad.on).toHaveBeenCalledWith('progress', expect.any(Function));
    });

    it('should create responsive loading bar on large mobile screen (414x896)', () => {
      (scene as any).scale = { width: 414, height: 896 };
      
      scene.preload();
      
      expect((scene as any).add.graphics).toHaveBeenCalled();
      expect((scene as any).add.text).toHaveBeenCalled();
      expect(mockLoad.on).toHaveBeenCalledWith('progress', expect.any(Function));
    });

    it('should create responsive loading bar on tablet screen (768x1024)', () => {
      (scene as any).scale = { width: 768, height: 1024 };
      
      scene.preload();
      
      expect((scene as any).add.graphics).toHaveBeenCalled();
      expect((scene as any).add.text).toHaveBeenCalled();
      expect(mockLoad.on).toHaveBeenCalledWith('progress', expect.any(Function));
    });
  });

  describe('Orientation Changes', () => {
    it('should create responsive loading bar in portrait mode (360x640)', () => {
      (scene as any).scale = { width: 360, height: 640 };
      
      scene.preload();
      
      // Get the progress callback
      const progressCallback = mockLoad.on.mock.calls.find(
        (call: any[]) => call[0] === 'progress'
      )?.[1];
      
      expect(progressCallback).toBeDefined();
      
      // Simulate progress update
      if (progressCallback) {
        progressCallback(0.5);
        
        // Verify bar was drawn with correct dimensions
        // Bar should be at width * 0.1 with width * 0.8 * progress
        expect(mockGraphics.fillRect).toHaveBeenCalledWith(
          36, // width * 0.1 = 360 * 0.1
          320, // height / 2 = 640 / 2
          144, // (width * 0.8) * 0.5 = (360 * 0.8) * 0.5
          30
        );
      }
    });

    it('should create responsive loading bar in landscape mode (640x360)', () => {
      (scene as any).scale = { width: 640, height: 360 };
      
      scene.preload();
      
      // Get the progress callback
      const progressCallback = mockLoad.on.mock.calls.find(
        (call: any[]) => call[0] === 'progress'
      )?.[1];
      
      expect(progressCallback).toBeDefined();
      
      // Simulate progress update
      if (progressCallback) {
        progressCallback(0.5);
        
        // Verify bar was drawn with correct dimensions
        // Bar should be at width * 0.1 with width * 0.8 * progress
        expect(mockGraphics.fillRect).toHaveBeenCalledWith(
          64, // width * 0.1 = 640 * 0.1
          180, // height / 2 = 360 / 2
          256, // (width * 0.8) * 0.5 = (640 * 0.8) * 0.5
          30
        );
      }
    });
  });

  describe('Progress Bar Positioning', () => {
    it('should position loading bar elements relative to screen dimensions', () => {
      const width = 800;
      const height = 600;
      (scene as any).scale = { width, height };
      
      scene.preload();
      
      // Verify title text is centered horizontally and positioned above bar
      expect((scene as any).add.text).toHaveBeenCalledWith(
        width / 2,
        height / 2 - 80,
        'Vampire Survivors',
        expect.any(Object)
      );
      
      // Verify loading text is centered horizontally
      expect((scene as any).add.text).toHaveBeenCalledWith(
        width / 2,
        height / 2 - 40,
        'Loading...',
        expect.any(Object)
      );
      
      // Verify percentage text is centered
      expect((scene as any).add.text).toHaveBeenCalledWith(
        width / 2,
        height / 2 + 15,
        '0%',
        expect.any(Object)
      );
      
      // Verify file text is centered
      expect((scene as any).add.text).toHaveBeenCalledWith(
        width / 2,
        height / 2 + 50,
        '',
        expect.any(Object)
      );
    });

    it('should use 80% of screen width for progress bar', () => {
      const width = 1000;
      const height = 600;
      (scene as any).scale = { width, height };
      
      scene.preload();
      
      // Get the progress callback
      const progressCallback = mockLoad.on.mock.calls.find(
        (call: any[]) => call[0] === 'progress'
      )?.[1];
      
      expect(progressCallback).toBeDefined();
      
      // Simulate full progress
      if (progressCallback) {
        progressCallback(1.0);
        
        // Verify bar uses 80% of width
        expect(mockGraphics.fillRect).toHaveBeenCalledWith(
          100, // width * 0.1 = 1000 * 0.1
          300, // height / 2 = 600 / 2
          800, // width * 0.8 * 1.0 = 1000 * 0.8
          30
        );
      }
    });

    it('should center progress bar vertically', () => {
      const width = 800;
      const height = 1000;
      (scene as any).scale = { width, height };
      
      scene.preload();
      
      // Get the progress callback
      const progressCallback = mockLoad.on.mock.calls.find(
        (call: any[]) => call[0] === 'progress'
      )?.[1];
      
      expect(progressCallback).toBeDefined();
      
      // Simulate progress
      if (progressCallback) {
        progressCallback(0.75);
        
        // Verify bar is centered vertically
        expect(mockGraphics.fillRect).toHaveBeenCalledWith(
          80, // width * 0.1
          500, // height / 2 = 1000 / 2
          480, // (width * 0.8) * 0.75
          30
        );
      }
    });
  });

  describe('Progress Updates', () => {
    it('should update percentage text as loading progresses', () => {
      (scene as any).scale = { width: 800, height: 600 };
      
      scene.preload();
      
      // Get the progress callback
      const progressCallback = mockLoad.on.mock.calls.find(
        (call: any[]) => call[0] === 'progress'
      )?.[1];
      
      expect(progressCallback).toBeDefined();
      
      if (progressCallback) {
        // Test various progress values
        progressCallback(0.0);
        expect(mockText.setText).toHaveBeenCalledWith('0%');
        
        progressCallback(0.25);
        expect(mockText.setText).toHaveBeenCalledWith('25%');
        
        progressCallback(0.5);
        expect(mockText.setText).toHaveBeenCalledWith('50%');
        
        progressCallback(0.75);
        expect(mockText.setText).toHaveBeenCalledWith('75%');
        
        progressCallback(1.0);
        expect(mockText.setText).toHaveBeenCalledWith('100%');
      }
    });

    it('should update file loading text', () => {
      (scene as any).scale = { width: 800, height: 600 };
      
      scene.preload();
      
      // Get the fileprogress callback
      const fileProgressCallback = mockLoad.on.mock.calls.find(
        (call: any[]) => call[0] === 'fileprogress'
      )?.[1];
      
      expect(fileProgressCallback).toBeDefined();
      
      if (fileProgressCallback) {
        // Simulate file loading
        fileProgressCallback({ key: 'weapons-config' });
        expect(mockText.setText).toHaveBeenCalledWith('Loading: weapons-config');
        
        fileProgressCallback({ key: 'enemies-config' });
        expect(mockText.setText).toHaveBeenCalledWith('Loading: enemies-config');
      }
    });
  });

  describe('Cleanup', () => {
    it('should destroy all UI elements when loading completes', () => {
      (scene as any).scale = { width: 800, height: 600 };
      
      scene.preload();
      
      // Get the complete callback
      const completeCallback = mockLoad.on.mock.calls.find(
        (call: any[]) => call[0] === 'complete'
      )?.[1];
      
      expect(completeCallback).toBeDefined();
      
      if (completeCallback) {
        completeCallback();
        
        // Verify all elements were destroyed
        expect(mockGraphics.destroy).toHaveBeenCalled();
        expect(mockText.destroy).toHaveBeenCalled();
      }
    });
  });
});
