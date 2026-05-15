import { describe, it, expect, beforeEach, vi } from 'vitest';
import Phaser from 'phaser';
import { GameScene } from '../../src/scenes/GameScene';

describe('Collision Groups Setup', () => {
  let scene: GameScene;
  let game: Phaser.Game;

  beforeEach(() => {
    // Create a minimal Phaser game instance for testing
    game = new Phaser.Game({
      type: Phaser.HEADLESS,
      width: 800,
      height: 600,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: [GameScene],
    });

    scene = game.scene.getScene('Game') as GameScene;
  });

  it('should have physics world bounds set correctly', () => {
    // Wait for scene to be created
    return new Promise<void>((resolve) => {
      scene.events.once('create', () => {
        const bounds = scene.physics.world.bounds;
        expect(bounds.width).toBe(5000);
        expect(bounds.height).toBe(5000);
        game.destroy(true);
        resolve();
      });
      
      // Start the scene
      scene.scene.start();
    });
  });

  it('should enable physics on player sprite', () => {
    return new Promise<void>((resolve) => {
      scene.events.once('create', () => {
        // Access player through scene's public property
        const player = (scene as any).player;
        expect(player).toBeDefined();
        expect(player.sprite.body).toBeDefined();
        
        const body = player.sprite.body as Phaser.Physics.Arcade.Body;
        expect(body.collideWorldBounds).toBe(true);
        
        game.destroy(true);
        resolve();
      });
      
      scene.scene.start();
    });
  });

  it('should have collision groups configured message in console', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    
    return new Promise<void>((resolve) => {
      scene.events.once('create', () => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Arcade Physics collision groups configured')
        );
        
        consoleSpy.mockRestore();
        game.destroy(true);
        resolve();
      });
      
      scene.scene.start();
    });
  });
});
