using UnityEngine;
using VampireSurvivors.Core;

namespace VampireSurvivors.Gameplay
{
    /// <summary>
    /// 環繞投射物元件 — 掛載於環繞投射物預製體上，繞指定中心點旋轉。
    /// </summary>
    public class OrbitProjectile : MonoBehaviour
    {
        private Vector2 center;
        private float radius;
        private float orbitSpeed;
        private float currentAngle;
        private float damage;
        private float duration;
        private string poolId;
        private ObjectPoolManager pool;
        private float elapsed;

        /// <summary>
        /// 初始化環繞投射物參數。
        /// </summary>
        public void Initialize(Vector2 center, float radius, float speed, float startAngle,
            float dmg, float dur, string poolId, ObjectPoolManager pool)
        {
            this.center = center;
            this.radius = radius;
            orbitSpeed = speed;
            currentAngle = startAngle;
            damage = dmg;
            duration = dur;
            this.poolId = poolId;
            this.pool = pool;
            elapsed = 0f;
        }

        /// <summary>
        /// 更新環繞中心點（跟隨玩家移動）。
        /// </summary>
        public void UpdateCenter(Vector2 newCenter)
        {
            center = newCenter;
        }

        private void Update()
        {
            elapsed += Time.deltaTime;
            if (elapsed >= duration)
            {
                pool.Despawn(poolId, gameObject);
                return;
            }

            currentAngle += orbitSpeed * Time.deltaTime;
            Vector2 offset = new Vector2(
                Mathf.Cos(currentAngle * Mathf.Deg2Rad),
                Mathf.Sin(currentAngle * Mathf.Deg2Rad)
            ) * radius;

            transform.position = (Vector3)(center + offset);
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            var enemy = other.GetComponent<IEnemy>();
            if (enemy != null)
            {
                enemy.TakeDamage(damage);
                EventBus.Publish(new EnemyDamagedEvent
                {
                    Position = other.transform.position,
                    Damage = damage
                });
            }
            // 環繞投射物命中後不回收，持續旋轉直到持續時間結束
        }
    }
}
