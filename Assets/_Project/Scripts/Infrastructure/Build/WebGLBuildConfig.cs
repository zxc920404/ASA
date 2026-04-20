using UnityEngine;

namespace VampireSurvivors.Infrastructure
{
    /// <summary>
    /// WebGL 建置設定 — 定義 WebGL 平台的建置參數與設定說明。
    /// 包含壓縮格式、記憶體大小、引擎裁剪等設定。
    /// </summary>
    /// <remarks>
    /// Unity Player Settings 建議設定：
    /// 
    /// [Player Settings > Publishing Settings]
    /// - Compression Format: Brotli
    /// - Decompression Fallback: true（相容不支援 Brotli 的伺服器）
    /// 
    /// [Player Settings > Other Settings]
    /// - Strip Engine Code: true
    /// - Managed Stripping Level: High
    /// - Exception Support: Explicitly Thrown Exceptions Only
    /// - Memory Size: 256 MB
    /// 
    /// [平台差異處理]
    /// - 輸入：使用 KeyboardMouseInputAdapter（WASD + 滑鼠）
    /// - 存檔：使用 PlayerPrefsSaveProvider（IndexedDB）
    /// - 音效：需用戶互動後才能播放（瀏覽器限制）
    /// - 檔案系統：停用原生檔案系統存取
    /// 
    /// [WebGL 限制]
    /// - 不支援多執行緒
    /// - 不支援原生檔案系統
    /// - 音訊需用戶互動後才能播放
    /// - 記憶體受瀏覽器限制
    /// </remarks>
    public class WebGLBuildConfig : MonoBehaviour
    {
        /// <summary>WebGL 記憶體大小（MB）。</summary>
        public const int MemorySizeMB = 256;

        /// <summary>建議壓縮格式。</summary>
        public const string CompressionFormat = "Brotli";

        /// <summary>是否為 WebGL 環境。</summary>
        public static bool IsWebGL
        {
            get
            {
#if UNITY_WEBGL && !UNITY_EDITOR
                return true;
#else
                return false;
#endif
            }
        }

        /// <summary>
        /// 初始化 WebGL 特定設定。
        /// </summary>
        private void Awake()
        {
            if (!IsWebGL) return;

            ConfigureWebGLDefaults();
        }

        /// <summary>
        /// 設定 WebGL 環境預設值。
        /// </summary>
        private void ConfigureWebGLDefaults()
        {
            // 停用不支援的功能
            Application.targetFrameRate = 60;

            Debug.Log("[WebGLBuildConfig] WebGL 環境初始化完成。" +
                      "輸入: WASD + 滑鼠, 存檔: PlayerPrefs/IndexedDB");
        }

#if UNITY_EDITOR
        /// <summary>
        /// 在 Editor 中套用建議的 WebGL 建置設定。
        /// </summary>
        [ContextMenu("套用 WebGL 建置設定")]
        private void ApplyBuildSettings()
        {
            UnityEditor.PlayerSettings.WebGL.memorySize = MemorySizeMB;
            UnityEditor.PlayerSettings.WebGL.compressionFormat =
                UnityEditor.WebGLCompressionFormat.Brotli;
            UnityEditor.PlayerSettings.WebGL.decompressionFallback = true;
            UnityEditor.PlayerSettings.SetScriptingBackend(
                UnityEditor.BuildTargetGroup.WebGL,
                UnityEditor.ScriptingImplementation.IL2CPP);
            UnityEditor.PlayerSettings.stripEngineCode = true;

            Debug.Log($"[WebGLBuildConfig] 已套用 WebGL 建置設定。" +
                      $"記憶體: {MemorySizeMB}MB, 壓縮: {CompressionFormat}");
        }
#endif
    }
}
