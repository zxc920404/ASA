using UnityEngine;
using UnityEngine.UI;
using TMPro;
using VampireSurvivors.Core;

namespace VampireSurvivors.UI
{
    /// <summary>
    /// HUD 控制器 — 顯示生命值條、經驗值條、等級、遊戲時間、擊殺數、裝備圖示，
    /// 並在玩家受傷時觸發紅色閃爍效果。
    /// </summary>
    public class HUDController : MonoBehaviour
    {
        [Header("生命值與經驗值")]
        /// <summary>生命值條 Slider。</summary>
        [SerializeField] private Slider hpBar;
        /// <summary>經驗值條 Slider。</summary>
        [SerializeField] private Slider xpBar;

        [Header("文字資訊")]
        /// <summary>當前等級文字。</summary>
        [SerializeField] private TextMeshProUGUI levelText;
        /// <summary>遊戲經過時間文字。</summary>
        [SerializeField] private TextMeshProUGUI timeText;
        /// <summary>擊殺數文字。</summary>
        [SerializeField] private TextMeshProUGUI killCountText;

        [Header("裝備圖示")]
        /// <summary>武器圖示容器。</summary>
        [SerializeField] private Transform weaponIconContainer;
        /// <summary>被動道具圖示容器。</summary>
        [SerializeField] private Transform passiveIconContainer;
        /// <summary>裝備圖示 Prefab。</summary>
        [SerializeField] private GameObject equipmentIconPrefab;

        [Header("受傷閃爍")]
        /// <summary>受傷紅色閃爍覆蓋層。</summary>
        [SerializeField] private Image damageFlashOverlay;
        /// <summary>閃爍持續時間。</summary>
        [SerializeField] private float flashDuration = 0.2f;

        /// <summary>閃爍計時器。</summary>
        private float flashTimer;

        /// <summary>當前擊殺數。</summary>
        private int killCount;

        /// <summary>遊戲經過時間。</summary>
        private float gameTime;

        private void OnEnable()
        {
            EventBus.Subscribe<PlayerDamagedEvent>(OnPlayerDamaged);
            EventBus.Subscribe<PlayerLevelUpEvent>(OnPlayerLevelUp);
            EventBus.Subscribe<EnemyKilledEvent>(OnEnemyKilled);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<PlayerDamagedEvent>(OnPlayerDamaged);
            EventBus.Unsubscribe<PlayerLevelUpEvent>(OnPlayerLevelUp);
            EventBus.Unsubscribe<EnemyKilledEvent>(OnEnemyKilled);
        }

        private void Update()
        {
            UpdateGameTime();
            UpdateFlashEffect();
        }

        /// <summary>
        /// 更新遊戲經過時間顯示。
        /// </summary>
        private void UpdateGameTime()
        {
            gameTime += Time.deltaTime;
            if (timeText != null)
            {
                int minutes = Mathf.FloorToInt(gameTime / 60f);
                int seconds = Mathf.FloorToInt(gameTime % 60f);
                timeText.text = $"{minutes:00}:{seconds:00}";
            }
        }

        /// <summary>
        /// 更新受傷紅色閃爍效果。
        /// </summary>
        private void UpdateFlashEffect()
        {
            if (flashTimer <= 0f) return;

            flashTimer -= Time.deltaTime;
            if (damageFlashOverlay != null)
            {
                float alpha = Mathf.Clamp01(flashTimer / flashDuration) * 0.4f;
                damageFlashOverlay.color = new Color(1f, 0f, 0f, alpha);
            }
        }

        /// <summary>
        /// 更新生命值條。
        /// </summary>
        /// <param name="current">當前生命值。</param>
        /// <param name="max">最大生命值。</param>
        public void UpdateHP(float current, float max)
        {
            if (hpBar != null)
                hpBar.value = max > 0f ? current / max : 0f;
        }

        /// <summary>
        /// 更新經驗值條。
        /// </summary>
        /// <param name="current">當前經驗值。</param>
        /// <param name="threshold">升級所需經驗值。</param>
        public void UpdateXP(float current, float threshold)
        {
            if (xpBar != null)
                xpBar.value = threshold > 0f ? current / threshold : 0f;
        }

        /// <summary>
        /// 更新等級顯示。
        /// </summary>
        public void UpdateLevel(int level)
        {
            if (levelText != null)
                levelText.text = $"Lv.{level}";
        }

        /// <summary>
        /// 更新裝備圖示。
        /// </summary>
        /// <param name="weaponIcons">武器圖示陣列。</param>
        /// <param name="passiveIcons">被動道具圖示陣列。</param>
        public void UpdateEquipmentIcons(Sprite[] weaponIcons, Sprite[] passiveIcons)
        {
            RefreshIcons(weaponIconContainer, weaponIcons);
            RefreshIcons(passiveIconContainer, passiveIcons);
        }

        /// <summary>
        /// 刷新指定容器內的圖示。
        /// </summary>
        private void RefreshIcons(Transform container, Sprite[] icons)
        {
            if (container == null || equipmentIconPrefab == null) return;

            // 清除現有圖示
            for (int i = container.childCount - 1; i >= 0; i--)
                Destroy(container.GetChild(i).gameObject);

            if (icons == null) return;

            foreach (var icon in icons)
            {
                var obj = Instantiate(equipmentIconPrefab, container);
                var img = obj.GetComponent<Image>();
                if (img != null)
                    img.sprite = icon;
            }
        }

        /// <summary>
        /// 玩家受傷事件處理：觸發紅色閃爍。
        /// </summary>
        private void OnPlayerDamaged(PlayerDamagedEvent e)
        {
            flashTimer = flashDuration;
        }

        /// <summary>
        /// 玩家升級事件處理：更新等級顯示。
        /// </summary>
        private void OnPlayerLevelUp(PlayerLevelUpEvent e)
        {
            UpdateLevel(e.NewLevel);
        }

        /// <summary>
        /// 敵人被擊殺事件處理：更新擊殺數。
        /// </summary>
        private void OnEnemyKilled(EnemyKilledEvent e)
        {
            killCount++;
            if (killCountText != null)
                killCountText.text = killCount.ToString();
        }

        /// <summary>
        /// 重置 HUD 狀態（新遊戲開始時呼叫）。
        /// </summary>
        public void ResetHUD()
        {
            killCount = 0;
            gameTime = 0f;
            flashTimer = 0f;
            if (killCountText != null) killCountText.text = "0";
            if (levelText != null) levelText.text = "Lv.1";
            if (timeText != null) timeText.text = "00:00";
            if (hpBar != null) hpBar.value = 1f;
            if (xpBar != null) xpBar.value = 0f;
        }
    }
}
