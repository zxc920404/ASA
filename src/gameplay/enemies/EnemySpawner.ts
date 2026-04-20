import Phaser from 'phaser';
import { EnemyConfig } from '../../data/types';
import { ObjectPool } from '../../core/pool/ObjectPool';
import { ObjectPoolManager } from '../../core/pool/ObjectPoolManager';
import { EnemyBase } from './EnemyBase';
import { eventBus } from '../../core/events/EventBus';
import { GameEventNames } from '../../core/events/GameEvents';

const MAX_ENEMIES = 200;
const OFFSCREEN_SKIP_THRESHOLD = 100;

export class EnemySpawner {
  private scene: Phaser.Scene;
  private enemyPool!: ObjectPool<EnemyBase>;
  private playerPos: Phaser.Math.Vector2;
  private activeEnemies: Set<EnemyBase> = new Set();
  private frameCounter: number = 0;
  private enemyConfigs: Map<string, EnemyConfig> = new Map();

  constructor(
    scene: Phaser.Scene,
    poolManager: ObjectPoolManager,
    playerPos: Phaser.Math.Vector2,
    enemyConfigs: EnemyConfig[],
  ) {
    this.scene = scene;
    this.playerPos = playerPos;

    for (const cfg of enemyConfigs) {
      this.enemyConfigs.set(cfg.enemyId, cfg);
    }

    // Register enemy pool
    const defaultConfig = enemyConfigs[0] ?? {
      enemyId: 'enemy_bat', displayName: 'Bat', atlasFrame: 'enemy-bat',
      baseHP: 20, baseDamage: 5, moveSpeed: 80, bodySize: 12, xpValue: 1,
      isBoss: false, dropTable: [],
    };

    this.enemyPool = poolManager.register(
      { poolId: 'enemy_normal', preAllocateCount: 50, maxBatchExpansion: 10 },
      () => new EnemyBase(scene, defaultConfig),
    );

    // Listen for enemy killed to despawn
    eventBus.on(GameEventNames.ENEMY_KILLED, (_e: { enemyId: string; position: { x: number; y: number } }) => {
      this.despawnDeadEnemies();
    });
  }

  get activeCount(): number { return this.activeEnemies.size; }

  spawnEnemies(_enemyTypes: string[], count: number, statMultiplier: number): void {
    for (let i = 0; i < count; i++) {
      if (this.activeEnemies.size >= MAX_ENEMIES) return;

      const pos = this.getSpawnPosition();
      const enemy = this.enemyPool.spawn(pos.x, pos.y, statMultiplier);
      enemy.setTarget(this.playerPos);
      this.activeEnemies.add(enemy);
    }
  }

  update(delta: number): void {
    this.frameCounter++;
    const cam = this.scene.cameras.main;
    const camBounds = new Phaser.Geom.Rectangle(
      cam.scrollX - 50, cam.scrollY - 50,
      cam.width + 100, cam.height + 100,
    );

    for (const enemy of this.activeEnemies) {
      if (enemy.currentHP <= 0) continue;

      // Skip offscreen enemies every other frame when count > threshold
      const onScreen = camBounds.contains(enemy.sprite.x, enemy.sprite.y);
      if (!onScreen && this.activeEnemies.size > OFFSCREEN_SKIP_THRESHOLD && this.frameCounter % 2 !== 0) {
        continue;
      }

      enemy.setTarget(this.playerPos);
      enemy.update(delta);
    }

    this.despawnDeadEnemies();
  }

  getActiveEnemies(): EnemyBase[] {
    return Array.from(this.activeEnemies).filter(e => e.currentHP > 0);
  }

  private despawnDeadEnemies(): void {
    for (const enemy of this.activeEnemies) {
      if (enemy.currentHP <= 0) {
        this.enemyPool.despawn(enemy);
        this.activeEnemies.delete(enemy);
      }
    }
  }

  private getSpawnPosition(): { x: number; y: number } {
    const cam = this.scene.cameras.main;
    const margin = 80;

    // Pick a random edge (0=top, 1=right, 2=bottom, 3=left)
    const edge = Math.floor(Math.random() * 4);
    let x: number, y: number;

    switch (edge) {
      case 0: // top
        x = cam.scrollX + Math.random() * cam.width;
        y = cam.scrollY - margin;
        break;
      case 1: // right
        x = cam.scrollX + cam.width + margin;
        y = cam.scrollY + Math.random() * cam.height;
        break;
      case 2: // bottom
        x = cam.scrollX + Math.random() * cam.width;
        y = cam.scrollY + cam.height + margin;
        break;
      default: // left
        x = cam.scrollX - margin;
        y = cam.scrollY + Math.random() * cam.height;
        break;
    }

    return { x, y };
  }
}
