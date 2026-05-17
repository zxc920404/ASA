import { describe, it, expect, beforeEach, vi } from 'vitest';
// Phaser is imported for type checking
// @ts-expect-error - Phaser is used in type annotations
import Phaser from 'phaser';
import { TouchInputAdapter } from '../../src/infrastructure/input/TouchInputAdapter';

/**
 * TouchInputAdapter 多點觸控測試
 * 
 * 任務 4.2.3: 支援多點觸控（以 pointerId 追蹤搖桿觸控）
 * 
 * 驗收條件:
 * 1. 使用 pointerId 追蹤搖桿的觸控點
 * 2. 確保其他觸控點不會干擾搖桿操作
 * 3. 支援同時進行其他觸控操作(如 UI 點擊)
 */
describe('TouchInputAdapter - Multi-touch Support (任務 4.2.3)', () => {
  let mockScene: any;
  let adapter: TouchInputAdapter;
  let mockJoystickBase: any;
  let mockJoystickThumb: any;
  let pointerDownHandlers: ((pointer: any) => void)[] = [];
  let pointerMoveHandlers: ((pointer: any) => void)[] = [];
  let pointerUpHandlers: ((pointer: any) => void)[] = [];

  beforeEach(() => {
    // 重置處理器陣列
    pointerDownHandlers = [];
    pointerMoveHandlers = [];
    pointerUpHandlers = [];

    // 模擬搖桿圖像物件
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

    // 模擬 Phaser Scene
    mockScene = {
      add: {
        image: vi.fn((_x: number, _y: number, texture: string) => {
          if (texture === 'joystick-base') return mockJoystickBase;
          if (texture === 'joystick-thumb') return mockJoystickThumb;
          return null;
        }),
      },
      input: {
        on: vi.fn((event: string, handler: (pointer: any) => void) => {
          if (event === 'pointerdown') pointerDownHandlers.push(handler);
          if (event === 'pointermove') pointerMoveHandlers.push(handler);
          if (event === 'pointerup') pointerUpHandlers.push(handler);
        }),
        activePointer: {
          x: 0,
          y: 0,
          id: 0,
        },
      },
      scale: {
        width: 800,
        height: 600,
      },
    };

    adapter = new TouchInputAdapter(mockScene as any);
  });

  describe('pointerId 追蹤', () => {
    it('應該使用 pointerId 追蹤搖桿觸控點', () => {
      // 模擬第一個觸控點在左側（搖桿）
      const pointer1 = { id: 0, x: 100, y: 300 };
      pointerDownHandlers.forEach(h => h(pointer1));

      // 驗證搖桿已啟動
      expect(adapter.isPointerDown()).toBe(true);
      expect(mockJoystickBase.setVisible).toHaveBeenCalledWith(true);

      // 模擬第二個觸控點在右側（UI 按鈕）
      const pointer2 = { id: 1, x: 600, y: 300 };
      pointerDownHandlers.forEach(h => h(pointer2));

      // 搖桿應該仍然活躍（不受第二個觸控點影響）
      expect(adapter.isPointerDown()).toBe(true);
    });

    it('應該只響應追蹤的 pointerId 的移動', () => {
      // 啟動搖桿（pointer 0）
      mockJoystickBase.x = 100;
      mockJoystickBase.y = 300;
      const pointer1 = { id: 0, x: 100, y: 300 };
      pointerDownHandlers.forEach(h => h(pointer1));

      // 移動 pointer 1（不應影響搖桿）
      const pointer2Move = { id: 1, x: 650, y: 350 };
      pointerMoveHandlers.forEach(h => h(pointer2Move));

      // 搖桿方向應該仍然是 (0, 0)，因為只有 pointer 0 控制它
      const direction = adapter.getMovementInput();
      expect(direction.x).toBe(0);
      expect(direction.y).toBe(0);

      // 移動 pointer 0（應該影響搖桿）
      const pointer1Move = { id: 0, x: 150, y: 300 };
      pointerMoveHandlers.forEach(h => h(pointer1Move));

      // 現在方向應該更新了
      const newDirection = adapter.getMovementInput();
      expect(newDirection.x).toBeGreaterThan(0);
    });

    it('應該只在追蹤的 pointerId 釋放時停用搖桿', () => {
      // 啟動搖桿（pointer 0）
      const pointer1 = { id: 0, x: 100, y: 300 };
      pointerDownHandlers.forEach(h => h(pointer1));

      // 添加第二個觸控點
      const pointer2 = { id: 1, x: 600, y: 300 };
      pointerDownHandlers.forEach(h => h(pointer2));

      // 釋放 pointer 1（不應影響搖桿）
      pointerUpHandlers.forEach(h => h(pointer2));
      expect(adapter.isPointerDown()).toBe(true);

      // 釋放 pointer 0（應該停用搖桿）
      pointerUpHandlers.forEach(h => h(pointer1));
      expect(adapter.isPointerDown()).toBe(false);
      expect(mockJoystickBase.setVisible).toHaveBeenCalledWith(false);

      const direction = adapter.getMovementInput();
      expect(direction.x).toBe(0);
      expect(direction.y).toBe(0);
    });
  });

  describe('多點觸控隔離', () => {
    it('不應該在搖桿已啟動時接受第二個左側觸控', () => {
      // 第一個觸控在左側
      const pointer1 = { id: 0, x: 100, y: 300 };
      pointerDownHandlers.forEach(h => h(pointer1));

      expect(adapter.isPointerDown()).toBe(true);

      // 第二個觸控也在左側（應該被忽略）
      const pointer2 = { id: 1, x: 150, y: 350 };
      pointerDownHandlers.forEach(h => h(pointer2));

      // 移動 pointer 1（不應影響搖桿）
      mockJoystickBase.x = 100;
      mockJoystickBase.y = 300;
      const pointer2Move = { id: 1, x: 200, y: 350 };
      pointerMoveHandlers.forEach(h => h(pointer2Move));

      // 方向應該仍然是 (0, 0)，因為 pointer 1 不控制搖桿
      const direction = adapter.getMovementInput();
      expect(direction.x).toBe(0);
      expect(direction.y).toBe(0);
    });

    it('應該允許右側 UI 互動同時進行', () => {
      // 啟動搖桿在左側
      const joystickPointer = { id: 0, x: 100, y: 300 };
      pointerDownHandlers.forEach(h => h(joystickPointer));

      expect(adapter.isPointerDown()).toBe(true);

      // 模擬 UI 按鈕觸控在右側
      const uiPointer = { id: 1, x: 700, y: 100 };
      
      // UI 按鈕會有自己的事件處理器
      // 我們只驗證搖桿不會干擾
      pointerDownHandlers.forEach(h => h(uiPointer));

      // 搖桿應該仍然活躍
      expect(adapter.isPointerDown()).toBe(true);

      // UI pointer 釋放不應影響搖桿
      pointerUpHandlers.forEach(h => h(uiPointer));
      expect(adapter.isPointerDown()).toBe(true);
    });

    it('不應該在右側螢幕啟動搖桿', () => {
      // 觸控在右側（x > width/2）
      const pointer = { id: 0, x: 500, y: 300 };
      pointerDownHandlers.forEach(h => h(pointer));

      // 搖桿不應該啟動
      expect(adapter.isPointerDown()).toBe(false);
      expect(mockJoystickBase.setVisible).not.toHaveBeenCalledWith(true);
    });
  });

  describe('並發觸控場景', () => {
    it('應該正確處理：搖桿 + UI 按鈕 + 搖桿釋放的順序', () => {
      // 1. 啟動搖桿
      const joystickPointer = { id: 0, x: 100, y: 300 };
      pointerDownHandlers.forEach(h => h(joystickPointer));
      expect(adapter.isPointerDown()).toBe(true);

      // 2. 點擊 UI 按鈕
      const uiPointer = { id: 1, x: 700, y: 100 };
      pointerDownHandlers.forEach(h => h(uiPointer));
      expect(adapter.isPointerDown()).toBe(true);

      // 3. 釋放搖桿
      pointerUpHandlers.forEach(h => h(joystickPointer));
      expect(adapter.isPointerDown()).toBe(false);

      // 4. 釋放 UI 按鈕（不應影響搖桿狀態）
      pointerUpHandlers.forEach(h => h(uiPointer));
      expect(adapter.isPointerDown()).toBe(false);
    });

    it('應該正確處理：UI 按鈕 + 搖桿 + UI 釋放的順序', () => {
      // 1. 點擊 UI 按鈕（右側）
      const uiPointer = { id: 0, x: 700, y: 100 };
      pointerDownHandlers.forEach(h => h(uiPointer));
      expect(adapter.isPointerDown()).toBe(false); // 搖桿未啟動

      // 2. 啟動搖桿（左側）
      const joystickPointer = { id: 1, x: 100, y: 300 };
      pointerDownHandlers.forEach(h => h(joystickPointer));
      expect(adapter.isPointerDown()).toBe(true);

      // 3. 釋放 UI 按鈕
      pointerUpHandlers.forEach(h => h(uiPointer));
      expect(adapter.isPointerDown()).toBe(true); // 搖桿仍然活躍

      // 4. 釋放搖桿
      pointerUpHandlers.forEach(h => h(joystickPointer));
      expect(adapter.isPointerDown()).toBe(false);
    });

    it('應該處理快速連續的多點觸控', () => {
      // 快速連續觸控多個點
      const pointers = [
        { id: 0, x: 100, y: 300 }, // 左側 - 搖桿
        { id: 1, x: 600, y: 100 }, // 右側 - UI
        { id: 2, x: 650, y: 200 }, // 右側 - UI
        { id: 3, x: 120, y: 320 }, // 左側 - 應該被忽略
      ];

      pointers.forEach(p => {
        pointerDownHandlers.forEach(h => h(p));
      });

      // 只有第一個左側觸控應該啟動搖桿
      expect(adapter.isPointerDown()).toBe(true);

      // 釋放所有非搖桿觸控點
      [pointers[1], pointers[2], pointers[3]].forEach(p => {
        pointerUpHandlers.forEach(h => h(p));
      });

      // 搖桿應該仍然活躍
      expect(adapter.isPointerDown()).toBe(true);

      // 釋放搖桿觸控點
      pointerUpHandlers.forEach(h => h(pointers[0]));
      expect(adapter.isPointerDown()).toBe(false);
    });
  });
});

