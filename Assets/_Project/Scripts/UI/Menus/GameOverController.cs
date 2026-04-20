using UnityEngine;
using UnityEngine.SceneManagement;
using TMPro;
using VampireSurvivors.Core;

namespace VampireSurvivors.UI
{
    /// <summary>
    /// 遊戲結算控制器 — 顯示存活時間、擊殺數、金幣、最高等級，
    /// 並提供再來一局與返回主選單功能。支援勝利與失敗兩種結算畫面。
    /// </summary>
    public class GameOverController : MonoBehaviour
    {
        [Header("結算面板")]
        /// <summary>遊戲結束面板。</summary>
        [SerializeField] private GameObject gameOverPanel;
        /// <summary>勝利面板。</summary>
        [SerializeField] private GameObject victoryPanel;

        [Header("結算資訊文字")]
        /// <summary>存活時間文字。</summary>
        [SerializeField] private TextMeshProUGUI survivalTimeText;
        /// <summary>擊殺數文字。</summary>
        [SerializeField] private TextMeshProUGUI killCountText;
        /// <summary>金幣數文字。</summary>
        [SerializeField] private TextMeshProUGUI goldText;
        /// <summary>最高等級文字。</summary>
        [SerializeField] private TextMeshProUGUI levelText;

        /// <summary>主選單場景名稱。</summary>
        [SerializeField] private string mainMenuSceneName = "MainMenuScene";

        private void OnEnable()
        {
            EventBus.Subscribe<GameOverEvent>(OnGameOver);
            EventBus.Subscribe<VictoryEvent>(OnVictory);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<GameOverEvent>(OnGameOver);
            EventBus.Unsubscribe<VictoryEvent>(OnVictory);
        }

        /// <summary>
        /// 遊戲結束事件處理：顯示失敗結算畫面。
        /// </summary>
        private void OnGameOver(GameOverEvent e)
        {
            UpdateResultTexts(e.SurvivalTime, e.KillCount, e.Gold);
            if (gameOverPanel != null)
                gameOverPanel.SetActive(true);
        }

        /// <summary>
        /// 勝利事件處理：顯示勝利結算畫面。
        /// </summary>
        private void OnVictory(VictoryEvent e)
        {
            UpdateResultTexts(e.SurvivalTime, e.KillCount, 0);
            if (victoryPanel != null)
                victoryPanel.SetActive(true);
        }

        /// <summary>
        /// 更新結算資訊文字。
        /// </summary>
        private void UpdateResultTexts(float survivalTime, int killCount, int gold)
        {
            if (survivalTimeText != null)
            {
                int min = Mathf.FloorToInt(survivalTime / 60f);
                int sec = Mathf.FloorToInt(survivalTime % 60f);
                survivalTimeText.text = $"{min:00}:{sec:00}";
            }

            if (killCountText != null)
                killCountText.text = killCount.ToString();

            if (goldText != null)
                goldText.text = gold.ToString();
        }

        /// <summary>
        /// 更新最高等級顯示。
        /// </summary>
        public void SetMaxLevel(int level)
        {
            if (levelText != null)
                levelText.text = $"Lv.{level}";
        }

        /// <summary>
        /// 再來一局（重新載入當前場景）。
        /// </summary>
        public void PlayAgain()
        {
            Time.timeScale = 1f;
            SceneManager.LoadScene(SceneManager.GetActiveScene().name);
        }

        /// <summary>
        /// 返回主選單。
        /// </summary>
        public void ReturnToMainMenu()
        {
            Time.timeScale = 1f;
            SceneManager.LoadScene(mainMenuSceneName);
        }
    }
}
