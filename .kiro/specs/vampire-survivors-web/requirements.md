# 需求文件

## 簡介

本專案為一款類似「吸血鬼倖存者（Vampire Survivors）」的 Roguelike 生存手遊，使用 Phaser.js 3 遊戲引擎搭配 TypeScript 開發，以 Vite 作為建置工具，最終透過 Capacitor 包裝為 Android App 上架 Google Play。開發與測試階段直接在瀏覽器中進行，支援虛擬搖桿觸控操作（手機）與 WASD 鍵盤操作（瀏覽器測試）。玩家操控角色在地圖上移動，面對不斷湧來的敵人波次，透過自動攻擊與升級系統存活盡可能長的時間。遊戲強調簡單直覺的操作、豐富的武器與道具組合、以及每局不同的成長路線。架構設計優先考慮可擴充性與模組化，預留技能、裝備、角色、抽卡、任務、廣告與內購等後續功能的擴展空間，並以物件池（Object Pooling）為核心效能策略。

## 術語表

- **Game_System**：遊戲系統，負責整體遊戲流程控制與狀態管理，基於 Phaser.Scene 實作
- **Player_Character**：玩家角色，由玩家操控在地圖上移動的 Phaser.GameObjects.Sprite 遊戲實體
- **Enemy_Spawner**：敵人生成器，負責依據波次規則從物件池取出敵人並初始化
- **Weapon_System**：武器系統，管理玩家角色的自動攻擊武器邏輯
- **Level_Up_System**：升級系統，管理經驗值累積與升級選項的呈現與套用
- **Input_Controller**：輸入控制器，處理玩家的觸控輸入與虛擬搖桿，基於 Phaser Input 系統
- **Wave_Manager**：波次管理器，控制敵人波次的難度遞增與時間節奏
- **Drop_System**：掉落系統，管理敵人死亡後的經驗寶石與道具掉落
- **UI_Manager**：介面管理器，使用 Phaser DOM 元素或 Phaser GameObjects 管理所有遊戲內 UI 元素的顯示與互動
- **Save_System**：存檔系統，使用 localStorage 負責遊戲進度的持久化儲存與讀取
- **Audio_Manager**：音效管理器，基於 Phaser Sound Manager 管理背景音樂與音效播放
- **Build_Pipeline**：建置管線，使用 Vite 建置 Web 版本，並透過 Capacitor 包裝為 Android APK/AAB
- **Plugin_System**：插件系統，提供 TypeScript 介面（Interface）供後續功能（技能、裝備、角色、抽卡、任務、廣告、內購）以模組形式擴展
- **Object_Pool**：物件池，使用 Phaser.GameObjects.Group 或自訂 TypeScript Pool 類別，預先分配並重複利用遊戲物件（敵人、投射物、特效、掉落物），避免運行時頻繁建立與銷毀
- **JSON_Config**：JSON 設定檔，使用 JSON 檔案作為資料驅動設計的資料容器，定義武器、敵人、角色等遊戲實體的屬性，取代 Unity ScriptableObject
- **Input_Adapter**：輸入適配器，抽象化輸入來源的 TypeScript 介面，使觸控、鍵盤與滑鼠輸入透過統一介面處理
- **Phaser_Tilemap**：Phaser 瓦片地圖系統，用於生成與渲染遊戲地圖
- **Capacitor_Bridge**：Capacitor 橋接層，負責 Web 應用與 Android 原生功能之間的通訊

## 需求

### 需求 1：玩家角色移動

**使用者故事：** 身為玩家，我希望能透過虛擬搖桿或鍵盤控制角色在地圖上移動，以便閃避敵人並收集道具。

#### 驗收條件

1. WHEN 玩家觸碰螢幕左半部區域，THE Input_Controller SHALL 顯示虛擬搖桿並開始追蹤觸控位置
2. WHILE 玩家拖曳虛擬搖桿，THE Player_Character SHALL 朝搖桿指向的方向以設定的移動速度持續移動
3. WHEN 玩家釋放虛擬搖桿，THE Player_Character SHALL 停止移動且 THE Input_Controller SHALL 隱藏虛擬搖桿
4. THE Player_Character SHALL 面朝最近的敵人方向（角色朝向與移動方向獨立）
5. IF 玩家角色碰觸地圖邊界，THEN THE Game_System SHALL 限制 Player_Character 在地圖範圍內移動
6. WHEN 玩家在瀏覽器環境中按下 WASD 鍵，THE Input_Controller SHALL 將鍵盤輸入轉換為等效的移動方向向量

### 需求 2：自動攻擊系統

