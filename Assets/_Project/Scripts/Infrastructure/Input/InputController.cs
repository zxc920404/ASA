using UnityEngine;
using VampireSurvivors.Core;

namespace VampireSurvivors.Infrastructure
{
    /// <summary>
    /// 輸入控制器 — 透過預處理指令自動切換輸入來源。
    /// WebGL 環境使用鍵盤/滑鼠適配器，其餘平台（Android）使用觸控適配器。
    /// 外部系統透過 GetMovement() 取得正規化移動向量，無需關心底層輸入來源。
    /// </summary>
    public class InputController : MonoBehaviour
    {
        /// <summary>當前使用的輸入適配器實例。</summary>
        private IInputAdapter _adapter;

        /// <summary>
        /// 初始化時依據平台選擇對應的輸入適配器。
        /// </summary>
        private void Awake()
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            _adapter = new KeyboardMouseInputAdapter();
#else
            _adapter = new TouchInputAdapter();
#endif
        }

        /// <summary>
        /// 取得正規化的移動方向向量。
        /// </summary>
        /// <returns>正規化的二維移動方向向量。</returns>
        public Vector2 GetMovement()
        {
            return _adapter.GetMovementInput();
        }

        /// <summary>
        /// 判斷指標（觸控或滑鼠）是否正在按下。
        /// </summary>
        /// <returns>若指標按下則回傳 true。</returns>
        public bool IsPointerDown()
        {
            return _adapter.IsPointerDown();
        }

        /// <summary>
        /// 取得指標（觸控或滑鼠）在螢幕上的位置。
        /// </summary>
        /// <returns>指標的螢幕座標。</returns>
        public Vector2 GetPointerPosition()
        {
            return _adapter.GetPointerPosition();
        }

        /// <summary>
        /// 取得當前使用的輸入適配器（供測試或除錯使用）。
        /// </summary>
        public IInputAdapter Adapter => _adapter;
    }
}
