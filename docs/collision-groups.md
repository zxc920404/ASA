# Arcade Physics 碰撞群組設定

## 概述

本專案使用 Phaser Arcade Physics 系統進行物理模擬與碰撞檢測。由於 Arcade Physics 不像 Matter.js 有內建的碰撞群組系統，我們採用手動碰撞檢測的方式來實現更靈活且高效能的碰撞處理。

## 碰撞群組

### 1. 玩家群組 (Player)
- **物件**: PlayerCharacter
- **物理設定**:
  - 啟用 Arcade Physics Body
  - 碰撞世界邊界 (collideWorldBounds: true)
  - 碰撞體積: 32x32 像素
- **碰撞對象**: 敵人、掉落物

### 2. 敵人群組 (Enemies)
- **物件**: EnemyBase (透過 Object Pool 管理)
- **物理設定**:
  - 啟用 Arcade Physics Body
  - 圓形碰撞體 (依據 config.bodySize)
  - 可推動 (pushable: true)
- **碰撞對象**: 玩家、投射物、其他敵人

### 3. 投射物群組 (Projectiles)
- **物件**: Projectile (透過 Object Pool 管理)
- **物理設定**:
  - 啟用 Arcade Physics Body
  - 圓形碰撞體 (半徑 6 像素，AoE 投射物會動態調整)
- **碰撞對象**: 敵人

### 4. 掉落物群組 (Drops)
- **物件**: XPGem, ItemDrop (透過 Object Pool 管理)
- **物理設定**:
  - 啟用 Arcade Physics Body
  - 圓形碰撞體 (半徑 8 像素)
- **碰撞對象**: 玩家

## 碰撞規則

| 群組 A | 群組 B | 碰撞效果 | 檢測方式 | 檢測位置 |
|--------|--------|----------|----------|----------|
| 玩家 | 敵人 | 接觸傷害 | 手動 | `GameScene.checkEnemyContactDamage()` |
| 投射物 | 敵人 | 造成傷害 | 手動 | `GameScene.checkProjectileEnemyCollisions()` |
| 玩家 | 掉落物 | 拾取 | 手動 | `DropSystem.update()` |
| 敵人 | 敵人 | 推擠 | 手動 | `GameScene.resolveEnemyCollisions()` |
| 投射物 | 投射物 | 無碰撞 | - | - |
| 掉落物 | 掉落物 | 無碰撞 | - | - |
| 掉落物 | 敵人 | 無碰撞 | - | - |

## 手動碰撞檢測的優勢

### 1. 效能優化
- **跳幀檢測**: 敵人間碰撞每 3 幀檢測一次
- **範圍限制**: 只檢測螢幕內的敵人碰撞
- **數量限制**: 敵人超過 80 隻時跳過碰撞檢測

### 2. 靈活的碰撞邏輯
- **AoE 穿透**: AoE 投射物可以穿透多個敵人
- **吸附效果**: 掉落物進入拾取範圍後自動飛向玩家
- **接觸冷卻**: 敵人接觸傷害有 0.5 秒冷卻時間

### 3. 避免效能問題
- 當場上有 200+ 敵人和 100+ 投射物時，Phaser 內建碰撞系統會造成嚴重效能問題
- 手動檢測可以精確控制檢測頻率和範圍

## 實作細節

### 玩家碰撞設定
```typescript
if (this.player.sprite.body) {
  const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
  body.setCollideWorldBounds(true); // 玩家不能超出地圖邊界
  body.setSize(32, 32); // 設定碰撞體積
  body.setOffset(0, 0); // 設定碰撞偏移
}
```

### 敵人碰撞設定
```typescript
// 在 EnemyBase 建構子中
scene.physics.add.existing(this.sprite);
const body = this.sprite.body as Phaser.Physics.Arcade.Body;
body.setCircle(config.bodySize);
body.pushable = true;
body.immovable = false;
```

### 投射物碰撞設定
```typescript
// 在 Projectile 建構子中
scene.physics.add.existing(this.sprite);
(this.sprite.body as Phaser.Physics.Arcade.Body).setCircle(6);

// 在 activate() 中動態調整 AoE 投射物
if (aoeRadius > 0) {
  body.setCircle(aoeRadius);
  this.sprite.setScale(aoeRadius / 16);
}
```

### 掉落物碰撞設定
```typescript
// 在 XPGem/ItemDrop 建構子中
scene.physics.add.existing(this.sprite);
(this.sprite.body as Phaser.Physics.Arcade.Body).setCircle(8);
```

## 效能監控

遊戲提供即時效能監控面板（開發模式），顯示：
- FPS (每秒幀數)
- 敵人數量
- 投射物數量
- 掉落物數量

當 FPS 低於 30 時，系統會自動：
1. 降低螢幕外敵人的更新頻率
2. 跳過敵人間碰撞檢測
3. 限制新敵人生成

## 未來擴展

如果需要更複雜的碰撞系統（如多層碰撞、碰撞過濾等），可以考慮：
1. 使用 Phaser Matter.js 物理引擎（支援碰撞群組）
2. 實作自訂的空間分割系統（Quadtree）
3. 使用 Web Workers 進行碰撞檢測

## 參考資料

- [Phaser Arcade Physics 文件](https://photonstorm.github.io/phaser3-docs/Phaser.Physics.Arcade.html)
- [Phaser 碰撞檢測教學](https://phaser.io/tutorials/getting-started-phaser3/part5)
- [遊戲效能優化最佳實踐](https://phaser.io/tutorials/performance-tips)
