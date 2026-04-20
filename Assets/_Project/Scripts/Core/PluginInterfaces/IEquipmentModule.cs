namespace VampireSurvivors.Core
{
    /// <summary>
    /// 裝備模組介面 — 供後續裝備系統以插件形式擴展，
    /// 實作此介面即可將自訂裝備註冊至遊戲系統。
    /// </summary>
    public interface IEquipmentModule
    {
        /// <summary>將模組內定義的裝備註冊至遊戲系統。</summary>
        void RegisterEquipment();
    }
}
