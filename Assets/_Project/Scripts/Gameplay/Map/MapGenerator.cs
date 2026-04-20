using UnityEngine;
using UnityEngine.Tilemaps;

namespace VampireSurvivors.Gameplay
{
    /// <summary>
    /// 地圖生成器 — 使用 Tilemap 系統生成遊戲地圖（100x100 Tile），
    /// 並在地圖上隨機放置裝飾物件（樹木、石頭、建築殘骸）。
    /// </summary>
    public class MapGenerator : MonoBehaviour
    {
        /// <summary>地面 Tilemap。</summary>
        [SerializeField] private Tilemap groundTilemap;

        /// <summary>裝飾物件 Tilemap。</summary>
        [SerializeField] private Tilemap decorationTilemap;

        /// <summary>地面 Tile 素材。</summary>
        [SerializeField] private TileBase groundTile;

        /// <summary>裝飾 Tile 素材陣列（樹木、石頭、建築殘骸等）。</summary>
        [SerializeField] private TileBase[] decorationTiles;

        /// <summary>地圖寬度（Tile 單位）。</summary>
        [SerializeField] private int mapWidth = 100;

        /// <summary>地圖高度（Tile 單位）。</summary>
        [SerializeField] private int mapHeight = 100;

        /// <summary>裝飾物件放置機率（0~1）。</summary>
        [SerializeField, Range(0f, 1f)] private float decorationDensity = 0.05f;

        /// <summary>隨機種子（0 表示使用隨機種子）。</summary>
        [SerializeField] private int seed;

        /// <summary>地圖半寬（世界座標）。</summary>
        public float HalfWidth => mapWidth * 0.5f;

        /// <summary>地圖半高（世界座標）。</summary>
        public float HalfHeight => mapHeight * 0.5f;

        private void Start()
        {
            GenerateMap();
        }

        /// <summary>
        /// 生成地圖：填充地面 Tile 並隨機放置裝飾物件。
        /// </summary>
        public void GenerateMap()
        {
            if (seed != 0)
                Random.InitState(seed);

            FillGround();
            PlaceDecorations();
        }

        /// <summary>
        /// 填充地面 Tile，以地圖中心為原點。
        /// </summary>
        private void FillGround()
        {
            if (groundTilemap == null || groundTile == null)
                return;

            int halfW = mapWidth / 2;
            int halfH = mapHeight / 2;

            for (int x = -halfW; x < halfW; x++)
            {
                for (int y = -halfH; y < halfH; y++)
                {
                    groundTilemap.SetTile(new Vector3Int(x, y, 0), groundTile);
                }
            }
        }

        /// <summary>
        /// 隨機放置裝飾物件，避開地圖中心區域（玩家出生點附近）。
        /// </summary>
        private void PlaceDecorations()
        {
            if (decorationTilemap == null || decorationTiles == null || decorationTiles.Length == 0)
                return;

            int halfW = mapWidth / 2;
            int halfH = mapHeight / 2;
            int safeZone = 5;

            for (int x = -halfW; x < halfW; x++)
            {
                for (int y = -halfH; y < halfH; y++)
                {
                    // 跳過出生點安全區域
                    if (Mathf.Abs(x) < safeZone && Mathf.Abs(y) < safeZone)
                        continue;

                    if (Random.value < decorationDensity)
                    {
                        int tileIndex = Random.Range(0, decorationTiles.Length);
                        decorationTilemap.SetTile(
                            new Vector3Int(x, y, 0), decorationTiles[tileIndex]);
                    }
                }
            }
        }
    }
}
