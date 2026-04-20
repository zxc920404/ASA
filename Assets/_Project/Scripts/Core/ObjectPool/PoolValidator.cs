using UnityEngine;

namespace VampireSurvivors.Core
{
    /// <summary>
    /// 物件池驗證工具 — 開發階段用於檢測運行時是否有非法的 Instantiate/Destroy 呼叫。
    /// 僅在 UNITY_EDITOR 或 DEVELOPMENT_BUILD 環境下啟用。
    /// </summary>
    public class PoolValidator : MonoBehaviour
    {
#if UNITY_EDITOR || DEVELOPMENT_BUILD
        /// <summary>是否啟用驗證。</summary>
        [SerializeField] private bool enableValidation = true;

        /// <summary>需要監控的標籤（敵人、投射物、掉落物、傷害數字、特效）。</summary>
        [SerializeField] private string[] monitoredTags =
        {
            "Enemy", "Projectile", "Drop", "DamageText", "VFX"
        };

        /// <summary>違規計數。</summary>
        private int violationCount;

        /// <summary>違規計數（唯讀）。</summary>
        public int ViolationCount => violationCount;

        /// <summary>是否啟用驗證（唯讀）。</summary>
        public bool IsEnabled => enableValidation;

        /// <summary>
        /// 驗證物件是否透過 Object Pool 生成。
        /// 若偵測到非法的直接實例化，記錄警告。
        /// </summary>
        /// <param name="obj">要驗證的遊戲物件。</param>
        /// <param name="context">呼叫來源描述。</param>
        public void ValidateSpawn(GameObject obj, string context = "")
        {
            if (!enableValidation || obj == null) return;

            if (IsMonitoredObject(obj))
            {
                violationCount++;
                Debug.LogWarning(
                    $"[PoolValidator] 偵測到可能的非法 Instantiate！" +
                    $"物件: {obj.name}, 標籤: {obj.tag}, 來源: {context}。" +
                    $"請使用 ObjectPoolManager.Spawn() 替代。" +
                    $"（累計違規: {violationCount}）");
            }
        }

        /// <summary>
        /// 驗證物件是否透過 Object Pool 回收。
        /// 若偵測到非法的直接銷毀，記錄警告。
        /// </summary>
        /// <param name="obj">要驗證的遊戲物件。</param>
        /// <param name="context">呼叫來源描述。</param>
        public void ValidateDespawn(GameObject obj, string context = "")
        {
            if (!enableValidation || obj == null) return;

            if (IsMonitoredObject(obj))
            {
                violationCount++;
                Debug.LogWarning(
                    $"[PoolValidator] 偵測到可能的非法 Destroy！" +
                    $"物件: {obj.name}, 標籤: {obj.tag}, 來源: {context}。" +
                    $"請使用 ObjectPoolManager.Despawn() 替代。" +
                    $"（累計違規: {violationCount}）");
            }
        }

        /// <summary>
        /// 重置違規計數。
        /// </summary>
        public void ResetViolationCount()
        {
            violationCount = 0;
        }

        /// <summary>
        /// 判斷物件是否為需要監控的類型。
        /// </summary>
        private bool IsMonitoredObject(GameObject obj)
        {
            foreach (var tag in monitoredTags)
            {
                if (obj.CompareTag(tag))
                    return true;
            }
            return false;
        }

        /// <summary>
        /// 在 Inspector 中顯示驗證報告。
        /// </summary>
        [ContextMenu("顯示驗證報告")]
        private void ShowReport()
        {
            Debug.Log($"[PoolValidator] 驗證報告 — 累計違規次數: {violationCount}");
            if (violationCount == 0)
                Debug.Log("[PoolValidator] ✓ 未偵測到非法的 Instantiate/Destroy 呼叫。");
        }
#endif
    }
}
