namespace VampireSurvivors.Core
{
    /// <summary>
    /// 屬性修正結構體 — 用於表示被動道具或永久升級對角色屬性的加成。
    /// 各欄位為乘數加成（1.0 表示無加成）。
    /// </summary>
    [System.Serializable]
    public struct StatModifier
    {
        /// <summary>最大生命值加成乘數。</summary>
        public float maxHPMultiplier;

        /// <summary>攻擊力加成乘數。</summary>
        public float attackPowerMultiplier;

        /// <summary>移動速度加成乘數。</summary>
        public float moveSpeedMultiplier;

        /// <summary>經驗值獲取加成乘數。</summary>
        public float xpGainMultiplier;

        /// <summary>拾取範圍加成乘數。</summary>
        public float pickupRangeMultiplier;

        /// <summary>
        /// 建立預設的屬性修正（所有乘數為 1.0，即無加成）。
        /// </summary>
        public static StatModifier Default => new StatModifier
        {
            maxHPMultiplier = 1f,
            attackPowerMultiplier = 1f,
            moveSpeedMultiplier = 1f,
            xpGainMultiplier = 1f,
            pickupRangeMultiplier = 1f
        };
    }
}
