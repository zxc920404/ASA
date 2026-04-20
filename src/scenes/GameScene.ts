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

const MAP_WIDTH = 3200;
const MAP_HEIGHT = 3200;
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
  private hpText!: Phaser.GameObjects.Text;
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
  // End screen UI
  private endScreenPanel?: Phaser.GameObjects.Container;

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

    // Add starting weapon
    const allWeapons = weaponsData as WeaponConfig[];
    const startWeapon = allWeapons.find(w => w.weaponId === charConfig.startingWeaponId);
    if (startWeapon) this.weaponSystem.addWeapon(startWeapon);

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

    // HUD
    this.updateHUD();
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
    const enemies = this.enemySpawner.getActiveEnemies();
    const len = enemies.length;
    // 簡單的 O(n²) 碰撞推擠，只處理螢幕附近的敵人
    for (let i = 0; i < len; i++) {
      const a = enemies[i];
      if (a.currentHP <= 0) continue;
      for (let j = i + 1; j < len; j++) {
        const b = enemies[j];
        if (b.currentHP <= 0) continue;

        const dx = b.sprite.x - a.sprite.x;
        const dy = b.sprite.y - a.sprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.config.bodySize + b.config.bodySize;

        if (dist < minDist && dist > 0.1) {
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
    this.gameState = GameState.LevelUp;
    this.physics.pause();

    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;

    this.levelUpPanel = this.add.container(0, 0).setScrollFactor(0).setDepth(200);

    // Dim overlay
    const overlay = this.add.rectangle(cx, cy, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.6);
    this.levelUpPanel.add(overlay);

    // Title
    const title = this.add.text(cx, cy - 120, `升級！Lv ${this.levelUpSystem.currentLevel}`, {
      fontSize: '24px', color: '#ffff00', align: 'center',
    }).setOrigin(0.5).setScrollFactor(0);
    this.levelUpPanel.add(title);

    // Option buttons
    options.forEach((opt, i) => {
      const y = cy - 40 + i * 70;
      const bg = this.add.rectangle(cx, y, 300, 56, 0x333366, 0.9)
        .setInteractive({ useHandCursor: true })
        .setScrollFactor(0);
      const txt = this.add.text(cx, y, `${opt.displayName}\n${opt.description}`, {
        fontSize: '14px', color: '#ffffff', align: 'center',
      }).setOrigin(0.5).setScrollFactor(0);

      bg.on('pointerdown', () => {
        this.levelUpSystem.applyOption(opt);
        this.closeLevelUpUI();
      });

      this.levelUpPanel!.add([bg, txt]);
    });
  }

  private closeLevelUpUI(): void {
    if (this.levelUpPanel) {
      this.levelUpPanel.destroy(true);
      this.levelUpPanel = undefined;
    }
    this.gameState = GameState.Playing;
    this.physics.resume();
  }

  private createGround(): void {
    const ground = this.add.graphics();
    ground.fillStyle(0x2d5a1e, 1);
    ground.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    ground.lineStyle(1, 0x3a6b28, 0.3);
    for (let x = 0; x <= MAP_WIDTH; x += 32) ground.lineBetween(x, 0, x, MAP_HEIGHT);
    for (let y = 0; y <= MAP_HEIGHT; y += 32) ground.lineBetween(0, y, MAP_WIDTH, y);
    ground.setDepth(-1);
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
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '16px', color: '#ffffff',
      backgroundColor: '#00000088', padding: { x: 6, y: 4 },
    };
    this.timeText = this.add.text(10, 10, '', style).setScrollFactor(0).setDepth(100);
    this.hpText = this.add.text(10, 36, '', style).setScrollFactor(0).setDepth(100);
    this.levelText = this.add.text(10, 62, '', style).setScrollFactor(0).setDepth(100);
    this.killText = this.add.text(10, 88, '', style).setScrollFactor(0).setDepth(100);

    // XP 經驗值進度條（螢幕頂部全寬）
    const camW = this.cameras.main.width;
    this.xpBarBg = this.add.graphics().setScrollFactor(0).setDepth(99);
    this.xpBarBg.fillStyle(0x222222, 0.8);
    this.xpBarBg.fillRect(0, 0, camW, 6);

    this.xpBarFill = this.add.graphics().setScrollFactor(0).setDepth(100);

    this.xpText = this.add.text(camW - 10, 10, '', {
      fontSize: '14px', color: '#aaddff',
      backgroundColor: '#00000088', padding: { x: 4, y: 2 },
    }).setScrollFactor(0).setDepth(100).setOrigin(1, 0);

    // 裝備欄 + 能力欄（螢幕底部）
    this.equipmentContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(100);
    this.updateEquipmentSlots();
  }

  private updateEquipmentSlots(): void {
    this.equipmentContainer.removeAll(true);

    const camW = this.cameras.main.width;
    const camH = this.cameras.main.height;
    const slotSize = 36;
    const slotGap = 4;
    const slotsPerRow = 6;
    const totalWidth = slotsPerRow * (slotSize + slotGap) - slotGap;
    const startX = (camW - totalWidth) / 2;
    const weaponY = camH - slotSize * 2 - slotGap - 10;
    const passiveY = camH - slotSize - 8;

    // 武器欄標籤
    const weaponLabel = this.add.text(startX - 2, weaponY - 16, '⚔ 武器', {
      fontSize: '11px', color: '#ffaa44',
    }).setScrollFactor(0);
    this.equipmentContainer.add(weaponLabel);

    // 能力欄標籤
    const passiveLabel = this.add.text(startX - 2, passiveY - 16, '💎 能力', {
      fontSize: '11px', color: '#44aaff',
    }).setScrollFactor(0);
    this.equipmentContainer.add(passiveLabel);

    const weapons = this.weaponSystem.getWeapons();
    const passives = this.weaponSystem.getPassives();

    // 繪製 6 格武器欄
    for (let i = 0; i < slotsPerRow; i++) {
      const x = startX + i * (slotSize + slotGap) + slotSize / 2;
      const y = weaponY + slotSize / 2;

      // 格子背景
      const bg = this.add.rectangle(x, y, slotSize, slotSize, 0x1a1a2e, 0.8)
        .setStrokeStyle(1, i < weapons.length ? 0xffaa44 : 0x333355)
        .setScrollFactor(0);
      this.equipmentContainer.add(bg);

      if (i < weapons.length) {
        const w = weapons[i];
        // 武器名稱首字
        const initial = w.config.displayName.charAt(0);
        const txt = this.add.text(x, y - 4, initial, {
          fontSize: '14px', color: '#ffaa44', fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0);
        // 等級
        const lvl = this.add.text(x, y + 10, `${w.level}`, {
          fontSize: '9px', color: '#cccccc',
        }).setOrigin(0.5).setScrollFactor(0);
        this.equipmentContainer.add([txt, lvl]);
      }
    }

    // 繪製 6 格能力欄
    for (let i = 0; i < slotsPerRow; i++) {
      const x = startX + i * (slotSize + slotGap) + slotSize / 2;
      const y = passiveY + slotSize / 2;

      const bg = this.add.rectangle(x, y, slotSize, slotSize, 0x1a1a2e, 0.8)
        .setStrokeStyle(1, i < passives.length ? 0x44aaff : 0x333355)
        .setScrollFactor(0);
      this.equipmentContainer.add(bg);

      if (i < passives.length) {
        const p = passives[i];
        const initial = p.config.displayName.charAt(0);
        const txt = this.add.text(x, y - 4, initial, {
          fontSize: '14px', color: '#44aaff', fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0);
        const lvl = this.add.text(x, y + 10, `${p.level}`, {
          fontSize: '9px', color: '#cccccc',
        }).setOrigin(0.5).setScrollFactor(0);
        this.equipmentContainer.add([txt, lvl]);
      }
    }
  }

  private updateHUD(): void {
    // 倒數計時器
    const remaining = Math.max(0, GAME_DURATION - this.gameTime);
    const mins = Math.floor(remaining / 60);
    const secs = Math.floor(remaining % 60);
    this.timeText.setText(`⏱ ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    this.hpText.setText(`❤ ${Math.ceil(this.player.currentHP)} / ${Math.ceil(this.player.maxHP)}`);
    this.levelText.setText(`⭐ Lv ${this.levelUpSystem.currentLevel}`);
    this.killText.setText(`💀 ${this.killCount}`);

    // 更新 XP 進度條
    const xp = this.levelUpSystem.currentXP;
    const xpNeeded = this.levelUpSystem.xpToNextLevel;
    const ratio = xpNeeded > 0 ? Math.min(xp / xpNeeded, 1) : 0;
    const camW = this.cameras.main.width;

    this.xpBarFill.clear();
    this.xpBarFill.fillStyle(0x44aaff, 1);
    this.xpBarFill.fillRect(0, 0, camW * ratio, 6);

    this.xpText.setText(`XP ${Math.floor(xp)} / ${Math.floor(xpNeeded)}`);

    // 更新裝備欄 UI
    this.updateEquipmentSlots();

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
