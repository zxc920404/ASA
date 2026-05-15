import { describe, it, expect, beforeEach, vi } from 'vitest';
import Phaser from 'phaser';
import { InputController } from '../../src/infrastructure/input/InputController';

/**
 * Task 4.1.2: 提供 getMovement() 統一介面
 * 
 * This test verifies that:
 * 1. getMovement() method exists and returns a normalized direction vector
 * 2. The returned vector has values in the range [-1, 1]
 * 3. The method unifies input from different adapters
 */
describe('InputController.getMovement() - Task 4.1.2', () => {
  let mockScene: Phaser.Scene;

  beforeEach(() => {
    // Create a minimal mock scene for testing
    mockScene = {
      input: {
        keyboard: {
          addKey: vi.fn().mockReturnValue({
            isDown: false,
          }),
        },
        activePointer: {
          isDown: false,
          x: 0,
          y: 0,
          worldX: 0,
          worldY: 0,
        },
        on: vi.fn(),
      },
      add: {
        image: vi.fn().mockReturnValue({
          setScrollFactor: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        }),
      },
      scale: {
        width: 800,
        height: 600,
      },
    } as any;
  });

  describe('Requirement: 在 InputController 中實作 getMovement() 方法', () => {
    it('should have getMovement() method', () => {
      const controller = new InputController(mockScene);
      
      expect(controller.getMovement).toBeDefined();
      expect(typeof controller.getMovement).toBe('function');
    });

    it('should return a Phaser.Math.Vector2', () => {
      const controller = new InputController(mockScene);
      const result = controller.getMovement();
      
      expect(result).toBeInstanceOf(Phaser.Math.Vector2);
    });
  });

  describe('Requirement: 返回正規化的方向向量 {x, y}', () => {
    it('should return a vector with x and y properties', () => {
      const controller = new InputController(mockScene);
      const movement = controller.getMovement();
      
      expect(movement).toHaveProperty('x');
      expect(movement).toHaveProperty('y');
      expect(typeof movement.x).toBe('number');
      expect(typeof movement.y).toBe('number');
    });

    it('should return a normalized vector (length <= 1)', () => {
      const controller = new InputController(mockScene);
      const movement = controller.getMovement();
      
      const length = Math.sqrt(movement.x * movement.x + movement.y * movement.y);
      expect(length).toBeLessThanOrEqual(1);
    });

    it('should return zero vector when no input', () => {
      const controller = new InputController(mockScene);
      const movement = controller.getMovement();
      
      expect(movement.x).toBe(0);
      expect(movement.y).toBe(0);
    });
  });

  describe('Requirement: 統一處理來自不同輸入適配器的輸入', () => {
    it('should work with keyboard adapter (desktop)', () => {
      // Force keyboard adapter
      const originalOntouchstart = (window as any).ontouchstart;
      const originalMaxTouchPoints = navigator.maxTouchPoints;
      
      if ('ontouchstart' in window) {
        delete (window as any).ontouchstart;
      }
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        configurable: true,
      });

      const controller = new InputController(mockScene);
      const movement = controller.getMovement();
      
      expect(movement).toBeInstanceOf(Phaser.Math.Vector2);
      
      // Cleanup
      if (originalOntouchstart !== undefined) {
        Object.defineProperty(window, 'ontouchstart', {
          value: originalOntouchstart,
          configurable: true,
        });
      }
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: originalMaxTouchPoints,
        configurable: true,
      });
    });

    it('should work with touch adapter (mobile)', () => {
      // Force touch adapter
      Object.defineProperty(window, 'ontouchstart', {
        value: {},
        configurable: true,
      });

      const controller = new InputController(mockScene);
      const movement = controller.getMovement();
      
      expect(movement).toBeInstanceOf(Phaser.Math.Vector2);
    });

    it('should provide consistent interface regardless of adapter', () => {
      const controller = new InputController(mockScene);
      
      // Verify all required methods exist
      expect(typeof controller.getMovement).toBe('function');
      expect(typeof controller.isPointerDown).toBe('function');
      expect(typeof controller.getPointerPosition).toBe('function');
      expect(typeof controller.update).toBe('function');
      expect(typeof controller.destroy).toBe('function');
    });
  });

  describe('Requirement: 確保返回值範圍在 [-1, 1] 之間', () => {
    it('should return x value in range [-1, 1]', () => {
      const controller = new InputController(mockScene);
      const movement = controller.getMovement();
      
      expect(movement.x).toBeGreaterThanOrEqual(-1);
      expect(movement.x).toBeLessThanOrEqual(1);
    });

    it('should return y value in range [-1, 1]', () => {
      const controller = new InputController(mockScene);
      const movement = controller.getMovement();
      
      expect(movement.y).toBeGreaterThanOrEqual(-1);
      expect(movement.y).toBeLessThanOrEqual(1);
    });

    it('should maintain range constraint after multiple calls', () => {
      const controller = new InputController(mockScene);
      
      // Call multiple times to ensure consistency
      for (let i = 0; i < 10; i++) {
        const movement = controller.getMovement();
        
        expect(movement.x).toBeGreaterThanOrEqual(-1);
        expect(movement.x).toBeLessThanOrEqual(1);
        expect(movement.y).toBeGreaterThanOrEqual(-1);
        expect(movement.y).toBeLessThanOrEqual(1);
      }
    });

    it('should return normalized vector with magnitude <= 1', () => {
      const controller = new InputController(mockScene);
      const movement = controller.getMovement();
      
      const magnitude = Math.sqrt(movement.x ** 2 + movement.y ** 2);
      expect(magnitude).toBeLessThanOrEqual(1);
    });
  });

  describe('Integration: getMovement() with update cycle', () => {
    it('should work correctly in update cycle', () => {
      const controller = new InputController(mockScene);
      
      // Simulate game update cycle
      controller.update(16); // 60 FPS frame
      const movement = controller.getMovement();
      
      expect(movement).toBeInstanceOf(Phaser.Math.Vector2);
      expect(movement.x).toBeGreaterThanOrEqual(-1);
      expect(movement.x).toBeLessThanOrEqual(1);
      expect(movement.y).toBeGreaterThanOrEqual(-1);
      expect(movement.y).toBeLessThanOrEqual(1);
    });

    it('should maintain state across multiple update cycles', () => {
      const controller = new InputController(mockScene);
      
      // Multiple update cycles
      for (let i = 0; i < 5; i++) {
        controller.update(16);
        const movement = controller.getMovement();
        
        expect(movement).toBeInstanceOf(Phaser.Math.Vector2);
        const magnitude = Math.sqrt(movement.x ** 2 + movement.y ** 2);
        expect(magnitude).toBeLessThanOrEqual(1);
      }
    });
  });
});
