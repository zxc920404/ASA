using System.Collections.Generic;
using VampireSurvivors.Core;

namespace VampireSurvivors.Gameplay
{
    /// <summary>
    /// 武器進化輔助工具 — 提供武器進化流程的靜態輔助方法，
    /// 包含進化條件檢查、武器實例建立與進化配方驗證。
    /// </summary>
    public static class WeaponEvolutionHelper
    {
        /// <summary>
        /// 依據武器設定檔建立對應的武器實例。
        /// 根據設定檔的 weaponId 前綴判斷武器類型並建立正確的子類別。
        /// </summary>
        /// <param name="config">武器設定檔。</param>
        /// <param name="poolManager">物件池管理器。</param>
        /// <returns>建立的武器實例；若無法判斷類型則回傳預設的直線投射武器。</returns>
        public static IWeapon CreateWeaponFromConfig(WeaponConfigSO config, ObjectPoolManager poolManager)
        {
            if (config == null || poolManager == null)
                return null;

            return new StraightProjectileWeapon(config, poolManager);
        }

        /// <summary>
        /// 檢查指定武器是否滿足進化條件（滿級且持有對應被動道具）。
        /// </summary>
        /// <param name="weapon">要檢查的武器。</param>
        /// <param name="passives">玩家當前持有的被動道具列表。</param>
        /// <returns>若滿足進化條件則回傳 true。</returns>
        public static bool CheckEvolutionReady(IWeapon weapon, IReadOnlyList<IPassiveItem> passives)
        {
            if (weapon == null || passives == null)
                return false;

            return weapon.CanEvolve(passives);
        }

        /// <summary>
        /// 執行武器進化並替換 WeaponSystem 中的對應武器。
        /// </summary>
        /// <param name="weaponSystem">武器系統。</param>
        /// <param name="weaponIndex">要進化的武器索引。</param>
        /// <returns>進化後的武器實例；若進化失敗則回傳 null。</returns>
        public static IWeapon EvolveAndReplace(WeaponSystem weaponSystem, int weaponIndex)
        {
            if (weaponSystem == null) return null;
            if (weaponIndex < 0 || weaponIndex >= weaponSystem.WeaponCount) return null;

            var weapon = weaponSystem.Weapons[weaponIndex];
            if (!weapon.CanEvolve(weaponSystem.Passives)) return null;

            var evolved = weapon.Evolve();
            if (evolved == null) return null;

            weaponSystem.ReplaceWeapon(weaponIndex, evolved);
            return evolved;
        }

        /// <summary>
        /// 驗證武器進化配方的唯一性 — 確保沒有兩種武器共用相同的進化被動道具。
        /// </summary>
        /// <param name="weaponConfigs">所有武器設定檔。</param>
        /// <returns>若所有進化配方皆唯一則回傳 true。</returns>
        public static bool ValidateEvolutionRecipes(IReadOnlyList<WeaponConfigSO> weaponConfigs)
        {
            if (weaponConfigs == null) return true;

            var seenPassiveIds = new HashSet<string>();
            for (int i = 0; i < weaponConfigs.Count; i++)
            {
                var config = weaponConfigs[i];
                if (string.IsNullOrEmpty(config.evolutionPassiveId)) continue;
                if (config.evolvedWeaponConfig == null) continue;

                if (!seenPassiveIds.Add(config.evolutionPassiveId))
                    return false;
            }
            return true;
        }
    }
}
