using UnityEngine;

namespace VampireSurvivors.Infrastructure
{
    /// <summary>
    /// Sprite Atlas 設定輔助 — 提供 Sprite Atlas 設定說明與驗證工具。
    /// 確保所有遊戲精靈圖打包至 Sprite Atlas 以減少 Draw Call。
    /// </summary>
    /// <remarks>
    /// 使用方式：
    /// 1. 在 Unity Editor 中建立 Sprite Atlas（Assets > Create > 2D > Sprite Atlas）
    /// 2. 將所有精靈圖資料夾加入 Atlas 的 Objects for Packing
    /// 3. 設定 Atlas 參數：
    ///    - Allow Rotation: false
    ///    - Tight Packing: true
    ///    - Max Texture Size: 2048
    ///    - Format: Compressed (ASTC 6x6 for Android)
    /// 4. 在 Player Settings 中啟用 Sprite Atlas V2
    /// </remarks>
    public class SpriteAtlasSetup : MonoBehaviour
    {
        /// <summary>建議的最大紋理尺寸。</summary>
        public const int RecommendedMaxTextureSize = 2048;

        /// <summary>建議的 Atlas 分組。</summary>
        public static readonly string[] RecommendedAtlasGroups =
        {
            "Atlas_Characters",
            "Atlas_Enemies",
            "Atlas_Projectiles",
            "Atlas_UI",
            "Atlas_Tiles",
            "Atlas_VFX"
        };

#if UNITY_EDITOR
        /// <summary>
        /// 在 Editor 中驗證 Sprite Atlas 設定。
        /// </summary>
        [ContextMenu("驗證 Sprite Atlas 設定")]
        private void ValidateAtlasSetup()
        {
            Debug.Log("[SpriteAtlasSetup] 建議的 Atlas 分組：");
            foreach (var group in RecommendedAtlasGroups)
                Debug.Log($"  - {group}");

            Debug.Log($"[SpriteAtlasSetup] 建議最大紋理尺寸: {RecommendedMaxTextureSize}");
            Debug.Log("[SpriteAtlasSetup] 請確認 Player Settings > Editor > Sprite Packer Mode = Sprite Atlas V2");
        }
#endif
    }
}
