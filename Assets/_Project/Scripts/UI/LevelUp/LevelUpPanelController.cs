using UnityEngine;
using UnityEngine.UI;
using TMPro;
using VampireSurvivors.Core;

namespace VampireSurvivors.UI
{
    /// <summary>
    /// 升級選項面板控制器 — 顯示 3 個升級選項卡片，玩家點選後套用升級並恢復遊戲。
    /// </summary>
    public class LevelUpPanelController : MonoBehaviour
    {
        /// <summary>升級面板根物件。</summary>
        [SerializeField] private GameObject panelRoot;

        /// <summary>升級選項卡片陣列（固定 3 個）。</summary>
        [SerializeField] private LevelUpCard[] cards = new LevelUpCard[3];

        /// <summary>當前顯示的升級選項資料。</summary>
        private UpgradeOptionData[] currentOptions;

        /// <summary>選項選擇回呼。</summary>
        private System.Action<int> onOptionSelected;

        /// <summary>
        /// 顯示升級面板並填入選項資料。
        /// </summary>
        /// <param name="options">3 個升級選項資料。</param>
        /// <param name="callback">玩家選擇後的回呼（傳入選項索引）。</param>
        public void Show(UpgradeOptionData[] options, System.Action<int> callback)
        {
            currentOptions = options;
            onOptionSelected = callback;

            for (int i = 0; i < cards.Length; i++)
            {
                if (i < options.Length && cards[i] != null)
                {
                    cards[i].Setup(options[i]);
                    cards[i].gameObject.SetActive(true);
                }
                else if (cards[i] != null)
                {
                    cards[i].gameObject.SetActive(false);
                }
            }

            if (panelRoot != null)
                panelRoot.SetActive(true);
        }

        /// <summary>
        /// 隱藏升級面板。
        /// </summary>
        public void Hide()
        {
            if (panelRoot != null)
                panelRoot.SetActive(false);
        }

        /// <summary>
        /// 玩家選擇升級選項（由 UI Button 呼叫）。
        /// </summary>
        /// <param name="index">選項索引（0~2）。</param>
        public void SelectOption(int index)
        {
            onOptionSelected?.Invoke(index);
            Hide();
        }
    }

    /// <summary>
    /// 升級選項卡片 — 顯示單一升級選項的圖示、名稱與描述。
    /// </summary>
    [System.Serializable]
    public class LevelUpCard : MonoBehaviour
    {
        /// <summary>選項圖示。</summary>
        [SerializeField] private Image icon;
        /// <summary>選項名稱文字。</summary>
        [SerializeField] private TextMeshProUGUI nameText;
        /// <summary>選項描述文字。</summary>
        [SerializeField] private TextMeshProUGUI descriptionText;

        /// <summary>
        /// 設定卡片顯示內容。
        /// </summary>
        public void Setup(UpgradeOptionData data)
        {
            if (icon != null) icon.sprite = data.icon;
            if (nameText != null) nameText.text = data.displayName;
            if (descriptionText != null) descriptionText.text = data.description;
        }
    }

    /// <summary>
    /// 升級選項資料結構 — 用於 UI 顯示。
    /// </summary>
    [System.Serializable]
    public struct UpgradeOptionData
    {
        /// <summary>選項圖示。</summary>
        public Sprite icon;
        /// <summary>選項顯示名稱。</summary>
        public string displayName;
        /// <summary>選項描述。</summary>
        public string description;
        /// <summary>是否為升級（而非新獲取）。</summary>
        public bool isUpgrade;
        /// <summary>對應的升級選項索引。</summary>
        public int optionIndex;
    }
}
