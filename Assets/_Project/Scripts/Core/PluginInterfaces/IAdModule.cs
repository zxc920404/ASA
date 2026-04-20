using System;

namespace VampireSurvivors.Core
{
    /// <summary>
    /// 廣告模組介面 — 供後續獎勵式廣告系統以插件形式擴展，
    /// 實作此介面即可接入第三方廣告 SDK。
    /// </summary>
    public interface IAdModule
    {
        /// <summary>
        /// 顯示獎勵式廣告，觀看完成後透過回呼通知呼叫端。
        /// </summary>
        /// <param name="onComplete">廣告觀看完成時的回呼。</param>
        void ShowRewardedAd(Action onComplete);
    }
}
