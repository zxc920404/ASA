# 技術設計文件

## 簡介

本文件描述「吸血鬼倖存者」類 Roguelike 生存手遊的技術架構設計。遊戲使用 Unity 2D 引擎搭配 C# 開發，主要目標平台為 Android（Google Play），同時支援 WebGL 建置供瀏覽器測試。架構以模組化、可擴充性與效能優化為核心設計原則，採用介面抽象、ScriptableObject 資料驅動、Object Pooling 與事件匯流排等設計模式。

## 架構概覽

```
┌─────────────────────────────────────────────────────┐
│                    Game Bootstrap                     │
│              (場景初始化 / Manager 註冊)               │
├─────────────────────────────────────────────────────┤
│                     Event Bus                         │
│           (模組間鬆耦合事件通訊中樞)                    │
├──────────┬──────────┬──────────┬─────────────────────┤
│   Core   │ Gameplay │    UI    │   Infrastructure    │
│ Assembly │ Assembly │ Assembly │     Assembly        │
├──────────┼──────────┼──────────┼─────────────────────┤
│GameSystem│WeaponSys │UIManager │  SaveSystem         │
│ObjectPool│EnemySpawn│HUDCtrl  │  AudioManager       │
│EventBus  │LevelUpSys│MenuCtrl │  BuildPipeline      │
│InputAdapt│WaveMgr   │          │  InputController    │
│          │DropSystem│          │  PluginSystem       │
└──────────┴──────────┴──────────┴─────────────────────┘
         ▲                              ▲
         │      ScriptableObject        │
         └──── 資料設定檔 (SO Config) ───┘
```

## Assembly Definition 結構

遊戲程式碼分為四個 Assembly Definition，控制編譯相依性：

| Assembly | 命名空間 | 職責 | 相依 |
|----------|---------|------|------|
| Core | `VampireSurvivors.Core` | 介面定義、事件匯流排、Object Pool、通用工具 | 無 |
| Gameplay | `VampireSurvivors.Gameplay` | 武器、敵人、升級、波次、掉落等遊戲邏輯 | Core |
| UI | `VampireSurvivors.UI` | HUD、選單、升級面板、設定介面 | Core |
| Infrastructure | `VampireSurvivors.Infrastructure` | 存檔、音效、輸入、建置管線、平台適配 | Core |

## 核心介面定義

### 遊戲實體介面（Core Assembly）

```csharp
// 武器介面
public interface IWeapon
{
    WeaponConfigSO Config { get; }
    int Level { get; }
    void Attack(Vector2 origin, Vector2 direction);
    void LevelUp();
    bool CanEvolve(IReadOnlyList<IPassiveItem> passives);
    IWeapon Evolve();
}

// 敵人介面
public interface IEnemy
{
    EnemyConfigSO Config { get; }
    float CurrentHP { get; }
    void TakeDamage(float damage);
    void SetTarget(Transform target);
    void ReturnToPool();
}

// 玩家角色介面
public interface IPlayerCharacter
{
    CharacterConfigSO Config { get; }
    float CurrentHP { get; }
    float MaxHP { get; }
    void Move(Vector2 direction);
    void TakeDamage(float damage);
    void ApplyStatModifier(StatModifier modifier);
}

// 被動道具介面
public interface IPassiveItem
{
    PassiveItemConfigSO Config { get; }
    int Level { get; }
    StatModifier GetModifier();
    void LevelUp();
}

// 輸入適配器介面
public interface IInputAdapter
{
    Vector2 GetMovementInput();
    bool IsPointerDown();
    Vector2 GetPointerPosition();
}

// 存檔資料介面
public interface ISaveProvider
{
    void Save(string key, string jsonData);
    string Load(string key);
    void Delete(string key);
    bool Exists(string key);
}
```

### 預留模組介面（Plugin System）

```csharp
public interface ISkillModule { void RegisterSkills(); }
public interface IEquipmentModule { void RegisterEquipment(); }
public interface IGachaModule { void OpenGachaBanner(); }
public interface IQuestModule { void LoadQuests(); }
public interface IAdModule { void ShowRewardedAd(Action onComplete); }
public interface IIAPModule { void PurchaseProduct(string productId, Action<bool> onResult); }
```

