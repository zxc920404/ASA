# 實作計畫：吸血鬼倖存者 Roguelike 生存手遊

## 概覽

基於 Unity 2D + C# 開發的類 Vampire Survivors Roguelike 生存手遊。實作順序為：Core 基礎架構 → Infrastructure 基礎設施 → Gameplay 核心遊戲邏輯 → UI 介面 → 整合串接 → 效能優化 → 建置管線。所有模組透過介面與事件匯流排鬆耦合通訊，使用 Object Pool 作為核心效能策略。

## 任務

- [x] 1. 建立專案結構與 Core Assembly
  - [x] 1.1 建立 Unity 專案目錄結構與 Assembly Definition
    - 建立 `Assets/_Project/Scripts/Core/`、`Gameplay/`、`UI/`、`Infrastructure/` 目錄
    - 建立四個 `.asmdef` 檔案（Core、Gameplay、UI、Infrastructure），設定正確的命名空間與相依性
    - Core 無相依；Gameplay、UI、Infrastructure 皆相依 Core
    - _需求：16.8_

  - [x] 1.2 定義核心介面（IWeapon、IEnemy、IPlayerCharacter、IPassiveItem）
    - 在 `Core/Interfaces/` 建立 `IWeapon.cs`、`IEnemy.cs`、`IPlayerCharacter.cs`、`IPassiveItem.cs`
    - 包含設計文件中定義的所有方法簽名
    - _需求：16.3, 16.4, 16.5_

  - [x] 1.3 定義基礎設施介面（IInputAdapter、ISaveProvider、IGameEvent）
    - 在 `Core/Interfaces/` 建立 `IInputAdapter.cs`、`ISaveProvider.cs`、`IGameEvent.cs`
    - _需求：17.4, 13.1_

  - [x] 1.4 實作事件匯流排（EventBus）與遊戲事件定義
    - 在 `Core/Events/` 建立 `EventBus.cs` 與 `GameEvents.cs`
    - 實作 Subscribe、Unsubscribe、Publish、Clear 方法
    - 定義所有遊戲事件結構體（EnemyKilledEvent、PlayerLevelUpEvent、PlayerDamagedEvent、GameOverEvent 等）
    - _需求：16.6_

  - [ ]* 1.5 撰寫事件匯流排屬性測試
    - **屬性 P14：事件匯流排訂閱/發布一致性**
    - **驗證：需求 16.6**

  - [x] 1.6 定義預留模組介面（Plugin System）
    - 在 `Core/PluginInterfaces/` 建立 ISkillModule、IEquipmentModule、IGachaModule、IQuestModule、IAdModule、IIAPModule
    - _需求：16.7_

- [x] 2. 實作 Object Pool 系統
  - [x] 2.1 建立 ScriptableObject 資料設定檔基礎類別
    - 建立 `ObjectPoolConfigSO.cs`（含 PoolEntry 結構：poolId、prefab、preAllocateCount、maxBatchExpansion）
    - 建立 `WeaponConfigSO.cs`、`EnemyConfigSO.cs`、`CharacterConfigSO.cs`、`WaveConfigSO.cs`、`PassiveItemConfigSO.cs`
    - _需求：16.2_

  - [x] 2.2 實作 ObjectPoolManager
    - 在 `Core/ObjectPool/` 建立 `ObjectPoolManager.cs` 與 `PoolStats.cs`
    - 實作 PreAllocate（場景載入時預分配）、Spawn（從池取出）、Despawn（回收至池）
    - 實作批次擴容機制（每批不超過 10 個）
    - 實作 PoolStats 監控介面（峰值使用量、當前使用量、擴容次數）
    - _需求：12.1, 12.2, 12.3, 12.8_

  - [ ]* 2.3 撰寫 Object Pool 批次擴容屬性測試
    - **屬性 P13：Object Pool 批次擴容上限**
    - **驗證：需求 12.3**

- [x] 3. 檢查點 - 確認 Core Assembly 完成
  - 確保所有測試通過，如有問題請詢問使用者。

