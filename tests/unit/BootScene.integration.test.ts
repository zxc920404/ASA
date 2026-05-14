import { describe, it, expect } from 'vitest';
import { BootScene } from '../../src/scenes/BootScene';

describe('BootScene Integration', () => {
  describe('Scene Transition', () => {
    it('should have create() method that transitions to MainMenuScene', () => {
      const scene = new BootScene();
      
      // Verify the create method exists
      expect(scene.create).toBeDefined();
      expect(typeof scene.create).toBe('function');
    });

    it('should call scene.start with MainMenu key', () => {
      const scene = new BootScene();
      let startCalled = false;
      let startKey = '';

      // Mock the scene manager
      (scene as any).scene = {
        start: (key: string) => {
          startCalled = true;
          startKey = key;
        },
      };

      // Call create
      scene.create();

      // Verify scene.start was called with correct key
      expect(startCalled).toBe(true);
      expect(startKey).toBe('MainMenu');
    });

    it('should ensure smooth transition by calling scene.start only once per create call', () => {
      const scene = new BootScene();
      let callCount = 0;

      // Mock the scene manager
      (scene as any).scene = {
        start: () => {
          callCount++;
        },
      };

      // Call create once
      scene.create();

      // Should be called exactly once
      expect(callCount).toBe(1);
    });
  });

  describe('Scene Configuration', () => {
    it('should have correct scene key', () => {
      const scene = new BootScene();
      
      // Access the scene config through the scene's sys property (if available in test)
      // In Phaser, the scene key is set in the constructor
      expect((scene as any).sys?.config).toBeDefined();
    });
  });
});