## ScriptableObject 資料設定

所有遊戲實體的屬性透過 ScriptableObject 定義，實現資料與邏輯分離：

```csharp
[CreateAssetMenu(menuName = "VampireSurvivors/Weapon Config")]
public class WeaponConfigSO : ScriptableObject
{
    public string weaponId;
    public string displayName;
    public Sprite icon;
    public GameObject projectilePrefab;
    public float baseDamage;
    public float attackInterval;
    public float attackRange;
    public int maxLevel;
    public WeaponLevelData[] levelData;
    public string evolutionPassiveId;  // 進化所需被動道具 ID
    public WeaponConfigSO evolvedWeaponConfig;
}

[CreateAssetMenu(menuName = "VampireSurvivors/Enemy Config")]
public class EnemyConfigSO : ScriptableObject
{
    public string enemyId;
    public string displayName;
    public Sprite sprite;
    public float baseHP;
    public float baseDamage;
    public float moveSpeed;
    public float bodySize;
    public DropTableEntry[] dropTable;
}

[CreateAssetMenu(menuName = "VampireSurvivors/Character Config")]
public class CharacterConfigSO : ScriptableObject
{
    public string characterId;
    public string displayName;
    public Sprite sprite;
    public float baseHP;
    public float baseMoveSpeed;
    public float baseAttackPower;
    public float basePickupRange;
    public WeaponConfigSO startingWeapon;
    public bool unlockedByDefault;
    public int unlockCost;
}

[CreateAssetMenu(menuName = "VampireSurvivors/Wave Config")]
public class WaveConfigSO : ScriptableObject
{
    public float startTime;
    public float endTime;
    public EnemyConfigSO[] enemyTypes;
    public float spawnInterval;
    public int spawnCount;
    public float statMultiplier;
}

[CreateAssetMenu(menuName = "VampireSurvivors/Object Pool Config")]
public class ObjectPoolConfigSO : ScriptableObject
{
    public PoolEntry[] pools;

    [System.Serializable]
    public class PoolEntry
    {
        public string poolId;
        public GameObject prefab;
        public int preAllocateCount;
        public int maxBatchExpansion;  // 上限 10
    }
}
```

## 事件匯流排（Event Bus）

模組間通訊透過事件匯流排實現鬆耦合：

```csharp
public static class EventBus
{
    private static readonly Dictionary<Type, List<Delegate>> _handlers = new();

    public static void Subscribe<T>(Action<T> handler) where T : struct, IGameEvent
    {
        var type = typeof(T);
        if (!_handlers.ContainsKey(type))
            _handlers[type] = new List<Delegate>();
        _handlers[type].Add(handler);
    }

    public static void Unsubscribe<T>(Action<T> handler) where T : struct, IGameEvent
    {
        var type = typeof(T);
        if (_handlers.ContainsKey(type))
            _handlers[type].Remove(handler);
    }

    public static void Publish<T>(T gameEvent) where T : struct, IGameEvent
    {
        var type = typeof(T);
        if (_handlers.TryGetValue(type, out var handlers))
            foreach (var handler in handlers)
                ((Action<T>)handler)?.Invoke(gameEvent);
    }

    public static void Clear() => _handlers.Clear();
}

public interface IGameEvent { }

// 事件定義範例
public struct EnemyKilledEvent : IGameEvent { public Vector2 Position; public EnemyConfigSO Config; }
public struct PlayerLevelUpEvent : IGameEvent { public int NewLevel; }
public struct PlayerDamagedEvent : IGameEvent { public float Damage; public float RemainingHP; }
public struct GameOverEvent : IGameEvent { public float SurvivalTime; public int KillCount; public int Gold; }
public struct WeaponEvolvedEvent : IGameEvent { public string WeaponId; }
public struct XPCollectedEvent : IGameEvent { public float Amount; }
```

## Object Pool 系統設計

Object Pool 是本專案的核心效能策略，管理所有高頻生成/銷毀的遊戲物件。