**使用者故事：** 身為玩家，我希望角色能自動攻擊附近的敵人，以便我專注於移動與閃避。

#### 驗收條件

1. THE Weapon_System SHALL 依據每把武器設定的攻擊間隔自動發動攻擊，無需玩家手動觸發
2. WHEN 武器攻擊間隔計時器歸零，THE Weapon_System SHALL 選擇攻擊範圍內最近的敵人作為目標並發射投射物或觸發攻擊效果
3. WHEN 投射物命中敵人，THE Weapon_System SHALL 對該敵人造成武器基礎傷害乘以角色攻擊力加成的最終傷害
4. THE Player_Character SHALL 同時裝備最多 6 把主動武器與 6 件被動道具
5. IF 攻擊範圍內無敵人，THEN THE Weapon_System SHALL 暫停攻擊計時器直到有敵人進入範圍

### 需求 3：敵人系統

**使用者故事：** 身為玩家，我希望面對多樣化的敵人，以便遊戲保持挑戰性與新鮮感。

#### 驗收條件

1. THE Enemy_Spawner SHALL 從攝影機可視範圍外的隨機位置生成敵人
2. WHILE 敵人存活，THE Game_System SHALL 使敵人朝 Player_Character 的當前位置持續移動
3. WHEN 敵人碰觸 Player_Character，THE Game_System SHALL 對 Player_Character 造成該敵人的接觸傷害
4. WHEN 敵人生命值降至零，THE Drop_System SHALL 在敵人位置生成經驗寶石，並依據掉落機率表決定是否生成額外道具
5. THE Enemy_Spawner SHALL 支援至少 5 種不同屬性（生命值、移動速度、傷害、體型）的敵人類型
6. IF 場上敵人數量達到上限（200 隻），THEN THE Enemy_Spawner SHALL 暫停生成直到場上敵人數量低於上限

### 需求 4：波次與難度遞增

**使用者故事：** 身為玩家，我希望遊戲難度隨時間逐漸提升，以便每局遊戲都有緊張刺激的節奏感。

#### 驗收條件

1. THE Wave_Manager SHALL 依據遊戲經過時間控制敵人生成的頻率與種類
2. WHILE 遊戲進行中，THE Wave_Manager SHALL 每 30 秒提升一次敵人生成頻率與敵人基礎屬性
3. WHEN 遊戲時間達到特定里程碑（每 5 分鐘），THE Wave_Manager SHALL 生成一隻 Boss 級敵人
4. WHEN 遊戲時間達到 30 分鐘，THE Wave_Manager SHALL 生成最終 Boss「死神」，該 Boss 具有極高生命值與傷害
5. IF 玩家擊敗最終 Boss，THEN THE Game_System SHALL 判定該局遊戲勝利並顯示結算畫面

### 需求 5：升級與成長系統

**使用者故事：** 身為玩家，我希望透過收集經驗值來升級並選擇強化方向，以便每局遊戲都有不同的成長路線。

#### 驗收條件

1. WHEN Player_Character 碰觸經驗寶石，THE Level_Up_System SHALL 將對應經驗值加入玩家當前經驗值池
2. WHEN 玩家經驗值達到當前等級的升級門檻，THE Level_Up_System SHALL 暫停遊戲並顯示 3 個隨機升級選項
3. THE Level_Up_System SHALL 提供的升級選項包含：新武器獲取、現有武器升級、新被動道具獲取、現有被動道具升級
4. WHEN 玩家選擇一個升級選項，THE Level_Up_System SHALL 立即套用該升級效果並恢復遊戲
5. THE Level_Up_System SHALL 確保每個武器與被動道具的最高等級為 8 級
6. IF 玩家已持有 6 把武器且 6 件被動道具，THEN THE Level_Up_System SHALL 僅提供已持有裝備的升級選項

### 需求 6：武器種類與進化

**使用者故事：** 身為玩家，我希望有多種武器可供選擇並能進化武器，以便探索不同的戰鬥風格。

#### 驗收條件

1. THE Weapon_System SHALL 提供至少 6 種基礎武器，每種武器具有獨特的攻擊模式（直線投射、環繞、範圍爆炸、追蹤等）
2. WHEN 一把武器達到最高等級且玩家持有對應的被動道具，THE Weapon_System SHALL 在下次開啟寶箱時提供武器進化選項
3. WHEN 武器進化完成，THE Weapon_System SHALL 將該武器替換為進化版本，進化版本具有顯著增強的攻擊效果
4. THE Weapon_System SHALL 為每種基礎武器定義唯一的進化配方（指定需要搭配的被動道具）
5. WHEN 武器等級提升，THE Weapon_System SHALL 依據武器類型提升對應屬性（傷害、投射物數量、攻擊範圍、攻擊頻率）

