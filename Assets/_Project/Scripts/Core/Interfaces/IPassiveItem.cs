namespace VampireSurvivors.Core
{
    /// <summary>
    /// 被動道具介面 — 定義被動道具的核心行為，
    /// 被動道具可提供屬性加成並影響武器進化條件。
    /// </summary>
    public interface IPassiveItem
    {
        /// <summary>被動道具的 ScriptableObject 設定檔。</summary>
        PassiveItemConfigSO Config { get; }

        /// <summary>被動道具當前等級（最高 8 級）。</summary>
        int Level { get; }

        /// <summary>
        /// 取得此被動道具提供的屬性修正。
        /// </summary>
        /// <returns>屬性修正資料。</returns>
        StatModifier GetModifier();

        /// <summary>提升被動道具等級，強化屬性加成。</summary>
        void LevelUp();
    }
}
