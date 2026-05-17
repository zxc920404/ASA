import Phaser from 'phaser';
import { ObjectPoolManager } from '../core/pool/ObjectPoolManager';
import { InputController } from '../infrastructure/input/InputController';
import { PlayerCharacter } from '../gameplay/player/PlayerCharacter';
import { WeaponSystem } from '../gameplay/weapons/WeaponSystem';
import { Projectile } from '../gameplay/weapons/Projectile';
import { EnemySpawner } from '../gameplay/enemies/EnemySpawner';
import { WaveManager } from '../gameplay/wave/WaveManager';
import { DropSystem } from '../gameplay/drop/DropSystem';
import { LevelUpSystem, LevelUpOption } from '../gameplay/level-up/LevelUpSystem';
import { DamageTextManager } from '../ui/hud/DamageTextManager';
import { PauseMenuUI } from '../ui/menus/PauseMenuUI';
import { AudioManager } from '../infrastructure/audio/AudioManager';
import { SaveSystem } from '../infrastructure/save/SaveSystem';
import { LocalStorageSaveProvider } from '../infrastructure/save/LocalStorageSaveProvider';
import { CharacterConfig, WeaponConfig, EnemyConfig, PassiveItemConfig, PoolConfigData } from '../data/types';
import { ObjectPool } from '../core/pool/ObjectPool';
import { GameState } from '../core/types';

// Re-export GameState for tests
export { GameState } from '../core/types';

import weaponsData from '../data/weapons.json';
import enemiesData from '../data/enemies.json';
import passiveItemsData from '../data/passive-items.json';
import poolConfigData from '../data/pool-config.json';

const MAP_WIDTH = 5000;
const MAP_HEIGHT = 5000;
const GAME_DURATION = 30 * 60; // 30 分鐘（秒）

export class GameScene extends Phaser.Scene {
  public poolManager!: ObjectPoolManager;
  private inputController!: InputController;
  private player!: PlayerCharacter;
  private weaponSystem!: WeaponSystem;
  private enemySpawner!: EnemySpawner;
  private waveManager!: WaveManager;
  private dropSystem!: DropSystem;
  private levelUpSystem!: LevelUpSystem;
  private projectilePool!: ObjectPool<Projectile>;
  public damageTextManager!: DamageTextManager;
  // @ts-expect-error - pauseMenuUI is initialized but not directly accessed
  private pauseMenuUI!: PauseMenuUI;
  private audioManager!: AudioManager;
  private saveSystem!: SaveSystem;

  public gameTime: number = 0;
  public killCount: number = 0;
  public gameState: GameState = GameState.Playing;

  // HUD texts
  private timeText!: Phaser.GameObjects.Text;
  private hpText!: Phaser.GameObjects.Graphics; // 改為 Graphics 用於繪製血條
  private levelText!: Phaser.GameObjects.Text;
  private killText!: Phaser.GameObjects.Text;
  // XP bar
  private xpBarBg!: Phaser.GameObjects.Graphics;
  private xpBarFill!: Phaser.GameObjects.Graphics;
  private xpText!: Phaser.GameObjects.Text;
  // Equipment slots UI
  private equipmentContainer!: Phaser.GameObjects.Container;

  // Level-up UI
  private levelUpPanel?: Phaser.GameObjects.Container;
  private levelUpPanelObjects: Phaser.GameObjects.GameObject[] = [];
  // End screen UI
  private endScreenPanel?: Phaser.GameObjects.Container;
  // Map boundary warning
  private boundaryWarning!: Phaser.GameObjects.Graphics;
  // Visual effects
  private vignette!: Phaser.GameObjects.Graphics;

  // 效能優化：HUD 更新計時器
  private hudUpdateTimer: number = 0;
  private hudUpdateInterval: number = 100; // 每 100ms 更新一次 HUD（10 FPS）
  private lastHP: number = 0;
  private lastXP: number = 0;
  private lastLevel: number = 0;
  private lastKillCount: number = 0;
  
