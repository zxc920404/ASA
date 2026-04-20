using UnityEngine;
using VampireSurvivors.Core;

namespace VampireSurvivors.Gameplay
{
    /// <summary>
    /// 經驗寶石 — 碰觸玩家時發布 XPCollectedEvent 並回收至物件池。
    /// </summary>
    [RequireComponent(typeof(Collider2D))]
    public class XPGem : MonoBehaviour
    {
        /// <summary>本顆寶石提供的經驗值。</summary>
        private float xpAmount;

        /// <summary>物件池管理器參考。</summary>
        private ObjectPoolManager poolManager;

        /// <summary>所屬物件池識別碼。</summary>
        private string poolId;

        /// <summary>
        /// 初始化經驗寶石屬性。
        /// </summary>
        /// <param name="amount">經驗值數量。</param>
        /// <param name="pool">物件池管理器。</param>
        /// <param name="gemPoolId">所屬物件池識別碼。</param>
        public void Initialize(float amount, ObjectPoolManager pool, string gemPoolId)
        {
            xpAmount = amount;
            poolManager = pool;
            poolId = gemPoolId;
        }

        /// <summary>
        /// 碰觸玩家時發布 XPCollectedEvent 並回收至物件池。
        /// </summary>
        private void OnTriggerEnter2D(Collider2D other)
        {
            var player = other.GetComponent<PlayerCharacter>();
            if (player == null) return;

            EventBus.Publish(new XPCollectedEvent { Amount = xpAmount });

            if (poolManager != null && !string.IsNullOrEmpty(poolId))
                poolManager.Despawn(poolId, gameObject);
            else
                gameObject.SetActive(false);
        }
    }
}
