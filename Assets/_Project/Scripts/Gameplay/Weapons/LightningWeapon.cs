using UnityEngine;
using VampireSurvivors.Core;

namespace VampireSurvivors.Gameplay
{
    /// <summary>
    /// 閃電武器 — 隨機打擊攻擊範圍內的敵人，可連鎖打擊多個目標。
    /// 每次攻擊依據投射物數量決定打擊次數。
    /// </summary>
    public class LightningWeapon : BaseWeapon
    {
        /// <summary>敵人所在的物理層。</summary>
        private readonly LayerMask enemyLayer;

        /// <summary>
        /// 建構閃電武器。
        /// </summary>
        /// <param name="config">武器設定檔。</param>
        /// <param name="poolManager">物件池管理器。</param>
        /// <param name="enemyLayer">敵人物理層遮罩。</param>
        public LightningWeapon(WeaponConfigSO config, ObjectPoolManager poolManager, LayerMask enemyLayer)
            : base(config, poolManager)
        {
            this.enemyLayer = enemyLayer;
        }

        /// <inheritdoc/>
        protected override void OnAttack(Vector2 origin, Vector2 direction)
        {
            var data = CurrentLevelData;

            var hits = Physics2D.OverlapCircleAll(origin, data.attackRange, enemyLayer);
            if (hits.Length == 0) return;

            int strikeCount = Mathf.Min(data.projectileCount, hits.Length);

            // 隨機選擇不重複的目標
            for (int i = 0; i < strikeCount; i++)
            {
                // Fisher-Yates 部分洗牌
                int randomIndex = Random.Range(i, hits.Length);
                (hits[i], hits[randomIndex]) = (hits[randomIndex], hits[i]);

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

                // 生成閃電特效
                if (config.projectilePrefab != null)
                {
                    var vfx = poolManager.Spawn(config.weaponId, hits[i].transform.position);
                    var areaVfx = vfx.GetComponent<AreaEffect>();
                    if (areaVfx != null)
                    {
                        areaVfx.Initialize(0.5f, 0.3f, config.weaponId, poolManager);
                    }
                }
            }
        }
    }
}