  // 效能監控
  private fpsText!: Phaser.GameObjects.Text;
  private debugText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'Game' });
  }

  create(data: { characterId?: string; mapId?: string }): void {
    this.gameState = GameState.Playing;
    this.gameTime = 0;
    this.killCount = 0;

    // 1. Ground
    this.createGround();

    // 2. Pool Manager - 初始化並依據 pool-config.json 預分配所有對象池
    this.poolManager = new ObjectPoolManager();
    this.initializeObjectPools();

    // 4. Player
    const characterId = data?.characterId ?? 'char_swordsman';
    const charConfig = this.getCharacterConfig(characterId);
    this.player = new PlayerCharacter(this, charConfig, MAP_WIDTH, MAP_HEIGHT);

    // 5. Input
    this.inputController = new InputController(this);

    // 6. Enemy Spawner
    const enemyConfigs = enemiesData as EnemyConfig[];
    this.enemySpawner = new EnemySpawner(this, this.poolManager, this.player.position, enemyConfigs);

    // 7. Weapon System
    this.weaponSystem = new WeaponSystem(
      this, this.poolManager, this.player.position,
      () => this.enemySpawner.getActiveEnemies(),
      () => this.player.getEffectiveStat('attackPower'),
    );

    // 根據角色給予初始武器（資料驅動）
    const allWeapons = weaponsData as WeaponConfig[];
    const startingWeapon = allWeapons.find(w => w.weaponId === charConfig.startingWeaponId);
    if (startingWeapon) {
      this.weaponSystem.addWeapon(startingWeapon);
    } else {
      console.warn(`Starting weapon ${charConfig.startingWeaponId} not found for character ${characterId}`);
    }

    // 套用角色天賦（StatModifier）
    if (charConfig.talentModifiers && charConfig.talentModifiers.length > 0) {
      for (const modifier of charConfig.talentModifiers) {
        this.player.applyStatModifier(modifier);
      }
    }

    // 8. Wave Manager
    const enemyConfigsList = enemiesData as EnemyConfig[];
    this.waveManager = new WaveManager(enemyConfigsList, this.enemySpawner);

    // 9. Drop System
    this.dropSystem = new DropSystem(
      this, this.poolManager, this.player.position,
      () => this.player.getEffectiveStat('pickupRange'),
      MAP_WIDTH, MAP_HEIGHT,
    );

    // 10. Level-Up System
    const allPassives = passiveItemsData as PassiveItemConfig[];
    this.levelUpSystem = new LevelUpSystem(
      this.weaponSystem, allWeapons, allPassives,
      (options) => this.showLevelUpUI(options),
      charConfig.startingWeaponId, // 傳入初始武器 ID，避免在升級選項中重複出現
    );

    // 11. Camera
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // 12. Physics
    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // 13. 設定 Arcade Physics 碰撞群組
    this.setupCollisionGroups();

    // 14. HUD
    this.createHUD();

    // 14.5 Map boundary warning overlay
    this.boundaryWarning = this.add.graphics().setScrollFactor(0).setDepth(90).setAlpha(0);

    // 14.6 效能監控 UI
    this.fpsText = this.add.text(10, this.cameras.main.height - 60, 'FPS: 60', {
      fontSize: '14px',
      color: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 5, y: 3 },
    }).setScrollFactor(0).setDepth(200);

    this.debugText = this.add.text(10, this.cameras.main.height - 40, '', {
      fontSize: '12px',
      color: '#ffff00',
      backgroundColor: '#000000',
      padding: { x: 5, y: 3 },
    }).setScrollFactor(0).setDepth(200);

    // 15. Damage Text Manager
    this.damageTextManager = new DamageTextManager(this);

    // 16. Pause Menu
    this.pauseMenuUI = new PauseMenuUI(this, {
      onPause: () => {
        this.gameState = GameState.Paused;
      },
      onResume: () => {
        this.gameState = GameState.Playing;
      },
      onRestart: () => {
        this.scene.restart();
      },
      onMainMenu: () => {
        this.scene.start('MainMenu');
      },
    });

    // 17. Audio Manager
    const saveProvider = new LocalStorageSaveProvider();
    this.saveSystem = new SaveSystem(saveProvider);
    const saveData = this.saveSystem.load();
    this.audioManager = new AudioManager(this, saveData.settings.musicVolume, saveData.settings.sfxVolume);

    // Try to play BGM (will silently skip if audio not loaded)
    const mapId = data?.mapId ?? 'forest';
    this.audioManager.playBGM(`bgm-${mapId}`);
    
    // 18. 輸出所有物件池的統計資訊（所有系統初始化完成後）
    this.logPoolStatistics();
  }

  /**
   * 初始化 ObjectPoolManager 並依據 pool-config.json 預分配所有對象池
   * 這個方法在遊戲開始前預先分配所有需要的物件池，避免遊戲進行中一次性生成大量物件造成幀率驟降
   * 
   * 注意：部分物件池（enemy_normal, xp_gem）由各自的系統（EnemySpawner, DropSystem）註冊
   * 這裡只預分配那些尚未由其他系統註冊的物件池
   */
  private initializeObjectPools(): void {
    console.log('[GameScene] Initializing object pools from pool-config.json...');
    
    // 讀取 pool-config.json
    const poolConfig = poolConfigData as PoolConfigData;
    
    // 依據配置預分配所有對象池
    for (const poolEntry of poolConfig.pools) {
      const { poolId, preAllocateCount, maxBatchExpansion } = poolEntry;
      
      console.log(`[GameScene] Checking pool: ${poolId} (preAllocate: ${preAllocateCount}, maxExpansion: ${maxBatchExpansion})`);
      
      // 根據 poolId 創建對應的工廠函數
      switch (poolId) {
        case 'projectile':
          // 投射物池在這裡註冊（WeaponSystem 會使用）
          this.projectilePool = this.poolManager.register(
            { poolId, preAllocateCount, maxBatchExpansion },
            () => new Projectile(this)
          );
          console.log(`[GameScene] ✓ Registered pool: ${poolId} (${preAllocateCount} objects pre-allocated)`);
          break;
          
        case 'enemy_normal':
          // 敵人池由 EnemySpawner 註冊，這裡跳過
          console.log(`[GameScene] → Pool ${poolId} will be registered by EnemySpawner`);
          break;
          
        case 'enemy_boss':
          // Boss 敵人池（目前未使用，預留）
          console.log(`[GameScene] → Pool ${poolId} reserved for future use`);
          break;
          
        case 'xp_gem':
          // XP 寶石池由 DropSystem 註冊，這裡跳過
          console.log(`[GameScene] → Pool ${poolId} will be registered by DropSystem`);
          break;
          
        case 'item_drop':
          // TODO: 實作 ItemDrop poolable object
          console.warn(`[GameScene] ⚠ Pool ${poolId} not yet implemented, skipping...`);
          break;
          
        case 'damage_text':
          // DamageText 使用自己的池管理系統（在 DamageTextManager 中）
          // 這裡不需要註冊到 ObjectPoolManager
          console.log(`[GameScene] → Pool ${poolId} managed by DamageTextManager`);
          break;
          
        case 'vfx':
          // TODO: 實作 VFX poolable object
          console.warn(`[GameScene] ⚠ Pool ${poolId} not yet implemented, skipping...`);
          break;
          
        default:
          console.warn(`[GameScene] ⚠ Unknown pool ID: ${poolId}, skipping...`);
          break;
      }
    }
    
    console.log('[GameScene] Object pool initialization phase 1 complete. Additional pools will be registered by their respective systems.');
  }

  /**
   * 輸出所有物件池的統計資訊
   * 在所有系統初始化完成後調用，用於驗證物件池是否正確預分配
   */
  private logPoolStatistics(): void {
    console.log('\n========== Object Pool Statistics ==========');
    
    const allStats = this.poolManager.getAllStats();
    
    if (allStats.size === 0) {
      console.warn('[GameScene] No pools registered in ObjectPoolManager');
      return;
    }
    
    let totalPreAllocated = 0;
    let totalActive = 0;
    let totalPeak = 0;
    
    allStats.forEach((stats, poolId) => {
      console.log(`\n[Pool: ${poolId}]`);
      console.log(`  Pre-allocated: ${stats.preAllocated} objects`);
      console.log(`  Currently active: ${stats.currentActive} objects`);
      console.log(`  Peak usage: ${stats.peakActive} objects`);
      console.log(`  Total expansions: ${stats.totalExpansions} times`);
      
      // 計算使用率
      if (stats.preAllocated > 0) {
        const utilizationRate = ((stats.peakActive / stats.preAllocated) * 100).toFixed(1);
        console.log(`  Peak utilization: ${utilizationRate}%`);
        
        // 警告：如果峰值使用率超過 80%，建議增加預分配數量
        if (stats.peakActive / stats.preAllocated > 0.8) {
          console.warn(`  ⚠ High utilization detected! Consider increasing preAllocateCount for ${poolId}`);
        }
      }
      
      // 警告：如果發生過擴容，說明預分配數量可能不足
      if (stats.totalExpansions > 0) {
        console.warn(`  ⚠ Pool expanded ${stats.totalExpansions} times during gameplay. Consider increasing preAllocateCount.`);
      }
      
      totalPreAllocated += stats.preAllocated;
      totalActive += stats.currentActive;
      totalPeak += stats.peakActive;
    });
    
    console.log('\n========== Summary ==========');
    console.log(`Total pools registered: ${allStats.size}`);
    console.log(`Total objects pre-allocated: ${totalPreAllocated}`);
    console.log(`Total objects currently active: ${totalActive}`);
    console.log(`Total peak usage: ${totalPeak}`);
    console.log('============================================\n');
  }

  /**
   * 設定 Arcade Physics 碰撞群組
   * 建立玩家、敵人、子彈、掉落物等群組，並設定群組之間的碰撞檢測規則
   */
  private setupCollisionGroups(): void {
    // 注意：Phaser Arcade Physics 不像 Matter.js 有內建的碰撞群組系統
    // 我們使用 Phaser.Physics.Arcade.Group 來組織物件，並手動設定碰撞規則
    
    // 玩家群組（單一物件）
    // 玩家已經在 PlayerCharacter 中啟用了物理 body
    if (this.player.sprite.body) {
      const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
      body.setCollideWorldBounds(true); // 玩家不能超出地圖邊界
      body.setSize(32, 32); // 設定碰撞體積
      body.setOffset(0, 0); // 設定碰撞偏移
    }

    // 敵人群組
    // 敵人的物理 body 在 EnemyBase 中啟用
    // 這裡我們確保敵人的碰撞設定正確
    // 敵人之間的碰撞推擠在 resolveEnemyCollisions() 中手動處理（效能考量）

    // 投射物群組
    // 投射物的物理 body 在 Projectile 中啟用
    // 投射物與敵人的碰撞在 checkProjectileEnemyCollisions() 中手動處理（效能考量）

    // 掉落物群組
    // 掉落物的物理 body 在 DropSystem 中啟用
    // 掉落物與玩家的碰撞在 DropSystem.update() 中手動處理（吸附效果）

    // 碰撞規則說明：
    // 1. 玩家 vs 敵人：接觸傷害（手動檢測於 checkEnemyContactDamage）
    // 2. 投射物 vs 敵人：造成傷害（手動檢測於 checkProjectileEnemyCollisions）
    // 3. 玩家 vs 掉落物：拾取（手動檢測於 DropSystem.update）
    // 4. 敵人 vs 敵人：推擠（手動檢測於 resolveEnemyCollisions）
    // 5. 投射物 vs 投射物：無碰撞
    // 6. 掉落物 vs 掉落物：無碰撞
    // 7. 掉落物 vs 敵人：無碰撞
    
    // 使用手動碰撞檢測而非 Phaser 內建碰撞系統的原因：
    // - 更好的效能控制（可以跳幀、限制檢測範圍）
    // - 更靈活的碰撞邏輯（如 AoE 穿透、吸附效果）
    // - 避免大量物件時的效能問題（200+ 敵人 + 100+ 投射物）
    
    console.log('[GameScene] Arcade Physics collision groups configured (manual collision detection)');
  }

  update(_time: number, delta: number): void {
    // 根據 GameState 控制更新邏輯
    switch (this.gameState) {
      case GameState.Playing:
        // Playing: 正常遊戲更新
        this.updateGameplay(_time, delta);
        break;

      case GameState.Paused:
        // Paused: 暫停時不更新遊戲邏輯，僅保持渲染
        // 不執行任何遊戲邏輯更新
        break;

      case GameState.LevelUp:
        // LevelUp: 升級選擇時暫停遊戲邏輯
        // 物理系統已在 showLevelUpUI() 中暫停
        // 不執行任何遊戲邏輯更新
        break;

      case GameState.GameOver:
      case GameState.Victory:
        // GameOver/Victory: 結束狀態，不更新遊戲邏輯
        // 結算畫面已顯示，等待玩家選擇
        break;

      default:
        // 未知狀態，預設不更新
        console.warn(`Unknown GameState: ${this.gameState}`);
        break;
    }
  }

  private updateGameplay(_time: number, delta: number): void {
    // 累積遊戲時間
    this.gameTime += delta / 1000;

    // Input
    this.inputController.update(delta);
    const dir = this.inputController.getMovement();
    this.player.move(dir);
    this.player.update(delta);

    // Systems
    this.weaponSystem.update(delta);
    this.waveManager.update(delta, this.gameTime);
    this.enemySpawner.update(delta);
    this.dropSystem.update(delta);

    // Update projectiles
    this.updateProjectiles(delta);

    // Projectile-enemy collision (manual check)
    this.checkProjectileEnemyCollisions();

    // Enemy-player contact damage (manual check every frame)
    this.checkEnemyContactDamage();

    // Enemy-enemy collision (push apart)
    this.resolveEnemyCollisions();

    // HUD 更新節流（每 100ms 更新一次，而不是每幀）
    this.hudUpdateTimer += delta;
    if (this.hudUpdateTimer >= this.hudUpdateInterval) {
      this.hudUpdateTimer = 0;
      this.updateHUD();
    }

    // Map boundary warning
    this.updateBoundaryWarning();

    // 效能監控更新（每 500ms 更新一次）
    if (Math.floor(_time / 500) !== Math.floor((_time - delta) / 500)) {
      this.updatePerformanceMonitor();
    }
  }

  private updateProjectiles(delta: number): void {
    const active = this.projectilePool.getActiveObjects();
    for (const proj of active) {
      if (proj.update(delta)) {
        this.projectilePool.despawn(proj);
      }
    }
  }

  private checkProjectileEnemyCollisions(): void {
    const projectiles = Array.from(this.projectilePool.getActiveObjects());
    const enemies = this.enemySpawner.getActiveEnemies();

    for (const proj of projectiles) {
      if (!proj.active) continue;
      const projRadius = proj.aoeRadius > 0 ? proj.aoeRadius : 12;

      for (const enemy of enemies) {
        if (enemy.currentHP <= 0) continue;
        const dx = proj.sprite.x - enemy.sprite.x;
        const dy = proj.sprite.y - enemy.sprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hitDist = projRadius + enemy.config.bodySize;

        if (dist < hitDist) {
          const finalDmg = this.weaponSystem.calculateDamage(proj.damage);
          enemy.takeDamage(finalDmg);

          // AoE 投射物可以穿透（不消失），普通投射物命中後消失
          if (proj.aoeRadius <= 0) {
            this.projectilePool.despawn(proj);
          }
          if (enemy.currentHP <= 0) this.killCount++;
          if (proj.aoeRadius <= 0) break; // 普通投射物只打一個
        }
      }
    }
  }

  private checkEnemyContactDamage(): void {
    const enemies = this.enemySpawner.getActiveEnemies();
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;
    const playerRadius = 16;

    for (const enemy of enemies) {
      if (enemy.currentHP <= 0) continue;
      const dx = enemy.sprite.x - px;
      const dy = enemy.sprite.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const contactDist = playerRadius + enemy.config.bodySize;

      if (dist < contactDist) {
        const dmg = enemy.getContactDamage();
        if (dmg > 0) {
          this.player.takeDamage(dmg);
        }
      }
    }
  }

  private resolveEnemyCollisions(): void {
    // 效能優化：降低碰撞檢測頻率，每 3 幀檢測一次
    if (this.game.loop.frame % 3 !== 0) return;
    
    const enemies = this.enemySpawner.getActiveEnemies();
    const len = enemies.length;
    
    // 效能優化：敵人太多時跳過碰撞檢測
    if (len > 80) return;
    
    // 效能優化：只處理螢幕內的敵人
    const cam = this.cameras.main;
    const camBounds = new Phaser.Geom.Rectangle(
      cam.scrollX, cam.scrollY,
      cam.width, cam.height,
    );
    
    const onScreenEnemies = enemies.filter(e => 
      camBounds.contains(e.sprite.x, e.sprite.y)
    );
    
    const screenLen = onScreenEnemies.length;
    
    // 簡單的 O(n²) 碰撞推擠，只處理螢幕內的敵人
    for (let i = 0; i < screenLen; i++) {
      const a = onScreenEnemies[i];
      if (a.currentHP <= 0) continue;
      
      for (let j = i + 1; j < screenLen; j++) {
        const b = onScreenEnemies[j];
        if (b.currentHP <= 0) continue;

        const dx = b.sprite.x - a.sprite.x;
        const dy = b.sprite.y - a.sprite.y;
        const distSq = dx * dx + dy * dy; // 使用平方距離避免 sqrt
        const minDist = a.config.bodySize + b.config.bodySize;
        const minDistSq = minDist * minDist;

        if (distSq < minDistSq && distSq > 0.01) {
          const dist = Math.sqrt(distSq);
          const overlap = (minDist - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          a.sprite.x -= nx * overlap;
          a.sprite.y -= ny * overlap;
          b.sprite.x += nx * overlap;
          b.sprite.y += ny * overlap;
        }
      }
    }
  }

  private showLevelUpUI(options: LevelUpOption[]): void {
    // Empty options = no more pending level-ups, resume game
    if (options.length === 0) {
      this.closeLevelUpUI();
      return;
    }

    this.gameState = GameState.LevelUp;
    this.physics.pause();

    // Clean up any existing panel first
    this.closeLevelUpObjects();

    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;

    this.levelUpPanelObjects = [];

    // Dim overlay at depth 200
    const overlay = this.add.rectangle(cx, cy, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.6)
      .setScrollFactor(0).setDepth(200).setInteractive();
    this.levelUpPanelObjects.push(overlay);

    // Title at depth 201
    const title = this.add.text(cx, cy - 120, `升級！Lv ${this.levelUpSystem.currentLevel}`, {
      fontSize: '24px', color: '#ffff00', align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    this.levelUpPanelObjects.push(title);

    // Option buttons at depth 202+
    options.forEach((opt, i) => {
      const y = cy - 40 + i * 70;
      const bg = this.add.rectangle(cx, y, 300, 56, 0x333366, 0.9)
        .setStrokeStyle(1, 0x6666aa)
        .setScrollFactor(0).setDepth(202)
        .setInteractive({ useHandCursor: true });
      const txt = this.add.text(cx, y, `${opt.displayName}\n${opt.description}`, {
        fontSize: '14px', color: '#ffffff', align: 'center',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(203);

      bg.on('pointerover', () => bg.setFillStyle(0x4444aa, 1));
      bg.on('pointerout', () => bg.setFillStyle(0x333366, 0.9));
      bg.on('pointerdown', () => {
        this.levelUpSystem.applyOption(opt);
        this.closeLevelUpObjects();
        // Check if there's another pending level-up
        this.levelUpSystem.checkPendingLevelUp();
      });

      this.levelUpPanelObjects.push(bg, txt);
    });
  }

  private closeLevelUpObjects(): void {
    if (this.levelUpPanelObjects) {
      for (const obj of this.levelUpPanelObjects) {
        obj.destroy();
      }
      this.levelUpPanelObjects = [];
    }
  }

  private closeLevelUpUI(): void {
    this.closeLevelUpObjects();
    if (this.levelUpPanel) {
      this.levelUpPanel.destroy(true);
      this.levelUpPanel = undefined;
    }
    this.gameState = GameState.Playing;
    this.physics.resume();
  }

  private updateBoundaryWarning(): void {
    const margin = 200;
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;

    // Calculate how close to edge (0 = safe, 1 = at edge)
    const leftDist = px / margin;
    const rightDist = (MAP_WIDTH - px) / margin;
    const topDist = py / margin;
    const bottomDist = (MAP_HEIGHT - py) / margin;
    const closeness = 1 - Math.min(leftDist, rightDist, topDist, bottomDist, 1);

    if (closeness > 0) {
      const camW = this.cameras.main.width;
      const camH = this.cameras.main.height;
      const alpha = closeness * 0.4;

      this.boundaryWarning.clear();
      this.boundaryWarning.setAlpha(1);

      // Red vignette edges
      const thickness = 8 + closeness * 20;
      this.boundaryWarning.fillStyle(0xff0000, alpha);

      if (px < margin) this.boundaryWarning.fillRect(0, 0, thickness, camH);
      if (px > MAP_WIDTH - margin) this.boundaryWarning.fillRect(camW - thickness, 0, thickness, camH);
      if (py < margin) this.boundaryWarning.fillRect(0, 0, camW, thickness);
      if (py > MAP_HEIGHT - margin) this.boundaryWarning.fillRect(0, camH - thickness, camW, thickness);
    } else {
      this.boundaryWarning.clear();
    }
  }

  private updatePerformanceMonitor(): void {
    // 更新 FPS 顯示
    const fps = Math.round(this.game.loop.actualFps);
    const fpsColor = fps >= 50 ? '#00ff00' : fps >= 30 ? '#ffff00' : '#ff0000';
    this.fpsText.setText(`FPS: ${fps}`);
    this.fpsText.setColor(fpsColor);

    // 更新 Debug 資訊
    const enemyCount = this.enemySpawner.getActiveEnemies().length;
    const projectileCount = this.projectilePool.getActiveObjects().size;
    const dropCount = this.dropSystem.getActiveDropCount();
    
    this.debugText.setText(
      `敵人:${enemyCount} 投射物:${projectileCount} 掉落物:${dropCount}`
    );
  }

  private createGround(): void {
    // === 1. 建立 Tilemap（使用 Phaser.Tilemaps API，100x100 Tiles）===
    this.createTilemap();
    
    // === 2. 優化後的裝飾物（大幅減少數量）===
    this.createMapDecorations();
    
    // === 3. 創建暗角效果（固定在螢幕上）===
    this.vignette = this.add.graphics().setScrollFactor(0).setDepth(95);
    this.updateVignette();
  }

  /**
   * 建立 Tilemap（使用 Phaser.Tilemaps API）
   * - 地圖大小：100x100 tiles
   * - Tile 大小：50x50 像素
   * - 總地圖尺寸：5000x5000 像素（符合 MAP_WIDTH 和 MAP_HEIGHT）
   */
  private createTilemap(): void {
    // 定義 tile 尺寸和地圖尺寸
    const TILE_SIZE = 50;
    const MAP_TILES_WIDTH = 100;
    const MAP_TILES_HEIGHT = 100;

    // 生成 tileset 紋理（如果不存在）
    if (!this.textures.exists('tileset-grass')) {
      this.generateTilesetTexture();
    }

    // 建立空白 tilemap
    const map = this.make.tilemap({
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
      width: MAP_TILES_WIDTH,
      height: MAP_TILES_HEIGHT,
    });

    // 添加 tileset（使用生成的草地 tileset）
    const tileset = map.addTilesetImage('tileset-grass', 'tileset-grass', TILE_SIZE, TILE_SIZE, 0, 0);

    if (!tileset) {
      console.error('Failed to create tileset');
      return;
    }

    // 建立 Ground 圖層
    const groundLayer = map.createBlankLayer('Ground', tileset, 0, 0);

    if (!groundLayer) {
      console.error('Failed to create ground layer');
      return;
    }

    // 填充地圖 tiles（使用隨機草地 tiles 增加變化）
    for (let y = 0; y < MAP_TILES_HEIGHT; y++) {
      for (let x = 0; x < MAP_TILES_WIDTH; x++) {
        // 隨機選擇 4 種草地 tile 之一（tile index 0-3）
        const tileIndex = Math.floor(Math.random() * 4);
        groundLayer.putTileAt(tileIndex, x, y);
      }
    }

    // 設定圖層深度（在背景層）
    groundLayer.setDepth(-20);

    // 添加半透明 overlay 增加氛圍
    const overlay = this.add.graphics();
    overlay.fillStyle(0x0a0a0a, 0.25);
    overlay.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    overlay.setDepth(-18);

    console.log(`Tilemap created: ${MAP_TILES_WIDTH}x${MAP_TILES_HEIGHT} tiles (${MAP_WIDTH}x${MAP_HEIGHT} pixels)`);
  }

  /**
   * 生成 tileset 紋理（4 種草地 tile 變化）
   * 每個 tile 為 50x50 像素
   */
  private generateTilesetTexture(): void {
    const TILE_SIZE = 50;
    const TILES_COUNT = 4; // 4 種草地變化
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE * TILES_COUNT;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d')!;

    // 生成 4 種不同的草地 tile
    for (let i = 0; i < TILES_COUNT; i++) {
      const offsetX = i * TILE_SIZE;
      
      // 基礎草地顏色（每個 tile 略有不同）
      const hueVariation = i * 5;
      const baseColors = [
        `#${(0x3a6b1e + hueVariation).toString(16)}`,
        `#${(0x2d5016 + hueVariation).toString(16)}`,
        `#${(0x243f12 + hueVariation).toString(16)}`,
      ];

      // 繪製漸層背景
      const gradient = ctx.createRadialGradient(
        offsetX + TILE_SIZE / 2, TILE_SIZE / 2, 0,
        offsetX + TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE / 2
      );
      gradient.addColorStop(0, baseColors[0]);
      gradient.addColorStop(0.7, baseColors[1]);
      gradient.addColorStop(1, baseColors[2]);
      ctx.fillStyle = gradient;
      ctx.fillRect(offsetX, 0, TILE_SIZE, TILE_SIZE);

      // 添加草地紋理細節
      const detailCount = 40 + Math.random() * 20;
      for (let j = 0; j < detailCount; j++) {
        const x = offsetX + Math.random() * TILE_SIZE;
        const y = Math.random() * TILE_SIZE;
        const radius = 0.5 + Math.random() * 2;
        const brightness = 0.7 + Math.random() * 0.5;

        ctx.fillStyle = `rgba(${Math.floor(45 * brightness)}, ${Math.floor(90 * brightness)}, ${Math.floor(30 * brightness)}, ${0.3 + Math.random() * 0.4})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 添加草叢線條
      ctx.strokeStyle = 'rgba(30, 60, 20, 0.4)';
      ctx.lineWidth = 1;
      for (let j = 0; j < 10; j++) {
        const x = offsetX + Math.random() * TILE_SIZE;
        const y = Math.random() * TILE_SIZE;
        const length = 2 + Math.random() * 6;
        const angle = Math.random() * Math.PI * 2;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
        ctx.stroke();
      }

      // 添加隨機深色斑塊
      if (Math.random() > 0.5) {
        const patchX = offsetX + Math.random() * TILE_SIZE;
        const patchY = Math.random() * TILE_SIZE;
        const patchRadius = 5 + Math.random() * 10;
        const patchGradient = ctx.createRadialGradient(patchX, patchY, 0, patchX, patchY, patchRadius);
        patchGradient.addColorStop(0, 'rgba(10, 20, 10, 0.3)');
        patchGradient.addColorStop(1, 'rgba(10, 20, 10, 0)');
        ctx.fillStyle = patchGradient;
        ctx.beginPath();
        ctx.arc(patchX, patchY, patchRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 將 canvas 轉換為 Phaser texture
    this.textures.addCanvas('tileset-grass', canvas);
    console.log('Tileset texture generated: 4 grass tile variations');
  }
  
  private createMapDecorations(): void {
    // 大幅減少裝飾物密度以提升效能
    // 從每 300x300 區域 10 個 → 每 1000x1000 區域 5 個
    const decorationCount = Math.floor((MAP_WIDTH * MAP_HEIGHT) / (1000 * 1000) * 5);
    
    const decorations = this.add.graphics();
    decorations.setDepth(-10);
    
    for (let i = 0; i < decorationCount; i++) {
      const x = Math.random() * MAP_WIDTH;
      const y = Math.random() * MAP_HEIGHT;
      const type = Math.floor(Math.random() * 3); // 減少裝飾物種類以簡化繪製
      
      switch (type) {
        case 0: // 草叢（深綠色小圓，移除模糊效果）
          const grassSize = 15 + Math.random() * 25;
          decorations.fillStyle(0x1a3a1a, 0.4 + Math.random() * 0.3);
          decorations.fillCircle(x, y, grassSize);
          break;
          
        case 1: // 石頭（灰色橢圓，移除陰影）
          const rockW = 20 + Math.random() * 30;
          const rockH = 15 + Math.random() * 25;
          decorations.fillStyle(0x3a3a3a, 0.5 + Math.random() * 0.3);
          decorations.fillEllipse(x, y, rockW, rockH);
          break;
          
        case 2: // 地面陰影（深色圓形）
          const shadowSize = 25 + Math.random() * 40;
          decorations.fillStyle(0x000000, 0.15 + Math.random() * 0.2);
          decorations.fillCircle(x, y, shadowSize);
          break;
      }
    }
  }
  
  private updateVignette(): void {
    const camW = this.cameras.main.width;
    const camH = this.cameras.main.height;
    
    this.vignette.clear();
    
    // 繪製更柔和的漸層暗角（大幅優化效能）
    const gradientSteps = 40; // 從 120 降到 40，減少繪製次數
    const maxAlpha = 0.25; // 從 0.7 降到 0.25，避免過暗
    
    for (let i = 0; i < gradientSteps; i++) {
      const progress = i / gradientSteps;
      // 使用平方函數讓暗角過渡更自然
      const alpha = Math.pow(progress, 2) * maxAlpha;
      const thickness = 1;
      
      this.vignette.lineStyle(thickness, 0x000000, alpha);
      this.vignette.strokeRect(i, i, camW - i * 2, camH - i * 2);
    }
    
    // 移除四角額外暗化以提升效能
  }
  
  private getCharacterConfig(characterId: string): CharacterConfig {
    const characters = this.cache.json.get('characters-config') as CharacterConfig[] | undefined;
    if (characters) {
      const found = characters.find(c => c.characterId === characterId);
      if (found) return found;
    }
    // 預設角色：青衣劍客
    return {
      characterId: 'char_blue_swordsman',
      displayName: '青衣劍客',
      atlasFrame: 'char-swordsman',
      baseHP: 100,
      baseMoveSpeed: 165,
      baseAttackPower: 1.0,
      basePickupRange: 50,
      startingWeaponId: 'weapon_wind_sword',
      talentName: '輕功身法',
      talentDescription: '移動速度 +10%',
      talentModifiers: [{ stat: 'moveSpeed', value: 0.1, type: 'percent' }],
      unlockedByDefault: true,
      unlockCost: 0,
    };
  }

  private createHUD(): void {
    const camW = this.cameras.main.width;
    
    // 偵測是否為手機版
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const xpBarHeight = isMobile ? 14 : 18;
    
    // === 頂部 XP 經驗條（全寬，黃色漸層）===
    this.xpBarBg = this.add.graphics().setScrollFactor(0).setDepth(99);
    this.xpBarBg.fillStyle(0x1a1a2e, 0.95);
    this.xpBarBg.fillRect(0, 0, camW, xpBarHeight);
    this.xpBarBg.lineStyle(2, 0x665522, 1);
    this.xpBarBg.strokeRect(0, 0, camW, xpBarHeight);

    this.xpBarFill = this.add.graphics().setScrollFactor(0).setDepth(100);

    const xpFontSize = isMobile ? '11px' : '13px';
    this.xpText = this.add.text(camW / 2, xpBarHeight / 2 - 6, '', {
      fontSize: xpFontSize, 
      color: '#ffee88',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setScrollFactor(0).setDepth(101).setOrigin(0.5, 0);

    // === 左上角狀態面板（手機版縮小）===
    const panelX = isMobile ? 8 : 12;
    const panelY = xpBarHeight + (isMobile ? 6 : 10);
    const panelW = Math.min(isMobile ? camW * 0.32 : 240, 240);
    const panelH = isMobile ? 100 : 140;
    
    // 面板背景（深色半透明，帶漸層邊框）
    const hudBg = this.add.graphics().setScrollFactor(0).setDepth(98);
    hudBg.fillStyle(0x0a0a1a, isMobile ? 0.75 : 0.85);
    hudBg.fillRoundedRect(panelX, panelY, panelW, panelH, isMobile ? 6 : 10);
    // 漸層邊框效果
    hudBg.lineStyle(isMobile ? 2 : 3, 0x4466aa, 0.9);
    hudBg.strokeRoundedRect(panelX, panelY, panelW, panelH, isMobile ? 6 : 10);
    if (!isMobile) {
      hudBg.lineStyle(1, 0x6688cc, 0.6);
      hudBg.strokeRoundedRect(panelX + 2, panelY + 2, panelW - 4, panelH - 4, 8);
    }
    
    // 文字樣式（手機版縮小）
    const textFontSize = isMobile ? '12px' : '15px';
    const labelFontSize = isMobile ? '10px' : '12px';
    
    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: textFontSize, 
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: isMobile ? 3 : 4,
    };
    
    const labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: labelFontSize, 
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: isMobile ? 2 : 3,
    };
    
    const rowGap = isMobile ? 20 : 25;
    const leftPad = panelX + (isMobile ? 10 : 15);
    const valuePad = panelX + (isMobile ? 60 : 85);
    
    // 時間
    const timeY = panelY + (isMobile ? 12 : 15);
    this.add.text(leftPad, timeY, '⏱', labelStyle).setScrollFactor(0).setDepth(100);
    this.timeText = this.add.text(valuePad, timeY, '', textStyle).setScrollFactor(0).setDepth(100);
    
    // 等級
    const levelY = timeY + rowGap;
    this.add.text(leftPad, levelY, 'Lv', labelStyle).setScrollFactor(0).setDepth(100);
    this.levelText = this.add.text(valuePad, levelY, '', textStyle).setScrollFactor(0).setDepth(100);
    
    // 擊殺數
    const killY = levelY + rowGap;
    this.add.text(leftPad, killY, '💀', labelStyle).setScrollFactor(0).setDepth(100);
    this.killText = this.add.text(valuePad, killY, '', textStyle).setScrollFactor(0).setDepth(100);
    
    // HP 血條（紅色漸層）
    const hpY = killY + rowGap;
    this.add.text(leftPad, hpY, '❤', labelStyle).setScrollFactor(0).setDepth(100);
    
    // HP 條背景
    const hpBarX = leftPad;
    const hpBarY = hpY + (isMobile ? 14 : 20);
    const hpBarW = panelW - (isMobile ? 20 : 30);
    const hpBarH = isMobile ? 12 : 16;
    
    const hpBarBg = this.add.graphics().setScrollFactor(0).setDepth(99);
    hpBarBg.fillStyle(0x330000, 0.9);
    hpBarBg.fillRoundedRect(hpBarX, hpBarY, hpBarW, hpBarH, 4);
    hpBarBg.lineStyle(isMobile ? 1 : 2, 0x660000, 1);
    hpBarBg.strokeRoundedRect(hpBarX, hpBarY, hpBarW, hpBarH, 4);
    
    // HP 條填充（會在 updateHUD 中繪製）
    this.hpText = this.add.graphics().setScrollFactor(0).setDepth(100);
    
    // HP 數值文字
    const hpValueFontSize = isMobile ? '10px' : '12px';
    this.add.text(hpBarX + hpBarW / 2, hpBarY + hpBarH / 2, '', {
      fontSize: hpValueFontSize,
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: isMobile ? 2 : 3,
    }).setScrollFactor(0).setDepth(101).setOrigin(0.5, 0.5).setName('hpValueText');

    // 裝備欄 + 能力欄（螢幕底部）
    this.equipmentContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(100);
    this.updateEquipmentSlots();
  }

  private updateEquipmentSlots(): void {
    this.equipmentContainer.removeAll(true);

    const camW = this.cameras.main.width;
    const camH = this.cameras.main.height;
    
    // 偵測是否為手機版
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // 手機版格子尺寸縮小
    const slotSize = isMobile ? 36 : 42;
    const slotGap = isMobile ? 4 : 6;
    const slotsPerRow = 6;
    const totalWidth = slotsPerRow * (slotSize + slotGap) - slotGap;
    const startX = (camW - totalWidth) / 2;
    
    // Safe area bottom padding（避開手機瀏覽器工具列）
    const safeBottom = isMobile ? 20 : 12;
    const weaponBarHeight = slotSize + 20; // 格子高度 + 標籤高度
    const passiveBarHeight = slotSize + 20;
    
    const weaponY = camH - safeBottom - weaponBarHeight - passiveBarHeight - slotGap;
    const passiveY = camH - safeBottom - passiveBarHeight;

    // 武器欄標籤
    const labelFontSize = isMobile ? '11px' : '13px';
    const weaponLabel = this.add.text(startX - 2, weaponY - (isMobile ? 16 : 20), '⚔ 武器', {
      fontSize: labelFontSize, 
      color: '#ffaa44',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: isMobile ? 2 : 3,
    }).setScrollFactor(0);
    this.equipmentContainer.add(weaponLabel);

    // 能力欄標籤
    const passiveLabel = this.add.text(startX - 2, passiveY - (isMobile ? 16 : 20), '💎 能力', {
      fontSize: labelFontSize, 
      color: '#44aaff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: isMobile ? 2 : 3,
    }).setScrollFactor(0);
    this.equipmentContainer.add(passiveLabel);

    const weapons = this.weaponSystem.getWeapons();
    const passives = this.weaponSystem.getPassives();

    // 繪製 6 格武器欄
    for (let i = 0; i < slotsPerRow; i++) {
      const x = startX + i * (slotSize + slotGap) + slotSize / 2;
      const y = weaponY + slotSize / 2;

      // 格子背景
      const borderWidth = isMobile ? 2 : 3;
      const bg = this.add.rectangle(x, y, slotSize, slotSize, 0x1a1a2e, 0.9)
        .setStrokeStyle(borderWidth, i < weapons.length ? 0xffaa44 : 0x333355, 1)
        .setScrollFactor(0);
      this.equipmentContainer.add(bg);
      
      // 內層邊框（手機版省略）
      if (!isMobile) {
        const innerBorder = this.add.rectangle(x, y, slotSize - 6, slotSize - 6, 0x000000, 0)
          .setStrokeStyle(1, i < weapons.length ? 0xffcc66 : 0x222233, 0.6)
          .setScrollFactor(0);
        this.equipmentContainer.add(innerBorder);
      }

      if (i < weapons.length) {
        const w = weapons[i];
        // 武器名稱首字
        const initial = w.config.displayName.charAt(0);
        const iconFontSize = isMobile ? '14px' : '18px';
        const txt = this.add.text(x, y - (isMobile ? 4 : 6), initial, {
          fontSize: iconFontSize, 
          color: '#ffaa44', 
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: isMobile ? 2 : 3,
        }).setOrigin(0.5).setScrollFactor(0);
        
        // 等級
        const lvlBgSize = isMobile ? 20 : 24;
        const lvlBgHeight = isMobile ? 12 : 14;
        const lvlBg = this.add.rectangle(x, y + (isMobile ? 10 : 12), lvlBgSize, lvlBgHeight, 0x000000, 0.7)
          .setScrollFactor(0);
        const lvlFontSize = isMobile ? '9px' : '10px';
        const lvl = this.add.text(x, y + (isMobile ? 10 : 12), `Lv${w.level}`, {
          fontSize: lvlFontSize, 
          color: '#ffffff',
          fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0);
        this.equipmentContainer.add([lvlBg, txt, lvl]);
      }
    }

    // 繪製 6 格能力欄
    for (let i = 0; i < slotsPerRow; i++) {
      const x = startX + i * (slotSize + slotGap) + slotSize / 2;
      const y = passiveY + slotSize / 2;

      // 格子背景
      const borderWidth = isMobile ? 2 : 3;
      const bg = this.add.rectangle(x, y, slotSize, slotSize, 0x1a1a2e, 0.9)
        .setStrokeStyle(borderWidth, i < passives.length ? 0x44aaff : 0x333355, 1)
        .setScrollFactor(0);
      this.equipmentContainer.add(bg);
      
      // 內層邊框（手機版省略）
      if (!isMobile) {
        const innerBorder = this.add.rectangle(x, y, slotSize - 6, slotSize - 6, 0x000000, 0)
          .setStrokeStyle(1, i < passives.length ? 0x66ccff : 0x222233, 0.6)
          .setScrollFactor(0);
        this.equipmentContainer.add(innerBorder);
      }

      if (i < passives.length) {
        const p = passives[i];
        const initial = p.config.displayName.charAt(0);
        const iconFontSize = isMobile ? '14px' : '18px';
        const txt = this.add.text(x, y - (isMobile ? 4 : 6), initial, {
          fontSize: iconFontSize, 
          color: '#44aaff', 
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: isMobile ? 2 : 3,
        }).setOrigin(0.5).setScrollFactor(0);
        
        // 等級
        const lvlBgSize = isMobile ? 20 : 24;
        const lvlBgHeight = isMobile ? 12 : 14;
        const lvlBg = this.add.rectangle(x, y + (isMobile ? 10 : 12), lvlBgSize, lvlBgHeight, 0x000000, 0.7)
          .setScrollFactor(0);
        const lvlFontSize = isMobile ? '9px' : '10px';
        const lvl = this.add.text(x, y + (isMobile ? 10 : 12), `Lv${p.level}`, {
          fontSize: lvlFontSize, 
          color: '#ffffff',
          fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0);
        this.equipmentContainer.add([lvlBg, txt, lvl]);
      }
    }
  }

  private updateHUD(): void {
    // 倒數計時器（每秒更新一次即可）
    const remaining = Math.max(0, GAME_DURATION - this.gameTime);
    const mins = Math.floor(remaining / 60);
    const secs = Math.floor(remaining % 60);
    this.timeText.setText(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    
    // 只在等級變化時更新
    if (this.lastLevel !== this.levelUpSystem.currentLevel) {
      this.lastLevel = this.levelUpSystem.currentLevel;
      this.levelText.setText(`${this.levelUpSystem.currentLevel}`);
    }
    
    // 只在擊殺數變化時更新
    if (this.lastKillCount !== this.killCount) {
      this.lastKillCount = this.killCount;
      this.killText.setText(`${this.killCount}`);
    }

    // === 更新 HP 血條（只在 HP 變化時重繪）===
    const currentHP = Math.ceil(this.player.currentHP);
    if (this.lastHP !== currentHP) {
      this.lastHP = currentHP;
      
      const hpPercent = this.player.currentHP / this.player.maxHP;
      
      // 偵測手機版並動態計算尺寸
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const camW = this.cameras.main.width;
      const xpBarHeight = isMobile ? 14 : 18;
      
      const panelX = isMobile ? 8 : 12;
      const panelY = xpBarHeight + (isMobile ? 6 : 10);
      const panelW = Math.min(isMobile ? camW * 0.32 : 240, 240);
      const rowGap = isMobile ? 20 : 25;
      const leftPad = panelX + (isMobile ? 10 : 15);
      
      const hpBarX = leftPad;
      const hpBarY = panelY + (isMobile ? 12 : 15) + rowGap * 3 + (isMobile ? 14 : 20);
      const hpBarW = panelW - (isMobile ? 20 : 30);
      const hpBarH = isMobile ? 12 : 16;
      
      this.hpText.clear();
      
      // 繪製 HP 條漸層（紅色到深紅色）
      const hpFillW = hpBarW * hpPercent;
      for (let i = 0; i < hpFillW; i++) {
        const ratio = i / hpBarW;
        // 根據血量百分比改變顏色
        let r, g, b;
        if (hpPercent > 0.5) {
          // 健康：亮紅色到橙紅色
          r = 255;
          g = Math.floor(80 - ratio * 40);
          b = 20;
        } else if (hpPercent > 0.25) {
          // 警告：橙紅色
          r = 255;
          g = Math.floor(60 - ratio * 30);
          b = 0;
        } else {
          // 危險：深紅色
          r = 200;
          g = 0;
          b = 0;
        }
        const color = (r << 16) | (g << 8) | b;
        this.hpText.fillStyle(color, 1);
        this.hpText.fillRect(hpBarX + 2 + i, hpBarY + 2, 1, hpBarH - 4);
      }
      
      // HP 數值文字
      const hpValueText = this.children.getByName('hpValueText') as Phaser.GameObjects.Text;
      if (hpValueText) {
        hpValueText.setText(`${currentHP} / ${Math.ceil(this.player.maxHP)}`);
        hpValueText.setPosition(hpBarX + hpBarW / 2, hpBarY + hpBarH / 2);
      }
    }

    // === 更新 XP 經驗條（只在 XP 變化時重繪）===
    const currentXP = Math.floor(this.levelUpSystem.currentXP);
    if (this.lastXP !== currentXP) {
      this.lastXP = currentXP;
      
      const xp = this.levelUpSystem.currentXP;
      const xpNeeded = this.levelUpSystem.xpToNextLevel;
      const xpRatio = xpNeeded > 0 ? Math.min(xp / xpNeeded, 1) : 0;
      const camW = this.cameras.main.width;
      
      // 手機版 XP 條高度
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const xpBarHeight = isMobile ? 14 : 18;

      this.xpBarFill.clear();
      
      // 繪製黃色漸層 XP 條
      const xpBarWidth = camW * xpRatio;
      for (let i = 0; i < xpBarWidth; i++) {
        const colorRatio = i / camW;
        // 金黃色漸層
        const r = Math.floor(255 - colorRatio * 50);
        const g = Math.floor(200 - colorRatio * 50);
        const b = Math.floor(50 + colorRatio * 100);
        const color = (r << 16) | (g << 8) | b;
        this.xpBarFill.fillStyle(color, 1);
        this.xpBarFill.fillRect(i, 3, 1, xpBarHeight - 6);
      }

      // XP 文字（顯示等級和百分比）
      const xpPercent = Math.floor(xpRatio * 100);
      this.xpText.setText(`Lv ${this.levelUpSystem.currentLevel}  |  ${xpPercent}%`);
    }

    // 裝備欄只在等級變化時更新（因為升級時才會改變裝備）
    if (this.lastLevel !== this.levelUpSystem.currentLevel) {
      this.updateEquipmentSlots();
    }

    // 倒數歸零 → 勝利
    if (remaining <= 0 && this.gameState === GameState.Playing) {
      this.triggerVictory();
    }

    // 玩家死亡 → 失敗
    if (this.player.currentHP <= 0 && this.gameState === GameState.Playing) {
      this.triggerGameOver();
    }
  }

  private triggerGameOver(): void {
    this.gameState = GameState.GameOver;
    this.physics.pause();
    const gold = Math.floor(this.gameTime * 0.5) + this.killCount;
    this.showEndScreen(false, gold);
  }

  private triggerVictory(): void {
    this.gameState = GameState.Victory;
    this.physics.pause();
    const gold = Math.floor(this.gameTime * 0.5) + this.killCount;
    this.showEndScreen(true, gold);
  }

  private showEndScreen(isVictory: boolean, gold: number): void {
    // Save gold to save system
    if (this.saveSystem) {
      this.saveSystem.addGold(gold);
    }

    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;

    this.endScreenPanel = this.add.container(0, 0).setScrollFactor(0).setDepth(300);

    // 半透明背景
    const overlay = this.add.rectangle(cx, cy, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.75);
    this.endScreenPanel.add(overlay);

    // 標題
    const titleText = isVictory ? '🎉 生存成功！' : '💀 你倒下了...';
    const titleColor = isVictory ? '#ffdd00' : '#ff4444';
    const title = this.add.text(cx, cy - 140, titleText, {
      fontSize: '36px', color: titleColor, fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0);
    this.endScreenPanel.add(title);

    // 結算資訊
    const mins = Math.floor(this.gameTime / 60);
    const secs = Math.floor(this.gameTime % 60);
    const stats = [
      `存活時間：${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
      `擊殺數：${this.killCount}`,
      `最高等級：Lv ${this.levelUpSystem.currentLevel}`,
      `獲得金幣：${gold} 🪙`,
    ];

    stats.forEach((line, i) => {
      const t = this.add.text(cx, cy - 60 + i * 36, line, {
        fontSize: '20px', color: '#ffffff',
      }).setOrigin(0.5).setScrollFactor(0);
      this.endScreenPanel!.add(t);
    });

    // 按鈕
    const btnY = cy + 100;
    const retryBtn = this.add.text(cx - 100, btnY, '🔄 再來一局', {
      fontSize: '22px', color: '#ffffff', backgroundColor: '#336633',
      padding: { x: 16, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setScrollFactor(0);
    retryBtn.on('pointerover', () => retryBtn.setStyle({ backgroundColor: '#44aa44' }));
    retryBtn.on('pointerout', () => retryBtn.setStyle({ backgroundColor: '#336633' }));
    retryBtn.on('pointerdown', () => this.scene.restart());
    this.endScreenPanel.add(retryBtn);

    const menuBtn = this.add.text(cx + 100, btnY, '🏠 主選單', {
      fontSize: '22px', color: '#ffffff', backgroundColor: '#333366',
      padding: { x: 16, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setScrollFactor(0);
    menuBtn.on('pointerover', () => menuBtn.setStyle({ backgroundColor: '#4444aa' }));
    menuBtn.on('pointerout', () => menuBtn.setStyle({ backgroundColor: '#333366' }));
    menuBtn.on('pointerdown', () => this.scene.start('MainMenu'));
    this.endScreenPanel.add(menuBtn);
  }
}
