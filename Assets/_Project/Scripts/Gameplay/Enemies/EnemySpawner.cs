using UnityEngine;
using VampireSurvivors.Core;

namespace VampireSurvivors.Gameplay
{
    /// <summary>
    /// 敵人生成器 — 從攝影機可視範圍外的隨機位置生成敵人，
    /// 透過 Object Pool 管理敵人物件，並控制場上敵人數量上限。
    /// </summary>
    public class EnemySpawner : MonoBehaviour
    {
        /// <summary>物件池管理器。</summary>
        [SerializeField] private ObjectPoolManager poolManager;

        /// <summary>主攝影機。</summary>
        [SerializeField] private Camera mainCamera;

        /// <summary>玩家角色 Transform（敵人追蹤目標）。</summary>
        [SerializeField] private Transform playerTransform;

        /// <summary>敵人物件池識別碼。</summary>
        [SerializeField] private string enemyPoolId = "enemy_normal";

        /// <summary>場上敵人數量上限。</summary>
        [SerializeField] private int maxActiveEnemies = 200;

        /// <summary>生成位置距離攝影機可視邊緣的偏移量。</summary>
        [SerializeField] private float spawnOffset = 2f;

        /// <summary>當前場上活躍敵人數量。</summary>
        private int activeEnemyCount;

        /// <summary>場上活躍敵人數量（唯讀）。</summary>
        public int ActiveEnemyCount => activeEnemyCount;

        /// <summary>場上敵人數量上限（唯讀）。</summary>
        public int MaxActiveEnemies => maxActiveEnemies;

        private void OnEnable()
        {
            EventBus.Subscribe<EnemyKilledEvent>(OnEnemyKilled);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<EnemyKilledEvent>(OnEnemyKilled);
        }

        /// <summary>
        /// 生成一隻敵人。若場上敵人已達上限則不生成。
        /// </summary>
        /// <param name="config">敵人設定檔。</param>
        /// <param name="statMultiplier">難度屬性乘數。</param>
        /// <returns>生成的敵人物件；若已達上限則回傳 null。</returns>
        public EnemyBase SpawnEnemy(EnemyConfigSO config, float statMultiplier)
        {
            if (activeEnemyCount >= maxActiveEnemies)
                return null;

            Vector2 spawnPos = GetSpawnPosition();
            GameObject obj = poolManager.Spawn(enemyPoolId, spawnPos);

            var enemy = obj.GetComponent<EnemyBase>();
            if (enemy != null)
            {
                enemy.Initialize(config, statMultiplier, poolManager, enemyPoolId);
                enemy.SetTarget(playerTransform);
            }

            activeEnemyCount++;
            return enemy;
        }

        /// <summary>
        /// 計算攝影機可視範圍外的隨機生成位置。
        /// 從上、下、左、右四個邊隨機選擇一邊，在該邊外側隨機取點。
        /// </summary>
        /// <returns>攝影機可視範圍外的世界座標位置。</returns>
        private Vector2 GetSpawnPosition()
        {
            if (mainCamera == null)
                return (Vector2)transform.position + Random.insideUnitCircle.normalized * 15f;

            // 取得攝影機可視範圍的世界座標邊界
            float camHeight = mainCamera.orthographicSize;
            float camWidth = camHeight * mainCamera.aspect;
            Vector2 camPos = mainCamera.transform.position;

            float minX = camPos.x - camWidth - spawnOffset;
            float maxX = camPos.x + camWidth + spawnOffset;
            float minY = camPos.y - camHeight - spawnOffset;
            float maxY = camPos.y + camHeight + spawnOffset;

            // 隨機選擇一邊（0=上, 1=下, 2=左, 3=右）
            int side = Random.Range(0, 4);

            return side switch
            {
                0 => new Vector2(Random.Range(minX, maxX), maxY),  // 上方
                1 => new Vector2(Random.Range(minX, maxX), minY),  // 下方
                2 => new Vector2(minX, Random.Range(minY, maxY)),  // 左方
                _ => new Vector2(maxX, Random.Range(minY, maxY)),  // 右方
            };
        }

        /// <summary>
        /// 敵人被擊殺時遞減活躍數量。
        /// </summary>
        private void OnEnemyKilled(EnemyKilledEvent e)
        {
            activeEnemyCount--;
            if (activeEnemyCount < 0)
                activeEnemyCount = 0;
        }
    }
}
