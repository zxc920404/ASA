# Task 3.3.5 Implementation Summary

## 任務描述
實作 GameScene 中的 update() 主迴圈，根據 GameState 控制不同的更新邏輯。

## 實作內容

### 1. 重構 update() 方法
將原本的簡單 if 判斷重構為更清晰的 switch-case 結構，明確處理每個 GameState：

```typescript
update(_time: number, delta: number): void {
  // 根據 GameState 控制更新邏輯
  switch (this.gameState) {
    case GameState.Playing:
      // Playing: 正常遊戲更新
      this.updateGameplay(_time, delta);
      break;

    case GameState.Paused:
      // Paused: 暫停時不更新遊戲邏輯，僅保持渲染
      // 不執行任何遊戲邏輯更新
      break;

    case GameState.LevelUp:
      // LevelUp: 升級選擇時暫停遊戲邏輯
      // 物理系統已在 showLevelUpUI() 中暫停
      // 不執行任何遊戲邏輯更新
      break;

    case GameState.GameOver:
    case GameState.Victory:
      // GameOver/Victory: 結束狀態，不更新遊戲邏輯
      // 結算畫面已顯示，等待玩家選擇
      break;

    default:
      // 未知狀態，預設不更新
      console.warn(`Unknown GameState: ${this.gameState}`);
      break;
  }
}
```

### 2. 提取 updateGameplay() 私有方法
將原本在 update() 中的遊戲邏輯提取到獨立的 `updateGameplay()` 方法中，提高代碼可讀性和可維護性：

```typescript
private updateGameplay(_time: number, delta: number): void {
  // 累積遊戲時間
  this.gameTime += delta / 1000;

  // Input
  this.inputController.update(delta);
  const dir = this.inputController.getMovement();
  this.player.move(dir);
  this.player.update(delta);

  // Systems
  this.weaponSystem.update(delta);
  this.waveManager.update(delta, this.gameTime);
  this.enemySpawner.update(delta);
  this.dropSystem.update(delta);

  // Update projectiles
  this.updateProjectiles(delta);

  // Projectile-enemy collision (manual check)
  this.checkProjectileEnemyCollisions();

  // Enemy-player contact damage (manual check every frame)
  this.checkEnemyContactDamage();

  // Enemy-enemy collision (push apart)
  this.resolveEnemyCollisions();

  // HUD 更新節流（每 100ms 更新一次，而不是每幀）
  this.hudUpdateTimer += delta;
  if (this.hudUpdateTimer >= this.hudUpdateInterval) {
    this.hudUpdateTimer = 0;
    this.updateHUD();
  }

  // Map boundary warning
  this.updateBoundaryWarning();

  // 效能監控更新（每 500ms 更新一次）
  if (Math.floor(_time / 500) !== Math.floor((_time - delta) / 500)) {
    this.updatePerformanceMonitor();
  }
}
```

## GameState 處理邏輯

### Playing 狀態
- **行為**: 正常執行所有遊戲邏輯更新
- **包含**:
  - 玩家輸入處理
  - 玩家移動和更新
  - 武器系統更新
  - 波次管理器更新
  - 敵人生成器更新
  - 掉落系統更新
  - 投射物更新
  - 碰撞檢測（投射物-敵人、敵人-玩家、敵人-敵人）
  - HUD 更新
  - 地圖邊界警告
  - 效能監控

### Paused 狀態
- **行為**: 暫停所有遊戲邏輯更新
- **特點**:
  - 不執行任何遊戲邏輯
  - 保持畫面渲染（Phaser 自動處理）
  - 等待玩家恢復遊戲或選擇其他操作

### LevelUp 狀態
- **行為**: 升級選擇時暫停遊戲邏輯
- **特點**:
  - 不執行任何遊戲邏輯
  - 物理系統已在 `showLevelUpUI()` 中暫停
  - 顯示升級選項面板
  - 等待玩家選擇升級選項

