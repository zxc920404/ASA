import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Phaser from 'phaser';
import { GameScene } from '../../src/scenes/GameScene';

describe('Tilemap Implementation (Task 3.3.2)', () => {
  let game: Phaser.Game;
  let scene: GameScene;

  beforeEach(() => {
    // Create a headless Phaser game for testing
    game = new Phaser.Game({
      type: Phaser.HEADLESS,
      width: 800,
      height: 600,
      scene: [GameScene],
      physics: {
        default: 'arcade',
        arcade: {
          debug: false,
        },
      },
      callbacks: {
        postBoot: () => {
          game.loop.stop();
        },
      },
    });

    scene = game.scene.getScene('Game') as GameScene;
  });

  afterEach(() => {
    game.destroy(true);
  });

  it('should create a tilemap with at least 100x100 tiles', (done) => {
    // Wait for scene to be created
    scene.events.once('create', () => {
      try {
        // Check if tilemap was created
        const tilemaps = scene.children.list.filter(
          (child) => child instanceof Phaser.Tilemaps.TilemapLayer
        );

        expect(tilemaps.length).toBeGreaterThan(0);

        // Get the first tilemap layer
        const tilemapLayer = tilemaps[0] as Phaser.Tilemaps.TilemapLayer;
        const tilemap = tilemapLayer.tilemap;

        // Verify tilemap dimensions (at least 100x100)
        expect(tilemap.width).toBeGreaterThanOrEqual(100);
        expect(tilemap.height).toBeGreaterThanOrEqual(100);

        // Verify tile size is set
        expect(tilemap.tileWidth).toBeGreaterThan(0);
        expect(tilemap.tileHeight).toBeGreaterThan(0);

        // Verify total map size matches expected dimensions (5000x5000)
        const totalWidth = tilemap.width * tilemap.tileWidth;
        const totalHeight = tilemap.height * tilemap.tileHeight;
        expect(totalWidth).toBe(5000);
        expect(totalHeight).toBe(5000);

        done();
      } catch (error) {
        done(error);
      }
    });

    // Start the scene
    scene.scene.start();
  });

  it('should use Phaser.Tilemaps API', (done) => {
    scene.events.once('create', () => {
      try {
        // Check if tilemap layer exists
        const tilemapLayers = scene.children.list.filter(
          (child) => child instanceof Phaser.Tilemaps.TilemapLayer
        );

        expect(tilemapLayers.length).toBeGreaterThan(0);

        // Verify it's using Phaser's Tilemap system
        const layer = tilemapLayers[0] as Phaser.Tilemaps.TilemapLayer;
        expect(layer.tilemap).toBeInstanceOf(Phaser.Tilemaps.Tilemap);
        expect(layer.tileset).toBeDefined();

        done();
      } catch (error) {
        done(error);
      }
    });

    scene.scene.start();
  });

  it('should have tiles properly placed in the tilemap', (done) => {
    scene.events.once('create', () => {
      try {
        const tilemapLayers = scene.children.list.filter(
          (child) => child instanceof Phaser.Tilemaps.TilemapLayer
        );

        const layer = tilemapLayers[0] as Phaser.Tilemaps.TilemapLayer;
        const tilemap = layer.tilemap;

        // Check that tiles are placed (not all empty)
        let tileCount = 0;
        for (let y = 0; y < tilemap.height; y++) {
          for (let x = 0; x < tilemap.width; x++) {
            const tile = layer.getTileAt(x, y);
            if (tile) {
              tileCount++;
            }
          }
        }

        // Expect at least 90% of tiles to be filled (10000 tiles total)
        expect(tileCount).toBeGreaterThan(9000);

        done();
      } catch (error) {
        done(error);
      }
    });

    scene.scene.start();
  });

  it('should set appropriate tile size (50x50 pixels)', (done) => {
    scene.events.once('create', () => {
      try {
        const tilemapLayers = scene.children.list.filter(
          (child) => child instanceof Phaser.Tilemaps.TilemapLayer
        );

        const layer = tilemapLayers[0] as Phaser.Tilemaps.TilemapLayer;
        const tilemap = layer.tilemap;

        // Verify tile size is 50x50 as specified in the implementation
        expect(tilemap.tileWidth).toBe(50);
        expect(tilemap.tileHeight).toBe(50);

        done();
      } catch (error) {
        done(error);
      }
    });

    scene.scene.start();
  });
});
