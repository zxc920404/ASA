namespace VampireSurvivors.Gameplay
{
    using VampireSurvivors.Core;

    /// <summary>
    /// 升級選項類型列舉。
    /// </summary>
    public enum UpgradeType
    {
        /// <summary>獲取新武器。</summary>
        NewWeapon,
        /// <summary>升級已有武器。</summary>
        WeaponUpgrade,
        /// <summary>獲取新被動道具。</summary>
        NewPassive,
        /// <summary>升級已有被動道具。</summary>
        PassiveUpgrade
    }

    /// <summary>
    /// 升級選項資料結構 — 描述一個可供玩家選擇的升級項目。
    /// </summary>
    public class UpgradeOption
    {
        /// <summary>升級類型。</summary>
        public UpgradeType Type;

        /// <summary>武器設定檔（NewWeapon / WeaponUpgrade 時使用）。</summary>
        public WeaponConfigSO WeaponConfig;

        /// <summary>被動道具設定檔（NewPassive / PassiveUpgrade 時使用）。</summary>
        public PassiveItemConfigSO PassiveConfig;

        /// <summary>已有裝備的索引（升級時使用）。</summary>
        public int TargetIndex;
    }
}
