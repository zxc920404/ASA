using UnityEngine;

namespace VampireSurvivors.Infrastructure
{
    /// <summary>
    /// Android 建置設定 — 定義 Android 平台的建置參數與設定說明。
    /// 包含 targetSdkVersion、minSdkVersion、AAB 格式、簽署金鑰等設定。
    /// </summary>
    /// <remarks>
    /// Unity Player Settings 建議設定：
    /// 
    /// [Build Settings]
    /// - Build System: Gradle
    /// - Export Project: false
    /// - Build App Bundle (AAB): true
    /// 
    /// [Player Settings > Other Settings]
    /// - Package Name: com.yourcompany.vampiresurvivors
    /// - Minimum API Level: Android 7.0 (API Level 24)
    /// - Target API Level: Android 14.0 (API Level 34)
    /// - Scripting Backend: IL2CPP
    /// - Target Architectures: ARM64
    /// - Internet Access: Auto
    /// 
    /// [Player Settings > Publishing Settings]
    /// - Custom Keystore: true
    /// - Keystore Path: 設定正式簽署金鑰路徑
    /// - Keystore Password: 設定金鑰庫密碼
    /// - Key Alias: 設定金鑰別名
    /// - Key Password: 設定金鑰密碼
    /// 
    /// [AAB 大小控制]
    /// - 啟用 Strip Engine Code
    /// - 啟用 Managed Stripping Level: High
    /// - 壓縮紋理使用 ASTC 格式
    /// - 音訊壓縮使用 Vorbis（品質 70%）
    /// - 目標 AAB 大小: ≤ 150 MB
    /// </remarks>
    public class AndroidBuildConfig : MonoBehaviour
    {
        /// <summary>最低 API Level。</summary>
        public const int MinSdkVersion = 24;

        /// <summary>目標 API Level。</summary>
        public const int TargetSdkVersion = 34;

        /// <summary>AAB 大小上限（MB）。</summary>
        public const int MaxAabSizeMB = 150;

        /// <summary>版本號格式。</summary>
        [SerializeField] private string versionFormat = "v{0}.{1}.{2}";

        /// <summary>主版本號。</summary>
        [SerializeField] private int majorVersion = 1;

        /// <summary>次版本號。</summary>
        [SerializeField] private int minorVersion = 0;

        /// <summary>修訂版本號。</summary>
        [SerializeField] private int patchVersion = 0;

        /// <summary>
        /// 取得格式化的版本號字串。
        /// </summary>
        /// <returns>版本號字串（例如 v1.0.0）。</returns>
        public string GetVersionString()
        {
            return string.Format(versionFormat, majorVersion, minorVersion, patchVersion);
        }

#if UNITY_EDITOR
        /// <summary>
        /// 在 Editor 中套用建議的 Android 建置設定。
        /// </summary>
        [ContextMenu("套用 Android 建置設定")]
        private void ApplyBuildSettings()
        {
            UnityEditor.PlayerSettings.Android.minSdkVersion =
                (UnityEditor.AndroidSdkVersions)MinSdkVersion;
            UnityEditor.PlayerSettings.Android.targetSdkVersion =
                (UnityEditor.AndroidSdkVersions)TargetSdkVersion;
            UnityEditor.PlayerSettings.SetScriptingBackend(
                UnityEditor.BuildTargetGroup.Android,
                UnityEditor.ScriptingImplementation.IL2CPP);
            UnityEditor.PlayerSettings.Android.targetArchitectures =
                UnityEditor.AndroidArchitecture.ARM64;
            UnityEditor.PlayerSettings.bundleVersion =
                $"{majorVersion}.{minorVersion}.{patchVersion}";

            Debug.Log($"[AndroidBuildConfig] 已套用 Android 建置設定。" +
                      $"版本: {GetVersionString()}, " +
                      $"minSdk: {MinSdkVersion}, targetSdk: {TargetSdkVersion}");
        }
#endif
    }
}
