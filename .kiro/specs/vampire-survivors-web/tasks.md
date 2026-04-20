# 實作任務清單

## 第 1 階段：專案初始化與基礎架構

- [x] 1.1 初始化 Vite + TypeScript + Phaser.js 專案
  - [x] 1.1.1 建立 package.json，安裝 phaser、typescript、vite、vitest、fast-check、@capacitor/core、@capacitor/cli 等依賴
  - [x] 1.1.2 建立 tsconfig.json（strict mode、ES2020 target、moduleResolution bundler）
  - [x] 1.1.3 建立 vite.config.ts（base: './'、terser 壓縮、phaser manualChunks）
  - [x] 1.1.4 建立 capacitor.config.ts（appId、webDir: dist、minSdkVersion 24、targetSdkVersion 34）
  - [x] 1.1.5 建立 index.html 與 src/main.ts（Phaser.Game 初始化，Scale.FIT 模式，Arcade Physics）

- [x] 1.2 建立專案目錄結構
  - [x] 1.2.1 建立 src/core/、src/gameplay/、src/ui/、src/infrastructure/、src/scenes/、src/data/ 目錄
  - [x] 1.2.2 建立 public/assets/sprites/、public/assets/tilemaps/、public/assets/audio/bgm/、public/assets/audio/sfx/ 目錄
  - [x] 1.2.3 建立 tests/unit/、tests/property/ 目錄

- [x] 1.3 實作核心 TypeScript 介面（core/interfaces/）
  - [x] 1.3.1 建立 IWeapon.ts 介面（id、config、level、attack、levelUp、canEvolve、evolve）
  - [x] 1.3.2 建立 IEnemy.ts 介面（id、config、currentHP、takeDamage、activate、deactivate、update）
  - [x] 1.3.3 建立 IPlayerCharacter.ts 介面（config、currentHP、position、move、takeDamage、applyStatModifier）
  - [x] 1.3.4 建立 IPassiveItem.ts 介面（id、config、level、getModifier、levelUp）
  - [x] 1.3.5 建立 IInputAdapter.ts 介面（getMovementInput、isPointerDown、getPointerPosition、update、destroy）
  - [x] 1.3.6 建立 ISaveProvider.ts 介面（save、load、delete、exists）
  - [x] 1.3.7 建立 core/plugin-interfaces/index.ts（ISkillModule、IEquipmentModule、IGachaModule、IQuestModule、IAdModule、IIAPModule）

- [x] 1.4 實作資料型別定義（data/types.ts）
  - [x] 1.4.1 定義 WeaponConfig、WeaponLevelData 型別
  - [x] 1.4.2 定義 EnemyConfig、DropTableEntry 型別
  - [x] 1.4.3 定義 CharacterConfig 型別
  - [x] 1.4.4 定義 PassiveItemConfig、PassiveItemLevelData、StatModifier、StatType 型別
  - [x] 1.4.5 定義 WaveConfig 型別
  - [x] 1.4.6 定義 PoolConfigData、PoolEntry 型別
  - [x] 1.4.7 定義 PermanentUpgrade、SaveData 型別

## 第 2 階段：核心系統

- [x] 2.1 實作事件匯流排（core/events/）
  - [x] 2.1.1 實作 EventBus 類別（on、off、emit、clear 方法，使用 Map<string, Set<handler>>）
  - [x] 2.1.2 定義 GameEvents.ts 所有事件介面與事件名稱常數（GameEventNames）
  - [x] 2.1.3 匯出全域 eventBus 單例

- [ ] 2.2 實作 Object Pool 系統（core/pool/）
  - [x] 2.2.1 實作 ObjectPool<T> 泛型類別（preAllocate、spawn、despawn、expand、getStats、clear）
  - [x] 2.2.2 實作 PoolStats 介面
  - [x] 2.2.3 實作 ObjectPoolManager 類別（register、getPool、getAllStats、clearAll）
  - [x] 2.2.4 確保 expand() 批次擴容不超過 10 個

