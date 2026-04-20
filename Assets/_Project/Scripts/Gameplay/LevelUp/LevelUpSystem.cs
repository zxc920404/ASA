using System.Collections.Generic;
using UnityEngine;
using VampireSurvivors.Core;

namespace VampireSurvivors.Gameplay
{
    /// <summary>
    /// 升級系統 — 訂閱 XPCollectedEvent 累積經驗值，
    /// 達到門檻時暫停遊戲並生成隨機升級選項供玩家選擇。
    /// </summary>
    public class LevelUpSystem : MonoBehaviour
    {
        /// <summary>各等級所需經驗值門檻。</summary>
        [SerializeField] private int[] xpThresholds = { 10, 20, 40, 70, 110, 160, 220, 290, 370, 460 };

        /// <summary>可用武器設定檔列表。</summary>
        [SerializeField] private WeaponConfigSO[] availableWeapons;

        /// <summary>可用被動道具設定檔列表。</summary>
        [SerializeField] private PassiveItemConfigSO[] availablePassives;

        /// <summary>武器系統參考。</summary>
        [SerializeField] private WeaponSystem weaponSystem;

        /// <summary>武器與被動道具最高等級。</summary>
        private const int MaxItemLevel = 8;

        /// <summary>當前玩家等級。</summary>
        private int currentLevel = 1;

        /// <summary>當前累積經驗值。</summary>
        private float currentXP;

        /// <summary>當前玩家等級（唯讀）。</summary>
        public int CurrentLevel => currentLevel;

        /// <summary>當前累積經驗值（唯讀）。</summary>
        public float CurrentXP => currentXP;

        private void OnEnable()
        {
            EventBus.Subscribe<XPCollectedEvent>(OnXPCollected);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<XPCollectedEvent>(OnXPCollected);
        }

        /// <summary>
        /// 取得當前等級的升級門檻。
        /// </summary>
        private int GetCurrentThreshold()
        {
            int index = Mathf.Clamp(currentLevel - 1, 0, xpThresholds.Length - 1);
            return xpThresholds[index];
        }

        /// <summary>
        /// 經驗值收集回呼 — 累積經驗值並檢查是否升級。
        /// </summary>
        private void OnXPCollected(XPCollectedEvent e)
        {
            currentXP += e.Amount;

            while (currentXP >= GetCurrentThreshold())
            {
                currentXP -= GetCurrentThreshold();
                currentLevel++;
                PresentUpgradeOptions();
            }
        }

        /// <summary>
        /// 暫停遊戲並發布升級事件，等待 UI 顯示選項。
        /// </summary>
        private void PresentUpgradeOptions()
        {
            Time.timeScale = 0f;
            EventBus.Publish(new PlayerLevelUpEvent { NewLevel = currentLevel });
        }

        /// <summary>
        /// 生成指定數量的隨機升級選項。
        /// 裝備已滿時僅提供升級選項；武器/道具已達最高等級則排除。
        /// </summary>
        /// <param name="count">要生成的選項數量。</param>
        /// <returns>升級選項列表。</returns>
        public List<UpgradeOption> GenerateUpgradeOptions(int count)
        {
            var candidates = new List<UpgradeOption>();
            bool weaponsFull = weaponSystem.WeaponCount >= WeaponSystem.MaxWeapons;
            bool passivesFull = weaponSystem.PassiveCount >= WeaponSystem.MaxPassives;

            // 已有武器的升級選項
            var weapons = weaponSystem.Weapons;
            for (int i = 0; i < weapons.Count; i++)
            {
                if (weapons[i].Level < MaxItemLevel)
                {
                    candidates.Add(new UpgradeOption
                    {
                        Type = UpgradeType.WeaponUpgrade,
                        WeaponConfig = weapons[i].Config,
                        TargetIndex = i
                    });
                }
            }

            // 已有被動道具的升級選項
            var passives = weaponSystem.Passives;
            for (int i = 0; i < passives.Count; i++)
            {
                if (passives[i].Level < MaxItemLevel)
                {
                    candidates.Add(new UpgradeOption
                    {
                        Type = UpgradeType.PassiveUpgrade,
                        PassiveConfig = passives[i].Config,
                        TargetIndex = i
                    });
                }
            }

            // 裝備未滿時加入新裝備選項
            if (!weaponsFull)
            {
                foreach (var wc in availableWeapons)
                {
                    if (wc == null) continue;
                    bool alreadyOwned = false;
                    for (int i = 0; i < weapons.Count; i++)
                    {
                        if (weapons[i].Config == wc) { alreadyOwned = true; break; }
                    }
                    if (!alreadyOwned)
                    {
                        candidates.Add(new UpgradeOption
                        {
                            Type = UpgradeType.NewWeapon,
                            WeaponConfig = wc
                        });
                    }
                }
            }

            if (!passivesFull)
            {
                foreach (var pc in availablePassives)
                {
                    if (pc == null) continue;
                    bool alreadyOwned = false;
                    for (int i = 0; i < passives.Count; i++)
                    {
                        if (passives[i].Config == pc) { alreadyOwned = true; break; }
                    }
                    if (!alreadyOwned)
                    {
                        candidates.Add(new UpgradeOption
                        {
                            Type = UpgradeType.NewPassive,
                            PassiveConfig = pc
                        });
                    }
                }
            }

            // 隨機選取指定數量
            Shuffle(candidates);
            int resultCount = Mathf.Min(count, candidates.Count);
            return candidates.GetRange(0, resultCount);
        }

        /// <summary>
        /// 套用玩家選擇的升級選項並恢復遊戲。
        /// </summary>
        /// <param name="option">玩家選擇的升級選項。</param>
        public void ApplyUpgrade(UpgradeOption option)
        {
            switch (option.Type)
            {
                case UpgradeType.NewWeapon:
                    var newWeapon = WeaponEvolutionHelper.CreateWeaponFromConfig(
                        option.WeaponConfig, weaponSystem.PoolManager);
                    if (newWeapon != null)
                        weaponSystem.AddWeapon(newWeapon);
                    break;

                case UpgradeType.WeaponUpgrade:
                    if (option.TargetIndex >= 0 && option.TargetIndex < weaponSystem.WeaponCount)
                        weaponSystem.Weapons[option.TargetIndex].LevelUp();
                    break;

                case UpgradeType.NewPassive:
                    var newPassive = new PassiveItemBase(option.PassiveConfig);
                    weaponSystem.AddPassive(newPassive);
                    break;

                case UpgradeType.PassiveUpgrade:
                    if (option.TargetIndex >= 0 && option.TargetIndex < weaponSystem.PassiveCount)
                        weaponSystem.Passives[option.TargetIndex].LevelUp();
                    break;
            }

            Time.timeScale = 1f;
        }

        /// <summary>
        /// Fisher-Yates 洗牌演算法。
        /// </summary>
        private static void Shuffle<T>(List<T> list)
        {
            for (int i = list.Count - 1; i > 0; i--)
            {
                int j = Random.Range(0, i + 1);
                (list[i], list[j]) = (list[j], list[i]);
            }
        }
    }
}
