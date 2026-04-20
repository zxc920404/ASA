using System.IO;
using UnityEngine;
using VampireSurvivors.Core;

namespace VampireSurvivors.Infrastructure
{
    /// <summary>
    /// 檔案系統儲存提供者（Android 平台）—
    /// 使用 Application.persistentDataPath 將存檔資料以 JSON 檔案形式寫入裝置本地儲存空間。
    /// </summary>
    public class FileSaveProvider : ISaveProvider
    {
        /// <summary>
        /// 儲存根目錄路徑。
        /// </summary>
        private string BasePath => Application.persistentDataPath;

        /// <summary>
        /// 將 JSON 資料儲存至指定鍵值對應的檔案。
        /// </summary>
        /// <param name="key">存檔鍵值。</param>
        /// <param name="jsonData">JSON 格式的存檔資料。</param>
        public void Save(string key, string jsonData)
        {
            File.WriteAllText(Path.Combine(BasePath, key + ".json"), jsonData);
        }

        /// <summary>
        /// 讀取指定鍵值對應的檔案內容。
        /// </summary>
        /// <param name="key">存檔鍵值。</param>
        /// <returns>JSON 格式的存檔資料。</returns>
        public string Load(string key)
        {
            return File.ReadAllText(Path.Combine(BasePath, key + ".json"));
        }

        /// <summary>
        /// 刪除指定鍵值對應的存檔檔案。
        /// </summary>
        /// <param name="key">存檔鍵值。</param>
        public void Delete(string key)
        {
            File.Delete(Path.Combine(BasePath, key + ".json"));
        }

        /// <summary>
        /// 檢查指定鍵值對應的存檔檔案是否存在。
        /// </summary>
        /// <param name="key">存檔鍵值。</param>
        /// <returns>若檔案存在則回傳 true。</returns>
        public bool Exists(string key)
        {
            return File.Exists(Path.Combine(BasePath, key + ".json"));
        }
    }
}
