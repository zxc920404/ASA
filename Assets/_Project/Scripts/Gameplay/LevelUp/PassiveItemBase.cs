using UnityEngine;
using VampireSurvivors.Core;

namespace VampireSurvivors.Gameplay
{
    /// <summary>
    /// 被動道具基底類別 — 實作 IPassiveItem，持有設定檔並依等級回傳屬性修正。
    /// </summary>
    public class PassiveItemBase : IPassiveItem
    {
        /// <summary>被動道具設定檔。</summary>
        private readonly PassiveItemConfigSO config;

        /// <summary>當前等級（1 起始）。</summary>
        private int level = 1;

        /// <inheritdoc/>
        public PassiveItemConfigSO Config => config;

        /// <inheritdoc/>
        public int Level => level;

        /// <summary>
        /// 建構被動道具實例。
        /// </summary>
        /// <param name="config">被動道具設定檔。</param>
        public PassiveItemBase(PassiveItemConfigSO config)
        {
            this.config = config;
        }

        /// <inheritdoc/>
        public void LevelUp()
        {
            if (level < config.maxLevel)
                level++;
        }

        /// <inheritdoc/>
        public StatModifier GetModifier()
        {
            if (config.levelModifiers == null || config.levelModifiers.Length == 0)
                return StatModifier.Default;

            int index = Mathf.Clamp(level - 1, 0, config.levelModifiers.Length - 1);
            return config.levelModifiers[index];
        }
    }
}
