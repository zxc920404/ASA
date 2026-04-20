using UnityEngine;

namespace VampireSurvivors.Gameplay
{
    /// <summary>
    /// 攝影機跟隨 — 平滑跟隨玩家角色，接近地圖邊緣時顯示視覺提示。
    /// </summary>
    public class CameraFollow : MonoBehaviour
    {
        /// <summary>跟隨目標（玩家角色）。</summary>
        [SerializeField] private Transform target;

        /// <summary>平滑跟隨速度。</summary>
        [SerializeField] private float smoothSpeed = 8f;

        /// <summary>攝影機 Z 軸偏移。</summary>
        [SerializeField] private float zOffset = -10f;

        /// <summary>地圖半寬（世界座標）。</summary>
        [SerializeField] private float mapHalfWidth = 50f;

        /// <summary>地圖半高（世界座標）。</summary>
        [SerializeField] private float mapHalfHeight = 50f;

        /// <summary>邊界提示觸發距離（距離邊緣多少單位開始提示）。</summary>
        [SerializeField] private float edgeWarningDistance = 8f;

        /// <summary>邊界提示 UI 物件（上、下、左、右）。</summary>
        [SerializeField] private GameObject edgeWarningTop;
        [SerializeField] private GameObject edgeWarningBottom;
        [SerializeField] private GameObject edgeWarningLeft;
        [SerializeField] private GameObject edgeWarningRight;

        /// <summary>主攝影機元件。</summary>
        private Camera cam;

        private void Awake()
        {
            cam = GetComponent<Camera>();
        }

        private void LateUpdate()
        {
            if (target == null) return;

            FollowTarget();
            UpdateEdgeWarnings();
        }

        /// <summary>
        /// 平滑跟隨目標，並將攝影機限制在地圖範圍內。
        /// </summary>
        private void FollowTarget()
        {
            Vector3 targetPos = new Vector3(target.position.x, target.position.y, zOffset);
            Vector3 smoothed = Vector3.Lerp(transform.position, targetPos, smoothSpeed * Time.deltaTime);

            // 限制攝影機在地圖範圍內
            if (cam != null)
            {
                float camH = cam.orthographicSize;
                float camW = camH * cam.aspect;

                smoothed.x = Mathf.Clamp(smoothed.x, -mapHalfWidth + camW, mapHalfWidth - camW);
                smoothed.y = Mathf.Clamp(smoothed.y, -mapHalfHeight + camH, mapHalfHeight - camH);
            }

            transform.position = smoothed;
        }

        /// <summary>
        /// 檢查玩家是否接近地圖邊緣，啟用或停用對應方向的提示 UI。
        /// </summary>
        private void UpdateEdgeWarnings()
        {
            if (target == null) return;

            Vector2 pos = target.position;

            SetWarningActive(edgeWarningTop, pos.y > mapHalfHeight - edgeWarningDistance);
            SetWarningActive(edgeWarningBottom, pos.y < -mapHalfHeight + edgeWarningDistance);
            SetWarningActive(edgeWarningRight, pos.x > mapHalfWidth - edgeWarningDistance);
            SetWarningActive(edgeWarningLeft, pos.x < -mapHalfWidth + edgeWarningDistance);
        }

        /// <summary>
        /// 安全地啟用或停用 UI 物件。
        /// </summary>
        private void SetWarningActive(GameObject obj, bool active)
        {
            if (obj != null && obj.activeSelf != active)
                obj.SetActive(active);
        }
    }
}
