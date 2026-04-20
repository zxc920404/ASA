using UnityEngine;
using VampireSurvivors.Core;

namespace VampireSurvivors.Gameplay
{
    /// <summary>
    /// 範圍爆炸武器（如大蒜） — 以角色為中心對周圍範圍內所有敵人造成傷害。
    /// 使用 Physics2D.OverlapCircleAll 偵測範圍內敵人。
    /// </summary>
    public class AreaExplosionWeapon : BaseWeapon
    {
        /// <summary>敵人所在的物理層。</summary>
        private readonly LayerMask enemyLayer;

        /// <summary>
        /// 建構範圍爆炸武器。
        /// </summary>
        /// <param name="config">武器設定檔。</param>
        /// <param name="poolManager">物件池管理器。</param>
        /// <param name="enemyLayer">敵人物理層遮罩。</param>
        public AreaExplosionWeapon(WeaponConfigSO config, ObjectPoolManager poolManager, LayerMask enemyLayer)
            : base(config, poolManager)
        {
            this.enemyLayer = enemyLayer;
        }

        /// <inheritdoc/>
        protected override void OnAttack(Vector2 origin, Vector2 direction)
        {
            var data = CurrentLevelData;

            // 偵測範圍內所有敵人
            var hits = Physics2D.OverlapCircleAll(origin, data.attackRange, enemyLayer);
            for (int i = 0; i < hits.Length; i++)
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
                }
            }

            // 生成爆炸特效（若有設定投射物預製體）
            if (config.projectilePrefab != null)
            {
                var vfx = poolManager.Spawn(config.weaponId, origin);
                var areaVfx = vfx.GetComponent<AreaEffect>();
                if (areaVfx != null)
                {
                    areaVfx.Initialize(data.attackRange, 0.5f, config.weaponId, poolManager);
                }
            }
        }
    }
}
