using UnityEngine;
using VampireSurvivors.Core;

namespace VampireSurvivors.Gameplay
{
    /// <summary>
    /// 追蹤投射物武器（如魔杖） — 發射會自動追蹤最近敵人的投射物。
    /// 投射物從 Object Pool 取出，命中後回收。
    /// </summary>
    public class HomingProjectileWeapon : BaseWeapon
    {
        /// <summary>投射物飛行速度。</summary>
        private const float ProjectileSpeed = 8f;

        /// <summary>投射物最大存活時間（秒）。</summary>
        private const float MaxLifetime = 4f;

        /// <summary>敵人所在的物理層。</summary>
        private readonly LayerMask enemyLayer;

        /// <summary>
        /// 建構追蹤投射物武器。
        /// </summary>
        /// <param name="config">武器設定檔。</param>
        /// <param name="poolManager">物件池管理器。</param>
        /// <param name="enemyLayer">敵人物理層遮罩。</param>
        public HomingProjectileWeapon(WeaponConfigSO config, ObjectPoolManager poolManager, LayerMask enemyLayer)
            : base(config, poolManager)
        {
            this.enemyLayer = enemyLayer;
        }

        /// <inheritdoc/>
        protected override void OnAttack(Vector2 origin, Vector2 direction)
        {
            var data = CurrentLevelData;

            for (int i = 0; i < data.projectileCount; i++)
            {
                // 隨機初始方向增加視覺多樣性
                float randomAngle = Random.Range(0f, 360f);
                Vector2 dir = new Vector2(
                    Mathf.Cos(randomAngle * Mathf.Deg2Rad),
                    Mathf.Sin(randomAngle * Mathf.Deg2Rad)
                );

                var obj = poolManager.Spawn(config.weaponId, origin);
                var homing = obj.GetComponent<HomingProjectile>();
                if (homing != null)
                {
                    homing.Initialize(dir, ProjectileSpeed, data.damage, MaxLifetime,
                        data.attackRange, enemyLayer, config.weaponId, poolManager);
                }
            }
        }
    }
}
