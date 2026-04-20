namespace VampireSurvivors.Core
{
    /// <summary>
    /// 物件池監控數據 — 記錄單一物件池的使用狀態與擴容歷史。
    /// </summary>
    public struct PoolStats
    {
        /// <summary>場景載入時預分配的物件數量。</summary>
        public int PreAllocated;

        /// <summary>當前正在使用中的物件數量。</summary>
        public int CurrentActive;

        /// <summary>歷史峰值使用量。</summary>
        public int PeakActive;

        /// <summary>累計批次擴容次數。</summary>
        public int TotalExpansions;
    }
}