### 需求 7：地圖與場景

**使用者故事：** 身為玩家，我希望在有特色的地圖上戰鬥，以便獲得沉浸式的遊戲體驗。

#### 驗收條件

1. THE Game_System SHALL 提供至少 2 張可選擇的遊戲地圖，每張地圖具有不同的視覺主題與敵人配置
2. THE Game_System SHALL 使用 Phaser_Tilemap 系統生成地圖，地圖尺寸至少為 100x100 個 Tile 單位
3. WHILE 玩家移動，THE Game_System SHALL 使 Phaser 攝影機平滑跟隨 Player_Character
4. THE Game_System SHALL 在地圖上隨機放置裝飾物件（樹木、石頭、建築殘骸）以豐富視覺效果
5. IF Player_Character 接近地圖邊緣，THEN THE UI_Manager SHALL 顯示視覺提示告知玩家已接近邊界

### 需求 8：遊戲 UI 與 HUD

**使用者故事：** 身為玩家，我希望在遊戲中清楚看到角色狀態與遊戲資訊，以便做出正確的決策。

#### 驗收條件

1. THE UI_Manager SHALL 在螢幕上方持續顯示：玩家生命值條、經驗值條、當前等級、遊戲經過時間、擊殺數
2. THE UI_Manager SHALL 在螢幕下方顯示當前裝備的武器與被動道具圖示
3. WHEN 玩家受到傷害，THE UI_Manager SHALL 以紅色閃爍效果提示生命值減少
4. THE UI_Manager SHALL 確保所有 UI 元素適配不同螢幕比例（16:9、18:9、20:9、21:9），使用 Phaser Scale Manager 的 RESIZE 或 FIT 模式
5. WHEN 玩家點擊暫停按鈕，THE UI_Manager SHALL 暫停遊戲並顯示暫停選單（繼續、重新開始、返回主選單）
6. THE UI_Manager SHALL 顯示傷害數字浮動文字，數字從受擊位置向上飄散並淡出

### 需求 9：主選單與遊戲流程

**使用者故事：** 身為玩家，我希望有清晰的選單介面引導我進入遊戲，以便快速開始遊戲。

#### 驗收條件

1. WHEN 應用程式啟動，THE Game_System SHALL 顯示主選單畫面，包含：開始遊戲、角色選擇、設定、退出按鈕
2. WHEN 玩家選擇「開始遊戲」，THE Game_System SHALL 進入地圖選擇畫面
3. WHEN 玩家選擇地圖後，THE Game_System SHALL 載入對應的 Phaser Scene 並開始遊戲
4. WHEN 玩家角色生命值降至零，THE Game_System SHALL 顯示遊戲結算畫面，包含：存活時間、擊殺數、獲得金幣、取得的最高等級
5. WHEN 玩家在結算畫面點擊「再來一局」，THE Game_System SHALL 重新啟動遊戲 Scene 並重置所有遊戲狀態
6. THE Game_System SHALL 支援至少 3 個可解鎖的玩家角色，每個角色具有不同的初始武器與基礎屬性

### 需求 10：永久升級系統（Meta 進度）

**使用者故事：** 身為玩家，我希望每局遊戲獲得的金幣能用於永久強化角色，以便感受到長期的成長進度。

#### 驗收條件

1. WHEN 一局遊戲結束，THE Game_System SHALL 依據存活時間與擊殺數計算並發放金幣獎勵
2. THE UI_Manager SHALL 在主選單提供「永久升級」介面，顯示所有可升級的永久屬性
3. WHEN 玩家在永久升級介面選擇一項升級並擁有足夠金幣，THE Save_System SHALL 扣除金幣並永久提升對應屬性
4. THE Game_System SHALL 提供至少 5 種永久升級屬性：最大生命值加成、攻擊力加成、移動速度加成、經驗值獲取加成、拾取範圍加成
5. THE Save_System SHALL 將永久升級進度儲存至 localStorage，確保瀏覽器關閉或應用程式關閉後進度不遺失

### 需求 11：音效與音樂

**使用者故事：** 身為玩家，我希望遊戲有配樂與音效回饋，以便提升遊戲的沉浸感。

#### 驗收條件