- [ ] 2.3 建立 JSON 設定檔（src/data/）
  - [x] 2.3.1 建立 weapons.json（至少 6 種武器：飛刀、魔杖、聖水、大蒜、鞭子、斧頭，含 levelData 與進化配方）
  - [x] 2.3.2 建立 enemies.json（至少 5 種敵人：蝙蝠、骷髏、狼人、石像鬼、死神，含 dropTable）
  - [x] 2.3.3 建立 characters.json（至少 3 個角色，含初始武器與基礎屬性）
  - [x] 2.3.4 建立 waves.json（30 分鐘波次設定，每 30 秒難度遞增，每 5 分鐘 Boss）
  - [x] 2.3.5 建立 passive-items.json（至少 6 種被動道具，與武器進化配方對應）
  - [x] 2.3.6 建立 pool-config.json（各物件池預分配數量與擴容上限）

## 第 3 階段：Phaser Scene 與基礎遊戲流程

- [-] 3.1 實作 BootScene（scenes/BootScene.ts）
  - [ ] 3.1.1 preload() 載入 Texture Atlas、Tilemap JSON、音效檔案、JSON 設定檔
  - [ ] 3.1.2 建立載入進度條 UI
  - [ ] 3.1.3 create() 完成後切換至 MainMenuScene

- [ ] 3.2 實作 MainMenuScene（scenes/MainMenuScene.ts）
  - [ ] 3.2.1 顯示主選單按鈕（開始遊戲、角色選擇、永久升級、設定）
  - [ ] 3.2.2 實作角色選擇畫面（顯示角色列表、屬性、解鎖狀態）
  - [ ] 3.2.3 實作地圖選擇畫面
  - [ ] 3.2.4 實作永久升級介面（5 種升級屬性、金幣扣除）
  - [ ] 3.2.5 實作設定畫面（音樂/音效音量滑桿）
  - [ ] 3.2.6 顯示版本號

- [ ] 3.3 實作 GameScene 骨架（scenes/GameScene.ts）
  - [ ] 3.3.1 create() 初始化 ObjectPoolManager 並依據 pool-config.json 預分配
  - [ ] 3.3.2 建立 Tilemap（使用 Phaser.Tilemaps，至少 100x100 Tile）
  - [ ] 3.3.3 設定 Phaser 攝影機跟隨玩家（平滑跟隨）
  - [ ] 3.3.4 設定 Arcade Physics 碰撞群組
  - [ ] 3.3.5 實作 update() 主迴圈（依 GameState 控制更新邏輯）
  - [ ] 3.3.6 實作 GameState 列舉（Playing、Paused、LevelUp、GameOver、Victory）

## 第 4 階段：輸入系統

- [ ] 4.1 實作 InputController（infrastructure/input/InputController.ts）
  - [ ] 4.1.1 依據平台自動選擇 TouchInputAdapter 或 KeyboardMouseAdapter
  - [ ] 4.1.2 提供 getMovement() 統一介面

- [ ] 4.2 實作 TouchInputAdapter（infrastructure/input/TouchInputAdapter.ts）
  - [ ] 4.2.1 實作浮動虛擬搖桿（觸碰左半螢幕顯示，釋放隱藏）
  - [ ] 4.2.2 實作搖桿死區（半徑 15%）
  - [ ] 4.2.3 支援多點觸控（以 pointerId 追蹤搖桿觸控）
  - [ ] 4.2.4 確保觸控到移動延遲不超過 2 幀

- [ ] 4.3 實作 KeyboardMouseAdapter（infrastructure/input/KeyboardMouseAdapter.ts）
  - [ ] 4.3.1 WASD 鍵映射為正規化方向向量
  - [ ] 4.3.2 滑鼠點擊支援 UI 操作

## 第 5 階段：玩家角色

- [ ] 5.1 實作 PlayerCharacter（gameplay/player/PlayerCharacter.ts）
  - [ ] 5.1.1 建立 Phaser.GameObjects.Sprite，從 CharacterConfig 初始化屬性
  - [ ] 5.1.2 實作 move() 方法（依據 InputController 方向與移動速度移動）
  - [ ] 5.1.3 實作地圖邊界限制（clamp 位置至地圖範圍內）
  - [ ] 5.1.4 實作面朝最近敵人方向（flipX）
  - [ ] 5.1.5 實作 takeDamage() 與死亡判定
  - [ ] 5.1.6 實作 StatModifier 系統（flat 與 percent 修改器堆疊計算）

