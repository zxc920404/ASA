using System;
using UnityEngine;
using VampireSurvivors.Core;

namespace VampireSurvivors.Gameplay
{
    /// <summary>
    /// 永久升級系統 — 管理 Meta 進度，包含金幣獎勵計算、
    /// 5 種永久升級屬性的購買與合併 StatModifier 輸出。
    /// </summary>
    public class PermanentUpgradeSystem : MonoBehaviour
    {
        /// <summary>永久升級定義（5 種屬性）。</summary>
        [SerializeField] private PermanentUpgradeEntry[] upgrades = new PermanentUpgradeEntry[]
        {
            new() { name = "最大生命值", maxLevel = 10, baseCost = 50, costPerLevel = 25 },
            new() { name = "攻擊力",     maxLevel = 10, baseCost = 50, costPerLevel = 25 },
            new() { name = "移動速度",   maxLevel = 10, baseCost = 50, costPerLevel = 25 },
            new() { name = "經驗值獲取", maxLevel = 10, baseCost = 50, costPerLevel = 25 },
            new() { name = "拾取範圍",   maxLevel = 10, baseCost = 50, costPerLevel = 25 },
        };

        /// <summary>每級加成比例（乘數增量）。</summary>
        [SerializeField] private float bonusPerLevel = 0.1f;

        /// <summary>玩家持有金幣。</summary>
        private int gold;

        /// <summary>玩家持有金幣（唯讀）。</summary>
        public int Gold => gold;

        /// <summary>永久升級數量。</summary>
        public int UpgradeCount => upgrades.Length;

        /// <summary>
        /// 設定玩家金幣數量（從存檔載入時使用）。
        /// </summary>
        public void SetGold(int amount) => gold = Mathf.Max(0, amount);

        /// <summary>
        /// 增加金幣。
        /// </summary>
        public void AddGold(int amount) => gold += Mathf.Max(0, amount);

        /// <summary>
        /// 取得指定升級的當前等級。
        /// </summary>
        public int GetUpgradeLevel(int upgradeIndex)
        {
            if (upgradeIndex < 0 || upgradeIndex >= upgrades.Length) return 0;
            return upgrades[upgradeIndex].currentLevel;
        }

        /// <summary>
        /// 設定指定升級的等級（從存檔載入時使用）。
        /// </summary>
        public void SetUpgradeLevel(int upgradeIndex, int level)
        {
            if (upgradeIndex < 0 || upgradeIndex >= upgrades.Length) return;
            upgrades[upgradeIndex].currentLevel = Mathf.Clamp(level, 0, upgrades[upgradeIndex].maxLevel);
        }

        /// <summary>
        /// 取得指定升級的購買費用。
        /// </summary>
        public int GetUpgradeCost(int upgradeIndex)
        {
            if (upgradeIndex < 0 || upgradeIndex >= upgrades.Length) return int.MaxValue;
            var entry = upgrades[upgradeIndex];
            if (entry.currentLevel >= entry.maxLevel) return int.MaxValue;
            return entry.baseCost + entry.costPerLevel * entry.currentLevel;
        }

        /// <summary>
        /// 取得指定升級的名稱。
        /// </summary>
        public string GetUpgradeName(int upgradeIndex)
        {
            if (upgradeIndex < 0 || upgradeIndex >= upgrades.Length) return string.Empty;
            return upgrades[upgradeIndex].name;
        }

        /// <summary>
        /// 計算金幣獎勵：floor(存活時間 × 0.5) + 擊殺數。
        /// </summary>
        /// <param name="survivalTime">存活時間（秒）。</param>
        /// <param name="killCount">擊殺數。</param>
        /// <returns>金幣獎勵數量。</returns>
        public static int CalculateGoldReward(float survivalTime, int killCount)
        {
            return Mathf.FloorToInt(survivalTime * 0.5f) + killCount;
        }

        /// <summary>
        /// 購買指定永久升級。金幣不足或已達最高等級時回傳 false。
        /// </summary>
        /// <param name="upgradeIndex">升級索引（0~4）。</param>
        /// <returns>是否購買成功。</returns>
        public bool PurchaseUpgrade(int upgradeIndex)
        {
            if (upgradeIndex < 0 || upgradeIndex >= upgrades.Length) return false;

            var entry = upgrades[upgradeIndex];
            if (entry.currentLevel >= entry.maxLevel) return false;

            int cost = GetUpgradeCost(upgradeIndex);
            if (gold < cost) return false;

            gold -= cost;
            entry.currentLevel++;
            upgrades[upgradeIndex] = entry;
            return true;
        }

        /// <summary>
        /// 取得所有永久升級的合併 StatModifier。
        /// </summary>
        /// <returns>合併後的屬性修正。</returns>
        public StatModifier GetStatModifier()
        {
            return new StatModifier
            {
                maxHPMultiplier       = 1f + upgrades[0].currentLevel * bonusPerLevel,
                attackPowerMultiplier = 1f + upgrades[1].currentLevel * bonusPerLevel,
                moveSpeedMultiplier   = 1f + upgrades[2].currentLevel * bonusPerLevel,
                xpGainMultiplier      = 1f + upgrades[3].currentLevel * bonusPerLevel,
                pickupRangeMultiplier = 1f + upgrades[4].currentLevel * bonusPerLevel,
            };
        }
    }

    /// <summary>
    /// 永久升級條目 — 定義單一永久升級屬性的等級與費用。
    /// </summary>
    [Serializable]
    public struct PermanentUpgradeEntry
    {
        /// <summary>升級名稱。</summary>
        public string name;

        /// <summary>當前等級。</summary>
        public int currentLevel;

        /// <summary>最高等級。</summary>
        public int maxLevel;

        /// <summary>基礎費用。</summary>
        public int baseCost;

        /// <summary>每級費用增量。</summary>
        public int costPerLevel;
    }
}