### 架構

```csharp
public class ObjectPoolManager : MonoBehaviour
{
    [SerializeField] private ObjectPoolConfigSO poolConfig;

    private Dictionary<string, Queue<GameObject>> _pools = new();
    private Dictionary<string, PoolStats> _stats = new();

    // 場景載入時預分配
    public void PreAllocate()
    {
        foreach (var entry in poolConfig.pools)
        {
            var queue = new Queue<GameObject>();
            for (int i = 0; i < entry.preAllocateCount; i++)
            {
                var obj = Instantiate(entry.prefab, transform);
                obj.SetActive(false);
                queue.Enqueue(obj);
            }
            _pools[entry.poolId] = queue;
            _stats[entry.poolId] = new PoolStats { PreAllocated = entry.preAllocateCount };
        }
    }

    // 從池中取出物件
    public GameObject Spawn(string poolId, Vector2 position)
    {
        if (!_pools.TryGetValue(poolId, out var queue) || queue.Count == 0)
        {
            ExpandPool(poolId);  // 批次擴容，每批 <= 10
            queue = _pools[poolId];
        }

        var obj = queue.Dequeue();
        obj.transform.position = position;
        obj.SetActive(true);
        UpdateStats(poolId, active: true);
        return obj;
    }

    // 回收物件至池中
    public void Despawn(string poolId, GameObject obj)
    {
        obj.SetActive(false);
        obj.transform.SetParent(transform);
        _pools[poolId].Enqueue(obj);
        UpdateStats(poolId, active: false);
    }

    // 批次擴容（每批不超過 10 個）
    private void ExpandPool(string poolId)
    {
        var entry = System.Array.Find(poolConfig.pools, e => e.poolId == poolId);
        int batchSize = Mathf.Min(entry.maxBatchExpansion, 10);
        var queue = _pools[poolId];
        for (int i = 0; i < batchSize; i++)
        {
            var obj = Instantiate(entry.prefab, transform);
            obj.SetActive(false);
            queue.Enqueue(obj);
        }
    }

    // 監控介面
    public PoolStats GetStats(string poolId) => _stats.GetValueOrDefault(poolId);
}

public struct PoolStats
{
    public int PreAllocated;
    public int CurrentActive;
    public int PeakActive;
    public int TotalExpansions;
}
```

### 物件池使用對照表

| 物件類型 | Pool ID | 預分配數量 | 批次擴容上限 |
|---------|---------|-----------|------------|
| 一般敵人 | `enemy_normal` | 50 | 10 |
| Boss 敵人 | `enemy_boss` | 2 | 1 |
| 投射物 | `projectile` | 100 | 10 |
| 經驗寶石 | `xp_gem` | 80 | 10 |
| 道具掉落 | `item_drop` | 20 | 5 |
| 傷害數字 | `damage_text` | 30 | 10 |
| 特效 | `vfx` | 40 | 10 |

## 輸入適配器設計

透過 Input_Adapter 介面抽象化輸入來源，支援觸控（Android）與鍵盤/滑鼠（WebGL）：

```csharp
// 觸控輸入（Android）
public class TouchInputAdapter : IInputAdapter
{
    private FloatingJoystick _joystick;

    public Vector2 GetMovementInput() => _joystick.Direction;
    public bool IsPointerDown() => Input.touchCount > 0;
    public Vector2 GetPointerPosition() =>
        Input.touchCount > 0 ? (Vector2)Input.GetTouch(0).position : Vector2.zero;
}

// 鍵盤/滑鼠輸入（WebGL）
public class KeyboardMouseInputAdapter : IInputAdapter
{
    public Vector2 GetMovementInput()
    {
        var dir = Vector2.zero;
        if (Input.GetKey(KeyCode.W)) dir.y += 1;
        if (Input.GetKey(KeyCode.S)) dir.y -= 1;
        if (Input.GetKey(KeyCode.A)) dir.x -= 1;
        if (Input.GetKey(KeyCode.D)) dir.x += 1;
        return dir.normalized;
    }

    public bool IsPointerDown() => Input.GetMouseButton(0);
    public Vector2 GetPointerPosition() => Input.mousePosition;
}

// InputController 透過介面取得輸入
public class InputController : MonoBehaviour
{
    private IInputAdapter _adapter;

    private void Awake()
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        _adapter = new KeyboardMouseInputAdapter();
#else
        _adapter = new TouchInputAdapter();
#endif
    }

    public Vector2 GetMovement() => _adapter.GetMovementInput();
}
```

