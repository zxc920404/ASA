using UnityEngine;
using VampireSurvivors.Core;

namespace VampireSurvivors.Gameplay
{
    /// <summary>
    /// 敵人基礎類別 — 實作 IEnemy 介面，負責敵人朝玩家移動、接觸傷害、受傷與死亡邏輯。
    /// 透過 <see cref="EnemyConfigSO"/> 設定敵人屬性，支援難度乘數調整。
    /// </summary>
    [RequireComponent(typeof(Rigidbody2D))]
    [RequireComponent(typeof(Collider2D))]
    public class EnemyBase : MonoBehaviour, IEnemy
    {
        /// <summary>敵人設定檔。</summary>
        [SerializeField] private EnemyConfigSO config;

        /// <summary>追蹤目標（通常為玩家角色）。</summary>
        private Transform target;

        /// <summary>當前生命值。</summary>
        private float currentHP;

        /// <summary>實際傷害（含難度乘數）。</summary>
        private float damage;

        /// <summary>實際移動速度（含難度乘數）。</summary>
        private float moveSpeed;

        /// <summary>接觸傷害冷卻計時器。</summary>
        private float damageCooldown;

        /// <summary>接觸傷害冷卻間隔（秒）。</summary>
        private const float DamageCooldownInterval = 0.5f;

        /// <summary>物件池識別碼，用於回收時識別所屬池。</summary>
        private string poolId;

        /// <summary>物件池管理器參考。</summary>
        private ObjectPoolManager poolManager;

        /// <summary>Rigidbody2D 元件快取。</summary>
        private Rigidbody2D rb;

        /// <summary>敵人是否已死亡。</summary>
        private bool isDead;

        /// <inheritdoc/>
        public EnemyConfigSO Config => config;

        /// <inheritdoc/>
        public float CurrentHP => currentHP;

        /// <summary>
        /// 初始化敵人屬性與相依參考。
        /// </summary>
        /// <param name="enemyConfig">敵人設定檔。</param>
        /// <param name="statMultiplier">難度屬性乘數。</param>
        /// <param name="pool">物件池管理器。</param>
        /// <param name="enemyPoolId">所屬物件池識別碼。</param>
        public void Initialize(EnemyConfigSO enemyConfig, float statMultiplier,
            ObjectPoolManager pool, string enemyPoolId)
        {
            config = enemyConfig;
            currentHP = enemyConfig.baseHP * statMultiplier;
            damage = enemyConfig.baseDamage * statMultiplier;
            moveSpeed = enemyConfig.moveSpeed;
            poolManager = pool;
            poolId = enemyPoolId;
            isDead = false;
            damageCooldown = 0f;

            // 設定精靈圖
            var sr = GetComponent<SpriteRenderer>();
            if (sr != null && enemyConfig.sprite != null)
                sr.sprite = enemyConfig.sprite;
        }

        private void Awake()
        {
            rb = GetComponent<Rigidbody2D>();
            rb.gravityScale = 0f;
            rb.freezeRotation = true;
        }

        private void FixedUpdate()
        {
            if (isDead || target == null) return;

            // 朝玩家方向移動
            Vector2 direction = ((Vector2)target.position - rb.position).normalized;
            rb.MovePosition(rb.position + direction * moveSpeed * Time.fixedDeltaTime);

            // 翻轉精靈圖面朝移動方向
            if (direction.x != 0f)
            {
                Vector3 scale = transform.localScale;
                scale.x = Mathf.Abs(scale.x) * Mathf.Sign(direction.x);
                transform.localScale = scale;
            }
        }

        private void Update()
        {
            if (damageCooldown > 0f)
                damageCooldown -= Time.deltaTime;
        }

        /// <summary>
        /// 碰觸玩家時造成接觸傷害。
        /// </summary>
        private void OnCollisionStay2D(Collision2D collision)
        {
            if (isDead || damageCooldown > 0f) return;

            var player = collision.gameObject.GetComponent<PlayerCharacter>();
            if (player != null)
            {
                player.TakeDamage(damage);
                damageCooldown = DamageCooldownInterval;
            }
        }

        /// <inheritdoc/>
        public void TakeDamage(float damageAmount)
        {
            if (isDead) return;

            currentHP -= damageAmount;

            EventBus.Publish(new EnemyDamagedEvent
            {
                Position = transform.position,
                Damage = damageAmount
            });

            if (currentHP <= 0f)
                Die();
        }

        /// <inheritdoc/>
        public void SetTarget(Transform newTarget)
        {
            target = newTarget;
        }

        /// <inheritdoc/>
        public void ReturnToPool()
        {
            if (poolManager != null && !string.IsNullOrEmpty(poolId))
                poolManager.Despawn(poolId, gameObject);
            else
                gameObject.SetActive(false);
        }

        /// <summary>
        /// 敵人死亡處理：發布 EnemyKilledEvent 並回收至物件池。
        /// </summary>
        private void Die()
        {
            isDead = true;

            EventBus.Publish(new EnemyKilledEvent
            {
                Position = transform.position,
                Config = config
            });

            ReturnToPool();
        }
    }
}