- [x] 4. 實作 Infrastructure 基礎設施層
  - [x] 4.1 實作輸入適配器與輸入控制器
    - 在 `Infrastructure/Input/` 建立 `TouchInputAdapter.cs`（浮動虛擬搖桿，含 15% 死區）
    - 建立 `KeyboardMouseInputAdapter.cs`（WASD 移動 + 滑鼠操作）
    - 建立 `InputController.cs`，透過預處理指令切換 Android/WebGL 輸入來源
    - _需求：1.1, 1.2, 1.3, 15.1, 15.2, 15.3, 15.6, 17.2, 17.3, 17.4_

  - [ ]* 4.2 撰寫輸入適配器屬性測試
    - **屬性 P15：輸入適配器行為等價性**
    - **驗證：需求 17.4**
    - **屬性 P16：搖桿死區過濾**
    - **驗證：需求 15.2**

  - [x] 4.3 實作存檔系統
    - 在 `Infrastructure/Save/` 建立 `SaveData.cs`（金幣、永久升級等級、已解鎖角色、版本號）
    - 建立 `FileSaveProvider.cs`（Android，使用 Application.persistentDataPath）
    - 建立 `PlayerPrefsSaveProvider.cs`（WebGL，使用 PlayerPrefs/IndexedDB）
    - 建立 `SaveSystem.cs`，透過預處理指令切換儲存後端，含損毀存檔處理邏輯
    - _需求：13.1, 13.2, 13.3, 13.4, 13.5, 17.5, 17.6_

  - [ ]* 4.4 撰寫存檔往返一致性屬性測試
    - **屬性 P10：存檔往返一致性**
    - **驗證：需求 13.6**

  - [x] 4.5 實作音效管理器
    - 在 `Infrastructure/Audio/` 建立 `AudioManager.cs`
    - 使用 Unity Audio Mixer 管理 BGM 與 SFX 通道
    - 支援不同地圖使用不同背景音樂
    - 訂閱事件匯流排播放對應音效（攻擊、受擊、死亡、升級）
    - _需求：11.1, 11.2, 11.3, 11.4, 11.6_

- [x] 5. 檢查點 - 確認 Infrastructure 層完成
  - 確保所有測試通過，如有問題請詢問使用者。

- [x] 6. 實作玩家角色與移動系統
  - [x] 6.1 實作 PlayerCharacter
    - 在 `Gameplay/Player/` 建立 `PlayerCharacter.cs`，實作 IPlayerCharacter 介面
    - 實作移動邏輯（依據 InputController 方向與移動速度）
    - 實作面朝最近敵人方向（朝向與移動方向獨立）
    - 實作地圖邊界限制
    - 實作受傷與死亡邏輯，透過事件匯流排發布 PlayerDamagedEvent
    - 實作 StatModifier 套用（永久升級加成）
    - _需求：1.2, 1.4, 1.5, 3.3_

  - [ ]* 6.2 撰寫玩家位置邊界屬性測試
    - **屬性 P1：玩家位置邊界不變量**
    - **驗證：需求 1.5**

- [x] 7. 實作武器系統
  - [x] 7.1 實作 WeaponSystem 與基礎武器
    - 在 `Gameplay/Weapons/` 建立 `WeaponSystem.cs`，管理武器列表與自動攻擊邏輯
    - 實作攻擊間隔計時器、目標選擇（最近敵人）、無敵人時暫停計時器
    - 實作至少 6 種基礎武器（直線投射、環繞、範圍爆炸、追蹤等），每種實作 IWeapon 介面
    - 投射物從 Object Pool 取出，命中後回收
    - _需求：2.1, 2.2, 2.3, 2.4, 2.5, 6.1_

  - [ ]* 7.2 撰寫傷害計算與裝備欄位屬性測試
    - **屬性 P2：傷害計算公式一致性**
    - **驗證：需求 2.3**
    - **屬性 P3：裝備欄位上限不變量**
    - **驗證：需求 2.4**

  - [x] 7.3 實作武器升級與進化系統
    - 實作武器等級提升邏輯（傷害、投射物數量、攻擊範圍、攻擊頻率隨等級提升）
    - 實作武器進化判定（滿級 + 對應被動道具）與進化替換邏輯
    - 每種基礎武器定義唯一進化配方
    - _需求：6.2, 6.3, 6.4, 6.5_

  - [ ]* 7.4 撰寫武器等級與進化屬性測試
    - **屬性 P7：武器等級上限不變量**
    - **驗證：需求 5.5**
    - **屬性 P8：武器進化配方唯一性**
    - **驗證：需求 6.4**
    - **屬性 P9：武器屬性隨等級單調遞增**
    - **驗證：需求 6.5**