## 存檔系統設計

存檔系統透過 ISaveProvider 介面抽象化儲存後端，支援不同平台：

```csharp
// 存檔資料結構
[System.Serializable]
public class SaveData
{
    public int gold;
    public int[] permanentUpgradeLevels;
    public string[] unlockedCharacterIds;
    public string appVersion;
}

// 檔案系統儲存（Android）
public class FileSaveProvider : ISaveProvider
{
    private string BasePath => Application.persistentDataPath;

    public void Save(string key, string jsonData)
        => File.WriteAllText(Path.Combine(BasePath, key + ".json"), jsonData);

    public string Load(string key)
        => File.ReadAllText(Path.Combine(BasePath, key + ".json"));

    public void Delete(string key)
        => File.Delete(Path.Combine(BasePath, key + ".json"));

    public bool Exists(string key)
        => File.Exists(Path.Combine(BasePath, key + ".json"));
}

// PlayerPrefs 儲存（WebGL）
public class PlayerPrefsSaveProvider : ISaveProvider
{
    public void Save(string key, string jsonData) => PlayerPrefs.SetString(key, jsonData);
    public string Load(string key) => PlayerPrefs.GetString(key, "");
    public void Delete(string key) => PlayerPrefs.DeleteKey(key);
    public bool Exists(string key) => PlayerPrefs.HasKey(key);
}

// SaveSystem 使用平台適配
public class SaveSystem : MonoBehaviour
{
    private ISaveProvider _provider;

    private void Awake()
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        _provider = new PlayerPrefsSaveProvider();
#else
        _provider = new FileSaveProvider();
#endif
    }

    public void SaveGame(SaveData data)
    {
        string json = JsonUtility.ToJson(data);
        _provider.Save("save_data", json);
    }

    public SaveData LoadGame()
    {
        if (!_provider.Exists("save_data"))
            return CreateDefaultSave();

        try
        {
            string json = _provider.Load("save_data");
            return JsonUtility.FromJson<SaveData>(json);
        }
        catch
        {
            return CreateDefaultSave();
        }
    }

    private SaveData CreateDefaultSave() => new SaveData
    {
        gold = 0,
        permanentUpgradeLevels = new int[5],
        unlockedCharacterIds = new[] { "default_character" },
        appVersion = Application.version
    };
}
```

## 核心遊戲系統設計

### GameManager（遊戲流程控制）

```csharp
public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    [SerializeField] private ObjectPoolManager poolManager;
    [SerializeField] private WaveConfigSO[] waveConfigs;

    private GameState _state = GameState.MainMenu;
    private float _gameTime;
    private int _killCount;

    public GameState State => _state;
    public float GameTime => _gameTime;
    public int KillCount => _killCount;

    private void Awake()
    {
        Instance = this;
        poolManager.PreAllocate();
    }

    public void StartGame(CharacterConfigSO character, int mapIndex)
    {
        _state = GameState.Playing;
        _gameTime = 0;
        _killCount = 0;
        EventBus.Publish(new GameStartEvent { Character = character, MapIndex = mapIndex });
    }

    public void PauseGame()
    {
        _state = GameState.Paused;
        Time.timeScale = 0;
    }

    public void ResumeGame()
    {
        _state = GameState.Playing;
        Time.timeScale = 1;
    }

    public void GameOver()
    {
        _state = GameState.GameOver;
        Time.timeScale = 0;
        int gold = CalculateGoldReward(_gameTime, _killCount);
        EventBus.Publish(new GameOverEvent
        {
            SurvivalTime = _gameTime,
            KillCount = _killCount,
            Gold = gold
        });
    }

    private int CalculateGoldReward(float time, int kills)
        => Mathf.FloorToInt(time * 0.5f) + kills;
}

public enum GameState { MainMenu, Playing, Paused, LevelUp, GameOver, Victory }
```

