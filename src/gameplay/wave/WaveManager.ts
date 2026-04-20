import { EnemyConfig } from '../../data/types';
import { EnemySpawner } from '../enemies/EnemySpawner';
import { eventBus } from '../../core/events/EventBus';
import { GameEventNames } from '../../core/events/GameEvents';

/**
 * 波次管理器 — 動態難度遞增系統
 *
 * 規則：
 * - 每 1 分鐘：怪物數值（HP、傷害）增長 7%
 * - 每 2 分鐘：生成速度增加 10%
 * - 每 3 分鐘：解鎖新怪物種類
 * - 每 5 分鐘：生成一隻 Boss
 */

// 怪物解鎖順序（每 3 分鐘解鎖下一種）
const ENEMY_UNLOCK_ORDER = [
  'enemy_bandit',        // 0 分鐘起
  'enemy_snake',         // 3 分鐘起
  'enemy_zombie_priest', // 6 分鐘起
  'enemy_bat',           // 9 分鐘起
  'enemy_cultist',       // 12 分鐘起
];

const BOSS_ID = 'enemy_blood_lord';
const BOSS_INTERVAL = 300;        // 每 5 分鐘
const STAT_GROWTH_INTERVAL = 60;  // 每 1 分鐘
const STAT_GROWTH_RATE = 0.07;    // 7%
const SPEED_BOOST_INTERVAL = 120; // 每 2 分鐘
const SPEED_BOOST_RATE = 0.10;    // 10%
const UNLOCK_INTERVAL = 180;      // 每 3 分鐘
const BASE_SPAWN_INTERVAL = 1.8;  // 基礎生成間隔（秒）
const BASE_SPAWN_COUNT = 3;       // 基礎每次生成數量

export class WaveManager {
  private spawner: EnemySpawner;
  private enemyConfigs: Map<string, EnemyConfig>;
  private spawnTimer: number = 0;
  private bossesSpawned: number = 0;

  // 動態數值
  private statMultiplier: number = 1.0;
  private spawnSpeedMultiplier: number = 1.0;
  private unlockedEnemyCount: number = 1; // 開始只有山賊

  constructor(enemyConfigs: EnemyConfig[], spawner: EnemySpawner) {
    this.spawner = spawner;
    this.enemyConfigs = new Map();
    for (const cfg of enemyConfigs) {
      this.enemyConfigs.set(cfg.enemyId, cfg);
    }
  }

  update(delta: number, gameTime: number): void {
    // 計算動態難度
    this.updateDifficulty(gameTime);

    // Boss 生成檢查
    this.checkBossSpawn(gameTime);

    // 一般怪物生成
    this.spawnTimer += delta / 1000;
    const currentInterval = BASE_SPAWN_INTERVAL / this.spawnSpeedMultiplier;

    if (this.spawnTimer >= currentInterval) {
      this.spawnTimer -= currentInterval;
      this.spawnWaveEnemies(gameTime);
    }
  }

  private updateDifficulty(gameTime: number): void {
    // 每 1 分鐘數值增長 7%（複利）
    const statMinutes = Math.floor(gameTime / STAT_GROWTH_INTERVAL);
    this.statMultiplier = Math.pow(1 + STAT_GROWTH_RATE, statMinutes);

    // 每 2 分鐘生成速度增加 10%（複利）
    const speedMinutes = Math.floor(gameTime / SPEED_BOOST_INTERVAL);
    this.spawnSpeedMultiplier = Math.pow(1 + SPEED_BOOST_RATE, speedMinutes);

    // 每 3 分鐘解鎖新怪物
    this.unlockedEnemyCount = Math.min(
      ENEMY_UNLOCK_ORDER.length,
      1 + Math.floor(gameTime / UNLOCK_INTERVAL),
    );
  }

  private spawnWaveEnemies(gameTime: number): void {
    // 生成數量隨時間微增
    const extraCount = Math.floor(gameTime / 120); // 每 2 分鐘 +1
    const count = BASE_SPAWN_COUNT + extraCount;

    // 從已解鎖的怪物中隨機選擇
    const availableTypes = ENEMY_UNLOCK_ORDER.slice(0, this.unlockedEnemyCount);

    this.spawner.spawnEnemies(availableTypes, count, this.statMultiplier);
  }

  private checkBossSpawn(gameTime: number): void {
    const expectedBosses = Math.floor(gameTime / BOSS_INTERVAL);
    if (expectedBosses > this.bossesSpawned) {
      this.bossesSpawned = expectedBosses;
      // Boss 數值也隨難度增長
      this.spawner.spawnEnemies([BOSS_ID], 1, this.statMultiplier);

      eventBus.emit(GameEventNames.WAVE_CHANGED, {
        waveIndex: this.bossesSpawned,
        difficultyMultiplier: this.statMultiplier,
      });
    }
  }

  getStatMultiplier(): number { return this.statMultiplier; }
  getSpawnSpeedMultiplier(): number { return this.spawnSpeedMultiplier; }
  getUnlockedEnemyCount(): number { return this.unlockedEnemyCount; }
}
