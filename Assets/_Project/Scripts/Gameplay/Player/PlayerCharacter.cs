using UnityEngine;
using VampireSurvivors.Core;

namespace VampireSurvivors.Gameplay
{
    /// <summary>
    /// 玩家角色 — 實作 IPlayerCharacter 介面，負責角色移動、受傷、死亡與屬性加成邏輯。
    /// 角色面朝最近敵人方向（朝向與移動方向獨立），並受地圖邊界限制。
    /// </summary>
    public class PlayerCharacter : MonoBehaviour, IPlayerCharacter
    {
        /// <summary>角色設定檔。</summary>
        [SerializeField] private CharacterConfigSO config;

        /// <summary>地圖邊界（x = 半寬, y = 半高）。</summary>
        [SerializeField] private Vector2 mapBounds = new Vector2(50f, 50f);

        /// <summary>搜尋最近敵人的偵測半徑。</summary>
        [SerializeField] private float enemyDetectionRadius = 20f;

        /// <summary>敵人所在的物理層。</summary>
        [SerializeField] private LayerMask enemyLayer;

        /// <summary>當前生命值。</summary>
        private float currentHP;

        /// <summary>最大生命值（含加成）。</summary>
        private float maxHP;

        /// <summary>移動速度（含加成）。</summary>
        private float moveSpeed;

        /// <summary>攻擊力（含加成）。</summary>
        private float attackPower;

        /// <summary>拾取範圍（含加成）。</summary>
        private float pickupRange;

        /// <summary>角色是否已死亡。</summary>
        private bool isDead;

        /// <inheritdoc/>
        public CharacterConfigSO Config => config;

        /// <inheritdoc/>
        public float CurrentHP => currentHP;

        /// <inheritdoc/>
        public float MaxHP => maxHP;

        /// <summary>角色攻擊力（含永久升級加成）。</summary>
        public float AttackPower => attackPower;

        /// <summary>角色拾取範圍（含永久升級加成）。</summary>
        public float PickupRange => pickupRange;

        /// <summary>角色移動速度（含永久升級加成）。</summary>
        public float MoveSpeed => moveSpeed;

        /// <summary>
        /// 使用指定設定檔初始化角色屬性。
        /// </summary>
        /// <param name="characterConfig">角色設定檔。</param>
        public void Initialize(CharacterConfigSO characterConfig)
        {
            config = characterConfig;
            maxHP = config.baseHP;
            currentHP = maxHP;
            moveSpeed = config.baseMoveSpeed;
            attackPower = config.baseAttackPower;
            pickupRange = config.basePickupRange;
            isDead = false;
        }

        /// <summary>
        /// 每幀更新：面朝最近敵人方向。
        /// </summary>
        private void Update()
        {
            if (!isDead)
            {
                FaceNearestEnemy();
            }
        }

        /// <inheritdoc/>
        /// <summary>
        /// 依據輸入方向與移動速度移動角色，並限制在地圖邊界內。
        /// </summary>
        public void Move(Vector2 direction)
        {
            if (isDead) return;

            Vector3 movement = new Vector3(direction.x, direction.y, 0f) * moveSpeed * Time.deltaTime;
            transform.position += movement;

            // 限制在地圖邊界內
            Vector3 clampedPos = transform.position;
            clampedPos.x = Mathf.Clamp(clampedPos.x, -mapBounds.x, mapBounds.x);
            clampedPos.y = Mathf.Clamp(clampedPos.y, -mapBounds.y, mapBounds.y);
            transform.position = clampedPos;
        }

        /// <inheritdoc/>
        /// <summary>
        /// 對角色造成傷害，發布 PlayerDamagedEvent。HP 歸零時觸發死亡。
        /// </summary>
        public void TakeDamage(float damage)
        {
            if (isDead) return;

            currentHP -= damage;
            if (currentHP < 0f)
                currentHP = 0f;

            EventBus.Publish(new PlayerDamagedEvent
            {
                Damage = damage,
                RemainingHP = currentHP
            });

            if (currentHP <= 0f)
            {
                Die();
            }
        }

        /// <inheritdoc/>
        /// <summary>
        /// 套用屬性修正乘數（來自被動道具或永久升級）。
        /// </summary>
        public void ApplyStatModifier(StatModifier modifier)
        {
            maxHP *= modifier.maxHPMultiplier;
            attackPower *= modifier.attackPowerMultiplier;
            moveSpeed *= modifier.moveSpeedMultiplier;
            pickupRange *= modifier.pickupRangeMultiplier;

            // 套用最大生命值加成後，等比例調整當前生命值
            currentHP = Mathf.Min(currentHP, maxHP);
        }

        /// <summary>
        /// 面朝最近敵人方向。使用 Physics2D.OverlapCircle 搜尋附近敵人。
        /// 朝向與移動方向獨立。
        /// </summary>
        private void FaceNearestEnemy()
        {
            Collider2D[] hits = Physics2D.OverlapCircleAll(
                transform.position, enemyDetectionRadius, enemyLayer);

            if (hits.Length == 0) return;

            float closestDist = float.MaxValue;
            Vector2 closestDir = Vector2.right;

            for (int i = 0; i < hits.Length; i++)
            {
                Vector2 dir = (Vector2)hits[i].transform.position - (Vector2)transform.position;
                float dist = dir.sqrMagnitude;
                if (dist < closestDist)
                {
                    closestDist = dist;
                    closestDir = dir;
                }
            }

            if (closestDir != Vector2.zero)
            {
                // 透過 localScale.x 翻轉精靈圖來表示面朝方向
                float sign = Mathf.Sign(closestDir.x);
                if (sign != 0f)
                {
                    Vector3 scale = transform.localScale;
                    scale.x = Mathf.Abs(scale.x) * sign;
                    transform.localScale = scale;
                }
            }
        }

        /// <summary>
        /// 角色死亡處理：發布 GameOverEvent。
        /// </summary>
        private void Die()
        {
            isDead = true;

            EventBus.Publish(new GameOverEvent
            {
                SurvivalTime = Time.timeSinceLevelLoad,
                KillCount = 0, // 由 GameManager 追蹤實際擊殺數
                Gold = 0       // 由 GameManager 計算實際金幣
            });
        }
    }
}
