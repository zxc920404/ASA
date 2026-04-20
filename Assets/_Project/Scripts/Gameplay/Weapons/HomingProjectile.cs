using UnityEngine;
using VampireSurvivors.Core;

namespace VampireSurvivors.Gameplay
{
    /// <summary>
    /// 追蹤投射物元件 — 掛載於追蹤投射物預製體上，自動追蹤最近敵人。
    /// </summary>
    public class HomingProjectile : MonoBehaviour
    {
        /// <summary>追蹤轉向速度（度/秒）。</summary>
        private const float TurnSpeed = 360f;

        private Vector2 direction;
        private float speed;
        private float damage;
        private float lifetime;
        private float detectRange;
        private LayerMask enemyLayer;
        private string poolId;
        private ObjectPoolManager pool;
        private float elapsed;

        /// <summary>
        /// 初始化追蹤投射物參數。
        /// </summary>
        public void Initialize(Vector2 dir, float spd, float dmg, float life,
            float range, LayerMask layer, string poolId, ObjectPoolManager pool)
        {
            direction = dir.normalized;
            speed = spd;
            damage = dmg;
            lifetime = life;
            detectRange = range;
            enemyLayer = layer;
            this.poolId = poolId;
            this.pool = pool;
            elapsed = 0f;
        }

        private void Update()
        {
            elapsed += Time.deltaTime;
            if (elapsed >= lifetime)
            {
                ReturnToPool();
                return;
            }

            // 搜尋最近敵人並追蹤
            var target = FindNearestEnemy();
            if (target != null)
            {
                Vector2 toTarget = ((Vector2)target.position - (Vector2)transform.position).normalized;
                float step = TurnSpeed * Time.deltaTime;
                direction = Vector3.RotateTowards(direction, toTarget, step * Mathf.Deg2Rad, 0f);
            }

            transform.position += (Vector3)(direction * speed * Time.deltaTime);

            float angle = Mathf.Atan2(direction.y, direction.x) * Mathf.Rad2Deg;
            transform.rotation = Quaternion.Euler(0f, 0f, angle);
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
        /// 搜尋偵測範圍內最近的敵人。
        /// </summary>
        private Transform FindNearestEnemy()
        {
            var hits = Physics2D.OverlapCircleAll(transform.position, detectRange, enemyLayer);
            if (hits.Length == 0) return null;

            float closestDist = float.MaxValue;
            Transform closest = null;

            for (int i = 0; i < hits.Length; i++)
            {
                float dist = ((Vector2)hits[i].transform.position - (Vector2)transform.position).sqrMagnitude;
                if (dist < closestDist)
                {
                    closestDist = dist;
                    closest = hits[i].transform;
                }
            }
            return closest;
        }

        private void ReturnToPool()
        {
            pool.Despawn(poolId, gameObject);
        }
    }
}