### 升級系統

```csharp
public class LevelUpSystem : MonoBehaviour
{
    [SerializeField] private int[] xpThresholds;  // 各等級所需 XP

    private int _currentLevel = 1;
    private float _currentXP;

    private void OnEnable() => EventBus.Subscribe<XPCollectedEvent>(OnXPCollected);
    private void OnDisable() => EventBus.Unsubscribe<XPCollectedEvent>(OnXPCollected);

    private void OnXPCollected(XPCollectedEvent e)
    {
        _currentXP += e.Amount;
        while (_currentXP >= xpThresholds[Mathf.Min(_currentLevel - 1, xpThresholds.Length - 1)])
        {
            _currentXP -= xpThresholds[Mathf.Min(_currentLevel - 1, xpThresholds.Length - 1)];
            _currentLevel++;
            PresentUpgradeOptions();
        }
    }

    private void PresentUpgradeOptions()
    {
        var options = GenerateUpgradeOptions(3);
        GameManager.Instance.PauseGame();
        EventBus.Publish(new PlayerLevelUpEvent { NewLevel = _currentLevel });
        // UI 顯示 3 個選項供玩家選擇
    }

    private List<UpgradeOption> GenerateUpgradeOptions(int count)
    {
        // 依據當前裝備狀態生成選項
        // 若武器與被動道具皆已滿，僅提供升級選項
        // 每個武器/道具最高 8 級
        return new List<UpgradeOption>();
    }
}
```

### 波次管理器

```csharp
public class WaveManager : MonoBehaviour
{
    [SerializeField] private WaveConfigSO[] waveConfigs;
    [SerializeField] private EnemyConfigSO bossConfig;
    [SerializeField] private EnemyConfigSO finalBossConfig;
    [SerializeField] private int maxEnemyCount = 200;

    private int _activeEnemyCount;
    private float _difficultyMultiplier = 1f;
    private float _lastDifficultyIncrease;

    private void Update()
    {
        float gameTime = GameManager.Instance.GameTime;

        // 每 30 秒提升難度
        if (gameTime - _lastDifficultyIncrease >= 30f)
        {
            _difficultyMultiplier += 0.1f;
            _lastDifficultyIncrease = gameTime;
        }

        // 每 5 分鐘生成 Boss
        // 30 分鐘生成最終 Boss

        // 依據當前波次設定生成敵人（不超過上限）
        if (_activeEnemyCount < maxEnemyCount)
            SpawnEnemies();
    }

    private void SpawnEnemies()
    {
        // 從 Object Pool 取出敵人，設定屬性乘以 difficultyMultiplier
        // 生成位置在攝影機可視範圍外
    }
}
```

## 場景結構

```
Scenes/
├── MainMenuScene        # 主選單、角色選擇、永久升級
├── GameScene_Forest     # 森林地圖
└── GameScene_Cemetery   # 墓地地圖

GameScene Hierarchy:
├── GameManager
│   ├── ObjectPoolManager
│   ├── WaveManager
│   └── DropSystem
├── Player
│   ├── PlayerCharacter
│   ├── WeaponSystem
│   └── InputController
├── Camera (Cinemachine)
├── Tilemap
│   ├── Ground
│   └── Decorations
├── UI Canvas
│   ├── HUD
│   ├── LevelUpPanel
│   ├── PauseMenu
│   └── GameOverPanel
└── AudioManager
```

## WebGL 建置設定

### 平台差異處理

| 功能 | Android | WebGL |
|------|---------|-------|
| 輸入 | TouchInputAdapter（虛擬搖桿） | KeyboardMouseInputAdapter（WASD + 滑鼠） |
| 存檔 | FileSaveProvider（persistentDataPath） | PlayerPrefsSaveProvider（IndexedDB） |
| 音效 | Unity Audio Mixer | Unity Audio Mixer（WebGL 限制：需用戶互動後才能播放） |
| 壓縮 | AAB 壓縮 | Brotli / Gzip |
| 螢幕 | 觸控適配多比例 | 固定 Canvas 尺寸 |

