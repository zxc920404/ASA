using UnityEngine;
using VampireSurvivors.Core;

namespace VampireSurvivors.Gameplay
{
    /// <summary>
    /// 直線投射物元件 — 掛載於投射物預製體上，負責直線飛行、命中偵測與回收。
    /// </summary>
    public class Projectile : MonoBehaviour
    {
        /// <summary>飛行方向。</summary>
        private Vector2 direction;

        /// <summary>飛行速度。</summary>
        private float speed;

        /// <summary>傷害值。</summary>
        private float damage;

        /// <summary>最大飛行距離。</summary>
        private float maxRange;

        /// <summary>物件池識別碼。</summary>
        private string poolId;

        /// <summary>物件池管理器參考。</summary>
        private ObjectPoolManager pool;

        /// <summary>起始位置（用於計算飛行距離）。</summary>
        private Vector2 startPosition;

        /// <summary>
        /// 初始化投射物參數。
        /// </summary>
        public void Initialize(Vector2 dir, float spd, float dmg, float range,
            string poolId, ObjectPoolManager pool)
        {
            direction = dir.normalized;
            speed = spd;
            damage = dmg;
            maxRange = range;
            this.poolId = poolId;
            this.pool = pool;
            startPosition = transform.position;

            // 設定投射物朝向
            float angle = Mathf.Atan2(dir.y, dir.x) * Mathf.Rad2Deg;
            transform.rotation = Quaternion.Euler(0f, 0f, angle);
        }

        private void Update()
        {
            transform.position += (Vector3)(direction * speed * Time.deltaTime);

            // 超出最大飛行距離時回收
            float distSqr = ((Vector2)transform.position - startPosition).sqrMagnitude;
            if (distSqr >= maxRange * maxRange)
            {
                ReturnToPool();
            }
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
                ReturnToPool();
            }
        }

        /// <summary>
        /// 將投射物回收至物件池。
        /// </summary>
        private void ReturnToPool()
        {
            pool.Despawn(poolId, gameObject);
        }
    }
}
