using UnityEngine;

namespace VampireSurvivors.Core
{
    /// <summary>
    /// 波次設定檔 — 定義單一波次的時間範圍、敵人種類與生成規則。
    /// </summary>
    [CreateAssetMenu(menuName = "VampireSurvivors/Wave Config")]
    public class WaveConfigSO : ScriptableObject
    {
        /// <summary>波次開始時間（秒）。</summary>
        public float startTime;

        /// <summary>波次結束時間（秒）。</summary>
        public float endTime;

        /// <summary>本波次可生成的敵人類型。</summary>
        public EnemyConfigSO[] enemyTypes;

        /// <summary>敵人生成間隔（秒）。</summary>
        public float spawnInterval;

        /// <summary>每次生成的敵人數量。</summary>
        public int spawnCount;

        /// <summary>敵人屬性倍率。</summary>
        public float statMultiplier;
    }
}
