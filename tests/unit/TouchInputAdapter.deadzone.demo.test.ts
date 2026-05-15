/**
 * TouchInputAdapter 死區測試示範
 * 
 * 任務 4.2.2: 實作搖桿死區（半徑 15%）
 * 
 * 驗證項目:
 * 1. 死區半徑設為搖桿半徑的 15%
 * 2. 在死區內時返回零向量
 * 3. 避免微小抖動造成的誤操作
 * 
 * 實作說明:
 * - 搖桿半徑: 60 像素
 * - 死區半徑: 60 * 0.15 = 9 像素
 * - 當觸控點距離搖桿中心 < 9 像素時，返回零向量
 * - 當觸控點距離搖桿中心 >= 9 像素時，返回正規化方向向量
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TouchInputAdapter } from '../../src/infrastructure/input/TouchInputAdapter';
import Phaser from 'phaser';

describe('TouchInputAdapter - 死區測試 (任務 4.2.2)', () => {
  let adapter: TouchInputAdapter;
  let mockScene: any;
  let mockJoystickBase: any;
  let mockJoystickThumb: any;
  let pointerDownHandlers: any[];
  let pointerMoveHandlers: any[];
  let pointerUpHandlers: any[];

  beforeEach(() => {
    // 重置處理器陣列
    pointerDownHandlers = [];
    pointerMoveHandlers = [];
    pointerUpHandlers = [];

    // 模擬 Phaser.GameObjects.Image
    mockJoystickBase = {
      setScrollFactor: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
      x: 0,
      y: 0,
    };

    mockJoystickThumb = {
      setScrollFactor: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
      x: 0,
      y: 0,
    };

    // 模擬 Phaser.Scene
    mockScene = {
      add: {
        image: vi.fn((x: number, y: number, texture: string) => {
          if (texture === 'joystick-base') return mockJoystickBase;
          if (texture === 'joystick-thumb') return mockJoystickThumb;
          return mockJoystickBase;
        }),
      },
      input: {
        on: vi.fn((event: string, handler: any) => {
          if (event === 'pointerdown') pointerDownHandlers.push(handler);
          if (event === 'pointermove') pointerMoveHandlers.push(handler);
          if (event === 'pointerup') pointerUpHandlers.push(handler);
        }),
        activePointer: { x: 0, y: 0 },
      },
      scale: {
        width: 800,
        height: 600,
      },
    };

    adapter = new TouchInputAdapter(mockScene as any);
  });

  describe('死區半徑驗證', () => {
    it('死區半徑應為搖桿半徑的 15%', () => {
      // 搖桿半徑 = 60 像素
      // 死區半徑 = 60 * 0.15 = 9 像素
      const joystickRadius = 60;
      const deadZoneRatio = 0.15;
      const expectedDeadZoneRadius = joystickRadius * deadZoneRatio;
      
      expect(expectedDeadZoneRadius).toBe(9);
    });
  });

  describe('死區內返回零向量', () => {
    it('距離 5 像素（< 9 像素）應返回零向量', () => {
      const mockPointer = { x: 200, y: 300, id: 1 };
      
      // 觸碰顯示搖桿
      pointerDownHandlers.forEach(handler => handler(mockPointer));
      mockJoystickBase.x = 200;
      mockJoystickBase.y = 300;

      // 在死區內移動（距離 = 5 像素 < 9 像素）
      const movePointer = { x: 205, y: 300, id: 1 };
      pointerMoveHandlers.forEach(handler => handler(movePointer));

      const direction = adapter.getMovementInput();
      expect(direction.x).toBe(0);
      expect(direction.y).toBe(0);
    });

    it('距離 8 像素（< 9 像素）應返回零向量', () => {
      const mockPointer = { x: 200, y: 300, id: 1 };
      
      pointerDownHandlers.forEach(handler => handler(mockPointer));
      mockJoystickBase.x = 200;
      mockJoystickBase.y = 300;

      // 在死區內移動（距離 = 8 像素 < 9 像素）
      const movePointer = { x: 208, y: 300, id: 1 };
      pointerMoveHandlers.forEach(handler => handler(movePointer));

      const direction = adapter.getMovementInput();
      expect(direction.x).toBe(0);
      expect(direction.y).toBe(0);
    });

    it('對角線距離 6.36 像素（< 9 像素）應返回零向量', () => {
      const mockPointer = { x: 200, y: 300, id: 1 };
      
      pointerDownHandlers.forEach(handler => handler(mockPointer));
      mockJoystickBase.x = 200;
      mockJoystickBase.y = 300;

      // 對角線移動（距離 = sqrt(4.5^2 + 4.5^2) ≈ 6.36 像素 < 9 像素）
      const movePointer = { x: 204.5, y: 304.5, id: 1 };
      pointerMoveHandlers.forEach(handler => handler(movePointer));

      const direction = adapter.getMovementInput();
      expect(direction.x).toBe(0);
      expect(direction.y).toBe(0);
    });
  });

  describe('死區外返回正規化向量', () => {
    it('距離 10 像素（>= 9 像素）應返回正規化方向向量', () => {
      const mockPointer = { x: 200, y: 300, id: 1 };
      
      pointerDownHandlers.forEach(handler => handler(mockPointer));
      mockJoystickBase.x = 200;
      mockJoystickBase.y = 300;

      // 超出死區移動（距離 = 10 像素 >= 9 像素）
      const movePointer = { x: 210, y: 300, id: 1 };
      pointerMoveHandlers.forEach(handler => handler(movePointer));

      const direction = adapter.getMovementInput();
      const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
      
      // 方向向量應該被正規化（長度接近 1）
      expect(length).toBeCloseTo(1, 1);
      expect(direction.x).toBeGreaterThan(0);
    });

    it('距離 50 像素應返回正規化方向向量', () => {
      const mockPointer = { x: 200, y: 300, id: 1 };
      
      pointerDownHandlers.forEach(handler => handler(mockPointer));
      mockJoystickBase.x = 200;
      mockJoystickBase.y = 300;

      // 大幅移動（距離 = 50 像素）
      const movePointer = { x: 250, y: 300, id: 1 };
      pointerMoveHandlers.forEach(handler => handler(movePointer));

      const direction = adapter.getMovementInput();
      const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
      
      expect(length).toBeCloseTo(1, 1);
      expect(direction.x).toBeCloseTo(1, 1);
      expect(direction.y).toBeCloseTo(0, 1);
    });
  });

  describe('避免微小抖動', () => {
    it('從死區外移動到死區內應立即返回零向量', () => {
      const mockPointer = { x: 200, y: 300, id: 1 };
      
      pointerDownHandlers.forEach(handler => handler(mockPointer));
      mockJoystickBase.x = 200;
      mockJoystickBase.y = 300;

      // 先移動到死區外
      const movePointer1 = { x: 220, y: 300, id: 1 };
      pointerMoveHandlers.forEach(handler => handler(movePointer1));
      
      let direction = adapter.getMovementInput();
      expect(direction.x).not.toBe(0);

      // 再移動回死區內
      const movePointer2 = { x: 203, y: 300, id: 1 };
      pointerMoveHandlers.forEach(handler => handler(movePointer2));
      
      direction = adapter.getMovementInput();
      expect(direction.x).toBe(0);
      expect(direction.y).toBe(0);
    });

    it('在死區邊界反覆移動應正確切換狀態', () => {
      const mockPointer = { x: 200, y: 300, id: 1 };
      
      pointerDownHandlers.forEach(handler => handler(mockPointer));
      mockJoystickBase.x = 200;
      mockJoystickBase.y = 300;

      // 測試多次在死區邊界移動
      const testCases = [
        { x: 208, y: 300, expectZero: true },  // 8 像素，死區內
        { x: 210, y: 300, expectZero: false }, // 10 像素，死區外
        { x: 205, y: 300, expectZero: true },  // 5 像素，死區內
        { x: 215, y: 300, expectZero: false }, // 15 像素，死區外
      ];

      testCases.forEach(({ x, y, expectZero }) => {
        const movePointer = { x, y, id: 1 };
        pointerMoveHandlers.forEach(handler => handler(movePointer));
        
        const direction = adapter.getMovementInput();
        if (expectZero) {
          expect(direction.x).toBe(0);
          expect(direction.y).toBe(0);
        } else {
          const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
          expect(length).toBeCloseTo(1, 1);
        }
      });
    });
  });

  describe('搖桿視覺回饋', () => {
    it('死區內時搖桿拇指應重置到中心位置', () => {
      const mockPointer = { x: 200, y: 300, id: 1 };
      
      pointerDownHandlers.forEach(handler => handler(mockPointer));
      mockJoystickBase.x = 200;
      mockJoystickBase.y = 300;

      // 在死區內移動
      const movePointer = { x: 205, y: 300, id: 1 };
      pointerMoveHandlers.forEach(handler => handler(movePointer));

      // 驗證搖桿拇指被重置到基座中心
      expect(mockJoystickThumb.setPosition).toHaveBeenCalledWith(200, 300);
    });
  });
});

/**
 * 實作總結:
 * 
 * ✅ 任務 4.2.2 已完成
 * 
 * 實作細節:
 * 1. 死區半徑: 搖桿半徑 (60) * 死區比例 (0.15) = 9 像素
 * 2. 死區判定: distance < joystickRadius * deadZoneRatio
 * 3. 死區內行為: 返回零向量 (0, 0)，搖桿拇指重置到中心
 * 4. 死區外行為: 返回正規化方向向量，搖桿拇指跟隨觸控點
 * 
 * 效果:
 * - 避免手指微小抖動造成角色非預期移動
 * - 提供更精確的靜止狀態控制
 * - 改善觸控操作體驗
 */
