import { describe, it, expect, beforeEach, vi } from 'vitest';
import Phaser from 'phaser';
import { KeyboardMouseAdapter } from '../../src/infrastructure/input/KeyboardMouseAdapter';

describe('KeyboardMouseAdapter - Pointer Support', () => {
  let scene: Phaser.Scene;
  let adapter: KeyboardMouseAdapter;

  beforeEach(() => {
    // Create a minimal mock scene with input system
    scene = {
      input: {
        keyboard: {
          addKey: vi.fn((keyCode: number) => ({
            isDown: false,
            keyCode,
          })),
        },
        activePointer: {
          isDown: false,
          worldX: 0,
          worldY: 0,
          x: 0,
          y: 0,
        },
      },
    } as any;

    adapter = new KeyboardMouseAdapter(scene);
  });

  describe('isPointerDown()', () => {
    it('should return false when mouse is not pressed', () => {
      scene.input.activePointer.isDown = false;
      expect(adapter.isPointerDown()).toBe(false);
    });

    it('should return true when mouse is pressed', () => {
      scene.input.activePointer.isDown = true;
      expect(adapter.isPointerDown()).toBe(true);
    });

    it('should reflect real-time mouse button state', () => {
      // Initially not pressed
      scene.input.activePointer.isDown = false;
      expect(adapter.isPointerDown()).toBe(false);

      // Press mouse button
      scene.input.activePointer.isDown = true;
      expect(adapter.isPointerDown()).toBe(true);

      // Release mouse button
      scene.input.activePointer.isDown = false;
      expect(adapter.isPointerDown()).toBe(false);
    });
  });

  describe('getPointerPosition()', () => {
    it('should return mouse position in world coordinates', () => {
      scene.input.activePointer.worldX = 100;
      scene.input.activePointer.worldY = 200;

      const position = adapter.getPointerPosition();

      expect(position.x).toBe(100);
      expect(position.y).toBe(200);
    });

    it('should return updated position when mouse moves', () => {
      // Initial position
      scene.input.activePointer.worldX = 50;
      scene.input.activePointer.worldY = 75;
      let position = adapter.getPointerPosition();
      expect(position.x).toBe(50);
      expect(position.y).toBe(75);

      // Mouse moves
      scene.input.activePointer.worldX = 150;
      scene.input.activePointer.worldY = 225;
      position = adapter.getPointerPosition();
      expect(position.x).toBe(150);
      expect(position.y).toBe(225);
    });

    it('should return a new Vector2 instance each time', () => {
      scene.input.activePointer.worldX = 100;
      scene.input.activePointer.worldY = 200;

      const position1 = adapter.getPointerPosition();
      const position2 = adapter.getPointerPosition();

      // Should be different instances
      expect(position1).not.toBe(position2);
      // But with same values
      expect(position1.x).toBe(position2.x);
      expect(position1.y).toBe(position2.y);
    });

    it('should handle negative coordinates', () => {
      scene.input.activePointer.worldX = -50;
      scene.input.activePointer.worldY = -100;

      const position = adapter.getPointerPosition();

      expect(position.x).toBe(-50);
      expect(position.y).toBe(-100);
    });

    it('should handle zero coordinates', () => {
      scene.input.activePointer.worldX = 0;
      scene.input.activePointer.worldY = 0;

      const position = adapter.getPointerPosition();

      expect(position.x).toBe(0);
      expect(position.y).toBe(0);
    });

    it('should handle large coordinates', () => {
      scene.input.activePointer.worldX = 10000;
      scene.input.activePointer.worldY = 20000;

      const position = adapter.getPointerPosition();

      expect(position.x).toBe(10000);
      expect(position.y).toBe(20000);
    });
  });

  describe('UI Button Click Support', () => {
    it('should support detecting click state for UI buttons', () => {
      // Simulate mouse hover over button (not pressed)
      scene.input.activePointer.worldX = 100;
      scene.input.activePointer.worldY = 50;
      scene.input.activePointer.isDown = false;

      expect(adapter.isPointerDown()).toBe(false);
      const hoverPos = adapter.getPointerPosition();
      expect(hoverPos.x).toBe(100);
      expect(hoverPos.y).toBe(50);

      // Simulate mouse click on button
      scene.input.activePointer.isDown = true;

      expect(adapter.isPointerDown()).toBe(true);
      const clickPos = adapter.getPointerPosition();
      expect(clickPos.x).toBe(100);
      expect(clickPos.y).toBe(50);
    });

    it('should support tracking mouse position during drag', () => {
      const positions: Array<{ x: number; y: number }> = [];

      // Mouse down
      scene.input.activePointer.isDown = true;
      scene.input.activePointer.worldX = 100;
      scene.input.activePointer.worldY = 100;
      positions.push(adapter.getPointerPosition());

      // Drag to new position
      scene.input.activePointer.worldX = 150;
      scene.input.activePointer.worldY = 120;
      positions.push(adapter.getPointerPosition());

      // Continue dragging
      scene.input.activePointer.worldX = 200;
      scene.input.activePointer.worldY = 140;
      positions.push(adapter.getPointerPosition());

      // Mouse up
      scene.input.activePointer.isDown = false;

      expect(positions).toHaveLength(3);
      expect(positions[0]).toEqual({ x: 100, y: 100 });
      expect(positions[1]).toEqual({ x: 150, y: 120 });
      expect(positions[2]).toEqual({ x: 200, y: 140 });
    });
  });

  describe('Integration with IInputAdapter interface', () => {
    it('should implement all required IInputAdapter methods', () => {
      expect(typeof adapter.getMovementInput).toBe('function');
      expect(typeof adapter.isPointerDown).toBe('function');
      expect(typeof adapter.getPointerPosition).toBe('function');
      expect(typeof adapter.update).toBe('function');
      expect(typeof adapter.destroy).toBe('function');
    });

    it('should work alongside keyboard input', () => {
      // Keyboard input active
      const keys = scene.input.keyboard!.addKey as any;
      keys.mock.results[0].value.isDown = true; // W key

      adapter.update(16);
      const movement = adapter.getMovementInput();
      expect(movement.y).toBeLessThan(0); // Moving up

      // Mouse also active
      scene.input.activePointer.isDown = true;
      scene.input.activePointer.worldX = 300;
      scene.input.activePointer.worldY = 400;

      expect(adapter.isPointerDown()).toBe(true);
      const position = adapter.getPointerPosition();
      expect(position.x).toBe(300);
      expect(position.y).toBe(400);
    });
  });
});
