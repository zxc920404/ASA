using System;

namespace VampireSurvivors.Core
{
    /// <summary>
    /// 內購模組介面 — 供後續應用程式內購買（IAP）系統以插件形式擴展，
    /// 實作此介面即可接入平台商店的購買流程。
    /// </summary>
    public interface IIAPModule
    {
        /// <summary>
        /// 發起指定商品的購買請求。
        /// </summary>
        /// <param name="productId">商品識別碼。</param>
        /// <param name="onResult">購買結果回呼，true 表示成功，false 表示失敗或取消。</param>
        void PurchaseProduct(string productId, Action<bool> onResult);
    }
}
