using UnityEngine;
using VampireSurvivors.Core;

namespace VampireSurvivors.Infrastructure
{
    /// <summary>
    /// PlayerPrefs 儲存提供者（WebGL 平台）—
    /// 使用 Unity PlayerPrefs（底層對應 IndexedDB）作為存檔後端，
    /// 適用於不支援原生檔案系統存取的 WebGL 環境。
    /// </summary>
    public class PlayerPrefsSaveProvider : ISaveProvider
    {
        /// <summary>
        /// 將 JSON 資料儲存至 PlayerPrefs 的指定鍵值。
        /// </summary>
        /// <param name="key">存檔鍵值。</param>
        /// <param name="jsonData">JSON 格式的存檔資料。</param>
        public void Save(string key, string jsonData)
        {
            PlayerPrefs.SetString(key, jsonData);
            PlayerPrefs.Save();
        }

        /// <summary>
        /// 讀取 PlayerPrefs 中指定鍵值的存檔資料。
        /// </summary>
        /// <param name="key">存檔鍵值。</param>
        /// <returns>JSON 格式的存檔資料；若鍵值不存在則回傳空字串。</returns>
        public string Load(string key)
        {
            return PlayerPrefs.GetString(key, "");
        }

        /// <summary>
        /// 刪除 PlayerPrefs 中指定鍵值的存檔資料。
        /// </summary>
        /// <param name="key">存檔鍵值。</param>
        public void Delete(string key)
        {
            PlayerPrefs.DeleteKey(key);
        }

        /// <summary>
        /// 檢查 PlayerPrefs 中指定鍵值的存檔是否存在。
        /// </summary>
        /// <param name="key">存檔鍵值。</param>
        /// <returns>若鍵值存在則回傳 true。</returns>
        public bool Exists(string key)
        {
            return PlayerPrefs.HasKey(key);
        }
    }
}
