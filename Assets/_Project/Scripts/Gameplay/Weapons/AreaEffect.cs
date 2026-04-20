using UnityEngine;
using VampireSurvivors.Core;

namespace VampireSurvivors.Gameplay
{
    /// <summary>
    /// 範圍特效元件 — 掛載於範圍攻擊特效預製體上，顯示一段時間後自動回收。
    /// 用於大蒜爆炸、鞭擊、閃電等範圍攻擊的視覺效果。
    /// </summary>
    public class AreaEffect : MonoBehaviour
    {
        private float duration;
        private string poolId;
        private ObjectPoolManager pool;
        private float elapsed;

        /// <summary>
        /// 初始化範圍特效參數。
        /// </summary>
        /// <param name="radius">特效顯示半徑。</param>
        /// <param name="dur">特效持續時間（秒）。</param>
        /// <param name="poolId">物件池識別碼。</param>
        /// <param name="pool">物件池管理器。</param>
        public void Initialize(float radius, float dur, string poolId, ObjectPoolManager pool)
        {
            duration = dur;
            this.poolId = poolId;
            this.pool = pool;
            elapsed = 0f;

            // 依據半徑調整特效大小
            transform.localScale = Vector3.one * radius * 2f;
        }

        private void Update()
        {
            elapsed += Time.deltaTime;
            if (elapsed >= duration)
            {
                pool.Despawn(poolId, gameObject);
            }
        }
    }
}
