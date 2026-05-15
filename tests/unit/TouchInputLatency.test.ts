/**
 * TouchInputAdapter 響應延遲測試
 * 
 * 任務 4.2.4: 確保觸控到移動延遲不超過 2 幀
 * 
 * 需求 15.6: 觸控輸入與角色移動之間的延遲不超過 2 幀（約 66 毫秒，以 30 FPS 計算）
 * 設計文件: 使用事件驅動而非輪詢方式處理觸控
 * 
 * 驗證項目:
 * 1. 觸控事件到方向向量更新的延遲 < 33ms (2 幀 @ 60FPS)
 * 2. 事件驅動機制確保即時響應
 * 3. 無輪詢延遲
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import Phaser from 'phaser';
import { TouchInputAdapter } from '../../src/infrastructure/input/TouchInputAdapter';

describe('TouchInputAdapter - 響應延遲測試', () => {
  let scene: Phaser.Scene;
  let adapter: TouchInputAdapter;

  beforeEach(() => {
    // 創建模擬 Phaser Scene
    const mockGame = {
      config: {},
      events: new Phaser.Events.EventEmitter(),
    } as any;

    scene = {
      game: mockGame,
      add: {
        image: vi.fn().mockReturnValue({
          setScrollFactor: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
          x: 0,
          y: 0,
        }),
      },
      input: {
        on: vi.fn(),
        activePointer: {
          x: 0,
          y: 0,
          isDown: false,
        },
      },
      scale: {
        width: 800,
        height: 600,
      },
    } as any;

    adapter = new TouchInputAdapter(scene);
  });

  it('應該使用事件驅動機制而非輪詢', () => {
    // 驗證事件監聽器已註冊
    expect(scene.input.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    expect(scene.input.on).toHaveBeenCalledWith('pointermove', expect.any(Function));
    expect(scene.input.on).toHaveBeenCalledWith('pointerup', expect.any(Function));
  });

  it('應該在觸控事件中立即更新方向向量（無輪詢延遲）', () => {
    // 獲取註冊的事件處理器
    const pointerdownHandler = (scene.input.on as any).mock.calls.find(
      (call: any) => call[0] === 'pointerdown'
    )?.[1];
    const pointermoveHandler = (scene.input.on as any).mock.calls.find(
      (call: any) => call[0] === 'pointermove'
    )?.[1];

    expect(pointerdownHandler).toBeDefined();
    expect(pointermoveHandler).toBeDefined();

    // 模擬觸控開始（左半螢幕）
    const mockPointer = {
      id: 1,
      x: 100,
      y: 300,
    };

    pointerdownHandler(mockPointer);

    // 模擬觸控移動
    const movePointer = {
      id: 1,
      x: 150,
      y: 300,
    };

    // 記錄開始時間
    const startTime = performance.now();
    
    pointermoveHandler(movePointer);
    
    // 記錄結束時間
    const endTime = performance.now();
    const latency = endTime - startTime;

    // 獲取更新後的方向
    const direction = adapter.getMovementInput();

    // 驗證方向已更新（不為零向量）
    expect(direction.x).not.toBe(0);

    // 驗證延遲小於 33ms（2 幀 @ 60FPS）
    // 注意：實際測試中，事件處理通常在微秒級別完成
    expect(latency).toBeLessThan(33);

    console.log(`觸控響應延遲: ${latency.toFixed(3)}ms (目標: < 33ms)`);
  });

  it('應該在多次觸控移動中保持低延遲', () => {
    const pointerdownHandler = (scene.input.on as any).mock.calls.find(
      (call: any) => call[0] === 'pointerdown'
    )?.[1];
    const pointermoveHandler = (scene.input.on as any).mock.calls.find(
      (call: any) => call[0] === 'pointermove'
    )?.[1];

    // 啟動搖桿
    pointerdownHandler({ id: 1, x: 100, y: 300 });

    const latencies: number[] = [];

    // 模擬連續 10 次觸控移動
    for (let i = 0; i < 10; i++) {
      const movePointer = {
        id: 1,
        x: 100 + i * 10,
        y: 300,
      };

      const startTime = performance.now();
      pointermoveHandler(movePointer);
      const endTime = performance.now();

      latencies.push(endTime - startTime);
    }

    // 計算平均延遲
    const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
    const maxLatency = Math.max(...latencies);

    console.log(`平均延遲: ${avgLatency.toFixed(3)}ms`);
    console.log(`最大延遲: ${maxLatency.toFixed(3)}ms`);

    // 驗證所有延遲都小於 33ms
    latencies.forEach((latency, index) => {
      expect(latency).toBeLessThan(33);
    });

    // 驗證平均延遲遠小於目標值
    expect(avgLatency).toBeLessThan(10);
  });

  it('應該在死區內立即重置方向為零向量', () => {
    const pointerdownHandler = (scene.input.on as any).mock.calls.find(
      (call: any) => call[0] === 'pointerdown'
    )?.[1];
    const pointermoveHandler = (scene.input.on as any).mock.calls.find(
      (call: any) => call[0] === 'pointermove'
    )?.[1];

    // 啟動搖桿
    pointerdownHandler({ id: 1, x: 100, y: 300 });

    // 模擬在死區內移動（距離 < 搖桿半徑 * 0.15）
    const movePointer = {
      id: 1,
      x: 105, // 距離中心 5 像素，小於死區半徑 (60 * 0.15 = 9)
      y: 300,
    };

    const startTime = performance.now();
    pointermoveHandler(movePointer);
    const endTime = performance.now();

    const direction = adapter.getMovementInput();

    // 驗證方向為零向量
    expect(direction.x).toBe(0);
    expect(direction.y).toBe(0);

    // 驗證響應時間仍然很快
    expect(endTime - startTime).toBeLessThan(33);
  });

  it('應該在觸控釋放時立即重置狀態', () => {
    const pointerdownHandler = (scene.input.on as any).mock.calls.find(
      (call: any) => call[0] === 'pointerdown'
    )?.[1];
    const pointermoveHandler = (scene.input.on as any).mock.calls.find(
      (call: any) => call[0] === 'pointermove'
    )?.[1];
    const pointerupHandler = (scene.input.on as any).mock.calls.find(
      (call: any) => call[0] === 'pointerup'
    )?.[1];

    // 啟動搖桿並移動
    pointerdownHandler({ id: 1, x: 100, y: 300 });
    pointermoveHandler({ id: 1, x: 150, y: 300 });

    // 驗證方向不為零
    let direction = adapter.getMovementInput();
    expect(direction.x).not.toBe(0);

    // 釋放觸控
    const startTime = performance.now();
    pointerupHandler({ id: 1 });
    const endTime = performance.now();

    // 驗證方向已重置
    direction = adapter.getMovementInput();
    expect(direction.x).toBe(0);
    expect(direction.y).toBe(0);

    // 驗證響應時間
    expect(endTime - startTime).toBeLessThan(33);
  });

  it('update() 方法不應執行任何輪詢邏輯', () => {
    // 記錄初始方向
    const initialDirection = adapter.getMovementInput().clone();

    // 調用 update() 多次
    for (let i = 0; i < 100; i++) {
      adapter.update(16.67); // 模擬 60 FPS
    }

    // 驗證方向未改變（因為沒有觸控事件）
    const finalDirection = adapter.getMovementInput();
    expect(finalDirection.x).toBe(initialDirection.x);
    expect(finalDirection.y).toBe(initialDirection.y);
  });

  it('應該支援多點觸控（僅追蹤第一個觸控點）', () => {
    const pointerdownHandler = (scene.input.on as any).mock.calls.find(
      (call: any) => call[0] === 'pointerdown'
    )?.[1];
    const pointermoveHandler = (scene.input.on as any).mock.calls.find(
      (call: any) => call[0] === 'pointermove'
    )?.[1];

    // 第一個觸控點（左半螢幕）
    pointerdownHandler({ id: 1, x: 100, y: 300 });
    pointermoveHandler({ id: 1, x: 150, y: 300 });

    const direction1 = adapter.getMovementInput();
    expect(direction1.x).toBeGreaterThan(0);

    // 第二個觸控點（應該被忽略）
    pointerdownHandler({ id: 2, x: 600, y: 300 });
    pointermoveHandler({ id: 2, x: 650, y: 300 });

    // 驗證方向未改變（仍然追蹤第一個觸控點）
    const direction2 = adapter.getMovementInput();
    expect(direction2.x).toBe(direction1.x);
    expect(direction2.y).toBe(direction1.y);
  });
});
