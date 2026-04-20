using UnityEngine;
using VampireSurvivors.Core;

namespace VampireSurvivors.Infrastructure
{
    /// <summary>
    /// 鍵盤/滑鼠輸入適配器 — 用於 WebGL 環境。
    /// WASD 鍵映射為角色移動方向，滑鼠用於 UI 操作。
    /// </summary>
    public class KeyboardMouseInputAdapter : IInputAdapter
    {
        /// <summary>
        /// 取得正規化的移動方向向量。
        /// W/S 控制垂直方向，A/D 控制水平方向，
        /// 對角移動時自動正規化為單位向量。
        /// </summary>
        /// <returns>正規化的二維移動方向向量。</returns>
        public Vector2 GetMovementInput()
        {
            Vector2 direction = Vector2.zero;

            if (Input.GetKey(KeyCode.W)) direction.y += 1f;
            if (Input.GetKey(KeyCode.S)) direction.y -= 1f;
            if (Input.GetKey(KeyCode.A)) direction.x -= 1f;
            if (Input.GetKey(KeyCode.D)) direction.x += 1f;

            return direction.normalized;
        }

        /// <summary>
        /// 判斷滑鼠左鍵是否正在按下。
        /// </summary>
        /// <returns>若滑鼠左鍵按下則回傳 true。</returns>
        public bool IsPointerDown()
        {
            return Input.GetMouseButton(0);
        }

        /// <summary>
        /// 取得滑鼠在螢幕上的位置。
        /// </summary>
        /// <returns>滑鼠的螢幕座標。</returns>
        public Vector2 GetPointerPosition()
        {
            return Input.mousePosition;
        }
    }
}
