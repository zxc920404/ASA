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
import { CharacterConfig, WeaponConfig, EnemyConfig, PassiveItemConfig } from '../data/types';
import { ObjectPool } from '../core/pool/ObjectPool';

import weaponsData from '../data/weapons.json';
import enemiesData from '../data/enemies.json';
import passiveItemsData from '../data/passive-items.json';

export enum GameState {
  Playing = 'playing',
  Paused = 'paused',
  LevelUp = 'levelUp',
  GameOver = 'gameOver',
  Victory = 'victory',
}

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

    // 2. Pool Manager
    this.poolManager = new ObjectPoolManager();

    // 3. Register projectile pool
    this.projectilePool = this.poolManager.register(
      { poolId: 'projectile', preAllocateCount: 100, maxBatchExpansion: 10 },
      () => new Projectile(this),
    );

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

    // MVP: 玩家一開始就擁有三種自動武器
    const allWeapons = weaponsData as WeaponConfig[];
    
    // 1. 飛劍環繞（太極環）
    const orbitWeapon = allWeapons.find(w => w.weaponId === 'weapon_taichi_ring');
    if (orbitWeapon) this.weaponSystem.addWeapon(orbitWeapon);
    
    // 2. 劍氣射擊（追風劍）
    const projectileWeapon = allWeapons.find(w => w.weaponId === 'weapon_wind_sword');
    if (projectileWeapon) this.weaponSystem.addWeapon(projectileWeapon);
    
    // 3. 靈氣爆發（烈焰掌）
    const auraWeapon = allWeapons.find(w => w.weaponId === 'weapon_flame_palm');
    if (auraWeapon) this.weaponSystem.addWeapon(auraWeapon);

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
    );

    // 11. Camera
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // 12. Physics
    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // 13. Collision: enemy contact damage is checked manually in update()

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
  }

  update(_time: number, delta: number): void {
    if (this.gameState !== GameState.Playing) return;
    if (this.pauseMenuUI?.paused) return;

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
    // === 1. 檢查是否有草地背景圖片，如果沒有則生成 ===
    if (!this.textures.exists('grass_bg')) {
      // 生成草地背景紋理
      this.generateGrassTexture();
    }
    
    // === 2. 平鋪草地背景（加入隨機偏移打破規律性）===
    const grassBg = this.add.tileSprite(0, 0, MAP_WIDTH, MAP_HEIGHT, 'grass_bg');
    grassBg.setOrigin(0, 0);
    grassBg.setDepth(-20);
    // 隨機偏移 tile 起始位置，打破重複感
    grassBg.setTilePosition(Math.random() * 512, Math.random() * 512);
    
    // === 3. 單層半透明 overlay（移除噪點層以提升效能）===
    const overlay1 = this.add.graphics();
    overlay1.fillStyle(0x0a0a0a, 0.3);
    overlay1.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    overlay1.setDepth(-18);
    
    // === 4. 優化後的裝飾物（大幅減少數量）===
    this.createMapDecorations();
    
    // === 5. 創建暗角效果（固定在螢幕上）===
    this.vignette = this.add.graphics().setScrollFactor(0).setDepth(95);
    this.updateVignette();
    
    // === 6. 移除漂浮粒子以提升效能 ===
    // this.createAmbientParticles(); // 暫時停用
  }
  
  private generateGrassTexture(): void {
    // 生成 512x512 的無縫草地紋理
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    // 基礎草地顏色（深綠到淺綠漸層，使用徑向漸層讓中心更亮）
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, '#3a6b1e');
    gradient.addColorStop(0.7, '#2d5016');
    gradient.addColorStop(1, '#243f12');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // 添加草地紋理（隨機深淺綠色點，增加密度）
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = 1 + Math.random() * 4;
      const brightness = 0.7 + Math.random() * 0.5;
      
      ctx.fillStyle = `rgba(${Math.floor(45 * brightness)}, ${Math.floor(90 * brightness)}, ${Math.floor(30 * brightness)}, ${0.2 + Math.random() * 0.5})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 添加草叢紋理（小線條，增加數量）
    ctx.strokeStyle = 'rgba(30, 60, 20, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const length = 3 + Math.random() * 10;
      const angle = Math.random() * Math.PI * 2;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }
    
    // 添加深色斑塊增加變化
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = 10 + Math.random() * 30;
      const gradient2 = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient2.addColorStop(0, 'rgba(10, 20, 10, 0.3)');
      gradient2.addColorStop(1, 'rgba(10, 20, 10, 0)');
      ctx.fillStyle = gradient2;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 邊緣柔化處理（讓 tile 接縫更自然）
    const edgeFade = 30;
    for (let i = 0; i < edgeFade; i++) {
      const alpha = (edgeFade - i) / edgeFade * 0.3;
      ctx.fillStyle = `rgba(35, 60, 20, ${alpha})`;
      // 上邊
      ctx.fillRect(0, i, size, 1);
      // 下邊
      ctx.fillRect(0, size - i - 1, size, 1);
      // 左邊
      ctx.fillRect(i, 0, 1, size);
      // 右邊
      ctx.fillRect(size - i - 1, 0, 1, size);
    }
    
    // 將 canvas 轉換為 Phaser texture
    this.textures.addCanvas('grass_bg', canvas);
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
    
    // 繪製更柔和的漸層暗角
    const gradientSteps = 120; // 增加漸層步數讓過渡更平滑
    const maxAlpha = 0.7; // 最大暗角透明度
    
    for (let i = 0; i < gradientSteps; i++) {
      const progress = i / gradientSteps;
      // 使用平方函數讓暗角過渡更自然
      const alpha = Math.pow(progress, 2) * maxAlpha;
      const thickness = 1;
      
      this.vignette.lineStyle(thickness, 0x000000, alpha);
      this.vignette.strokeRect(i, i, camW - i * 2, camH - i * 2);
    }
    
    // 加入四角額外暗化
    const cornerSize = 150;
    const cornerAlpha = 0.3;
    this.vignette.fillStyle(0x000000, cornerAlpha);
    
    // 左上角
    this.vignette.fillTriangle(0, 0, cornerSize, 0, 0, cornerSize);
    // 右上角
    this.vignette.fillTriangle(camW, 0, camW - cornerSize, 0, camW, cornerSize);
    // 左下角
    this.vignette.fillTriangle(0, camH, cornerSize, camH, 0, camH - cornerSize);
    // 右下角
    this.vignette.fillTriangle(camW, camH, camW - cornerSize, camH, camW, camH - cornerSize);
  }
  
  private getCharacterConfig(characterId: string): CharacterConfig {
    const characters = this.cache.json.get('characters-config') as CharacterConfig[] | undefined;
    if (characters) {
      const found = characters.find(c => c.characterId === characterId);
      if (found) return found;
    }
    return {
      characterId: 'char_swordsman', displayName: '劍客・蕭風', atlasFrame: 'char-swordsman',
      baseHP: 100, baseMoveSpeed: 150, baseAttackPower: 1.0, basePickupRange: 50,
      startingWeaponId: 'weapon_wind_sword', unlockedByDefault: true, unlockCost: 0,
    };
  }

  private createHUD(): void {
    const camW = this.cameras.main.width;
    
    // === 頂部 XP 經驗條（全寬，黃色漸層）===
    this.xpBarBg = this.add.graphics().setScrollFactor(0).setDepth(99);
    this.xpBarBg.fillStyle(0x1a1a2e, 0.95);
    this.xpBarBg.fillRect(0, 0, camW, 18);
    this.xpBarBg.lineStyle(2, 0x665522, 1);
    this.xpBarBg.strokeRect(0, 0, camW, 18);

    this.xpBarFill = this.add.graphics().setScrollFactor(0).setDepth(100);

    this.xpText = this.add.text(camW / 2, 4, '', {
      fontSize: '13px', 
      color: '#ffee88',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setScrollFactor(0).setDepth(101).setOrigin(0.5, 0);

    // === 左上角狀態面板 ===
    const panelX = 12;
    const panelY = 28;
    const panelW = 240;
    const panelH = 140;
    
    // 面板背景（深色半透明，帶漸層邊框）
    const hudBg = this.add.graphics().setScrollFactor(0).setDepth(98);
    hudBg.fillStyle(0x0a0a1a, 0.85);
    hudBg.fillRoundedRect(panelX, panelY, panelW, panelH, 10);
    // 漸層邊框效果
    hudBg.lineStyle(3, 0x4466aa, 0.9);
    hudBg.strokeRoundedRect(panelX, panelY, panelW, panelH, 10);
    hudBg.lineStyle(1, 0x6688cc, 0.6);
    hudBg.strokeRoundedRect(panelX + 2, panelY + 2, panelW - 4, panelH - 4, 8);
    
    // 文字樣式（帶陰影和描邊）
    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '15px', 
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    };
    
    const labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '12px', 
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: 3,
    };
    
    // 時間
    const timeY = panelY + 15;
    this.add.text(panelX + 15, timeY, '⏱ 時間', labelStyle).setScrollFactor(0).setDepth(100);
    this.timeText = this.add.text(panelX + 85, timeY, '', textStyle).setScrollFactor(0).setDepth(100);
    
    // 等級
    const levelY = panelY + 40;
    this.add.text(panelX + 15, levelY, '⭐ 等級', labelStyle).setScrollFactor(0).setDepth(100);
    this.levelText = this.add.text(panelX + 85, levelY, '', textStyle).setScrollFactor(0).setDepth(100);
    
    // 擊殺數
    const killY = panelY + 65;
    this.add.text(panelX + 15, killY, '💀 擊殺', labelStyle).setScrollFactor(0).setDepth(100);
    this.killText = this.add.text(panelX + 85, killY, '', textStyle).setScrollFactor(0).setDepth(100);
    
    // HP 血條（紅色漸層）
    const hpY = panelY + 95;
    this.add.text(panelX + 15, hpY, '❤ 生命', labelStyle).setScrollFactor(0).setDepth(100);
    
    // HP 條背景
    const hpBarX = panelX + 15;
    const hpBarY = hpY + 20;
    const hpBarW = panelW - 30;
    const hpBarH = 16;
    
    const hpBarBg = this.add.graphics().setScrollFactor(0).setDepth(99);
    hpBarBg.fillStyle(0x330000, 0.9);
    hpBarBg.fillRoundedRect(hpBarX, hpBarY, hpBarW, hpBarH, 4);
    hpBarBg.lineStyle(2, 0x660000, 1);
    hpBarBg.strokeRoundedRect(hpBarX, hpBarY, hpBarW, hpBarH, 4);
    
    // HP 條填充（會在 updateHUD 中繪製）
    this.hpText = this.add.graphics().setScrollFactor(0).setDepth(100);
    
    // HP 數值文字
    this.add.text(hpBarX + hpBarW / 2, hpBarY + hpBarH / 2, '', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setScrollFactor(0).setDepth(101).setOrigin(0.5, 0.5).setName('hpValueText');

    // 裝備欄 + 能力欄（螢幕底部）
    this.equipmentContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(100);
    this.updateEquipmentSlots();
  }

  private updateEquipmentSlots(): void {
    this.equipmentContainer.removeAll(true);

    const camW = this.cameras.main.width;
    const camH = this.cameras.main.height;
    const slotSize = 42; // 增大格子
    const slotGap = 6;
    const slotsPerRow = 6;
    const totalWidth = slotsPerRow * (slotSize + slotGap) - slotGap;
    const startX = (camW - totalWidth) / 2;
    const weaponY = camH - slotSize * 2 - slotGap - 15;
    const passiveY = camH - slotSize - 12;

    // 武器欄標籤（更明顯）
    const weaponLabel = this.add.text(startX - 2, weaponY - 20, '⚔ 武器', {
      fontSize: '13px', 
      color: '#ffaa44',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setScrollFactor(0);
    this.equipmentContainer.add(weaponLabel);

    // 能力欄標籤
    const passiveLabel = this.add.text(startX - 2, passiveY - 20, '💎 能力', {
      fontSize: '13px', 
      color: '#44aaff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setScrollFactor(0);
    this.equipmentContainer.add(passiveLabel);

    const weapons = this.weaponSystem.getWeapons();
    const passives = this.weaponSystem.getPassives();

    // 繪製 6 格武器欄（更清楚的邊框）
    for (let i = 0; i < slotsPerRow; i++) {
      const x = startX + i * (slotSize + slotGap) + slotSize / 2;
      const y = weaponY + slotSize / 2;

      // 格子背景（雙層邊框）
      const bg = this.add.rectangle(x, y, slotSize, slotSize, 0x1a1a2e, 0.9)
        .setStrokeStyle(3, i < weapons.length ? 0xffaa44 : 0x333355, 1)
        .setScrollFactor(0);
      this.equipmentContainer.add(bg);
      
      // 內層邊框
      const innerBorder = this.add.rectangle(x, y, slotSize - 6, slotSize - 6, 0x000000, 0)
        .setStrokeStyle(1, i < weapons.length ? 0xffcc66 : 0x222233, 0.6)
        .setScrollFactor(0);
      this.equipmentContainer.add(innerBorder);

      if (i < weapons.length) {
        const w = weapons[i];
        // 武器名稱首字（更大更清楚）
        const initial = w.config.displayName.charAt(0);
        const txt = this.add.text(x, y - 6, initial, {
          fontSize: '18px', 
          color: '#ffaa44', 
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3,
        }).setOrigin(0.5).setScrollFactor(0);
        
        // 等級（帶背景）
        const lvlBg = this.add.rectangle(x, y + 12, 24, 14, 0x000000, 0.7)
          .setScrollFactor(0);
        const lvl = this.add.text(x, y + 12, `Lv${w.level}`, {
          fontSize: '10px', 
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

      // 格子背景（雙層邊框）
      const bg = this.add.rectangle(x, y, slotSize, slotSize, 0x1a1a2e, 0.9)
        .setStrokeStyle(3, i < passives.length ? 0x44aaff : 0x333355, 1)
        .setScrollFactor(0);
      this.equipmentContainer.add(bg);
      
      // 內層邊框
      const innerBorder = this.add.rectangle(x, y, slotSize - 6, slotSize - 6, 0x000000, 0)
        .setStrokeStyle(1, i < passives.length ? 0x66ccff : 0x222233, 0.6)
        .setScrollFactor(0);
      this.equipmentContainer.add(innerBorder);

      if (i < passives.length) {
        const p = passives[i];
        const initial = p.config.displayName.charAt(0);
        const txt = this.add.text(x, y - 6, initial, {
          fontSize: '18px', 
          color: '#44aaff', 
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3,
        }).setOrigin(0.5).setScrollFactor(0);
        
        // 等級（帶背景）
        const lvlBg = this.add.rectangle(x, y + 12, 24, 14, 0x000000, 0.7)
          .setScrollFactor(0);
        const lvl = this.add.text(x, y + 12, `Lv${p.level}`, {
          fontSize: '10px', 
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
      const panelX = 12;
      const panelY = 28;
      const panelW = 240;
      const hpBarX = panelX + 15;
      const hpBarY = panelY + 95 + 20;
      const hpBarW = panelW - 30;
      const hpBarH = 16;
      
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
        this.xpBarFill.fillRect(i, 3, 1, 12);
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
