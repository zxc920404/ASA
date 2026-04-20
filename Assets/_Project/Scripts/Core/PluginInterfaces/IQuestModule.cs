namespace VampireSurvivors.Core
{
    /// <summary>
    /// 任務模組介面 — 供後續任務系統以插件形式擴展，
    /// 實作此介面即可載入並管理自訂的任務內容。
    /// </summary>
    public interface IQuestModule
    {
        /// <summary>載入任務資料並初始化任務追蹤。</summary>
        void LoadQuests();
    }
}
