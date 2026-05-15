# 搖桿死區實作說明

## 任務 4.2.2: 實作搖桿死區（半徑 15%）

### 實作概述

在 `TouchInputAdapter` 中實作了搖桿死區功能，以避免微小抖動造成的誤操作。

### 技術規格

- **搖桿半徑**: 60 像素
- **死區比例**: 15% (0.15)
- **死區半徑**: 60 × 0.15 = **9 像素**

### 實作位置

檔案: `src/infrastructure/input/TouchInputAdapter.ts`

```typescript
private joystickRadius: number = 60;
private deadZoneRatio: number = 0.15;
```

### 核心邏輯

在 `pointermove` 事件處理器中 (第 76-81 行):

```typescript
// 死區判定
if (distance < this.joystickRadius * this.deadZoneRatio) {
  this.direction.set(0, 0);
  this.joystickThumb.setPosition(this.joystickBase.x, this.joystickBase.y);
  return;
}
```

### 行為說明

#### 死區內 (距離 < 9 像素)
- ✅ 返回零向量 `(0, 0)`
- ✅ 搖桿拇指重置到基座中心位置
- ✅ 角色停止移動

#### 死區外 (距離 >= 9 像素)
- ✅ 計算正規化方向向量
- ✅ 搖桿拇指跟隨觸控點位置
- ✅ 角色朝指定方向移動

### 視覺示意圖

```
        搖桿基座中心
             ●
            ╱│╲
           ╱ │ ╲
          ╱  │  ╲
         ╱   │   ╲
        ╱    │    ╲
       ╱     │     ╲
      ╱      │      ╲
     ╱   死區區域   ╲
    ╱   (半徑 9px)   ╲
   ╱                  ╲
  ╱────────────────────╲
 ╱                      ╱
╱──────────────────────╱
│                      │
│   有效輸入區域      │
│  (9px - 60px)       │
│                      │
└──────────────────────┘
```

### 測試案例

#### 測試 1: 死區內移動
```typescript
// 搖桿中心: (200, 300)
// 觸控點: (205, 300)
// 距離: 5 像素 < 9 像素
// 結果: direction = (0, 0) ✅
```

#### 測試 2: 死區邊界
```typescript
// 搖桿中心: (200, 300)
// 觸控點: (208, 300)
// 距離: 8 像素 < 9 像素
// 結果: direction = (0, 0) ✅
```

#### 測試 3: 死區外移動
```typescript
// 搖桿中心: (200, 300)
// 觸控點: (210, 300)
// 距離: 10 像素 >= 9 像素
// 結果: direction = (1, 0) 正規化向量 ✅
```

### 效果與優勢

1. **避免誤操作**: 手指輕微抖動不會觸發角色移動
2. **精確控制**: 提供明確的靜止/移動狀態切換
3. **改善體驗**: 減少非預期的角色移動，提升操作舒適度
4. **符合標準**: 15% 死區比例符合業界標準實踐

### 相關需求

- **需求 15.2**: 觸控操作適配 - 虛擬搖桿死區設定
- **需求 1.2**: 玩家角色移動 - 搖桿拖曳控制

### 測試檔案

- `tests/unit/TouchInputAdapter.test.ts` - 單元測試
- `tests/unit/TouchInputAdapter.deadzone.demo.test.ts` - 死區專項測試
- `tests/unit/TouchInputLatency.test.ts` - 延遲測試（包含死區測試）

### 實作狀態

✅ **已完成** - 死區功能已實作並通過測試

### 程式碼位置

```
src/infrastructure/input/TouchInputAdapter.ts
├── Line 8:  private joystickRadius: number = 60;
├── Line 9:  private deadZoneRatio: number = 0.15;
└── Line 76-81: 死區判定邏輯
```

### 相關文件

- [設計文件](../.kiro/specs/vampire-survivors-web/design.md) - Property 3: 搖桿死區過濾
- [需求文件](../.kiro/specs/vampire-survivors-web/requirements.md) - 需求 15.2
- [任務清單](../.kiro/specs/vampire-survivors-web/tasks.md) - 任務 4.2.2
