using UnityEngine;
using VampireSurvivors.Core;

namespace VampireSurvivors.Infrastructure
{
    /// <summary>
    /// 存檔系統 — 負責遊戲進度的序列化、反序列化與持久化儲存。
    /// 透過預處理指令自動切換儲存後端：
    /// WebGL 使用 PlayerPrefsSaveProvider，其餘平台使用 FileSaveProvider。
    /// </summary>
    public class SaveSystem : MonoBehaviour
    {
        /// <summary>
        /// 存檔鍵值常數。
        /// </summary>
        private const string SaveKey = "save_data";

        /// <summary>
        /// 儲存後端提供者。
        /// </summary>
        private ISaveProvider _provider;

        /// <summary>
        /// 初始化時依據平台選擇對應的儲存後端。
        /// </summary>
        private void Awake()
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            _provider = new PlayerPrefsSaveProvider();
#else
            _provider = new FileSaveProvider();
#endif
        }

        /// <summary>
        /// 將存檔資料序列化為 JSON 並寫入儲存後端。
        /// </summary>
        /// <param name="data">要儲存的存檔資料。</param>
        public void SaveGame(SaveData data)
        {
            string json = JsonUtility.ToJson(data);
            _provider.Save(SaveKey, json);
        }

        /// <summary>
        /// 從儲存後端讀取存檔資料並反序列化。
        /// 若存檔不存在或資料損毀，則建立預設存檔。
        /// </summary>
        /// <returns>反序列化後的存檔資料。</returns>
        public SaveData LoadGame()
        {
            if (!_provider.Exists(SaveKey))
                return CreateDefaultSave();

            try
            {
                string json = _provider.Load(SaveKey);
                return JsonUtility.FromJson<SaveData>(json);
            }
            catch
            {
                return CreateDefaultSave();
            }
        }

        /// <summary>
        /// 建立預設存檔資料 — 金幣為零、永久升級皆為初始等級、
        /// 僅解鎖預設角色、版本號為當前應用程式版本。
        /// </summary>
        /// <returns>預設的存檔資料。</returns>
        public SaveData CreateDefaultSave()
        {
            return new SaveData
            {
                gold = 0,
                permanentUpgradeLevels = new int[5],
                unlockedCharacterIds = new[] { "default_character" },
                appVersion = Application.version
            };
        }
    }
}
