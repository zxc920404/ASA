using UnityEngine;

namespace VampireSurvivors.Core
{
    /// <summary>
    /// 敵人被擊殺事件 — 當敵人生命值歸零時發布。
    /// </summary>
    public struct EnemyKilledEvent : IGameEvent
    {
        /// <summary>敵人死亡位置。</summary>
        public Vector2 Position;

        /// <summary>被擊殺敵人的設定檔。</summary>
        public EnemyConfigSO Config;
    }

    /// <summary>
    /// 玩家升級事件 — 當玩家經驗值達到升級門檻時發布。
    /// </summary>
    public struct PlayerLevelUpEvent : IGameEvent
    {
        /// <summary>升級後的新等級。</summary>
        public int NewLevel;
    }

    /// <summary>
    /// 玩家受傷事件 — 當玩家角色受到傷害時發布。
    /// </summary>
    public struct PlayerDamagedEvent : IGameEvent
    {
        /// <summary>本次受到的傷害量。</summary>
        public float Damage;

        /// <summary>受傷後剩餘的生命值。</summary>
        public float RemainingHP;
    }

    /// <summary>
    /// 遊戲結束事件 — 當玩家角色死亡或遊戲結束時發布。
    /// </summary>
    public struct GameOverEvent : IGameEvent
    {
        /// <summary>本局存活時間（秒）。</summary>
        public float SurvivalTime;

        /// <summary>本局擊殺敵人總數。</summary>
        public int KillCount;

        /// <summary>本局獲得的金幣數量。</summary>
        public int Gold;
    }

    /// <summary>
    /// 武器進化事件 — 當武器完成進化時發布。
    /// </summary>
    public struct WeaponEvolvedEvent : IGameEvent
    {
        /// <summary>進化武器的識別碼。</summary>
        public string WeaponId;
    }

    /// <summary>
    /// 經驗值收集事件 — 當玩家拾取經驗寶石時發布。
    /// </summary>
    public struct XPCollectedEvent : IGameEvent
    {
        /// <summary>收集的經驗值數量。</summary>
        public float Amount;
    }

    /// <summary>
    /// 遊戲開始事件 — 當新一局遊戲開始時發布。
    /// </summary>
    public struct GameStartEvent : IGameEvent
    {
        /// <summary>玩家選擇的角色設定檔。</summary>
        public CharacterConfigSO Character;

        /// <summary>玩家選擇的地圖索引。</summary>
        public int MapIndex;
    }

    /// <summary>
    /// 武器攻擊事件 — 當武器發動攻擊時發布。
    /// </summary>
    public struct WeaponAttackEvent : IGameEvent
    {
        /// <summary>發動攻擊的武器識別碼。</summary>
        public string WeaponId;
    }

    /// <summary>
    /// 敵人受傷事件 — 當敵人受到傷害時發布。
    /// </summary>
    public struct EnemyDamagedEvent : IGameEvent
    {
        /// <summary>受傷敵人的位置。</summary>
        public Vector2 Position;

        /// <summary>本次受到的傷害量。</summary>
        public float Damage;
    }

    /// <summary>
    /// 勝利事件 — 當玩家擊敗最終 Boss 時發布。
    /// </summary>
    public struct VictoryEvent : IGameEvent
    {
        /// <summary>本局存活時間（秒）。</summary>
        public float SurvivalTime;

        /// <summary>本局擊殺敵人總數。</summary>
        public int KillCount;
    }
}
