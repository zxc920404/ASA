import { describe, it, expect, beforeEach, vi } from 'vitest';
import Phaser from 'phaser';
import { TouchInputAdapter } from '../../src/infrastructure/input/TouchInputAdapter';

/**
 * TouchInputAdapter 浮動虛擬搖桿測試
 * 
 * 任務 4.2.1: 實作浮動虛擬搖桿（觸碰左半螢幕顯示，釋放隱藏）
 * 
 * 驗收條件:
 * 1. 觸碰螢幕左半部時顯示搖桿
 * 2. 釋放觸控時隱藏搖桿
 * 3. 搖桿位置跟隨觸碰點
 * 4. 搖桿死區判定（15%）
 */
describe('TouchInputAdapter - 浮動虛擬搖桿 (任務 4.2.1)', () => {
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
        },
      },
      scale: {
        width: 800,
        height: 600,
      },
    };

    adapter = new TouchInputAdapter(mockScene as any);
  });

  describe('搖桿初始化', () => {
    it('應該創建搖桿基座和搖桿桿', () => {
      expect(mockScene.add.image).toHaveBeenCalledWith(0, 0, 'joystick-base');
      expect(mockScene.add.image).toHaveBeenCalledWith(0, 0, 'joystick-thumb');
    });

    it('搖桿初始狀態應該是隱藏的', () => {
      expect(mockJoystickBase.setVisible).toHaveBeenCalledWith(false);
      expect(mockJoystickThumb.setVisible).toHaveBeenCalledWith(false);
    });

    it('搖桿應該設置正確的深度和透明度', () => {
      expect(mockJoystickBase.setDepth).toHaveBeenCalledWith(1000);
      expect(mockJoystickThumb.setDepth).toHaveBeenCalledWith(1001);
      expect(mockJoystickBase.setAlpha).toHaveBeenCalled();
      expect(mockJoystickThumb.setAlpha).toHaveBeenCalled();
    });
  });

  describe('觸碰左半螢幕顯示搖桿', () => {
    it('觸碰左半螢幕時應該顯示搖桿', () => {
      const mockPointer = {
        x: 200, // 左半螢幕 (< 400)
        y: 300,
        id: 1,
      };

      // 觸發 pointerdown 事件
      pointerDownHandlers.forEach(handler => handler(mockPointer));

      expect(mockJoystickBase.setVisible).toHaveBeenCalledWith(true);
      expect(mockJoystickThumb.setVisible).toHaveBeenCalledWith(true);
    });

    it('觸碰右半螢幕時不應該顯示搖桿', () => {
      const mockPointer = {
        x: 600, // 右半螢幕 (> 400)
        y: 300,
        id: 1,
      };

      // 重置 mock 調用記錄
      mockJoystickBase.setVisible.mockClear();
      mockJoystickThumb.setVisible.mockClear();

      // 觸發 pointerdown 事件
      pointerDownHandlers.forEach(handler => handler(mockPointer));

      // 不應該調用 setVisible(true)
      expect(mockJoystickBase.setVisible).not.toHaveBeenCalledWith(true);
      expect(mockJoystickThumb.setVisible).not.toHaveBeenCalledWith(true);
    });

    it('搖桿位置應該跟隨觸碰點', () => {
      const mockPointer = {
        x: 150,
        y: 250,
        id: 1,
      };

      // 觸發 pointerdown 事件
      pointerDownHandlers.forEach(handler => handler(mockPointer));

      // 搖桿應該定位在觸碰點（或考慮 safe area 後的位置）
      expect(mockJoystickBase.setPosition).toHaveBeenCalled();
      expect(mockJoystickThumb.setPosition).toHaveBeenCalled();
    });
  });

  describe('釋放觸控隱藏搖桿', () => {
    it('釋放觸控時應該隱藏搖桿', () => {
      const mockPointer = {
        x: 200,
        y: 300,
        id: 1,
      };

      // 先觸碰顯示搖桿
      pointerDownHandlers.forEach(handler => handler(mockPointer));

      // 重置 mock 調用記錄
      mockJoystickBase.setVisible.mockClear();
      mockJoystickThumb.setVisible.mockClear();

      // 釋放觸控
      pointerUpHandlers.forEach(handler => handler(mockPointer));

      expect(mockJoystickBase.setVisible).toHaveBeenCalledWith(false);
      expect(mockJoystickThumb.setVisible).toHaveBeenCalledWith(false);
    });

    it('釋放觸控時應該重置方向向量', () => {
      const mockPointer = {
        x: 200,
        y: 300,
        id: 1,
      };

      // 先觸碰顯示搖桿
      pointerDownHandlers.forEach(handler => handler(mockPointer));

      // 移動搖桿產生方向
      mockJoystickBase.x = 200;
      mockJoystickBase.y = 300;
      const movePointer = {
        x: 250,
        y: 300,
        id: 1,
      };
      pointerMoveHandlers.forEach(handler => handler(movePointer));

      // 釋放觸控
      pointerUpHandlers.forEach(handler => handler(mockPointer));

      // 方向應該重置為 (0, 0)
      const direction = adapter.getMovementInput();
      expect(direction.x).toBe(0);
      expect(direction.y).toBe(0);
    });
  });

  describe('搖桿死區判定', () => {
    it('在死區內移動時應該返回零向量', () => {
      const mockPointer = {
        x: 200,
        y: 300,
        id: 1,
      };

      // 觸碰顯示搖桿
      pointerDownHandlers.forEach(handler => handler(mockPointer));

      // 設置搖桿基座位置
      mockJoystickBase.x = 200;
      mockJoystickBase.y = 300;

      // 在死區內移動（距離 < 60 * 0.15 = 9 像素）
      const movePointer = {
        x: 205, // 距離 = 5 像素
        y: 300,
        id: 1,
      };
      pointerMoveHandlers.forEach(handler => handler(movePointer));

      const direction = adapter.getMovementInput();
      expect(direction.x).toBe(0);
      expect(direction.y).toBe(0);
    });

    it('超出死區時應該返回正規化方向向量', () => {
      const mockPointer = {
        x: 200,
        y: 300,
        id: 1,
      };

      // 觸碰顯示搖桿
      pointerDownHandlers.forEach(handler => handler(mockPointer));

      // 設置搖桿基座位置
      mockJoystickBase.x = 200;
      mockJoystickBase.y = 300;

      // 超出死區移動（距離 > 9 像素）
      const movePointer = {
        x: 250, // 距離 = 50 像素
        y: 300,
        id: 1,
      };
      pointerMoveHandlers.forEach(handler => handler(movePointer));

      const direction = adapter.getMovementInput();
      // 方向應該是正規化的（長度接近 1）
      const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
      expect(length).toBeCloseTo(1, 1);
    });
  });

  describe('多點觸控支援', () => {
    it('應該只追蹤第一個觸碰點', () => {
      const pointer1 = { x: 200, y: 300, id: 1 };
      const pointer2 = { x: 250, y: 350, id: 2 };

      // 第一個觸碰
      pointerDownHandlers.forEach(handler => handler(pointer1));

      // 重置 mock
      mockJoystickBase.setVisible.mockClear();
      mockJoystickThumb.setVisible.mockClear();

      // 第二個觸碰（應該被忽略）
      pointerDownHandlers.forEach(handler => handler(pointer2));

      // 不應該再次顯示搖桿
      expect(mockJoystickBase.setVisible).not.toHaveBeenCalledWith(true);
    });

    it('釋放非追蹤的觸碰點時不應該隱藏搖桿', () => {
      const pointer1 = { x: 200, y: 300, id: 1 };
      const pointer2 = { x: 250, y: 350, id: 2 };

      // 第一個觸碰
      pointerDownHandlers.forEach(handler => handler(pointer1));

      // 重置 mock
      mockJoystickBase.setVisible.mockClear();
      mockJoystickThumb.setVisible.mockClear();

      // 釋放第二個觸碰點（不是追蹤的點）
      pointerUpHandlers.forEach(handler => handler(pointer2));

      // 不應該隱藏搖桿
      expect(mockJoystickBase.setVisible).not.toHaveBeenCalledWith(false);
    });
  });

  describe('資源清理', () => {
    it('destroy 時應該清理搖桿物件', () => {
      adapter.destroy();

      expect(mockJoystickBase.destroy).toHaveBeenCalled();
      expect(mockJoystickThumb.destroy).toHaveBeenCalled();
    });
  });

  describe('IInputAdapter 介面實作', () => {
    it('應該實作 getMovementInput 方法', () => {
      const direction = adapter.getMovementInput();
      expect(direction).toBeInstanceOf(Phaser.Math.Vector2);
    });

    it('應該實作 isPointerDown 方法', () => {
      const isDown = adapter.isPointerDown();
      expect(typeof isDown).toBe('boolean');
    });

    it('應該實作 getPointerPosition 方法', () => {
      const position = adapter.getPointerPosition();
      expect(position).toBeInstanceOf(Phaser.Math.Vector2);
    });

    it('應該實作 update 方法', () => {
      expect(() => adapter.update(16)).not.toThrow();
    });
  });
});

/**
 * 實作說明
 * 
 * TouchInputAdapter 實作了浮動虛擬搖桿，具有以下特性：
 * 
 * 1. 浮動搖桿：
 *    - 搖桿不是固定位置，而是在玩家觸碰時出現在觸碰點
 *    - 這樣玩家可以在左半螢幕任意位置開始操作
 * 
 * 2. 左半螢幕觸發：
 *    - 只有觸碰螢幕左半部（x < width / 2）時才顯示搖桿
 *    - 右半螢幕保留給 UI 按鈕等其他操作
 * 
 * 3. 死區判定：
 *    - 搖桿半徑的 15% 範圍內視為死區
 *    - 在死區內的微小移動不會產生輸入，避免誤操作
 * 
 * 4. 多點觸控：
 *    - 使用 pointerId 追蹤特定觸碰點
 *    - 允許玩家同時操作搖桿和點擊 UI
 * 
 * 5. Safe Area 處理：
 *    - 避免搖桿出現在底部瀏覽器工具列區域
 *    - 提升移動端使用體驗
 */
