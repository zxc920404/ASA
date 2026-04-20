using UnityEngine;

namespace VampireSurvivors.Core
{
    /// <summary>
    /// 輸入適配器介面 — 抽象化輸入來源，
    /// 使觸控（Android）與鍵盤/滑鼠（WebGL）輸入透過統一介面處理，
    /// 可在運行時切換輸入來源。
    /// </summary>
    public interface IInputAdapter
    {
        /// <summary>
        /// 取得正規化的移動方向向量。
        /// 觸控模式下對應虛擬搖桿方向，鍵盤模式下對應 WASD 方向。
        /// </summary>
        /// <returns>正規化的二維移動方向向量。</returns>
        Vector2 GetMovementInput();

        /// <summary>
        /// 判斷指標（觸控或滑鼠）是否正在按下。
        /// </summary>
        /// <returns>若指標按下則回傳 true。</returns>
        bool IsPointerDown();

        /// <summary>
        /// 取得指標（觸控或滑鼠）在螢幕上的位置。
        /// </summary>
        /// <returns>指標的螢幕座標。</returns>
        Vector2 GetPointerPosition();
    }
}
