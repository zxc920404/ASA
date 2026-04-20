using UnityEngine;

namespace VampireSurvivors.Gameplay
{
    /// <summary>
    /// 螢幕外敵人降頻更新器 — 當場上超過 100 隻敵人時，
    /// 對螢幕外的敵人降低更新頻率以節省運算資源。
    /// </summary>
    public class EnemyUpdateOptimizer : MonoBehaviour
    {
        /// <summary>主攝影機。</summary>
        [SerializeField] private Camera mainCamera;

        /// <summary>觸發降頻的敵人數量門檻。</summary>
        [SerializeField] private int optimizationThreshold = 100;

        /// <summary>螢幕外敵人更新間隔（幀數）。</summary>
        [SerializeField] private int offScreenUpdateInterval = 3;

        /// <summary>可視範圍外擴邊距（世界座標）。</summary>
        [SerializeField] private float viewportPadding = 2f;

        /// <summary>當前幀計數。</summary>
        private int frameCount;

        /// <summary>敵人生成器參考。</summary>
        [SerializeField] private EnemySpawner enemySpawner;

        private void Update()
        {
            frameCount++;
        }

        /// <summary>
        /// 判斷指定敵人是否應在本幀更新。
        /// 當場上敵人數量超過門檻時，螢幕外敵人每隔數幀才更新一次。
        /// </summary>
        /// <param name="enemy">敵人 Transform。</param>
        /// <returns>是否應更新。</returns>
        public bool ShouldUpdate(Transform enemy)
        {
            // 敵人數量未達門檻，全部正常更新
            if (enemySpawner == null || enemySpawner.ActiveEnemyCount < optimizationThreshold)
                return true;

            // 螢幕內敵人始終更新
            if (IsOnScreen(enemy.position))
                return true;

            // 螢幕外敵人降頻更新
            return (frameCount % offScreenUpdateInterval) == 0;
        }

        /// <summary>
        /// 判斷世界座標位置是否在攝影機可視範圍內（含邊距）。
        /// </summary>
        /// <param name="worldPos">世界座標位置。</param>
        /// <returns>是否在可視範圍內。</returns>
        public bool IsOnScreen(Vector3 worldPos)
        {
            if (mainCamera == null) return true;

            float camH = mainCamera.orthographicSize + viewportPadding;
            float camW = camH * mainCamera.aspect;
            Vector2 camPos = mainCamera.transform.position;

            return worldPos.x >= camPos.x - camW && worldPos.x <= camPos.x + camW
                && worldPos.y >= camPos.y - camH && worldPos.y <= camPos.y + camH;
        }
    }
}