## 第 6 階段：武器系統

- [x] 6.1 實作 WeaponSystem（gameplay/weapons/WeaponSystem.ts）
  - [ ] 6.1.1 管理玩家裝備的武器列表（最多 6 把）
  - [ ] 6.1.2 實作自動攻擊計時器（依據各武器 attackInterval）
  - [ ] 6.1.3 實作目標選擇（攻擊範圍內最近敵人）
  - [ ] 6.1.4 無敵人時暫停攻擊計時器
  - [ ] 6.1.5 實作傷害計算（baseDamage * attackPower 倍率）

- [ ] 6.2 實作基礎武器類型
  - [ ] 6.2.1 實作 ProjectileWeapon（直線投射，如飛刀）
  - [ ] 6.2.2 實作 AreaWeapon（範圍攻擊，如聖水）
  - [ ] 6.2.3 實作 OrbitWeapon（環繞攻擊，如大蒜）
  - [ ] 6.2.4 實作 HomingWeapon（追蹤投射物，如魔杖）
  - [ ] 6.2.5 實作 ChainWeapon（連鎖攻擊，如鞭子）
  - [ ] 6.2.6 實作 RandomWeapon（隨機方向投射，如斧頭）

- [ ] 6.3 實作武器升級與進化
  - [ ] 6.3.1 實作 levelUp() 方法（依據 levelData 提升屬性，最高 8 級）
  - [ ] 6.3.2 實作 canEvolve() 判定（武器滿級 + 持有對應被動道具）
  - [ ] 6.3.3 實作 evolve() 方法（替換為進化版武器）

## 第 7 階段：敵人系統

- [ ] 7.1 實作 EnemyBase（gameplay/enemies/EnemyBase.ts）
  - [ ] 7.1.1 實作 PoolableObject 介面（activate、deactivate）
  - [ ] 7.1.2 實作朝玩家移動 AI
  - [ ] 7.1.3 實作 takeDamage() 與死亡處理（發布 EnemyKilledEvent，回收至物件池）
  - [ ] 7.1.4 實作接觸傷害（碰撞偵測）

- [ ] 7.2 實作 EnemySpawner（gameplay/enemies/EnemySpawner.ts）
  - [ ] 7.2.1 從攝影機可視範圍外隨機位置生成敵人
  - [ ] 7.2.2 從 Object Pool 取出敵人並初始化屬性（乘以難度倍率）
  - [ ] 7.2.3 實作場上敵人數量上限（200 隻）
  - [ ] 7.2.4 螢幕外敵人跳幀更新（場上 > 100 隻時）

## 第 8 階段：波次與掉落系統

- [ ] 8.1 實作 WaveManager（gameplay/wave/WaveManager.ts）
  - [ ] 8.1.1 依據 waves.json 控制敵人生成頻率與種類
  - [ ] 8.1.2 每 30 秒提升難度倍率
  - [ ] 8.1.3 每 5 分鐘生成 Boss
  - [ ] 8.1.4 30 分鐘生成最終 Boss「死神」

- [ ] 8.2 實作 DropSystem（gameplay/drop/DropSystem.ts）
  - [ ] 8.2.1 監聽 EnemyKilledEvent，在敵人位置生成經驗寶石（從物件池取出）
  - [ ] 8.2.2 依據 dropTable 機率生成額外道具
  - [ ] 8.2.3 實作經驗寶石吸附效果（進入拾取範圍後自動飛向玩家）
  - [ ] 8.2.4 實作寶石碰觸收集（發布 XPCollectedEvent）

## 第 9 階段：升級系統

