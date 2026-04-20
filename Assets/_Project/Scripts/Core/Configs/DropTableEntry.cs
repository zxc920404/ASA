using UnityEngine;

namespace VampireSurvivors.Core
{
    /// <summary>
    /// 掉落表項目 — 定義敵人死亡時可掉落的道具與機率。
    /// </summary>
    [System.Serializable]
    public struct DropTableEntry
    {
        /// <summary>掉落的道具預製體。</summary>
        public GameObject itemPrefab;

        /// <summary>掉落機率（0.0 ~ 1.0）。</summary>
        [Range(0f, 1f)]
        public float dropChance;
    }
}