- [x] 8. 實作敵人系統與波次管理
  - [x] 8.1 實作敵人基礎類別與生成器
    - 在 `Gameplay/Enemies/` 建立 `EnemyBase.cs`，實作 IEnemy 介面
    - 實作敵人朝玩家移動、接觸傷害、受傷與死亡邏輯
    - 建立 `EnemySpawner.cs`，從攝影機可視範圍外隨機位置生成敵人（透過 Object Pool）
    - 支援至少 5 種不同屬性的敵人類型
    - 實作場上敵人數量上限（200 隻）控制
    - _需求：3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 8.2 撰寫敵人系統屬性測試
    - **屬性 P4：敵人數量上限不變量**
    - **驗證：需求 3.6**
    - **屬性 P17：敵人生成位置在可視範圍外**
    - **驗證：需求 3.1**

  - [x] 8.3 實作波次管理器
    - 在 `Gameplay/Wave/` 建立 `WaveManager.cs`
    - 依據遊戲經過時間控制敵人生成頻率與種類
    - 每 30 秒提升難度（生成頻率與敵人基礎屬性）
    - 每 5 分鐘生成 Boss 級敵人
    - 30 分鐘生成最終 Boss「死神」
    - 擊敗最終 Boss 判定勝利
    - _需求：4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 8.4 實作掉落系統
    - 在 `Gameplay/Drop/` 建立 `DropSystem.cs`
    - 訂閱 EnemyKilledEvent，在敵人位置生成經驗寶石（透過 Object Pool）
    - 依據掉落機率表決定是否生成額外道具
    - 實作經驗寶石拾取邏輯（碰觸 PlayerCharacter 時觸發 XPCollectedEvent）
    - _需求：3.4, 5.1_

- [x] 9. 實作升級與成長系統
  - [x] 9.1 實作 LevelUpSystem
    - 在 `Gameplay/LevelUp/` 建立 `LevelUpSystem.cs`
    - 訂閱 XPCollectedEvent 累積經驗值
    - 達到升級門檻時暫停遊戲並生成 3 個隨機升級選項
    - 升級選項包含：新武器、武器升級、新被動道具、被動道具升級
    - 武器與被動道具最高 8 級
    - 裝備已滿時僅提供升級選項
    - 玩家選擇後立即套用並恢復遊戲
    - _需求：5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 9.2 撰寫升級系統屬性測試
    - **屬性 P5：升級選項數量不變量**
    - **驗證：需求 5.2**
    - **屬性 P6：裝備滿時僅提供升級選項**
    - **驗證：需求 5.6**

  - [x] 9.3 實作永久升級系統（Meta 進度）
    - 實作金幣獎勵計算（存活時間 × 0.5 + 擊殺數）
    - 實作 5 種永久升級屬性：最大生命值、攻擊力、移動速度、經驗值獲取、拾取範圍
    - 永久升級購買邏輯（扣除金幣、儲存進度）
    - 遊戲開始時載入永久升級加成並套用至 PlayerCharacter
    - _需求：10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 9.4 撰寫永久升級系統屬性測試
    - **屬性 P11：金幣獎勵計算確定性**
    - **驗證：需求 10.1**
    - **屬性 P12：永久升級購買後金幣不為負**
    - **驗證：需求 10.3**

- [x] 10. 檢查點 - 確認 Gameplay 層完成
  - 確保所有測試通過，如有問題請詢問使用者。

- [x] 11. 實作地圖與場景系統
  - [x] 11.1 建立地圖場景
    - 建立 `GameScene_Forest` 與 `GameScene_Cemetery` 兩張地圖場景
    - 使用 Tilemap 系統生成地圖（至少 100x100 Tile 單位）
    - 在地圖上隨機放置裝飾物件（樹木、石頭、建築殘骸）
    - _需求：7.1, 7.2, 7.4_

  - [x] 11.2 實作攝影機跟隨與邊界提示
    - 設定 Cinemachine 攝影機平滑跟隨 PlayerCharacter
    - 實作接近地圖邊緣時的視覺提示
    - _需求：7.3, 7.5_

- [x] 12. 實作 UI 系統
  - [x] 12.1 實作 HUD 控制器
    - 在 `UI/HUD/` 建立 `HUDController.cs`
    - 顯示生命值條、經驗值條、當前等級、遊戲經過時間、擊殺數
    - 顯示當前裝備的武器與被動道具圖示
    - 實作受傷紅色閃爍效果
    - _需求：8.1, 8.2, 8.3_

  - [x] 12.2 實作傷害數字浮動文字
    - 在 `UI/HUD/` 建立 `DamageTextController.cs`
    - 傷害數字從受擊位置向上飄散並淡出（透過 Object Pool 管理）
    - _需求：8.6_

  - [x] 12.3 實作主選單與遊戲流程介面
    - 在 `UI/Menus/` 建立 `MainMenuController.cs`（開始遊戲、角色選擇、設定、退出）
    - 建立地圖選擇畫面
    - 建立角色選擇畫面（至少 3 個可解鎖角色）
    - 建立永久升級介面
    - 建立設定畫面（音樂/音效音量滑桿）
    - _需求：9.1, 9.2, 9.6, 10.2, 11.5_

  - [x] 12.4 實作暫停選單與遊戲結算畫面
    - 建立 `PauseMenuController.cs`（繼續、重新開始、返回主選單）
    - 建立 `GameOverController.cs`（存活時間、擊殺數、金幣、最高等級、再來一局）
    - 勝利結算畫面
    - _需求：8.5, 9.4, 9.5, 4.5_

  - [x] 12.5 實作升級選項面板
    - 在 `UI/LevelUp/` 建立 `LevelUpPanelController.cs`
    - 顯示 3 個升級選項卡片，玩家點選後套用升級
    - _需求：5.2, 5.3, 5.4_

  - [x] 12.6 實作 UI 適配與觸控規範
    - 使用 Canvas Scaler 適配不同螢幕比例（16:9、18:9、20:9、21:9）
    - 確保所有可互動 UI 元素最小觸控區域為 48x48 dp
    - _需求：8.4, 15.4, 15.5_