- [ ] 9.1 實作 LevelUpSystem（gameplay/level-up/LevelUpSystem.ts）
  - [ ] 9.1.1 監聽 XPCollectedEvent，累積經驗值
  - [ ] 9.1.2 經驗值達到門檻時暫停遊戲並觸發升級
  - [ ] 9.1.3 生成 3 個隨機升級選項（新武器、武器升級、新被動道具、被動道具升級）
  - [ ] 9.1.4 裝備已滿時僅提供升級選項
  - [ ] 9.1.5 套用升級效果並恢復遊戲
  - [ ] 9.1.6 確保武器/道具最高 8 級

## 第 10 階段：UI 系統

- [ ] 10.1 實作 HUDManager（ui/hud/HUDManager.ts）
  - [ ] 10.1.1 顯示生命值條、經驗值條、等級、遊戲時間、擊殺數
  - [ ] 10.1.2 顯示裝備武器與被動道具圖示
  - [ ] 10.1.3 受傷紅色閃爍效果
  - [ ] 10.1.4 使用 Phaser Scale Manager 適配不同螢幕比例
  - [ ] 10.1.5 確保所有可互動 UI 元素最小觸控區域 48x48 CSS 像素

- [ ] 10.2 實作 DamageTextManager（ui/hud/DamageTextManager.ts）
  - [ ] 10.2.1 從物件池取出傷害數字文字
  - [ ] 10.2.2 數字從受擊位置向上飄散並淡出

- [ ] 10.3 實作 LevelUpPanelUI（ui/level-up/LevelUpPanelUI.ts）
  - [ ] 10.3.1 顯示 3 個升級選項卡片（圖示、名稱、描述）
  - [ ] 10.3.2 玩家點擊選項後套用升級並關閉面板

- [ ] 10.4 實作暫停選單（ui/menus/PauseMenuUI.ts）
  - [ ] 10.4.1 暫停按鈕與暫停選單（繼續、重新開始、返回主選單）

- [ ] 10.5 實作遊戲結算畫面（ui/menus/GameOverUI.ts）
  - [ ] 10.5.1 顯示存活時間、擊殺數、金幣獎勵、最高等級
  - [ ] 10.5.2 「再來一局」與「返回主選單」按鈕

- [ ] 10.6 實作地圖邊界提示
  - [ ] 10.6.1 玩家接近地圖邊緣時顯示視覺提示

## 第 11 階段：存檔與音效

- [ ] 11.1 實作存檔系統（infrastructure/save/）
  - [ ] 11.1.1 實作 LocalStorageSaveProvider（save、load、delete、exists）
  - [ ] 11.1.2 實作 SaveSystem（save、load、createDefault，JSON 序列化/反序列化）
  - [ ] 11.1.3 實作自動儲存（visibilitychange 事件、返回主選單時）
  - [ ] 11.1.4 實作損毀存檔偵測與預設存檔建立
  - [ ] 11.1.5 實作 localStorage 不可用時的降級處理

- [ ] 11.2 實作音效系統（infrastructure/audio/AudioManager.ts）
  - [ ] 11.2.1 使用 Phaser Sound Manager 播放 BGM（不同地圖不同曲目）
  - [ ] 11.2.2 實作武器攻擊、敵人受擊/死亡、升級等 SFX 播放
  - [ ] 11.2.3 實作獨立音樂/音效音量通道
  - [ ] 11.2.4 實作瀏覽器 AudioContext 解鎖（首次互動觸發）
  - [ ] 11.2.5 限制同類音效最大同時播放數

## 第 12 階段：永久升級與金幣經濟

- [ ] 12.1 實作金幣獎勵計算
  - [ ] 12.1.1 遊戲結束時依據存活時間與擊殺數計算金幣
  - [ ] 12.1.2 金幣獎勵寫入存檔

- [ ] 12.2 實作永久升級系統
  - [ ] 12.2.1 定義 5 種永久升級（最大生命值、攻擊力、移動速度、經驗值獲取、拾取範圍）
  - [ ] 12.2.2 購買升級時扣除金幣並提升屬性
  - [ ] 12.2.3 遊戲開始時套用永久升級加成

## 第 13 階段：地圖與裝飾

