using UnityEngine;
using VampireSurvivors.Core;

namespace VampireSurvivors.Gameplay
{
    /// <summary>
    /// 環繞武器（如聖經） — 投射物環繞角色旋轉，持續對接觸的敵人造成傷害。
    /// 投射物從 Object Pool 取出，環繞一定時間後回收。
    /// </summary>
    public class OrbitWeapon : BaseWeapon
    {
        /// <summary>環繞旋轉速度（度/秒）。</summary>
        private const float OrbitSpeed = 180f;

        /// <summary>環繞持續時間（秒）。</summary>
        private const float OrbitDuration = 3f;

        /// <summary>
        /// 建構環繞武器。
        /// </summary>
        /// <param name="config">武器設定檔。</param>
        /// <param name="poolManager">物件池管理器。</param>
        public OrbitWeapon(WeaponConfigSO config, ObjectPoolManager poolManager)
            : base(config, poolManager) { }

        /// <inheritdoc/>
        protected override void OnAttack(Vector2 origin, Vector2 direction)
        {
            var data = CurrentLevelData;
            float angleStep = 360f / data.projectileCount;

            for (int i = 0; i < data.projectileCount; i++)
            {
                float angle = i * angleStep;
                Vector2 offset = new Vector2(
                    Mathf.Cos(angle * Mathf.Deg2Rad),
                    Mathf.Sin(angle * Mathf.Deg2Rad)
                ) * data.attackRange;

                var obj = poolManager.Spawn(config.weaponId, origin + offset);
                var orbit = obj.GetComponent<OrbitProjectile>();
                if (orbit != null)
                {
                    orbit.Initialize(origin, data.attackRange, OrbitSpeed, angle,
                        data.damage, OrbitDuration, config.weaponId, poolManager);
                }
            }
        }
    }
}
