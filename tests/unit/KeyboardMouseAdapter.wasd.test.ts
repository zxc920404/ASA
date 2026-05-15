import { describe, it, expect, beforeEach, vi } from 'vitest';
import Phaser from 'phaser';
import { KeyboardMouseAdapter } from '../../src/infrastructure/input/KeyboardMouseAdapter';

describe('KeyboardMouseAdapter - WASD Key Mapping', () => {
  let scene: Phaser.Scene;
  let adapter: KeyboardMouseAdapter;
  let mockKeys: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  beforeEach(() => {
    // Create mock keys
    mockKeys = {
      W: { isDown: false } as Phaser.Input.Keyboard.Key,
      A: { isDown: false } as Phaser.Input.Keyboard.Key,
      S: { isDown: false } as Phaser.Input.Keyboard.Key,
      D: { isDown: false } as Phaser.Input.Keyboard.Key,
    };

    // Create mock scene
    scene = {
      input: {
        keyboard: {
          addKey: vi.fn((keyCode: number) => {
            if (keyCode === Phaser.Input.Keyboard.KeyCodes.W) return mockKeys.W;
            if (keyCode === Phaser.Input.Keyboard.KeyCodes.A) return mockKeys.A;
            if (keyCode === Phaser.Input.Keyboard.KeyCodes.S) return mockKeys.S;
            if (keyCode === Phaser.Input.Keyboard.KeyCodes.D) return mockKeys.D;
            return {} as Phaser.Input.Keyboard.Key;
          }),
        },
        activePointer: {
          isDown: false,
          worldX: 0,
          worldY: 0,
        },
      },
    } as unknown as Phaser.Scene;

    adapter = new KeyboardMouseAdapter(scene);
  });

  describe('單鍵輸入 - 正規化方向向量', () => {
    it('應該將 W 鍵映射為 (0, -1)', () => {
      mockKeys.W.isDown = true;
      adapter.update(16);
      const movement = adapter.getMovementInput();
      expect(movement.x).toBeCloseTo(0, 5);
      expect(movement.y).toBeCloseTo(-1, 5);
      expect(movement.length()).toBeCloseTo(1, 5);
    });

    it('應該將 S 鍵映射為 (0, 1)', () => {
      mockKeys.S.isDown = true;
      adapter.update(16);
      const movement = adapter.getMovementInput();
      expect(movement.x).toBeCloseTo(0, 5);
      expect(movement.y).toBeCloseTo(1, 5);
      expect(movement.length()).toBeCloseTo(1, 5);
    });

    it('應該將 A 鍵映射為 (-1, 0)', () => {
      mockKeys.A.isDown = true;
      adapter.update(16);
      const movement = adapter.getMovementInput();
      expect(movement.x).toBeCloseTo(-1, 5);
      expect(movement.y).toBeCloseTo(0, 5);
      expect(movement.length()).toBeCloseTo(1, 5);
    });

    it('應該將 D 鍵映射為 (1, 0)', () => {
      mockKeys.D.isDown = true;
      adapter.update(16);
      const movement = adapter.getMovementInput();
      expect(movement.x).toBeCloseTo(1, 5);
      expect(movement.y).toBeCloseTo(0, 5);
      expect(movement.length()).toBeCloseTo(1, 5);
    });
  });

  describe('對角線移動 - 正規化向量', () => {
    it('應該將 W+D 映射為正規化的 (0.707, -0.707)', () => {
      mockKeys.W.isDown = true;
      mockKeys.D.isDown = true;
      adapter.update(16);
      const movement = adapter.getMovementInput();
      expect(movement.x).toBeCloseTo(0.7071067811865475, 5);
      expect(movement.y).toBeCloseTo(-0.7071067811865475, 5);
      expect(movement.length()).toBeCloseTo(1, 5);
    });

    it('應該將 W+A 映射為正規化的 (-0.707, -0.707)', () => {
      mockKeys.W.isDown = true;
      mockKeys.A.isDown = true;
      adapter.update(16);
      const movement = adapter.getMovementInput();
      expect(movement.x).toBeCloseTo(-0.7071067811865475, 5);
      expect(movement.y).toBeCloseTo(-0.7071067811865475, 5);
      expect(movement.length()).toBeCloseTo(1, 5);
    });

    it('應該將 S+D 映射為正規化的 (0.707, 0.707)', () => {
      mockKeys.S.isDown = true;
      mockKeys.D.isDown = true;
      adapter.update(16);
      const movement = adapter.getMovementInput();
      expect(movement.x).toBeCloseTo(0.7071067811865475, 5);
      expect(movement.y).toBeCloseTo(0.7071067811865475, 5);
      expect(movement.length()).toBeCloseTo(1, 5);
    });

    it('應該將 S+A 映射為正規化的 (-0.707, 0.707)', () => {
      mockKeys.S.isDown = true;
      mockKeys.A.isDown = true;
      adapter.update(16);
      const movement = adapter.getMovementInput();
      expect(movement.x).toBeCloseTo(-0.7071067811865475, 5);
      expect(movement.y).toBeCloseTo(0.7071067811865475, 5);
      expect(movement.length()).toBeCloseTo(1, 5);
    });
  });

  describe('向量長度驗證', () => {
    it('無按鍵時應該返回零向量 (長度為 0)', () => {
      adapter.update(16);
      const movement = adapter.getMovementInput();
      expect(movement.x).toBe(0);
      expect(movement.y).toBe(0);
      expect(movement.length()).toBe(0);
    });

    it('單鍵按下時向量長度應該為 1', () => {
      mockKeys.W.isDown = true;
      adapter.update(16);
      const movement = adapter.getMovementInput();
      expect(movement.length()).toBeCloseTo(1, 5);
    });

    it('對角線移動時向量長度應該為 1', () => {
      mockKeys.W.isDown = true;
      mockKeys.D.isDown = true;
      adapter.update(16);
      const movement = adapter.getMovementInput();
      expect(movement.length()).toBeCloseTo(1, 5);
    });

    it('相反方向按鍵同時按下應該返回零向量', () => {
      mockKeys.W.isDown = true;
      mockKeys.S.isDown = true;
      adapter.update(16);
      const movement = adapter.getMovementInput();
      expect(movement.x).toBe(0);
      expect(movement.y).toBe(0);
      expect(movement.length()).toBe(0);
    });

    it('水平相反方向按鍵同時按下應該返回零向量', () => {
      mockKeys.A.isDown = true;
      mockKeys.D.isDown = true;
      adapter.update(16);
      const movement = adapter.getMovementInput();
      expect(movement.x).toBe(0);
      expect(movement.y).toBe(0);
      expect(movement.length()).toBe(0);
    });
  });

  describe('按鍵釋放', () => {
    it('按鍵釋放後應該返回零向量', () => {
      mockKeys.W.isDown = true;
      adapter.update(16);
      let movement = adapter.getMovementInput();
      expect(movement.length()).toBeCloseTo(1, 5);

      mockKeys.W.isDown = false;
      adapter.update(16);
      movement = adapter.getMovementInput();
      expect(movement.x).toBe(0);
      expect(movement.y).toBe(0);
      expect(movement.length()).toBe(0);
    });

    it('部分按鍵釋放後應該更新方向', () => {
      mockKeys.W.isDown = true;
      mockKeys.D.isDown = true;
      adapter.update(16);
      let movement = adapter.getMovementInput();
      expect(movement.x).toBeCloseTo(0.707, 2);
      expect(movement.y).toBeCloseTo(-0.707, 2);

      mockKeys.D.isDown = false;
      adapter.update(16);
      movement = adapter.getMovementInput();
      expect(movement.x).toBeCloseTo(0, 5);
      expect(movement.y).toBeCloseTo(-1, 5);
    });
  });
});
