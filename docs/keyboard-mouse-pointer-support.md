# KeyboardMouseAdapter 滑鼠點擊支援

## 概述

本文件說明 `KeyboardMouseAdapter` 中滑鼠點擊支援的實作，對應任務 **4.3.2 滑鼠點擊支援 UI 操作**。

## 實作內容

### 1. isPointerDown() 方法

檢測滑鼠按鈕是否按下，用於 UI 按鈕點擊檢測。

**實作位置**: `src/infrastructure/input/KeyboardMouseAdapter.ts`

```typescript
isPointerDown(): boolean {
  return this.scene.input.activePointer.isDown;
}
```

**功能說明**:
- 返回 `true` 當滑鼠左鍵按下
- 返回 `false` 當滑鼠左鍵未按下
- 即時反映滑鼠按鈕狀態

**使用場景**:
- UI 按鈕點擊檢測
- 拖曳操作開始/結束判定
- 滑鼠互動狀態追蹤

### 2. getPointerPosition() 方法

獲取滑鼠在遊戲世界中的位置座標。

**實作位置**: `src/infrastructure/input/KeyboardMouseAdapter.ts`

```typescript
getPointerPosition(): Phaser.Math.Vector2 {
  const p = this.scene.input.activePointer;
  return new Phaser.Math.Vector2(p.worldX, p.worldY);
}
```

**功能說明**:
- 返回滑鼠在遊戲世界座標系中的位置
- 使用 `worldX` 和 `worldY` 而非螢幕座標，自動處理攝影機偏移
- 每次調用返回新的 `Vector2` 實例，避免引用問題

**使用場景**:
- UI 元素懸停檢測
- 點擊位置判定
- 拖曳操作位置追蹤
- 滑鼠游標相關功能

## 介面一致性

`KeyboardMouseAdapter` 完整實作 `IInputAdapter` 介面：

```typescript
export interface IInputAdapter {
  getMovementInput(): Phaser.Math.Vector2;  // WASD 鍵盤移動
  isPointerDown(): boolean;                  // 滑鼠按鈕狀態 ✓
  getPointerPosition(): Phaser.Math.Vector2; // 滑鼠位置 ✓
  update(delta: number): void;               // 更新輸入狀態
  destroy(): void;                           // 清理資源
}
```

## 與 TouchInputAdapter 的對應關係

| 功能 | KeyboardMouseAdapter | TouchInputAdapter |
|------|---------------------|-------------------|
| 移動輸入 | WASD 鍵盤 | 虛擬搖桿 |
| 指標按下檢測 | `activePointer.isDown` | `isActive` (搖桿啟用狀態) |
| 指標位置 | `worldX, worldY` | `x, y` (螢幕座標) |
| 座標系統 | 世界座標 | 螢幕座標 |

## 使用範例

### 範例 1: UI 按鈕點擊檢測

```typescript
class GameScene extends Phaser.Scene {
  private inputController: InputController;
  private button: Phaser.GameObjects.Rectangle;

  update() {
    if (this.inputController.isPointerDown()) {
      const pos = this.inputController.getPointerPosition();
      
      // 檢查滑鼠是否點擊按鈕
      if (this.button.getBounds().contains(pos.x, pos.y)) {
        this.onButtonClick();
      }
    }
  }
}
```

### 範例 2: 拖曳操作

```typescript
class DraggableUI {
  private isDragging = false;
  private dragStartPos: Phaser.Math.Vector2;

  update(inputController: InputController) {
    const isDown = inputController.isPointerDown();
    const pos = inputController.getPointerPosition();

    if (isDown && !this.isDragging) {
      // 開始拖曳
      this.isDragging = true;
      this.dragStartPos = pos.clone();
    } else if (!isDown && this.isDragging) {
      // 結束拖曳
      this.isDragging = false;
    } else if (this.isDragging) {
      // 拖曳中
      const offset = pos.clone().subtract(this.dragStartPos);
      this.updatePosition(offset);
    }
  }
}
```

### 範例 3: 懸停效果

```typescript
class HoverableButton {
  private isHovered = false;

  update(inputController: InputController) {
    const pos = inputController.getPointerPosition();
    const wasHovered = this.isHovered;
    
    this.isHovered = this.bounds.contains(pos.x, pos.y);
    
    if (this.isHovered && !wasHovered) {
      this.onHoverEnter();
    } else if (!this.isHovered && wasHovered) {
      this.onHoverExit();
    }
  }
}
```

## 測試覆蓋

### 單元測試

測試檔案: `tests/unit/KeyboardMouseAdapter.pointer.test.ts`

**測試項目**:

1. **isPointerDown() 測試**
   - ✓ 滑鼠未按下時返回 false
   - ✓ 滑鼠按下時返回 true
   - ✓ 即時反映滑鼠按鈕狀態變化

