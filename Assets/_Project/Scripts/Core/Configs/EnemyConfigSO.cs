using UnityEngine;

namespace VampireSurvivors.Core
{
    /// <summary>
    /// 敵人設定檔 — 定義敵人的基礎屬性與掉落表。
    /// </summary>
    [CreateAssetMenu(menuName = "VampireSurvivors/Enemy Config")]
    public class EnemyConfigSO : ScriptableObject
    {
        /// <summary>敵人唯一識別碼。</summary>
        public string enemyId;

        /// <summary>敵人顯示名稱。</summary>
        public string displayName;

        /// <summary>敵人精靈圖。</summary>
        public Sprite sprite;

        /// <summary>基礎生命值。</summary>
        public float baseHP;

        /// <summary>基礎接觸傷害。</summary>
        public float baseDamage;

        /// <summary>移動速度。</summary>
        public float moveSpeed;

        /// <summary>身體碰撞體大小。</summary>
        public float bodySize;

        /// <summary>掉落表。</summary>
        public DropTableEntry[] dropTable;
    }
}