### 建置設定

```
Player Settings (WebGL):
- Compression Format: Brotli
- Memory Size: 256 MB
- Exception Support: Explicitly Thrown Exceptions Only
- Code Optimization: Speed
- Strip Engine Code: Enabled
```

## 專案目錄結構

```
Assets/
├── _Project/
│   ├── Scripts/
│   │   ├── Core/                          # Core Assembly
│   │   │   ├── Core.asmdef
│   │   │   ├── Interfaces/
│   │   │   │   ├── IWeapon.cs
│   │   │   │   ├── IEnemy.cs
│   │   │   │   ├── IPlayerCharacter.cs
│   │   │   │   ├── IPassiveItem.cs
│   │   │   │   ├── IInputAdapter.cs
│   │   │   │   ├── ISaveProvider.cs
│   │   │   │   └── IGameEvent.cs
│   │   │   ├── Events/
│   │   │   │   ├── EventBus.cs
│   │   │   │   └── GameEvents.cs
│   │   │   ├── ObjectPool/
│   │   │   │   ├── ObjectPoolManager.cs
│   │   │   │   └── PoolStats.cs
│   │   │   └── PluginInterfaces/
│   │   │       ├── ISkillModule.cs
│   │   │       ├── IEquipmentModule.cs
│   │   │       ├── IGachaModule.cs
│   │   │       ├── IQuestModule.cs
│   │   │       ├── IAdModule.cs
│   │   │       └── IIAPModule.cs
│   │   ├── Gameplay/                      # Gameplay Assembly
│   │   │   ├── Gameplay.asmdef
│   │   │   ├── Player/
│   │   │   │   └── PlayerCharacter.cs
│   │   │   ├── Weapons/
│   │   │   │   ├── WeaponSystem.cs
│   │   │   │   └── Weapons/              # 各武器實作
│   │   │   ├── Enemies/
│   │   │   │   ├── EnemySpawner.cs
│   │   │   │   └── EnemyBase.cs
│   │   │   ├── LevelUp/
│   │   │   │   └── LevelUpSystem.cs
│   │   │   ├── Wave/
│   │   │   │   └── WaveManager.cs
│   │   │   └── Drop/
│   │   │       └── DropSystem.cs
│   │   ├── UI/                            # UI Assembly
│   │   │   ├── UI.asmdef
│   │   │   ├── HUD/
│   │   │   │   ├── HUDController.cs
│   │   │   │   └── DamageTextController.cs
│   │   │   ├── Menus/
│   │   │   │   ├── MainMenuController.cs
│   │   │   │   ├── PauseMenuController.cs
│   │   │   │   └── GameOverController.cs
│   │   │   └── LevelUp/
│   │   │       └── LevelUpPanelController.cs
│   │   └── Infrastructure/                # Infrastructure Assembly
│   │       ├── Infrastructure.asmdef
│   │       ├── Save/
│   │       │   ├── SaveSystem.cs
│   │       │   ├── SaveData.cs
│   │       │   ├── FileSaveProvider.cs
│   │       │   └── PlayerPrefsSaveProvider.cs
│   │       ├── Audio/
│   │       │   └── AudioManager.cs
│   │       ├── Input/
│   │       │   ├── InputController.cs
│   │       │   ├── TouchInputAdapter.cs
│   │       │   └── KeyboardMouseInputAdapter.cs
│   │       └── Build/
│   │           └── BuildPipeline.cs
│   ├── ScriptableObjects/
│   │   ├── Weapons/
│   │   ├── Enemies/
│   │   ├── Characters/
│   │   ├── Waves/
│   │   ├── PassiveItems/
│   │   └── PoolConfig/
│   ├── Prefabs/
│   │   ├── Player/
│   │   ├── Enemies/
│   │   ├── Projectiles/
│   │   ├── Drops/
│   │   └── VFX/
│   ├── Sprites/
│   │   └── Atlas/                         # Sprite Atlas
│   ├── Audio/
│   │   ├── BGM/
│   │   └── SFX/
│   ├── Tilemaps/
│   └── Scenes/
└── Plugins/                               # 第三方插件
```

