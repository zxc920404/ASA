using UnityEngine;

namespace VampireSurvivors.Core
{
    /// <summary>
    /// 玩家角色介面 — 定義玩家角色的核心行為，
    /// 使新增角色類型時無需修改核心遊戲邏輯。
    /// </summary>
    public interface IPlayerCharacter
    {
        /// <summary>角色的 ScriptableObject 設定檔。</summary>
        CharacterConfigSO Config { get; }

        /// <summary>角色當前生命值。</summary>
        float CurrentHP { get; }

        /// <summary>角色最大生命值（含永久升級加成）。</summary>
        float MaxHP { get; }

        /// <summary>
        /// 依據輸入方向移動角色。
        /// </summary>
        /// <param name="direction">正規化的移動方向向量。</param>
        void Move(Vector2 direction);

        /// <summary>
        /// 對角色造成傷害。
        /// </summary>
        /// <param name="damage">傷害數值。</param>
        void TakeDamage(float damage);

        /// <summary>
        /// 套用屬性修正（來自被動道具或永久升級）。
        /// </summary>
        /// <param name="modifier">屬性修正資料。</param>
        void ApplyStatModifier(StatModifier modifier);
    }
}
