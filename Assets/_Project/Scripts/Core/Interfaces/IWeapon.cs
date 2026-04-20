using System.Collections.Generic;
using UnityEngine;

namespace VampireSurvivors.Core
{
    /// <summary>
    /// 武器介面 — 所有武器類型皆須實作此介面，
    /// 以便新增武器時無需修改現有程式碼。
    /// </summary>
    public interface IWeapon
    {
        /// <summary>武器的 ScriptableObject 設定檔。</summary>
        WeaponConfigSO Config { get; }

        /// <summary>武器當前等級（最高 8 級）。</summary>
        int Level { get; }

        /// <summary>
        /// 從指定原點朝指定方向發動攻擊。
        /// </summary>
        /// <param name="origin">攻擊起始位置。</param>
        /// <param name="direction">攻擊方向。</param>
        void Attack(Vector2 origin, Vector2 direction);

        /// <summary>提升武器等級，強化對應屬性。</summary>
        void LevelUp();

        /// <summary>
        /// 判斷武器是否滿足進化條件（滿級且持有對應被動道具）。
        /// </summary>
        /// <param name="passives">玩家當前持有的被動道具列表。</param>
        /// <returns>若可進化則回傳 true。</returns>
        bool CanEvolve(IReadOnlyList<IPassiveItem> passives);

        /// <summary>
        /// 執行武器進化，回傳進化後的新武器實例。
        /// </summary>
        /// <returns>進化後的武器。</returns>
        IWeapon Evolve();
    }
}
