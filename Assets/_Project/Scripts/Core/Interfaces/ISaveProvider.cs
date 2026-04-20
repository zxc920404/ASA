namespace VampireSurvivors.Core
{
    /// <summary>
    /// 存檔資料提供者介面 — 抽象化儲存後端，
    /// 使不同平台（Android 檔案系統、WebGL PlayerPrefs）
    /// 可透過統一介面進行存檔操作。
    /// </summary>
    public interface ISaveProvider
    {
        /// <summary>
        /// 將 JSON 資料儲存至指定鍵值。
        /// </summary>
        /// <param name="key">存檔鍵值。</param>
        /// <param name="jsonData">JSON 格式的存檔資料。</param>
        void Save(string key, string jsonData);

        /// <summary>
        /// 讀取指定鍵值的存檔資料。
        /// </summary>
        /// <param name="key">存檔鍵值。</param>
        /// <returns>JSON 格式的存檔資料。</returns>
        string Load(string key);

        /// <summary>
        /// 刪除指定鍵值的存檔資料。
        /// </summary>
        /// <param name="key">存檔鍵值。</param>
        void Delete(string key);

        /// <summary>
        /// 檢查指定鍵值的存檔是否存在。
        /// </summary>
        /// <param name="key">存檔鍵值。</param>
        /// <returns>若存檔存在則回傳 true。</returns>
        bool Exists(string key);
    }
}
