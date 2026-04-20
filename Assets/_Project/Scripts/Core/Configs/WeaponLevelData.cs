namespace VampireSurvivors.Core
{
    /// <summary>
    /// 武器等級資料 — 定義武器在各等級的屬性數值。
    /// </summary>
    [System.Serializable]
    public struct WeaponLevelData
    {
        /// <summary>該等級的傷害值。</summary>
        public float damage;

        /// <summary>該等級的投射物數量。</summary>
        public int projectileCount;

        /// <summary>該等級的攻擊範圍。</summary>
        public float attackRange;

        /// <summary>該等級的攻擊間隔（秒）。</summary>
        public float attackInterval;
    }
}
