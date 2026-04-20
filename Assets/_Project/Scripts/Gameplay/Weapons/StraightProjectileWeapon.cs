using UnityEngine;
using VampireSurvivors.Core;

namespace VampireSurvivors.Gameplay
{
    /// <summary>
    /// 直線投射武器（如飛刀） — 朝最近敵人方向發射直線飛行的投射物。
    /// 投射物從 Object Pool 取出，命中或超出範圍後回收。
    /// </summary>
    public class StraightProjectileWeapon : BaseWeapon
    {
        /// <summary>投射物飛行速度。</summary>
        private const float ProjectileSpeed = 12f;

        /// <summary>
        /// 建構直線投射武器。
        /// </summary>
        /// <param name="config">武器設定檔。</param>
        /// <param name="poolManager">物件池管理器。</param>
        public StraightProjectileWeapon(WeaponConfigSO config, ObjectPoolManager poolManager)
            : base(config, poolManager) { }

        /// <inheritdoc/>
        protected override void OnAttack(Vector2 origin, Vector2 direction)
        {
            if (direction == Vector2.zero)
                direction = Vector2.right;

            var data = CurrentLevelData;
            float angleStep = data.projectileCount > 1 ? 15f : 0f;
            float startAngle = -(data.projectileCount - 1) * angleStep * 0.5f;

            for (int i = 0; i < data.projectileCount; i++)
            {
                float angle = startAngle + i * angleStep;
                Vector2 dir = Rotate(direction.normalized, angle);

                var obj = poolManager.Spawn(config.weaponId, origin);
                var proj = obj.GetComponent<Projectile>();
                if (proj != null)
                {
                    proj.Initialize(dir, ProjectileSpeed, data.damage, data.attackRange, config.weaponId, poolManager);
                }
            }
        }

        /// <summary>
        /// 將向量旋轉指定角度。
        /// </summary>
        private static Vector2 Rotate(Vector2 v, float degrees)
        {
            float rad = degrees * Mathf.Deg2Rad;
            float cos = Mathf.Cos(rad);
            float sin = Mathf.Sin(rad);
            return new Vector2(v.x * cos - v.y * sin, v.x * sin + v.y * cos);
        }
    }
}