1. THE Audio_Manager SHALL 使用 Phaser Sound Manager 在遊戲進行中播放背景音樂，並支援不同地圖使用不同音樂曲目
2. WHEN 武器發動攻擊，THE Audio_Manager SHALL 播放對應武器的攻擊音效
3. WHEN 敵人受到傷害或死亡，THE Audio_Manager SHALL 播放對應的受擊或死亡音效
4. WHEN 玩家升級，THE Audio_Manager SHALL 播放升級提示音效
5. THE UI_Manager SHALL 在設定畫面提供音樂音量與音效音量的獨立調節滑桿，範圍為 0% 至 100%
6. THE Audio_Manager SHALL 管理獨立的音樂與音效音量通道，確保多個音效同時播放時不產生音量爆破
7. WHEN 使用者首次與頁面互動（觸控或點擊），THE Audio_Manager SHALL 解鎖瀏覽器音訊上下文（AudioContext），確保後續音效正常播放


### 需求 12：效能優化

**使用者故事：** 身為玩家，我希望遊戲在中低階 Android 手機的瀏覽器或 Capacitor WebView 中也能流暢運行，以便獲得良好的遊戲體驗。

#### 驗收條件

1. THE Game_System SHALL 使用 Object_Pool 管理所有投射物、敵人、掉落物、傷害數字與特效的生成與回收，禁止在遊戲進行中使用 `new` 建立或直接 `destroy` 上述 Phaser GameObjects
2. THE Object_Pool SHALL 在 Phaser Scene 的 `create` 階段依據 JSON_Config 中定義的預分配數量預先生成物件，避免遊戲進行中一次性生成大量物件造成幀率驟降
3. THE Object_Pool SHALL 支援動態擴容機制，WHEN 池中可用物件不足時，SHALL 以批次方式（每批不超過 10 個）逐步補充，避免單幀內大量建立物件
4. THE Game_System SHALL 維持至少 30 FPS 的畫面更新率，目標裝置為搭載 Snapdragon 665 或同等級處理器的 Android 手機上的 Capacitor WebView
5. THE Game_System SHALL 使用 Phaser Texture Atlas（Sprite Atlas）將遊戲圖片打包為圖集，減少 WebGL Draw Call 數量
6. WHILE 場上存在超過 100 隻敵人，THE Game_System SHALL 對螢幕外的敵人降低更新頻率（跳幀更新）以節省運算資源
7. THE Object_Pool SHALL 提供使用量監控介面，記錄各類物件池的峰值使用量與當前使用量，供開發階段效能調校使用

### 需求 13：存檔系統

**使用者故事：** 身為玩家，我希望遊戲進度能自動儲存，以便隨時中斷遊戲而不遺失進度。

#### 驗收條件

1. THE Save_System SHALL 使用 JSON 格式序列化遊戲存檔資料
2. THE Save_System SHALL 將存檔資料寫入瀏覽器 localStorage
3. WHEN 玩家返回主選單或瀏覽器頁面失去焦點（visibilitychange 事件），THE Save_System SHALL 自動儲存當前永久升級進度與解鎖狀態
4. WHEN 應用程式啟動，THE Save_System SHALL 從 localStorage 讀取存檔並還原玩家的永久升級進度與解鎖狀態
5. IF 存檔資料損毀或 JSON 格式不正確，THEN THE Save_System SHALL 建立新的預設存檔並透過 UI_Manager 通知玩家
6. FOR ALL 有效的存檔資料物件，JSON.stringify 後再 JSON.parse SHALL 產生與原始物件等價的結果（往返一致性）

### 需求 14：Google Play 上架與 Capacitor 建置

**使用者故事：** 身為開發者，我希望遊戲能透過 Capacitor 包裝為 Android App 並符合 Google Play 的上架要求，以便順利發布遊戲。

#### 驗收條件

1. THE Build_Pipeline SHALL 使用 Vite 建置生產版本的 Web 資源（HTML、JS、CSS、資源檔案），並透過 Capacitor 同步至 Android 專案
2. THE Build_Pipeline SHALL 使用 Android Studio 或 Gradle 將 Capacitor Android 專案建置為 Android App Bundle（AAB）格式
3. THE Build_Pipeline SHALL 使用正式簽署金鑰對 AAB 進行簽署
4. THE Game_System SHALL 設定 Capacitor Android 專案的 targetSdkVersion 為 Google Play 當前要求的最低版本（API Level 34）
5. THE Game_System SHALL 提供隱私政策頁面連結，說明應用程式收集的資料類型與用途
6. THE Build_Pipeline SHALL 設定 minSdkVersion 為 API Level 24（Android 7.0）以涵蓋主流裝置
7. THE Game_System SHALL 在應用程式內提供版本號顯示，格式為「v主版本.次版本.修訂版本」
8. THE Build_Pipeline SHALL 在 Capacitor 設定中正確配置 WebView 設定，確保 Phaser 遊戲在 Android WebView 中正常渲染與互動

