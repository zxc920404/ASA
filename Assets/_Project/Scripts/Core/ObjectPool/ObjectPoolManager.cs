using System.Collections.Generic;
using UnityEngine;

namespace VampireSurvivors.Core
{
    /// <summary>
    /// 物件池管理器 — 管理所有遊戲物件的預分配、取出、回收與批次擴容。
    /// 透過 <see cref="ObjectPoolConfigSO"/> 設定各池的預分配數量與擴容上限。
    /// </summary>
    public class ObjectPoolManager : MonoBehaviour
    {
        /// <summary>物件池設定檔。</summary>
        [SerializeField] private ObjectPoolConfigSO poolConfig;

        /// <summary>各池的可用物件佇列，以 poolId 為鍵。</summary>
        private readonly Dictionary<string, Queue<GameObject>> _pools = new();

        /// <summary>各池的監控數據，以 poolId 為鍵。</summary>
        private readonly Dictionary<string, PoolStats> _stats = new();

        /// <summary>各池對應的設定項目快取，以 poolId 為鍵。</summary>
        private readonly Dictionary<string, ObjectPoolConfigSO.PoolEntry> _entryLookup = new();

        /// <summary>
        /// 場景載入時預分配所有物件池。
        /// 依據 <see cref="ObjectPoolConfigSO"/> 中定義的各池項目，
        /// 預先實例化指定數量的物件並設為非啟用狀態。
        /// </summary>
        public void PreAllocate()
        {
            if (poolConfig == null || poolConfig.pools == null)
                return;

            foreach (var entry in poolConfig.pools)
            {
                if (string.IsNullOrEmpty(entry.poolId) || entry.prefab == null)
                    continue;

                var queue = new Queue<GameObject>();

                for (int i = 0; i < entry.preAllocateCount; i++)
                {
                    var obj = Instantiate(entry.prefab, transform);
                    obj.SetActive(false);
                    queue.Enqueue(obj);
                }

                _pools[entry.poolId] = queue;
                _stats[entry.poolId] = new PoolStats
                {
                    PreAllocated = entry.preAllocateCount
                };
                _entryLookup[entry.poolId] = entry;
            }
        }

        /// <summary>
        /// 從指定物件池取出一個物件並放置於指定位置。
        /// 若池中無可用物件，將自動觸發批次擴容。
        /// </summary>
        /// <param name="poolId">物件池唯一識別碼。</param>
        /// <param name="position">物件放置的世界座標位置。</param>
        /// <returns>啟用後的遊戲物件。</returns>
        public GameObject Spawn(string poolId, Vector2 position)
        {
            if (!_pools.TryGetValue(poolId, out var queue) || queue.Count == 0)
            {
                ExpandPool(poolId);
                queue = _pools[poolId];
            }

            var obj = queue.Dequeue();
            obj.transform.position = (Vector3)position;
            obj.SetActive(true);

            var stats = _stats[poolId];
            stats.CurrentActive++;
            if (stats.CurrentActive > stats.PeakActive)
                stats.PeakActive = stats.CurrentActive;
            _stats[poolId] = stats;

            return obj;
        }

        /// <summary>
        /// 將物件回收至指定物件池。
        /// 物件將被設為非啟用狀態並重新歸入池中。
        /// </summary>
        /// <param name="poolId">物件池唯一識別碼。</param>
        /// <param name="obj">要回收的遊戲物件。</param>
        public void Despawn(string poolId, GameObject obj)
        {
            obj.SetActive(false);
            obj.transform.SetParent(transform);
            _pools[poolId].Enqueue(obj);

            var stats = _stats[poolId];
            stats.CurrentActive--;
            _stats[poolId] = stats;
        }

        /// <summary>
        /// 批次擴容指定物件池。
        /// 每次擴容數量不超過 10 個，受 <see cref="ObjectPoolConfigSO.PoolEntry.maxBatchExpansion"/> 限制。
        /// </summary>
        /// <param name="poolId">物件池唯一識別碼。</param>
        private void ExpandPool(string poolId)
        {
            if (!_entryLookup.TryGetValue(poolId, out var entry))
            {
                Debug.LogWarning($"[ObjectPoolManager] 找不到 poolId: {poolId} 的設定項目，無法擴容。");
                return;
            }

            int batchSize = Mathf.Min(entry.maxBatchExpansion, 10);

            if (!_pools.ContainsKey(poolId))
                _pools[poolId] = new Queue<GameObject>();

            var queue = _pools[poolId];
            for (int i = 0; i < batchSize; i++)
            {
                var obj = Instantiate(entry.prefab, transform);
                obj.SetActive(false);
                queue.Enqueue(obj);
            }

            var stats = _stats.ContainsKey(poolId) ? _stats[poolId] : new PoolStats();
            stats.TotalExpansions++;
            _stats[poolId] = stats;
        }

        /// <summary>
        /// 取得指定物件池的監控數據。
        /// </summary>
        /// <param name="poolId">物件池唯一識別碼。</param>
        /// <returns>該池的 <see cref="PoolStats"/> 監控數據；若池不存在則回傳預設值。</returns>
        public PoolStats GetStats(string poolId)
        {
            return _stats.TryGetValue(poolId, out var stats) ? stats : default;
        }
    }
}
