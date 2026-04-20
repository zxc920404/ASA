namespace VampireSurvivors.Core
{
    /// <summary>
    /// 抽卡模組介面 — 供後續抽卡（轉蛋）系統以插件形式擴展，
    /// 實作此介面即可接入自訂的抽卡橫幅與獎池邏輯。
    /// </summary>
    public interface IGachaModule
    {
        /// <summary>開啟抽卡橫幅介面。</summary>
        void OpenGachaBanner();
    }
}