## 正確性屬性與測試策略

以下列出可透過屬性測試（Property-Based Testing）或範例測試驗證的核心正確性屬性。

### 屬性測試（Property-Based Tests）

#### P1：玩家位置邊界不變量（需求 1.5）
- **屬性**：對於任意移動輸入序列，Player_Character 的位置始終在地圖邊界範圍內
- **類型**：不變量（Invariant）
- **驗證**：`0 <= player.position.x <= mapWidth && 0 <= player.position.y <= mapHeight`

#### P2：傷害計算公式一致性（需求 2.3）
- **屬性**：對於任意武器基礎傷害 `d > 0` 與攻擊力加成 `m > 0`，最終傷害始終等於 `d * m`
- **類型**：變形屬性（Metamorphic）
- **驗證**：`CalculateDamage(baseDamage, multiplier) == baseDamage * multiplier`

#### P3：裝備欄位上限不變量（需求 2.4）
- **屬性**：對於任意升級選擇序列，玩家持有的主動武器數量不超過 6，被動道具數量不超過 6
- **類型**：不變量（Invariant）
- **驗證**：`weapons.Count <= 6 && passives.Count <= 6`

#### P4：敵人數量上限不變量（需求 3.6）
- **屬性**：對於任意遊戲時間點，場上活躍敵人數量不超過 200
- **類型**：不變量（Invariant）
- **驗證**：`activeEnemyCount <= 200`

#### P5：升級選項數量不變量（需求 5.2）
- **屬性**：每次升級時，系統始終提供恰好 3 個升級選項
- **類型**：不變量（Invariant）
- **驗證**：`upgradeOptions.Count == 3`

#### P6：裝備滿時僅提供升級選項（需求 5.6）
- **屬性**：當玩家持有 6 把武器且 6 件被動道具時，所有升級選項皆為已持有裝備的升級
- **類型**：不變量（Invariant）
- **驗證**：`if (weapons.Count == 6 && passives.Count == 6) then options.All(o => o.IsUpgrade)`

#### P7：武器等級上限不變量（需求 5.5）
- **屬性**：對於任意升級序列，武器與被動道具等級不超過 8
- **類型**：不變量（Invariant）
- **驗證**：`weapon.Level <= 8 && passive.Level <= 8`

#### P8：武器進化配方唯一性（需求 6.4）
- **屬性**：每種基礎武器對應唯一的進化被動道具，無重複映射
- **類型**：不變量（Invariant）
- **驗證**：`evolutionRecipes.Values.Distinct().Count() == evolutionRecipes.Count`

#### P9：武器屬性隨等級單調遞增（需求 6.5）
- **屬性**：對於任意武器，等級 N+1 的屬性值大於等於等級 N 的屬性值
- **類型**：變形屬性（Metamorphic）
- **驗證**：`GetStats(level + 1) >= GetStats(level)`

#### P10：存檔往返一致性（需求 13.6）
- **屬性**：對於任意有效的 SaveData 物件，序列化後再反序列化產生與原始物件等價的結果
- **類型**：往返屬性（Round-Trip）
- **驗證**：`Deserialize(Serialize(saveData)) == saveData`

#### P11：金幣獎勵計算確定性（需求 10.1）
- **屬性**：對於相同的存活時間與擊殺數，金幣獎勵計算結果始終相同
- **類型**：冪等性（Idempotence）
- **驗證**：`CalculateGold(time, kills) == CalculateGold(time, kills)`

#### P12：永久升級購買後金幣不為負（需求 10.3）
- **屬性**：對於任意購買操作，購買後玩家金幣餘額始終大於等於零
- **類型**：不變量（Invariant）
- **驗證**：`gold >= 0 after purchase`

#### P13：Object Pool 批次擴容上限（需求 12.3）
- **屬性**：對於任意擴容操作，單次批次擴容數量不超過 10
- **類型**：不變量（Invariant）
- **驗證**：`batchSize <= 10`