- [x] 13. 檢查點 - 確認 UI 層完成
  - 確保所有測試通過，如有問題請詢問使用者。

- [x] 14. 整合串接與 GameManager
  - [x] 14.1 實作 GameManager 遊戲流程控制
    - 建立 `GameManager.cs`（Singleton），管理遊戲狀態（MainMenu、Playing、Paused、LevelUp、GameOver、Victory）
    - 實作 StartGame、PauseGame、ResumeGame、GameOver、Victory 流程
    - 場景載入時呼叫 ObjectPoolManager.PreAllocate()
    - 串接所有 Manager（WeaponSystem、EnemySpawner、WaveManager、LevelUpSystem、DropSystem、AudioManager、SaveSystem）
    - _需求：9.3, 9.4, 9.5_

  - [x] 14.2 實作 Game Bootstrap 場景初始化
    - 建立 MainMenuScene 與遊戲場景的 Hierarchy 結構
    - 設定場景切換邏輯（主選單 → 地圖選擇 → 遊戲場景）
    - 確保所有模組透過介面通訊，無直接引用
    - _需求：16.1_

  - [ ]* 14.3 撰寫整合測試
    - 測試完整遊戲流程：啟動 → 選角 → 選圖 → 遊戲 → 結算
    - 測試暫停/恢復流程
    - 測試升級流程（經驗收集 → 升級面板 → 選擇 → 恢復）
    - _需求：9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 15. 效能優化
  - [x] 15.1 實作 Sprite Atlas 與 Draw Call 優化
    - 建立 Sprite Atlas，將所有遊戲精靈圖打包
    - 確保使用 2D Sprite Renderer 搭配 Sprite Atlas 減少 Draw Call
    - _需求：12.5_

  - [x] 15.2 實作螢幕外敵人降頻更新
    - 場上超過 100 隻敵人時，對螢幕外敵人降低更新頻率
    - _需求：12.6_

  - [x] 15.3 確認禁止運行時 Instantiate/Destroy
    - 檢查所有投射物、敵人、掉落物、傷害數字、特效皆透過 Object Pool 管理
    - 確認遊戲進行中無直接 Instantiate 與 Destroy 呼叫
    - _需求：12.1_

- [x] 16. 建置管線設定
  - [x] 16.1 設定 Android 建置
    - 設定 targetSdkVersion API Level 34、minSdkVersion API Level 24
    - 設定 AAB 格式建置與正式簽署金鑰
    - 控制 AAB 大小在 150 MB 以內
    - 設定版本號顯示（v主版本.次版本.修訂版本）
    - _需求：14.1, 14.2, 14.3, 14.6, 14.7, 12.7_

  - [x] 16.2 設定 WebGL 建置
    - 設定 WebGL 建置目標（Brotli 壓縮、256 MB 記憶體、Strip Engine Code）
    - 確認 WebGL 環境中停用不支援的平台功能並提供替代實作
    - 確認 WASD + 滑鼠輸入在 WebGL 中正常運作
    - 確認 PlayerPrefs 存檔在 WebGL 中正常運作
    - _需求：17.1, 17.5, 17.6, 17.7_

- [x] 17. 最終檢查點 - 全面驗證
  - 確保所有測試通過，如有問題請詢問使用者。
  - 確認所有 17 項需求皆已涵蓋
  - 確認 Android 與 WebGL 建置皆可正常產出

## 備註

- 標記 `*` 的子任務為選擇性任務，可跳過以加速 MVP 開發
- 每個任務皆標註對應的需求編號，確保可追溯性
- 檢查點用於階段性驗證，確保增量式開發品質
- 屬性測試驗證設計文件中定義的正確性屬性
- 單元測試驗證特定範例與邊界情況
