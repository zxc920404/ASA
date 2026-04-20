using UnityEngine;

namespace VampireSurvivors.Core
{
    /// <summary>
    /// 被動道具設定檔 — 定義被動道具的基礎屬性與各等級修正值。
    /// </summary>
    [CreateAssetMenu(menuName = "VampireSurvivors/Passive Item Config")]
    public class PassiveItemConfigSO : ScriptableObject
    {
        /// <summary>被動道具唯一識別碼。</summary>
        public string passiveId;

        /// <summary>被動道具顯示名稱。</summary>
        public string displayName;

        /// <summary>被動道具圖示。</summary>
        public Sprite icon;

        /// <summary>各等級的屬性修正值。</summary>
        public StatModifier[] levelModifiers;

        /// <summary>最高等級。</summary>
        public int maxLevel;
    }
}