#### P14：事件匯流排訂閱/發布一致性（需求 16.6）
- **屬性**：對於任意事件序列，所有已訂閱的處理器皆收到對應事件，未訂閱的處理器不收到事件
- **類型**：不變量（Invariant）
- **驗證**：`subscribedHandlers.All(h => h.ReceivedEvent) && unsubscribedHandlers.None(h => h.ReceivedEvent)`

#### P15：輸入適配器行為等價性（需求 17.4）
- **屬性**：對於等價的輸入（觸控方向 vs WASD 方向），兩種 InputAdapter 產生相同的正規化移動向量
- **類型**：模型比對（Model-Based）
- **驗證**：`touchAdapter.GetMovement(touchDir) == keyboardAdapter.GetMovement(wasdDir)` for equivalent inputs

#### P16：搖桿死區過濾（需求 15.2）
- **屬性**：對於任意搖桿輸入，當輸入距離小於搖桿半徑的 15% 時，輸出移動向量為零
- **類型**：不變量（Invariant）
- **驗證**：`if (inputMagnitude < joystickRadius * 0.15) then movement == Vector2.zero`

#### P17：敵人生成位置在可視範圍外（需求 3.1）
- **屬性**：對於任意生成的敵人，其初始位置在攝影機可視範圍之外
- **類型**：不變量（Invariant）
- **驗證**：`!camera.IsInViewport(enemy.spawnPosition)`

### 範例測試（Example-Based Tests）

| 測試項目 | 對應需求 | 測試描述 |
|---------|---------|---------|
| 虛擬搖桿顯示 | 1.1 | 模擬觸碰螢幕左半部，驗證搖桿出現 |
| 搖桿釋放隱藏 | 1.3 | 模擬釋放觸控，驗證搖桿消失 |
| 自動攻擊觸發 | 2.1 | 設定攻擊間隔 1 秒，等待 1 秒後驗證攻擊觸發 |
| 敵人死亡掉落 | 3.4 | 擊殺敵人，驗證經驗寶石生成於敵人位置 |
| Boss 生成 | 4.3 | 模擬遊戲時間 5 分鐘，驗證 Boss 生成 |
| 最終 Boss | 4.4 | 模擬遊戲時間 30 分鐘，驗證死神生成 |
| 升級選項套用 | 5.4 | 選擇武器升級，驗證武器等級 +1 |
| 武器進化 | 6.2 | 武器滿級 + 持有對應被動道具，驗證進化選項出現 |
| 暫停選單 | 8.5 | 點擊暫停按鈕，驗證 Time.timeScale == 0 |
| 遊戲結算 | 9.4 | 玩家 HP 歸零，驗證結算畫面顯示 |
| 永久升級購買 | 10.3 | 持有 100 金幣，購買 50 金幣升級，驗證餘額 50 |
| 損毀存檔處理 | 13.5 | 提供損毀 JSON，驗證建立預設存檔並通知 |
| WASD 輸入映射 | 17.2 | 按下 W 鍵，驗證移動向量 y > 0 |
| 滑鼠 UI 操作 | 17.3 | 模擬滑鼠點擊 UI 按鈕，驗證按鈕回應 |
| 預分配驗證 | 12.2 | 場景載入後，驗證各池物件數量符合設定 |
| 池監控數據 | 12.8 | 生成/回收物件後，驗證 PoolStats 數據正確 |

## 效能預算

| 指標 | 目標值 | 量測方式 |
|------|-------|---------|
| FPS | ≥ 30 | Unity Profiler |
| Draw Calls | ≤ 50 | Frame Debugger |
| 記憶體使用 | ≤ 300 MB | Memory Profiler |
| 場景載入時間 | ≤ 3 秒 | Stopwatch |
| AAB 大小 | ≤ 150 MB | Build Report |
| WebGL 載入大小 | ≤ 30 MB (壓縮後) | Build Report |
| 輸入延遲 | ≤ 2 幀 (66ms) | Input Profiler |