### 需求 15：觸控操作適配

**使用者故事：** 身為手機玩家，我希望遊戲的觸控操作流暢且直覺，以便在小螢幕上也能舒適遊玩。

#### 驗收條件

1. THE Input_Controller SHALL 使用 Phaser Input 系統實作浮動虛擬搖桿，搖桿中心點出現在玩家首次觸碰的位置
2. THE Input_Controller SHALL 設定虛擬搖桿的死區半徑為搖桿半徑的 15%，避免微小觸碰導致非預期移動
3. THE Input_Controller SHALL 支援多點觸控，允許玩家在操作搖桿的同時點擊 UI 按鈕
4. THE UI_Manager SHALL 確保所有可互動 UI 元素的最小觸控區域為 48x48 CSS 像素，符合 Android 觸控目標尺寸建議
5. WHEN 裝置螢幕解析度或方向改變，THE Game_System SHALL 使用 Phaser Scale Manager 自動調整遊戲畫布與 UI 佈局
6. THE Input_Controller SHALL 在觸控輸入與角色移動之間的延遲不超過 2 幀（約 66 毫秒，以 30 FPS 計算）

### 需求 16：可擴充架構設計

**使用者故事：** 身為開發者，我希望遊戲架構清楚且模組化，以便後續能輕鬆加入技能、裝備、角色、抽卡、任務、廣告與內購等功能。

#### 驗收條件

1. THE Game_System SHALL 採用模組化架構，將核心系統（戰鬥、升級、生成、UI、音效、存檔）拆分為獨立的 Manager 類別，各 Manager 之間透過 TypeScript 介面（Interface）通訊而非直接引用
2. THE Game_System SHALL 使用 JSON_Config 檔案作為所有遊戲實體（武器、敵人、角色、被動道具）的資料定義容器，實現資料與邏輯分離
3. THE Weapon_System SHALL 定義 IWeapon TypeScript 介面，所有武器類型 SHALL 實作該介面，使新增武器類型無需修改現有程式碼
4. THE Enemy_Spawner SHALL 定義 IEnemy TypeScript 介面，所有敵人類型 SHALL 實作該介面，使新增敵人類型無需修改現有程式碼
5. THE Game_System SHALL 定義 IPlayerCharacter TypeScript 介面，使新增角色類型無需修改核心遊戲邏輯
6. THE Plugin_System SHALL 提供事件匯流排（Event Bus）機制，使用 TypeScript 泛型事件系統，允許各模組透過事件訂閱與發布進行鬆耦合通訊
7. THE Plugin_System SHALL 預留 ISkillModule、IEquipmentModule、IGachaModule、IQuestModule、IAdModule、IIAPModule TypeScript 介面定義，供後續功能模組實作
8. THE Game_System SHALL 使用 TypeScript 模組系統（ES Modules）將程式碼分為 core、gameplay、ui、infrastructure 等獨立目錄模組，透過明確的 import/export 控制相依性

### 需求 17：瀏覽器開發與測試

**使用者故事：** 身為開發者，我希望能直接在瀏覽器中開發與測試遊戲，以便快速迭代而無需部署至實體手機。

#### 驗收條件

1. THE Build_Pipeline SHALL 使用 Vite 開發伺服器提供熱模組替換（HMR）功能，支援在 Chrome、Firefox、Edge 等主流瀏覽器中即時預覽遊戲
2. THE Input_Adapter SHALL 在瀏覽器環境中將鍵盤 WASD 鍵映射為角色移動方向，功能等同於虛擬搖桿
3. THE Input_Adapter SHALL 在瀏覽器環境中支援滑鼠點擊操作 UI 元素，功能等同於觸控操作
4. THE Input_Controller SHALL 透過 Input_Adapter 介面取得輸入資料，使觸控與鍵盤滑鼠輸入來源可在運行時依據平台自動切換
5. THE Game_System SHALL 在瀏覽器環境與 Capacitor WebView 環境中使用相同的 localStorage 存檔機制，確保存檔功能在兩種環境中行為一致
6. THE Build_Pipeline SHALL 在 Vite 建置設定中配置適當的資源壓縮（Terser 壓縮 JS、圖片壓縮），確保生產版本載入效能良好
7. THE Game_System SHALL 在開發模式下提供 FPS 計數器與物件池監控面板，供開發者即時觀察效能指標
