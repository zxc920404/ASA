using UnityEngine;
using UnityEngine.SceneManagement;
using VampireSurvivors.Core;

namespace VampireSurvivors.UI
{
    /// <summary>
    /// 暫停選單控制器 — 提供繼續、重新開始、返回主選單功能。
    /// 暫停時設定 Time.timeScale = 0，恢復時設定為 1。
    /// </summary>
    public class PauseMenuController : MonoBehaviour
    {
        /// <summary>暫停選單面板。</summary>
        [SerializeField] private GameObject pausePanel;

        /// <summary>主選單場景名稱。</summary>
        [SerializeField] private string mainMenuSceneName = "MainMenuScene";

        /// <summary>是否處於暫停狀態。</summary>
        private bool isPaused;

        /// <summary>暫停狀態（唯讀）。</summary>
        public bool IsPaused => isPaused;

        private void Update()
        {
            // ESC 鍵切換暫停（WebGL / Editor）
            if (Input.GetKeyDown(KeyCode.Escape))
            {
                if (isPaused) Resume();
                else Pause();
            }
        }

        /// <summary>
        /// 暫停遊戲。
        /// </summary>
        public void Pause()
        {
            isPaused = true;
            Time.timeScale = 0f;
            if (pausePanel != null)
                pausePanel.SetActive(true);
        }

        /// <summary>
        /// 繼續遊戲。
        /// </summary>
        public void Resume()
        {
            isPaused = false;
            Time.timeScale = 1f;
            if (pausePanel != null)
                pausePanel.SetActive(false);
        }

        /// <summary>
        /// 重新開始當前場景。
        /// </summary>
        public void Restart()
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
