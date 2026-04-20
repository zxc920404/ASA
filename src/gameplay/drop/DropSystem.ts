import Phaser from 'phaser';
import { ObjectPool } from '../../core/pool/ObjectPool';
import { ObjectPoolManager } from '../../core/pool/ObjectPoolManager';
import { PoolableObject } from '../../core/pool/ObjectPool';
import { eventBus } from '../../core/events/EventBus';
import { GameEventNames, EnemyKilledEvent, XPCollectedEvent } from '../../core/events/GameEvents';

/** XP Gem poolable object */
export class XPGem implements PoolableObject {
  readonly gameObject: Phaser.GameObjects.GameObject;
  readonly sprite: Phaser.GameObjects.Sprite;
  xpValue: number = 1;
  private isActive: boolean = false;
  private attracted: boolean = false;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.sprite = scene.add.sprite(0, 0, 'xp_gem');
    this.sprite.setVisible(false);
    this.sprite.setActive(false);
    this.sprite.setScale(0.8);
    scene.physics.add.existing(this.sprite);
    (this.sprite.body as Phaser.Physics.Arcade.Body).setCircle(8);
    this.gameObject = this.sprite;
  }

  activate(x: number, y: number, xpValue: number = 1): void {
    this.isActive = true;
    this.attracted = false;
    this.xpValue = xpValue;
    this.sprite.setPosition(x, y);
    this.sprite.setVisible(true);
    this.sprite.setActive(true);
    (this.sprite.body as Phaser.Physics.Arcade.Body).enable = true;
  }

  deactivate(): void {
    this.isActive = false;
    this.attracted = false;
    this.sprite.setVisible(false);
    this.sprite.setActive(false);
    (this.sprite.body as Phaser.Physics.Arcade.Body).enable = false;
    (this.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
  }

  /** Attract toward player */
  attractTo(px: number, py: number, speed: number): void {
    if (!this.isActive) return;
    this.attracted = true;
    const dx = px - this.sprite.x;
    const dy = py - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 1) {
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      body.setVelocity((dx / dist) * speed, (dy / dist) * speed);
    }
  }

  get active(): boolean { return this.isActive; }
}

export class DropSystem {
  private scene: Phaser.Scene;
  private gemPool!: ObjectPool<XPGem>;
  private playerPos: Phaser.Math.Vector2;
  private getPickupRange: () => number;
  private activeGems: Set<XPGem> = new Set();
  private ambientSpawnTimer: number = 0;
  private ambientSpawnInterval: number = 3; // 每 3 秒生成一顆
  private mapWidth: number;
  private mapHeight: number;

  constructor(
    scene: Phaser.Scene,
    poolManager: ObjectPoolManager,
    playerPos: Phaser.Math.Vector2,
    getPickupRange: () => number,
    mapWidth: number = 3200,
    mapHeight: number = 3200,
  ) {
    this.scene = scene;
    this.playerPos = playerPos;
    this.getPickupRange = getPickupRange;
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;

    // Register XP gem pool
    this.gemPool = poolManager.register(
      { poolId: 'xp_gem', preAllocateCount: 80, maxBatchExpansion: 10 },
      () => new XPGem(scene),
    );

    // Listen for enemy kills
    eventBus.on<EnemyKilledEvent>(GameEventNames.ENEMY_KILLED, (e) => {
      this.spawnXPGem(e.position.x, e.position.y, e.xpValue);
    });
  }

  update(delta: number): void {
    const pickupRange = this.getPickupRange();
    const collectDist = 16;

    // 地圖隨機生成經驗球
    this.ambientSpawnTimer += delta / 1000;
    if (this.ambientSpawnTimer >= this.ambientSpawnInterval) {
      this.ambientSpawnTimer = 0;
      this.spawnAmbientGem();
    }

    for (const gem of this.activeGems) {
      if (!gem.active) {
        this.gemPool.despawn(gem);
        this.activeGems.delete(gem);
        continue;
      }

      const dx = this.playerPos.x - gem.sprite.x;
      const dy = this.playerPos.y - gem.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < pickupRange) {
        gem.attractTo(this.playerPos.x, this.playerPos.y, 350);
      }

      if (dist < collectDist) {
        const evt: XPCollectedEvent = { amount: gem.xpValue };
        eventBus.emit(GameEventNames.XP_COLLECTED, evt);
        this.gemPool.despawn(gem);
        this.activeGems.delete(gem);
      }
    }
  }

  /** 在玩家附近隨機位置生成一顆經驗球 */
  private spawnAmbientGem(): void {
    const cam = this.scene.cameras.main;
    // 在攝影機可視範圍內隨機位置
    const x = Phaser.Math.Clamp(
      cam.scrollX + Math.random() * cam.width,
      50, this.mapWidth - 50,
    );
    const y = Phaser.Math.Clamp(
      cam.scrollY + Math.random() * cam.height,
      50, this.mapHeight - 50,
    );
    this.spawnXPGem(x, y, 1);
  }

  private spawnXPGem(x: number, y: number, xpValue: number): void {
    const gem = this.gemPool.spawn(x, y, xpValue);
    this.activeGems.add(gem);
  }
}
