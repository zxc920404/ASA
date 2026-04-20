using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using TMPro;
using VampireSurvivors.Core;

namespace VampireSurvivors.UI
{
    /// <summary>
    /// 主選單控制器 — 管理開始遊戲、角色選擇、地圖選擇、永久升級、設定與退出功能。
    /// </summary>
    public class MainMenuController : MonoBehaviour
    {
        [Header("主選單面板")]
        /// <summary>主選單根面板。</summary>
        [SerializeField] private GameObject mainMenuPanel;
        /// <summary>角色選擇面板。</summary>
        [SerializeField] private GameObject characterSelectPanel;
        /// <summary>地圖選擇面板。</summary>
        [SerializeField] private GameObject mapSelectPanel;
        /// <summary>永久升級面板。</summary>
        [SerializeField] private GameObject upgradePanel;
        /// <summary>設定面板。</summary>
        [SerializeField] private GameObject settingsPanel;

        [Header("角色選擇")]
        /// <summary>可選角色設定檔陣列（至少 3 個）。</summary>
        [SerializeField] private CharacterConfigSO[] characters;
        /// <summary>角色名稱文字。</summary>
        [SerializeField] private TextMeshProUGUI characterNameText;
        /// <summary>角色圖片。</summary>
        [SerializeField] private Image characterImage;

        [Header("設定")]
        /// <summary>音樂音量滑桿。</summary>
        [SerializeField] private Slider bgmSlider;
        /// <summary>音效音量滑桿。</summary>
        [SerializeField] private Slider sfxSlider;

        [Header("場景名稱")]
        /// <summary>遊戲場景名稱陣列（對應地圖索引）。</summary>
        [SerializeField] private string[] gameSceneNames = { "GameScene_Forest", "GameScene_Cemetery" };

        /// <summary>當前選擇的角色索引。</summary>
        private int selectedCharacterIndex;

        /// <summary>當前選擇的角色設定檔。</summary>
        public CharacterConfigSO SelectedCharacter =>
            characters != null && characters.Length > 0
                ? characters[selectedCharacterIndex]
                : null;

        private void Start()
        {
            ShowMainMenu();
        }

        /// <summary>顯示主選單面板。</summary>
        public void ShowMainMenu()
        {
            SetActivePanel(mainMenuPanel);
        }

        /// <summary>顯示角色選擇面板。</summary>
        public void ShowCharacterSelect()
        {
            SetActivePanel(characterSelectPanel);
            UpdateCharacterDisplay();
        }

        /// <summary>顯示地圖選擇面板。</summary>
        public void ShowMapSelect()
        {
            SetActivePanel(mapSelectPanel);
        }

        /// <summary>顯示永久升級面板。</summary>
        public void ShowUpgradePanel()
        {
            SetActivePanel(upgradePanel);
        }

        /// <summary>顯示設定面板。</summary>
        public void ShowSettings()
        {
            SetActivePanel(settingsPanel);
        }

        /// <summary>
        /// 選擇下一個角色。
        /// </summary>
        public void NextCharacter()
        {
            if (characters == null || characters.Length == 0) return;
            selectedCharacterIndex = (selectedCharacterIndex + 1) % characters.Length;
            UpdateCharacterDisplay();
        }

        /// <summary>
        /// 選擇上一個角色。
        /// </summary>
        public void PreviousCharacter()
        {
            if (characters == null || characters.Length == 0) return;
            selectedCharacterIndex = (selectedCharacterIndex - 1 + characters.Length) % characters.Length;
            UpdateCharacterDisplay();
        }

        /// <summary>
        /// 確認角色選擇，進入地圖選擇。
        /// </summary>
        public void ConfirmCharacter()
        {
            ShowMapSelect();
        }

        /// <summary>
        /// 選擇地圖並載入遊戲場景。
        /// </summary>
        /// <param name="mapIndex">地圖索引。</param>
        public void SelectMap(int mapIndex)
        {
            if (gameSceneNames == null || mapIndex < 0 || mapIndex >= gameSceneNames.Length)
                return;

            SceneManager.LoadScene(gameSceneNames[mapIndex]);
        }

        /// <summary>
        /// 音樂音量變更回呼。
        /// </summary>
        public void OnBGMVolumeChanged(float value)
        {
            // 透過 AudioManager 設定音樂音量
            PlayerPrefs.SetFloat("BGMVolume", value);
        }

        /// <summary>
        /// 音效音量變更回呼。
        /// </summary>
        public void OnSFXVolumeChanged(float value)
        {
            PlayerPrefs.SetFloat("SFXVolume", value);
        }

        /// <summary>
        /// 退出遊戲。
        /// </summary>
        public void QuitGame()
        {
#if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
#else
            Application.Quit();
#endif
        }

        /// <summary>
        /// 更新角色選擇畫面的顯示。
        /// </summary>
        private void UpdateCharacterDisplay()
        {
            if (characters == null || characters.Length == 0) return;

            var config = characters[selectedCharacterIndex];
            if (characterNameText != null)
                characterNameText.text = config.displayName;
            if (characterImage != null)
                characterImage.sprite = config.sprite;
        }

        /// <summary>
        /// 切換顯示的面板（隱藏其他面板）。
        /// </summary>
        private void SetActivePanel(GameObject panel)
        {
            if (mainMenuPanel != null) mainMenuPanel.SetActive(mainMenuPanel == panel);
            if (characterSelectPanel != null) characterSelectPanel.SetActive(characterSelectPanel == panel);
            if (mapSelectPanel != null) mapSelectPanel.SetActive(mapSelectPanel == panel);
            if (upgradePanel != null) upgradePanel.SetActive(upgradePanel == panel);
            if (settingsPanel != null) settingsPanel.SetActive(settingsPanel == panel);
        }
    }
}
