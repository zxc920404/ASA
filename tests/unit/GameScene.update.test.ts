import { describe, it, expect, vi, beforeEach } from 'vitest';
import Phaser from 'phaser';
import { GameScene, GameState } from '../../src/scenes/GameScene';

describe('GameScene update() 方法', () => {
  let scene: GameScene;
  let mockGame: Phaser.Game;

  beforeEach(() => {
    // 創建最小化的 Phaser Game 實例用於測試
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.HEADLESS,
      width: 800,
      height: 600,
      physics: {
        default: 'arcade',
        arcade: {
          debug: false,
        },
      },
      scene: GameScene,
    };

    mockGame = new Phaser.Game(config);
    scene = mockGame.scene.getScene('Game') as GameScene;
  });

  describe('GameState.Playing', () => {
    it('應該在 Playing 狀態下正常更新遊戲邏輯', () => {
      // 設置場景為 Playing 狀態
      scene.gameState = GameState.Playing;
      
      // 模擬必要的屬性
      scene.gameTime = 0;
      
      // 監視 updateGameplay 方法（如果它是私有的，我們檢查副作用）
      const initialTime = scene.gameTime;
      
      // 調用 update
      scene.update(0, 16.67); // 模擬 60 FPS (16.67ms per frame)
      
      // 驗證遊戲時間有更新（證明 updateGameplay 被調用）
      expect(scene.gameTime).toBeGreaterThan(initialTime);
    });
  });

  describe('GameState.Paused', () => {
    it('應該在 Paused 狀態下不更新遊戲邏輯', () => {
      // 設置場景為 Paused 狀態
      scene.gameState = GameState.Paused;
      scene.gameTime = 10;
      
      const initialTime = scene.gameTime;
      
      // 調用 update
      scene.update(0, 16.67);
      
      // 驗證遊戲時間沒有更新（證明 updateGameplay 沒有被調用）
      expect(scene.gameTime).toBe(initialTime);
    });
  });

  describe('GameState.LevelUp', () => {
    it('應該在 LevelUp 狀態下不更新遊戲邏輯', () => {
      // 設置場景為 LevelUp 狀態
      scene.gameState = GameState.LevelUp;
      scene.gameTime = 20;
      
      const initialTime = scene.gameTime;
      
      // 調用 update
      scene.update(0, 16.67);
      
      // 驗證遊戲時間沒有更新
      expect(scene.gameTime).toBe(initialTime);
    });
  });

  describe('GameState.GameOver', () => {
    it('應該在 GameOver 狀態下不更新遊戲邏輯', () => {
      // 設置場景為 GameOver 狀態
      scene.gameState = GameState.GameOver;
      scene.gameTime = 30;
      
      const initialTime = scene.gameTime;
      
      // 調用 update
      scene.update(0, 16.67);
      
      // 驗證遊戲時間沒有更新
      expect(scene.gameTime).toBe(initialTime);
    });
  });

  describe('GameState.Victory', () => {
    it('應該在 Victory 狀態下不更新遊戲邏輯', () => {
      // 設置場景為 Victory 狀態
      scene.gameState = GameState.Victory;
      scene.gameTime = 1800; // 30 分鐘
      
      const initialTime = scene.gameTime;
      
      // 調用 update
      scene.update(0, 16.67);
      
      // 驗證遊戲時間沒有更新
      expect(scene.gameTime).toBe(initialTime);
    });
  });

  describe('狀態轉換', () => {
    it('應該能夠從 Playing 切換到 Paused 並停止更新', () => {
      // 開始時為 Playing
      scene.gameState = GameState.Playing;
      scene.gameTime = 0;
      
      // 第一次更新（Playing）
      scene.update(0, 16.67);
      const timeAfterFirstUpdate = scene.gameTime;
      expect(timeAfterFirstUpdate).toBeGreaterThan(0);
      
      // 切換到 Paused
      scene.gameState = GameState.Paused;
      
      // 第二次更新（Paused）
      scene.update(16.67, 16.67);
      
      // 驗證時間沒有繼續增加
      expect(scene.gameTime).toBe(timeAfterFirstUpdate);
    });

    it('應該能夠從 Paused 恢復到 Playing 並繼續更新', () => {
      // 開始時為 Paused
      scene.gameState = GameState.Paused;
      scene.gameTime = 10;
      
      // 第一次更新（Paused）
      scene.update(0, 16.67);
      expect(scene.gameTime).toBe(10);
      
      // 切換到 Playing
      scene.gameState = GameState.Playing;
      
      // 第二次更新（Playing）
      scene.update(16.67, 16.67);
      
      // 驗證時間開始增加
      expect(scene.gameTime).toBeGreaterThan(10);
    });

    it('應該能夠從 Playing 切換到 LevelUp 並停止更新', () => {
      scene.gameState = GameState.Playing;
      scene.gameTime = 0;
      
      // Playing 狀態更新
      scene.update(0, 16.67);
      const timeAfterPlaying = scene.gameTime;
      
      // 切換到 LevelUp
      scene.gameState = GameState.LevelUp;
      
      // LevelUp 狀態更新
      scene.update(16.67, 16.67);
      
      // 驗證時間沒有繼續增加
      expect(scene.gameTime).toBe(timeAfterPlaying);
    });
  });

  describe('邊界情況', () => {
    it('應該處理 delta 為 0 的情況', () => {
      scene.gameState = GameState.Playing;
      scene.gameTime = 5;
      
      // delta = 0
      scene.update(0, 0);
      
      // 時間應該保持不變
      expect(scene.gameTime).toBe(5);
    });

    it('應該處理非常大的 delta 值', () => {
      scene.gameState = GameState.Playing;
      scene.gameTime = 0;
      
      // 非常大的 delta (1 秒)
      scene.update(0, 1000);
      
      // 時間應該增加 1 秒
      expect(scene.gameTime).toBeCloseTo(1, 1);
    });
  });
});
