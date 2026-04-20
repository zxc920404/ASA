using UnityEngine;
using VampireSurvivors.Core;

namespace VampireSurvivors.Gameplay
{
    /// <summary>
    /// 鞭擊武器 — 近距離橫掃攻擊，對角色前方扇形範圍內的敵人造成傷害。
    /// 使用 Physics2D.OverlapCircleAll 搭配方向判定實現扇形攻擊。
    /// </summary>
    public class WhipWeapon : BaseWeapon
    {
        /// <summary>鞭擊扇形角度（度）。</summary>
        private const float SwingAngle = 120f;

        /// <summary>敵人所在的物理層。</summary>
        private readonly LayerMask enemyLayer;

        /// <summary>
        /// 建構鞭擊武器。
        /// </summary>
        /// <param name="config">武器設定檔。</param>
        /// <param name="poolManager">物件池管理器。</param>
        /// <param name="enemyLayer">敵人物理層遮罩。</param>
        public WhipWeapon(WeaponConfigSO config, ObjectPoolManager poolManager, LayerMask enemyLayer)
            : base(config, poolManager)
        {
            this.enemyLayer = enemyLayer;
        }

        /// <inheritdoc/>
        protected override void OnAttack(Vector2 origin, Vector2 direction)
        {
            if (direction == Vector2.zero)
                direction = Vector2.right;

            var data = CurrentLevelData;
            float halfAngle = SwingAngle * 0.5f;

            var hits = Physics2D.OverlapCircleAll(origin, data.attackRange, enemyLayer);
            int hitCount = 0;

            for (int i = 0; i < hits.Length; i++)
            {
                Vector2 toEnemy = (Vector2)hits[i].transform.position - origin;
                float angle = Vector2.Angle(direction, toEnemy);

                if (angle <= halfAngle)
                {
                    var enemy = hits[i].GetComponent<IEnemy>();
                    if (enemy != null)
                    {
                        enemy.TakeDamage(data.damage);
                        EventBus.Publish(new EnemyDamagedEvent
                        {
                            Position = hits[i].transform.position,
                            Damage = data.damage
                        });
                        hitCount++;
                    }
                }
            }

            // 生成鞭擊特效
            if (config.projectilePrefab != null)
            {
                var vfx = poolManager.Spawn(config.weaponId, origin);
                var areaVfx = vfx.GetComponent<AreaEffect>();
                if (areaVfx != null)
                {
                    areaVfx.Initialize(data.attackRange, 0.3f, config.weaponId, poolManager);
                }
            }
        }
    }
}
