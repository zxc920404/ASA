# Core Types

這個目錄包含遊戲核心的類型定義。

## GameState

`GameState` 列舉定義了遊戲的所有可能狀態。

### 狀態說明

- **Playing**: 遊戲進行中，所有遊戲邏輯正常更新
- **Paused**: 遊戲暫停，遊戲邏輯停止更新但保持渲染
- **LevelUp**: 升級選擇畫面，遊戲暫停並顯示升級選項
- **GameOver**: 遊戲結束（失敗），顯示結算畫面
- **Victory**: 遊戲勝利，顯示勝利結算畫面

### 使用範例

```typescript
import { GameState } from '../core/types';

// 在 GameScene 中使用
export class GameScene extends Phaser.Scene {
  private gameState: GameState = GameState.Playing;

  update(time: number, delta: number): void {
    // 根據遊戲狀態控制更新邏輯
    if (this.gameState !== GameState.Playing) {
      return; // 非遊戲進行狀態時不更新遊戲邏輯
    }

    // 正常遊戲邏輯更新
    this.updateGameplay(time, delta);
  }

  pauseGame(): void {
    this.gameState = GameState.Paused;
    this.physics.pause();
  }

  resumeGame(): void {
    this.gameState = GameState.Playing;
    this.physics.resume();
  }

  showLevelUpScreen(): void {
    this.gameState = GameState.LevelUp;
    this.physics.pause();
    // 顯示升級選項 UI
  }

  triggerGameOver(): void {
    this.gameState = GameState.GameOver;
    this.physics.pause();
    // 顯示遊戲結束畫面
  }

  triggerVictory(): void {
    this.gameState = GameState.Victory;
    this.physics.pause();
    // 顯示勝利畫面
  }
}
```

### Switch 語句範例

```typescript
switch (this.gameState) {
  case GameState.Playing:
    // 正常遊戲更新
    this.updateGameplay(time, delta);
    break;

  case GameState.Paused:
    // 暫停時不更新遊戲邏輯
    break;

  case GameState.LevelUp:
    // 升級畫面，等待玩家選擇
    break;

  case GameState.GameOver:
  case GameState.Victory:
    // 結束狀態，顯示結算畫面
    break;
}
```

### 狀態轉換流程

```
Playing ←→ Paused
   ↓
LevelUp → Playing
   ↓
GameOver (終止狀態)
   ↓
Victory (終止狀態)
```

### 注意事項

1. `GameOver` 和 `Victory` 是終止狀態，通常不會再轉換回其他狀態
2. 從 `LevelUp` 狀態返回時應該恢復到 `Playing` 狀態
3. `Paused` 狀態可以與 `Playing` 狀態互相切換
4. 狀態轉換時應該同步更新物理引擎的暫停/恢復狀態