2. **getPointerPosition() 測試**
   - ✓ 正確返回世界座標
   - ✓ 滑鼠移動時更新位置
   - ✓ 每次返回新的 Vector2 實例
   - ✓ 處理負座標
   - ✓ 處理零座標
   - ✓ 處理大數值座標

3. **UI 按鈕點擊支援測試**
   - ✓ 懸停狀態檢測
   - ✓ 點擊狀態檢測
   - ✓ 拖曳操作追蹤

4. **介面整合測試**
   - ✓ 實作所有 IInputAdapter 方法
   - ✓ 與鍵盤輸入並行運作

### 執行測試

```bash
# 執行所有測試
npm test

# 執行指標支援測試
npm test -- KeyboardMouseAdapter.pointer.test.ts

# 執行所有 KeyboardMouseAdapter 測試
npm test -- KeyboardMouseAdapter
```

## 技術細節

### 世界座標 vs 螢幕座標

`KeyboardMouseAdapter` 使用 **世界座標** (`worldX`, `worldY`)，這意味著：

- ✓ 自動處理攝影機偏移和縮放
- ✓ 適合遊戲物件互動（玩家、敵人、道具）
- ✓ 與 Phaser 物理系統座標一致

相對於 `TouchInputAdapter` 使用 **螢幕座標** (`x`, `y`)：
- 適合固定 UI 元素（HUD、選單）
- 不受攝影機影響

### Phaser Input System 整合

```typescript
// Phaser 提供的 activePointer 物件
scene.input.activePointer = {
  isDown: boolean,      // 滑鼠按鈕狀態
  x: number,            // 螢幕 X 座標
  y: number,            // 螢幕 Y 座標
  worldX: number,       // 世界 X 座標（考慮攝影機）
  worldY: number,       // 世界 Y 座標（考慮攝影機）
  // ... 其他屬性
}
```

## 設計決策

### 為什麼使用 worldX/worldY？

1. **一致性**: 與遊戲物件座標系統一致
2. **簡化邏輯**: 不需要手動轉換座標
3. **攝影機支援**: 自動處理攝影機移動和縮放
4. **物理系統整合**: 直接用於碰撞檢測和物理查詢

### 為什麼每次返回新的 Vector2？

```typescript
// ✓ 正確：返回新實例
return new Phaser.Math.Vector2(p.worldX, p.worldY);

// ✗ 錯誤：返回共享實例
return this.cachedPosition.set(p.worldX, p.worldY);
```

**原因**:
- 避免引用問題：調用者可以安全地修改返回的向量
- 防止意外副作用：多個系統可以獨立使用位置資料
- 符合 Phaser 慣例：大多數 Phaser API 返回新實例

## 效能考量

### 記憶體分配

每次調用 `getPointerPosition()` 會建立新的 `Vector2` 物件：

```typescript
// 每幀可能調用多次
const pos = adapter.getPointerPosition(); // 新物件
```

**優化建議**:
- 在 `update()` 中只調用一次，儲存結果
- 使用物件池（如果成為效能瓶頸）

```typescript
// ✓ 優化：每幀只調用一次
update() {
  const pointerPos = this.inputController.getPointerPosition();
  
  this.checkButtonHover(pointerPos);
  this.checkDragging(pointerPos);
  this.checkSelection(pointerPos);
}

// ✗ 未優化：重複調用
update() {
  this.checkButtonHover(this.inputController.getPointerPosition());
  this.checkDragging(this.inputController.getPointerPosition());
  this.checkSelection(this.inputController.getPointerPosition());
}
```

## 相關文件

- [IInputAdapter 介面定義](../src/core/interfaces/IInputAdapter.ts)
- [InputController 實作](../src/infrastructure/input/InputController.ts)
- [TouchInputAdapter 實作](../src/infrastructure/input/TouchInputAdapter.ts)
- [輸入系統平台檢測](./input-platform-detection.md)

## 任務完成檢查清單

- [x] 實作 `isPointerDown()` 方法
- [x] 實作 `getPointerPosition()` 方法
- [x] 使用世界座標系統
- [x] 返回新的 Vector2 實例
- [x] 與 IInputAdapter 介面一致
- [x] 編寫單元測試
- [x] 測試 UI 按鈕點擊場景
- [x] 測試拖曳操作場景
- [x] 文件撰寫

## 結論

`KeyboardMouseAdapter` 的滑鼠點擊支援已完整實作，提供：

1. ✓ **isPointerDown()**: 檢測滑鼠按鈕狀態
2. ✓ **getPointerPosition()**: 獲取滑鼠世界座標
3. ✓ **UI 操作支援**: 適用於按鈕點擊、拖曳、懸停等場景
4. ✓ **介面一致性**: 完整實作 IInputAdapter
5. ✓ **測試覆蓋**: 全面的單元測試

實作符合設計文件規範，可用於所有 UI 互動場景。
