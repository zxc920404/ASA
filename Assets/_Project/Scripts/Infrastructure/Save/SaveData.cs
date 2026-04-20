using System;

namespace VampireSurvivors.Infrastructure
{
    /// <summary>
    /// 存檔資料結構 — 儲存玩家的永久進度資訊，
    /// 包含金幣、永久升級等級、已解鎖角色與應用程式版本號。
    /// </summary>
    [Serializable]
    public class SaveData
    {
        /// <summary>
        /// 玩家持有的金幣數量。
        /// </summary>
        public int gold;

        /// <summary>
        /// 各項永久升級的等級陣列。
        /// 索引對應：0=最大生命值、1=攻擊力、2=移動速度、3=經驗值獲取、4=拾取範圍。
        /// </summary>
        public int[] permanentUpgradeLevels;

        /// <summary>
        /// 已解鎖角色的 ID 陣列。
        /// </summary>
        public string[] unlockedCharacterIds;

        /// <summary>
        /// 存檔時的應用程式版本號。
        /// </summary>
        public string appVersion;
    }
}
