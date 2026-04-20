using UnityEngine;
using UnityEngine.SceneManagement;

namespace VampireSurvivors.Gameplay
{
    /// <summary>
    /// 遊戲啟動引導 — 負責場景初始化與切換邏輯。
    /// 確保所有模組透過介面通訊，無直接引用。
    /// </summary>
    public class GameBootstrap : MonoBehaviour
    {
        /// <summary>主選單場景名稱。</summary>
        [SerializeField] private string mainMenuScene = "MainMenuScene";

        /// <summary>遊戲場景名稱陣列。</summary>
        [SerializeField] private string[] gameScenes = { "GameScene_Forest", "GameScene_Cemetery" };

        /// <summary>是否在啟動時自動載入主選單。</summary>
        [SerializeField] private bool autoLoadMainMenu = true;

        /// <summary>全域單例。</summary>
        public static GameBootstrap Instance { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Start()
        {
            if (autoLoadMainMenu)
                LoadMainMenu();
        }

        /// <summary>
        /// 載入主選單場景。
        /// </summary>
        public void LoadMainMenu()
        {
            SceneManager.LoadScene(mainMenuScene);
        }

        /// <summary>
        /// 載入指定索引的遊戲場景。
        /// </summary>
        /// <param name="mapIndex">地圖索引。</param>
        public void LoadGameScene(int mapIndex)
        {
            if (mapIndex < 0 || mapIndex >= gameScenes.Length)
            {
                Debug.LogWarning($"[GameBootstrap] 無效的地圖索引: {mapIndex}");
                return;
            }

            SceneManager.LoadScene(gameScenes[mapIndex]);
        }

        /// <summary>
        /// 重新載入當前場景。
        /// </summary>
        public void ReloadCurrentScene()
        {
            SceneManager.LoadScene(SceneManager.GetActiveScene().name);
        }
    }
}
