using UnityEngine;
using VampireSurvivors.Core;

namespace VampireSurvivors.Gameplay
{
    /// <summary>
    /// 掉落系統 — 訂閱 EnemyKilledEvent，在敵人位置生成經驗寶石與額外道具。
    /// 透過 Object Pool 管理所有掉落物件。
    /// </summary>
    public class DropSystem : MonoBehaviour
    {
        /// <summary>物件池管理器。</summary>
        [SerializeField] private ObjectPoolManager poolManager;

        /// <summary>經驗寶石物件池識別碼。</summary>
        [SerializeField] private string xpGemPoolId = "xp_gem";

        /// <summary>道具掉落物件池識別碼。</summary>
        [SerializeField] private string itemDropPoolId = "item_drop";

        /// <summary>每顆經驗寶石提供的基礎經驗值。</summary>
        [SerializeField] private float baseXPAmount = 10f;

        private void OnEnable()
        {
            EventBus.Subscribe<EnemyKilledEvent>(OnEnemyKilled);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<EnemyKilledEvent>(OnEnemyKilled);
        }

        /// <summary>
        /// 敵人被擊殺時，在其位置生成經驗寶石並依據掉落表生成額外道具。
        /// </summary>
        private void OnEnemyKilled(EnemyKilledEvent e)
        {
            SpawnXPGem(e.Position);
            SpawnDropTableItems(e.Position, e.Config);
        }

        /// <summary>
        /// 在指定位置生成經驗寶石。
        /// </summary>
        private void SpawnXPGem(Vector2 position)
        {
            if (poolManager == null) return;

            GameObject obj = poolManager.Spawn(xpGemPoolId, position);
            var gem = obj.GetComponent<XPGem>();
            if (gem != null)
            {
                gem.Initialize(baseXPAmount, poolManager, xpGemPoolId);
            }
        }

        /// <summary>
        /// 依據敵人設定檔的掉落表，以機率決定是否生成額外道具。
        /// </summary>
        private void SpawnDropTableItems(Vector2 position, EnemyConfigSO config)
        {
            if (config == null || config.dropTable == null || poolManager == null)
                return;

            for (int i = 0; i < config.dropTable.Length; i++)
            {
                var entry = config.dropTable[i];
                if (Random.value <= entry.dropChance)
                {
                    poolManager.Spawn(itemDropPoolId, position);
                }
            }
        }
    }
}