### GameOver 狀態
- **行為**: 遊戲結束，不更新遊戲邏輯
- **特點**:
  - 不執行任何遊戲邏輯
  - 物理系統已在 `triggerGameOver()` 中暫停
  - 顯示遊戲結算畫面
  - 等待玩家選擇重新開始或返回主選單

### Victory 狀態
- **行為**: 遊戲勝利，不更新遊戲邏輯
- **特點**:
  - 不執行任何遊戲邏輯
  - 物理系統已在 `triggerVictory()` 中暫停
  - 顯示勝利結算畫面
  - 等待玩家選擇重新開始或返回主選單

## 改進點

### 1. 代碼結構優化
- 使用 switch-case 替代簡單的 if 判斷，更清晰地表達不同狀態的處理邏輯
- 提取 `updateGameplay()` 方法，將遊戲邏輯與狀態控制分離
- 為每個狀態添加詳細的中文註釋，說明該狀態的行為

### 2. 移除冗餘檢查
- 移除了原本的 `if (this.pauseMenuUI?.paused) return;` 檢查
- 因為 `GameState.Paused` 已經處理了暫停邏輯，不需要額外檢查

### 3. 錯誤處理
- 添加 default case 處理未知的 GameState
- 使用 `console.warn()` 記錄異常狀態，便於調試

## 測試

創建了完整的單元測試文件 `tests/unit/GameScene.update.test.ts`，包含：

### 測試覆蓋範圍
1. **Playing 狀態測試**: 驗證遊戲邏輯正常更新
2. **Paused 狀態測試**: 驗證遊戲邏輯不更新
3. **LevelUp 狀態測試**: 驗證遊戲邏輯不更新
4. **GameOver 狀態測試**: 驗證遊戲邏輯不更新
5. **Victory 狀態測試**: 驗證遊戲邏輯不更新
6. **狀態轉換測試**: 驗證狀態之間的正確切換
7. **邊界情況測試**: 驗證 delta=0 和大 delta 值的處理

### 測試方法
- 通過檢查 `gameTime` 是否更新來驗證 `updateGameplay()` 是否被調用
- 測試不同狀態之間的轉換行為
- 測試邊界情況（delta=0, 大 delta 值）

## 驗證

### TypeScript 編譯
- ✅ 無 TypeScript 編譯錯誤
- ✅ 通過 `getDiagnostics` 檢查

### 代碼質量
- ✅ 清晰的代碼結構
- ✅ 完整的中文註釋
- ✅ 符合 TypeScript 最佳實踐
- ✅ 遵循現有代碼風格

## 相關文件

### 修改的文件
- `src/scenes/GameScene.ts`: 重構 update() 方法，添加 updateGameplay() 方法

### 新增的文件
- `tests/unit/GameScene.update.test.ts`: 單元測試文件

## 符合需求

本實作完全符合任務 3.3.5 的要求：

✅ **在 GameScene 中實作 update() 方法**
- 已實作並重構為更清晰的結構

✅ **根據 GameState 控制不同的更新邏輯**
- 使用 switch-case 明確處理每個 GameState

✅ **Playing: 正常遊戲更新**
- 調用 updateGameplay() 執行所有遊戲邏輯

✅ **Paused: 暫停時不更新遊戲邏輯**
- 空的 case，不執行任何邏輯

✅ **LevelUp: 升級選擇時暫停**
- 空的 case，配合 physics.pause() 實現暫停

✅ **GameOver/Victory: 結束狀態處理**
- 合併處理，不執行任何邏輯，等待玩家操作

## 總結

本次實作成功地將 GameScene 的 update() 方法重構為更清晰、更易維護的結構。通過使用 switch-case 語句和提取 updateGameplay() 方法，代碼的可讀性和可維護性都得到了顯著提升。所有 GameState 都得到了正確的處理，並且添加了完整的測試覆蓋。
