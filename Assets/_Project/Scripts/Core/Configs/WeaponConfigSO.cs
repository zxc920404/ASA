using UnityEngine;

namespace VampireSurvivors.Core
{
    /// <summary>
    /// 武器設定檔 — 定義武器的基礎屬性、等級資料與進化配方。
    /// </summary>
    [CreateAssetMenu(menuName = "VampireSurvivors/Weapon Config")]
    public class WeaponConfigSO : ScriptableObject
    {
        /// <summary>武器唯一識別碼。</summary>
        public string weaponId;

        /// <summary>武器顯示名稱。</summary>
        public string displayName;

        /// <summary>武器圖示。</summary>
        public Sprite icon;

        /// <summary>投射物預製體。</summary>
        public GameObject projectilePrefab;

        /// <summary>基礎傷害值。</summary>
        public float baseDamage;

        /// <summary>攻擊間隔（秒）。</summary>
        public float attackInterval;

        /// <summary>攻擊範圍。</summary>
        public float attackRange;

        /// <summary>最高等級。</summary>
        public int maxLevel;

        /// <summary>各等級的屬性資料。</summary>
        public WeaponLevelData[] levelData;

        /// <summary>進化所需被動道具的識別碼。</summary>
        public string evolutionPassiveId;

        /// <summary>進化後的武器設定檔。</summary>
        public WeaponConfigSO evolvedWeaponConfig;
    }
}
