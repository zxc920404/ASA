using UnityEngine;

namespace VampireSurvivors.Core
{
    /// <summary>
    /// 角色設定檔 — 定義玩家角色的基礎屬性與解鎖條件。
    /// </summary>
    [CreateAssetMenu(menuName = "VampireSurvivors/Character Config")]
    public class CharacterConfigSO : ScriptableObject
    {
        /// <summary>角色唯一識別碼。</summary>
        public string characterId;

        /// <summary>角色顯示名稱。</summary>
        public string displayName;

        /// <summary>角色精靈圖。</summary>
        public Sprite sprite;

        /// <summary>基礎生命值。</summary>
        public float baseHP;

        /// <summary>基礎移動速度。</summary>
        public float baseMoveSpeed;

        /// <summary>基礎攻擊力。</summary>
        public float baseAttackPower;

        /// <summary>基礎拾取範圍。</summary>
        public float basePickupRange;

        /// <summary>初始武器設定檔。</summary>
        public WeaponConfigSO startingWeapon;

        /// <summary>是否預設解鎖。</summary>
        public bool unlockedByDefault;

        /// <summary>解鎖所需金幣。</summary>
        public int unlockCost;
    }
}
