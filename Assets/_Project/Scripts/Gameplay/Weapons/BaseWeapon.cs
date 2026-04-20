using System.Collections.Generic;
using UnityEngine;
using VampireSurvivors.Core;

namespace VampireSurvivors.Gameplay
{
    /// <summary>
    /// 武器抽象基底類別 — 提供所有武器共用的等級管理、計時器與進化判定邏輯。
    /// 具體武器繼承此類別並實作 <see cref="OnAttack"/> 方法。
    /// </summary>
    public abstract class BaseWeapon : IWeapon
    {
        /// <summary>武器設定檔。</summary>
        protected readonly WeaponConfigSO config;

        /// <summary>物件池管理器參考。</summary>
        protected readonly ObjectPoolManager poolManager;

        /// <summary>當前武器等級（1 起始）。</summary>
        protected int level = 1;

        /// <inheritdoc/>
        public WeaponConfigSO Config => config;

        /// <inheritdoc/>
        public int Level => level;

        /// <summary>
        /// 取得當前等級的武器屬性資料。
        /// </summary>
        protected WeaponLevelData CurrentLevelData
        {
            get
            {
                if (config.levelData == null || config.levelData.Length == 0)
                    return new WeaponLevelData
                    {
                        damage = config.baseDamage,
                        projectileCount = 1,
                        attackRange = config.attackRange,
                        attackInterval = config.attackInterval
                    };

                int index = Mathf.Clamp(level - 1, 0, config.levelData.Length - 1);
                return config.levelData[index];
            }
        }

        /// <summary>
        /// 建構武器基底實例。
        /// </summary>
        /// <param name="config">武器設定檔。</param>
        /// <param name="poolManager">物件池管理器。</param>
        protected BaseWeapon(WeaponConfigSO config, ObjectPoolManager poolManager)
        {
            this.config = config;
            this.poolManager = poolManager;
        }

        /// <inheritdoc/>
        public void Attack(Vector2 origin, Vector2 direction)
        {
            OnAttack(origin, direction);
            EventBus.Publish(new WeaponAttackEvent { WeaponId = config.weaponId });
        }

        /// <inheritdoc/>
        public void LevelUp()
        {
            if (level < config.maxLevel)
                level++;
        }

        /// <inheritdoc/>
        public bool CanEvolve(IReadOnlyList<IPassiveItem> passives)
        {
            if (level < config.maxLevel) return false;
            if (string.IsNullOrEmpty(config.evolutionPassiveId)) return false;
            if (config.evolvedWeaponConfig == null) return false;

            for (int i = 0; i < passives.Count; i++)
            {
                if (passives[i].Config.passiveId == config.evolutionPassiveId)
                    return true;
            }
            return false;
        }

        /// <summary>
        /// 使用進化後的武器設定檔建立新武器實例並發布進化事件。
        /// 子類別可覆寫此方法以提供自訂的進化邏輯。
        /// </summary>
        /// <returns>進化後的武器實例；若無進化設定則回傳 null。</returns>
        public virtual IWeapon Evolve()
        {
            if (config.evolvedWeaponConfig == null)
                return null;

            var evolved = WeaponEvolutionHelper.CreateWeaponFromConfig(config.evolvedWeaponConfig, poolManager);
            if (evolved != null)
            {
                EventBus.Publish(new WeaponEvolvedEvent { WeaponId = config.evolvedWeaponConfig.weaponId });
            }
            return evolved;
        }

        /// <summary>
        /// 子類別實作的具體攻擊邏輯。
        /// </summary>
        /// <param name="origin">攻擊起始位置。</param>
        /// <param name="direction">攻擊方向（朝向最近敵人）。</param>
        protected abstract void OnAttack(Vector2 origin, Vector2 direction);
    }
}
