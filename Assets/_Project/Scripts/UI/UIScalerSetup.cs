using UnityEngine;
using UnityEngine.UI;

namespace VampireSurvivors.UI
{
    /// <summary>
    /// UI 適配設定 — 設定 Canvas Scaler 以適配不同螢幕比例（16:9、18:9、20:9、21:9），
    /// 並確保所有可互動 UI 元素最小觸控區域為 48x48 dp。
    /// </summary>
    [RequireComponent(typeof(CanvasScaler))]
    public class UIScalerSetup : MonoBehaviour
    {
        /// <summary>參考解析度。</summary>
        [SerializeField] private Vector2 referenceResolution = new Vector2(1080, 1920);

        /// <summary>螢幕匹配模式權重（0=寬度匹配, 1=高度匹配, 0.5=混合）。</summary>
        [SerializeField, Range(0f, 1f)] private float matchWidthOrHeight = 0.5f;

        /// <summary>最小觸控區域大小（dp）。</summary>
        [SerializeField] private float minTouchTargetDp = 48f;

        /// <summary>Canvas Scaler 元件。</summary>
        private CanvasScaler canvasScaler;

        private void Awake()
        {
            canvasScaler = GetComponent<CanvasScaler>();
            ConfigureScaler();
        }

        /// <summary>
        /// 設定 Canvas Scaler 參數。
        /// 使用 ScaleWithScreenSize 模式，依據螢幕寬高比動態調整匹配權重。
        /// </summary>
        private void ConfigureScaler()
        {
            if (canvasScaler == null) return;

            canvasScaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            canvasScaler.referenceResolution = referenceResolution;
            canvasScaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;

            // 依據螢幕比例動態調整匹配權重
            float aspect = (float)Screen.width / Screen.height;
            if (aspect > 0.55f) // 寬螢幕（18:9 以上）
                canvasScaler.matchWidthOrHeight = 0.6f;
            else
                canvasScaler.matchWidthOrHeight = matchWidthOrHeight;

            canvasScaler.referencePixelsPerUnit = 100;
        }

        /// <summary>
        /// 取得最小觸控區域像素大小（依據裝置 DPI 計算）。
        /// </summary>
        /// <returns>最小觸控區域像素大小。</returns>
        public float GetMinTouchTargetPixels()
        {
            float dpi = Screen.dpi > 0 ? Screen.dpi : 160f;
            return minTouchTargetDp * (dpi / 160f);
        }
    }
}
