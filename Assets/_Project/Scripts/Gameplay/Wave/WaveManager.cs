using UnityEngine;
using VampireSurvivors.Core;

namespace VampireSurvivors.Gameplay
{
    /// <summary>
    /// 波次管理器 — 依據遊戲經過時間控制敵人生成頻率與種類，
    /// 每 30 秒提升難度，每 5 分鐘生成 Boss，30 分鐘生成最終 Boss「死神」。
    /// </summary>
    public class WaveManager : MonoBehaviour
    {
        /// <summary>波次設定檔陣列，依時間順序排列。</summary>
        [SerializeField] private WaveConfigSO[] waveConfigs;

        /// <summary>Boss 敵人設定檔。</summary>
        [SerializeField] private EnemyConfigSO bossConfig;

        /// <summary>最終 Boss「死神」設定檔。</summary>
        [SerializeField] private EnemyConfigSO finalBossConfig;

        /// <summary>敵人生成器。</summary>
        [SerializeField] private EnemySpawner enemySpawner;

        /// <summary>難度提升間隔（秒）。</summary>
        private const float DifficultyInterval = 30f;

        /// <summary>Boss 生成間隔（秒）。</summary>
        private const float BossInterval = 300f;

        /// <summary>最終 Boss 生成時間（秒）。</summary>
        private const float FinalBossTime = 1800f;

        /// <summary>Boss 物件池識別碼。</summary>
        private const string BossPoolId = "enemy_boss";

        /// <summary>遊戲經過時間（秒）。</summary>
        private float gameTime;

        /// <summary>難度乘數，每 30 秒遞增。</summary>
        private float difficultyMultiplier = 1f;

        /// <summary>上次難度提升的時間點。</summary>
        private float lastDifficultyTime;

        /// <summary>上次生成敵人的時間點。</summary>
        private float lastSpawnTime;

        /// <summary>已生成的 Boss 數量（用於判斷下一次 Boss 時間）。</summary>
        private int bossesSpawned;

        /// <summary>是否已生成最終 Boss。</summary>
        private bool finalBossSpawned;

        /// <summary>是否正在運行。</summary>
        private bool isRunning;

        /// <summary>遊戲經過時間（唯讀）。</summary>
        public float GameTime => gameTime;

        /// <summary>當前難度乘數（唯讀）。</summary>
        public float DifficultyMultiplier => difficultyMultiplier;

        private void OnEnable()
        {
            EventBus.Subscribe<EnemyKilledEvent>(OnEnemyKilled);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<EnemyKilledEvent>(OnEnemyKilled);
        }

        /// <summary>
        /// 開始波次管理。
        /// </summary>
        public void StartWaves()
        {
            gameTime = 0f;
            difficultyMultiplier = 1f;
            lastDifficultyTime = 0f;
            lastSpawnTime = 0f;
            bossesSpawned = 0;
            finalBossSpawned = false;
            isRunning = true;
        }

        /// <summary>
        /// 停止波次管理。
        /// </summary>
        public void StopWaves()
        {
            isRunning = false;
        }

        private void Update()
        {
            if (!isRunning) return;

            gameTime += Time.deltaTime;

            // 每 30 秒提升難度
            if (gameTime - lastDifficultyTime >= DifficultyInterval)
            {
                difficultyMultiplier += 0.1f;
                lastDifficultyTime = gameTime;
            }

            // 30 分鐘生成最終 Boss
            if (!finalBossSpawned && gameTime >= FinalBossTime)
            {
                SpawnFinalBoss();
                return;
            }

            // 每 5 分鐘生成 Boss
            int expectedBosses = Mathf.FloorToInt(gameTime / BossInterval);
            if (expectedBosses > bossesSpawned && !finalBossSpawned)
            {
                SpawnBoss();
            }

            // 依據當前波次設定生成一般敵人
            SpawnWaveEnemies();
        }

        /// <summary>
        /// 依據當前遊戲時間找到對應波次設定，定期生成敵人。
        /// </summary>
        private void SpawnWaveEnemies()
        {
            if (enemySpawner == null || waveConfigs == null || waveConfigs.Length == 0)
                return;

            WaveConfigSO currentWave = GetCurrentWave();
            if (currentWave == null || currentWave.enemyTypes == null || currentWave.enemyTypes.Length == 0)
                return;

            float interval = Mathf.Max(currentWave.spawnInterval / difficultyMultiplier, 0.1f);
            if (gameTime - lastSpawnTime < interval)
                return;

            lastSpawnTime = gameTime;

            float waveMult = currentWave.statMultiplier * difficultyMultiplier;
            int count = currentWave.spawnCount;

            for (int i = 0; i < count; i++)
            {
                var config = currentWave.enemyTypes[Random.Range(0, currentWave.enemyTypes.Length)];
                enemySpawner.SpawnEnemy(config, waveMult);
            }
        }

        /// <summary>
        /// 取得當前遊戲時間對應的波次設定。
        /// </summary>
        /// <returns>當前波次設定；若無匹配則回傳最後一個波次。</returns>
        private WaveConfigSO GetCurrentWave()
        {
            WaveConfigSO result = null;
            for (int i = 0; i < waveConfigs.Length; i++)
            {
                if (gameTime >= waveConfigs[i].startTime && gameTime < waveConfigs[i].endTime)
                    return waveConfigs[i];
                result = waveConfigs[i];
            }
            // 超過所有波次時間範圍時，使用最後一個波次
            return result;
        }

        /// <summary>
        /// 生成 Boss 級敵人。
        /// </summary>
        private void SpawnBoss()
        {
            if (bossConfig == null || enemySpawner == null) return;

            enemySpawner.SpawnEnemy(bossConfig, difficultyMultiplier);
            bossesSpawned++;
        }

        /// <summary>
        /// 生成最終 Boss「死神」。
        /// </summary>
        private void SpawnFinalBoss()
        {
            if (finalBossConfig == null || enemySpawner == null) return;

            enemySpawner.SpawnEnemy(finalBossConfig, difficultyMultiplier);
            finalBossSpawned = true;
        }

        /// <summary>
        /// 監聽敵人被擊殺事件，判斷是否為最終 Boss 被擊敗。
        /// </summary>
        private void OnEnemyKilled(EnemyKilledEvent e)
        {
            if (finalBossSpawned && e.Config == finalBossConfig)
            {
                isRunning = false;
                EventBus.Publish(new VictoryEvent
                {
                    SurvivalTime = gameTime,
                    KillCount = 0 // 由 GameManager 追蹤實際擊殺數
                });
            }
        }
    }
}