- [ ] 13.1 建立遊戲地圖
  - [ ] 13.1.1 建立森林地圖 Tilemap（至少 100x100 Tile）
  - [ ] 13.1.2 建立墓地地圖 Tilemap（至少 100x100 Tile）
  - [ ] 13.1.3 在地圖上隨機放置裝飾物件

## 第 14 階段：效能優化與開發工具

- [ ] 14.1 效能優化
  - [ ] 14.1.1 確認所有遊戲物件使用 Object Pool（禁止 new/destroy）
  - [ ] 14.1.2 建立 Texture Atlas（Sprite Atlas）打包所有遊戲圖片
  - [ ] 14.1.3 實作螢幕外敵人跳幀更新邏輯

- [ ] 14.2 開發工具
  - [ ] 14.2.1 實作開發模式 FPS 計數器
  - [ ] 14.2.2 實作物件池監控面板（顯示各池使用量/峰值）

## 第 15 階段：測試

- [ ] 15.1 屬性測試（Property-Based Tests）
  - [ ] 15.1.1 P1: 玩家位置邊界不變量測試（tests/property/player.property.test.ts）
  - [ ] 15.1.2 P2: WASD 方向映射測試（tests/property/input.property.test.ts）
  - [ ] 15.1.3 P3: 搖桿死區過濾測試（tests/property/input.property.test.ts）
  - [ ] 15.1.4 P4: 傷害計算公式測試（tests/property/combat.property.test.ts）
  - [ ] 15.1.5 P5: 裝備欄位上限測試（tests/property/inventory.property.test.ts）
  - [ ] 15.1.6 P6: 武器道具等級上限測試（tests/property/inventory.property.test.ts）
  - [ ] 15.1.7 P7: 升級選項數量測試（tests/property/levelup.property.test.ts）
  - [ ] 15.1.8 P8: 武器屬性單調遞增測試（tests/property/weapon.property.test.ts）
  - [ ] 15.1.9 P9: 進化配方唯一性測試（tests/property/weapon.property.test.ts）
  - [ ] 15.1.10 P10: 存檔 JSON 往返一致性測試（tests/property/save.property.test.ts）
  - [ ] 15.1.11 P11: 敵人數量上限測試（tests/property/enemy.property.test.ts）
  - [ ] 15.1.12 P12: 敵人生成位置測試（tests/property/enemy.property.test.ts）
  - [ ] 15.1.13 P13: 金幣獎勵計算測試（tests/property/economy.property.test.ts）
  - [ ] 15.1.14 P14: 永久升級購買測試（tests/property/economy.property.test.ts）
  - [ ] 15.1.15 P15: 物件池擴容上限測試（tests/property/pool.property.test.ts）
  - [ ] 15.1.16 P16: 事件匯流排一致性測試（tests/property/eventbus.property.test.ts）
  - [ ] 15.1.17 P17: 輸入適配器等價性測試（tests/property/input.property.test.ts）

- [ ] 15.2 單元測試（Example-Based Tests）
  - [ ] 15.2.1 存檔系統測試（損毀存檔處理、自動儲存觸發、預設存檔建立）
  - [ ] 15.2.2 武器系統測試（自動攻擊觸發、無敵人暫停、進化判定）
  - [ ] 15.2.3 升級系統測試（升級選項套用、裝備已滿限制）
  - [ ] 15.2.4 敵人系統測試（碰觸傷害、死亡掉落）
  - [ ] 15.2.5 物件池測試（預分配驗證、監控數據正確性）
  - [ ] 15.2.6 輸入系統測試（搖桿顯示/隱藏、WASD 映射）

## 第 16 階段：Capacitor Android 建置

- [ ] 16.1 Capacitor 整合
  - [ ] 16.1.1 執行 npx cap init 初始化 Capacitor
  - [ ] 16.1.2 執行 npx cap add android 新增 Android 平台
  - [ ] 16.1.3 配置 AndroidManifest.xml（權限、螢幕方向鎖定橫向）
  - [ ] 16.1.4 配置 WebView 設定確保 Phaser 正常渲染
  - [ ] 16.1.5 建立建置腳本（npm run build → cap sync → gradle build）
  - [ ] 16.1.6 設定正式簽署金鑰與 AAB 簽署流程
