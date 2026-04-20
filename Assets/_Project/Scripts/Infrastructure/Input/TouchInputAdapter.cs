using UnityEngine;
using VampireSurvivors.Core;

namespace VampireSurvivors.Infrastructure
{
    /// <summary>
    /// 觸控輸入適配器 — 實作浮動虛擬搖桿。
    /// 搖桿中心點出現在玩家首次觸碰螢幕左半部的位置，
    /// 釋放觸控後搖桿隱藏。含 15% 死區過濾微小觸碰。
    /// 支援多點觸控，僅追蹤第一根用於搖桿的手指。
    /// </summary>
    public class TouchInputAdapter : IInputAdapter
    {
        /// <summary>搖桿操作半徑（像素）。</summary>
        private const float JoystickRadius = 120f;

        /// <summary>死區比例（搖桿半徑的 15%）。</summary>
        private const float DeadZoneRatio = 0.15f;

        /// <summary>死區半徑（像素）。</summary>
        private readonly float _deadZoneRadius;

        /// <summary>搖桿觸控起始中心點。</summary>
        private Vector2 _joystickCenter;

        /// <summary>當前正規化移動方向。</summary>
        private Vector2 _direction;

        /// <summary>是否正在追蹤搖桿觸控。</summary>
        private bool _isTracking;

        /// <summary>追蹤中的手指 ID，用於多點觸控識別。</summary>
        private int _trackingFingerId = -1;

        public TouchInputAdapter()
        {
            _deadZoneRadius = JoystickRadius * DeadZoneRatio;
        }

        /// <summary>
        /// 取得正規化的移動方向向量。
        /// 處理浮動搖桿邏輯：首次觸碰螢幕左半部時記錄中心點，
        /// 拖曳時計算方向，死區內回傳零向量，釋放時重置。
        /// </summary>
        /// <returns>正規化的二維移動方向向量。</returns>
        public Vector2 GetMovementInput()
        {
            int touchCount = Input.touchCount;

            if (touchCount == 0)
            {
                ResetTracking();
                return Vector2.zero;
            }

            // 若正在追蹤，更新該手指的位置
            if (_isTracking)
            {
                bool fingerFound = false;
                for (int i = 0; i < touchCount; i++)
                {
                    Touch touch = Input.GetTouch(i);
                    if (touch.fingerId == _trackingFingerId)
                    {
                        fingerFound = true;
                        if (touch.phase == TouchPhase.Ended || touch.phase == TouchPhase.Canceled)
                        {
                            ResetTracking();
                            return Vector2.zero;
                        }
                        UpdateDirection(touch.position);
                        break;
                    }
                }

                if (!fingerFound)
                {
                    ResetTracking();
                    return Vector2.zero;
                }

                return _direction;
            }

            // 尚未追蹤，尋找螢幕左半部的新觸碰
            for (int i = 0; i < touchCount; i++)
            {
                Touch touch = Input.GetTouch(i);
                if (touch.phase == TouchPhase.Began && touch.position.x < Screen.width * 0.5f)
                {
                    _isTracking = true;
                    _trackingFingerId = touch.fingerId;
                    _joystickCenter = touch.position;
                    _direction = Vector2.zero;
                    return Vector2.zero;
                }
            }

            return Vector2.zero;
        }

        /// <summary>
        /// 判斷是否有任何觸控正在按下。
        /// </summary>
        /// <returns>若有觸控按下則回傳 true。</returns>
        public bool IsPointerDown()
        {
            return Input.touchCount > 0;
        }

        /// <summary>
        /// 取得第一根手指的螢幕座標位置。
        /// </summary>
        /// <returns>觸控的螢幕座標，無觸控時回傳零向量。</returns>
        public Vector2 GetPointerPosition()
        {
            if (Input.touchCount > 0)
            {
                return Input.GetTouch(0).position;
            }
            return Vector2.zero;
        }

        /// <summary>
        /// 根據當前觸控位置與搖桿中心計算移動方向，
        /// 套用死區過濾與正規化。
        /// </summary>
        /// <param name="touchPosition">當前觸控螢幕座標。</param>
        private void UpdateDirection(Vector2 touchPosition)
        {
            Vector2 offset = touchPosition - _joystickCenter;
            float distance = offset.magnitude;

            // 死區過濾：距離小於死區半徑時輸出零向量
            if (distance < _deadZoneRadius)
            {
                _direction = Vector2.zero;
                return;
            }

            // 限制在搖桿半徑內並正規化
            if (distance > JoystickRadius)
            {
                offset = offset.normalized * JoystickRadius;
            }

            _direction = offset.normalized;
        }

        /// <summary>
        /// 重置搖桿追蹤狀態。
        /// </summary>
        private void ResetTracking()
        {
            _isTracking = false;
            _trackingFingerId = -1;
            _direction = Vector2.zero;
        }
    }
}
