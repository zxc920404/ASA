using UnityEngine;

namespace VampireSurvivors.Core
{
    /// <summary>
    /// 物件池設定檔 — 定義所有需要預分配的物件池項目。
    /// </summary>
    [CreateAssetMenu(menuName = "VampireSurvivors/Object Pool Config")]
    public class ObjectPoolConfigSO : ScriptableObject
    {
        /// <summary>物件池項目列表。</summary>
        public PoolEntry[] pools;

        /// <summary>
        /// 物件池項目 — 定義單一物件池的預製體、預分配數量與擴容上限。
        /// </summary>
        [System.Serializable]
        public struct PoolEntry
        {
            /// <summary>物件池唯一識別碼。</summary>
            public string poolId;

            /// <summary>物件預製體。</summary>
            public GameObject prefab;

            /// <summary>場景載入時的預分配數量。</summary>
            public int preAllocateCount;

            /// <summary>單次批次擴容上限（不超過 10）。</summary>
            public int maxBatchExpansion;
        }
    }
}
