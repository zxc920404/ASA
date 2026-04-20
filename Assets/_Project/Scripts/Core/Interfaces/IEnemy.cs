using UnityEngine;

namespace VampireSurvivors.Core
{
    /// <summary>
    /// 敵人介面 — 所有敵人類型皆須實作此介面，
    /// 以便新增敵人類型時無需修改現有程式碼。
    /// </summary>
    public interface IEnemy
    {
        /// <summary>敵人的 ScriptableObject 設定檔。</summary>
        EnemyConfigSO Config { get; }

        /// <summary>敵人當前生命值。</summary>
        float CurrentHP { get; }

        /// <summary>
        /// 對敵人造成傷害。
        /// </summary>
        /// <param name="damage">傷害數值。</param>
        void TakeDamage(float damage);

        /// <summary>
        /// 設定敵人的追蹤目標（通常為玩家角色）。
        /// </summary>
        /// <param name="target">追蹤目標的 Transform。</param>
        void SetTarget(Transform target);

        /// <summary>
        /// 將敵人回收至物件池。
        /// </summary>
        void ReturnToPool();
    }
}
