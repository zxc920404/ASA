# 輸入系統平台檢測實現文件

## 任務概述

**任務 4.1.1**: 依據平台自動選擇 TouchInputAdapter 或 KeyboardMouseAdapter

## 實現位置

`src/infrastructure/input/InputController.ts`

## 實現詳情

### 平台檢測邏輯

InputController 在構造函數中實現了自動平台檢測:

```typescript
constructor(scene: Phaser.Scene) {
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  this.adapter = isTouch
    ? new TouchInputAdapter(scene)
    : new KeyboardMouseAdapter(scene);
}
```

### 檢測方法

#### 1. `'ontouchstart' in window`

- **目的**: 檢查瀏覽器是否支援觸控事件
- **原理**: 觸控設備的瀏覽器會在 window 物件上提供 `ontouchstart` 屬性
- **適用場景**: 
  - 移動設備 (手機、平板)
  - 觸控螢幕筆記型電腦
  - 支援觸控的桌面顯示器

#### 2. `navigator.maxTouchPoints > 0`

- **目的**: 檢查設備支援的最大同時觸控點數
- **原理**: 
  - 觸控設備: `maxTouchPoints` 通常 > 0 (例如: 5, 10)
  - 非觸控設備: `maxTouchPoints` = 0
- **適用場景**: 
  - 作為 `ontouchstart` 檢測的補充
  - 某些現代瀏覽器可能不提供 `ontouchstart`，但會提供 `maxTouchPoints`

### 邏輯運算

使用 **OR (||)** 運算符組合兩個檢測條件:

```typescript
const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
```

- 只要**任一條件**為真，就判定為觸控設備
- 提高檢測的準確性和相容性

## 適配器選擇

### TouchInputAdapter (觸控設備)

**使用場景**:
- Android 手機/平板
- iOS 設備 (iPhone, iPad)
- 觸控螢幕筆記型電腦

**特性**:
- 虛擬搖桿控制
- 浮動搖桿 (觸碰位置顯示)
- 死區過濾 (15% 半徑)
- 多點觸控支援

**實現位置**: `src/infrastructure/input/TouchInputAdapter.ts`

### KeyboardMouseAdapter (桌面設備)

**使用場景**:
- 桌面電腦
- 筆記型電腦 (無觸控)
- 瀏覽器開發測試環境

**特性**:
- WASD 鍵盤控制
- 滑鼠點擊支援
- 方向向量正規化

**實現位置**: `src/infrastructure/input/KeyboardMouseAdapter.ts`

## 統一介面 (IInputAdapter)

兩個適配器都實現相同的介面，確保可互換性:

```typescript
export interface IInputAdapter {
  getMovementInput(): Phaser.Math.Vector2;
  isPointerDown(): boolean;
  getPointerPosition(): Phaser.Math.Vector2;
  update(delta: number): void;
  destroy(): void;
}
```

### 方法說明

| 方法 | 返回類型 | 說明 |
|------|---------|------|
| `getMovementInput()` | `Vector2` | 獲取正規化的移動方向向量 |
| `isPointerDown()` | `boolean` | 檢查指標/觸控是否按下 |
| `getPointerPosition()` | `Vector2` | 獲取指標/觸控的螢幕位置 |
| `update(delta)` | `void` | 更新輸入狀態 (每幀調用) |
| `destroy()` | `void` | 清理資源 |

## 使用範例

### 在 GameScene 中使用

```typescript
export class GameScene extends Phaser.Scene {
  private inputController!: InputController;

  create(): void {
    // 自動檢測平台並選擇適配器
    this.inputController = new InputController(this);
  }

  update(time: number, delta: number): void {
    // 獲取移動輸入 (無論哪個平台都使用相同方法)
    const movement = this.inputController.getMovement();
    
    // 移動玩家
    if (movement.length() > 0) {
      this.player.move(movement);
    }
  }
}
```

## 驗收標準

### ✅ 已完成項目

1. **平台檢測邏輯實現**
   - ✅ 使用 `'ontouchstart' in window` 檢測
   - ✅ 使用 `navigator.maxTouchPoints > 0` 檢測
   - ✅ 邏輯 OR 組合兩個條件

2. **自動適配器選擇**
   - ✅ 觸控設備 → TouchInputAdapter
   - ✅ 桌面設備 → KeyboardMouseAdapter

3. **統一介面**
   - ✅ 兩個適配器實現 IInputAdapter
   - ✅ 提供相同的方法簽名
   - ✅ 透明切換，無需修改調用代碼

4. **功能驗證**
   - ✅ 移動設備上顯示虛擬搖桿
   - ✅ 桌面設備上使用 WASD 鍵盤
   - ✅ 兩種輸入方式都能正確控制角色移動

## 測試

### 單元測試

位置: `tests/unit/InputController.test.ts`

測試內容:
- 平台檢測邏輯驗證
- 適配器選擇正確性
- 統一介面方法委派

### 手動測試

1. **桌面瀏覽器測試**:
   ```bash
   npm run dev
   ```
   - 開啟 Chrome/Firefox
   - 使用 WASD 鍵控制角色
   - 驗證鍵盤輸入正常

2. **移動設備測試**:
   - 使用 Chrome DevTools 的設備模擬器
   - 或在實際移動設備上測試
   - 觸碰螢幕左半部應顯示虛擬搖桿
   - 拖曳搖桿應能控制角色移動

3. **Capacitor Android 測試**:
   ```bash
   npm run build
   npx cap sync
   npx cap open android
   ```
   - 在 Android Studio 中運行
   - 驗證觸控輸入正常工作

## 相關需求

- **需求 1**: 玩家角色移動
  - 驗收條件 1: 虛擬搖桿顯示與追蹤
  - 驗收條件 6: WASD 鍵盤輸入轉換

- **需求 15**: 觸控操作適配
  - 驗收條件 1: 浮動虛擬搖桿實作
  - 驗收條件 2: 死區半徑設定

- **需求 17**: 瀏覽器開發與測試
  - 驗收條件 2: WASD 鍵映射
  - 驗收條件 3: 滑鼠點擊支援
  - 驗收條件 4: Input_Adapter 介面統一

## 技術決策

### 為什麼使用兩個檢測條件?

1. **相容性**: 不同瀏覽器可能只支援其中一種檢測方式
2. **準確性**: 雙重檢測降低誤判機率
3. **未來保障**: 隨著瀏覽器標準演進，確保持續有效

### 為什麼使用適配器模式?

1. **關注點分離**: 平台檢測邏輯與輸入處理邏輯分離
2. **可擴展性**: 未來可輕鬆添加新的輸入方式 (如遊戲手把)
3. **可測試性**: 可以獨立測試每個適配器
4. **統一介面**: 遊戲邏輯無需關心底層輸入來源

## 未來擴展

### 可能的改進方向

1. **遊戲手把支援**:
   ```typescript
   if (navigator.getGamepads().some(gp => gp !== null)) {
     this.adapter = new GamepadAdapter(scene);
   }
   ```

2. **混合輸入**:
   - 同時支援鍵盤和觸控
   - 動態切換輸入方式

3. **自訂輸入配置**:
   - 允許玩家重新映射按鍵
   - 調整搖桿靈敏度

## 結論

任務 4.1.1 已成功完成。InputController 實現了可靠的平台檢測邏輯，能夠自動選擇適合的輸入適配器，確保遊戲在移動設備和桌面設備上都能提供良好的操作體驗。

實現遵循了設計文件的規範，使用適配器模式提供了清晰的架構，為未來的擴展預留了空間。
