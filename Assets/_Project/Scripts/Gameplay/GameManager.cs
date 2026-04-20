using UnityEngine;
using VampireSurvivors.Core;

namespace VampireSurvivors.Gameplay
{
    /// <summary>
    /// 遊戲狀態列舉。
    /// </summary>
    public enum GameState
    {
        /// <summary>主選單。</summary>
        MainMenu,
        /// <summary>遊戲進行中。</summary>
        Playing,
        /// <summary>暫停。</summary>
        Paused,
        /// <summary>升級選擇中。</summary>
        LevelUp,
        /// <summary>遊戲結束。</summary>
        GameOver,
        /// <summary>勝利。</summary>
        Victory
    }

    /// <summary>
    /// 遊戲管理器 — Singleton，管理遊戲狀態與流程，串接所有 Manager。
    /// 負責 StartGame、PauseGame、ResumeGame、GameOver、Victory 流程控制。
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        /// <summary>全域單例。</summary>
        public static GameManager Instance { get; private set; }

        [Header("Manager 參考")]
        /// <summary>物件池管理器。</summary>
        [SerializeField] private ObjectPoolManager poolManager;

        /// <summary>當前遊戲狀態。</summary>
        private GameState state = GameState.MainMenu;

        /// <summary>遊戲經過時間（秒）。</summary>
        private float gameTime;

        /// <summary>擊殺數。</summary>
        private int killCount;

        /// <summary>當前等級。</summary>
        private int currentLevel = 1;

        /// <summary>當前遊戲狀態（唯讀）。</summary>
        public GameState State => state;

        /// <summary>遊戲經過時間（唯讀）。</summary>
        public float GameTime => gameTime;

        /// <summary>擊殺數（唯讀）。</summary>
        public int KillCount => killCount;

        /// <summary>當前等級（唯讀）。</summary>
        public int CurrentLevel => currentLevel;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
        }

        private void OnEnable()
        {
            EventBus.Subscribe<EnemyKilledEvent>(OnEnemyKilled);
            EventBus.Subscribe<PlayerLevelUpEvent>(OnPlayerLevelUp);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<EnemyKilledEvent>(OnEnemyKilled);
            EventBus.Unsubscribe<PlayerLevelUpEvent>(OnPlayerLevelUp);
        }

        private void Update()
        {
            if (state == GameState.Playing)
                gameTime += Time.deltaTime;
        }

        /// <summary>
        /// 開始遊戲。初始化物件池並發布 GameStartEvent。
        /// </summary>
        /// <param name="character">玩家選擇的角色設定檔。</param>
        /// <param name="mapIndex">地圖索引。</param>
        public void StartGame(CharacterConfigSO character, int mapIndex)
        {
            state = GameState.Playing;
            gameTime = 0f;
            killCount = 0;
            currentLevel = 1;
            Time.timeScale = 1f;

            if (poolManager != null)
                poolManager.PreAllocate();

            EventBus.Publish(new GameStartEvent
            {
                Character = character,
                MapIndex = mapIndex
            });
        }

        /// <summary>
        /// 暫停遊戲。
        /// </summary>
        public void PauseGame()
        {
            if (state != GameState.Playing) return;
            state = GameState.Paused;
            Time.timeScale = 0f;
        }

        /// <summary>
        /// 恢復遊戲。
        /// </summary>
        public void ResumeGame()
        {
            if (state != GameState.Paused && state != GameState.LevelUp) return;
            state = GameState.Playing;
            Time.timeScale = 1f;
        }

        /// <summary>
        /// 進入升級選擇狀態。
        /// </summary>
        public void EnterLevelUp()
        {
            state = GameState.LevelUp;
            Time.timeScale = 0f;
        }

        /// <summary>
        /// 觸發遊戲結束。計算金幣獎勵並發布 GameOverEvent。
        /// </summary>
        public void TriggerGameOver()
        {
            if (state == GameState.GameOver || state == GameState.Victory) return;

            state = GameState.GameOver;
            Time.timeScale = 0f;

            int gold = CalculateGoldReward(gameTime, killCount);
            EventBus.Publish(new GameOverEvent
            {
                SurvivalTime = gameTime,
                KillCount = killCount,
                Gold = gold
            });
        }

        /// <summary>
        /// 觸發勝利。
        /// </summary>
        public void TriggerVictory()
        {
            if (state == GameState.GameOver || state == GameState.Victory) return;

            state = GameState.Victory;
            Time.timeScale = 0f;

            EventBus.Publish(new VictoryEvent
            {
                SurvivalTime = gameTime,
                KillCount = killCount
            });
        }

        /// <summary>
        /// 計算金幣獎勵：存活時間 × 0.5 + 擊殺數。
        /// </summary>
        /// <param name="time">存活時間（秒）。</param>
        /// <param name="kills">擊殺數。</param>
        /// <returns>金幣獎勵。</returns>
        public static int CalculateGoldReward(float time, int kills)
        {
            return Mathf.FloorToInt(time * 0.5f) + kills;
        }

        /// <summary>
        /// 敵人被擊殺事件處理。
        /// </summary>
        private void OnEnemyKilled(EnemyKilledEvent e)
        {
            killCount++;
        }

        /// <summary>
        /// 玩家升級事件處理。
        /// </summary>
        private void OnPlayerLevelUp(PlayerLevelUpEvent e)
        {
            currentLevel = e.NewLevel;
        }

        private void OnDestroy()
        {
            if (Instance == this)
                Instance = null;
        }
    }
}
