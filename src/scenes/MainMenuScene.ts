import Phaser from 'phaser';
import { SaveSystem } from '../infrastructure/save/SaveSystem';
import { LocalStorageSaveProvider } from '../infrastructure/save/LocalStorageSaveProvider';
import { PermanentUpgradeSystem, PERMANENT_UPGRADES } from '../gameplay/level-up/PermanentUpgradeSystem';
import packageJson from '../../package.json';

const VERSION = packageJson.version;

type PanelType = 'main' | 'upgrades' | 'settings';

export class MainMenuScene extends Phaser.Scene {
  private musicVolume: number = 0.7;
  private sfxVolume: number = 1.0;
  private saveSystem!: SaveSystem;
  private upgradeSystem!: PermanentUpgradeSystem;
  private currentPanel: PanelType = 'main';
  private menuBGM: Phaser.Sound.BaseSound | null = null;

  constructor() {
    super({ key: 'MainMenu' });
  }

  create(): void {
    const provider = new LocalStorageSaveProvider();
    this.saveSystem = new SaveSystem(provider);
    this.upgradeSystem = new PermanentUpgradeSystem(this.saveSystem);

    const saveData = this.saveSystem.load();
    this.musicVolume = saveData.settings.musicVolume;
    this.sfxVolume = saveData.settings.sfxVolume;

    // Play menu BGM if available
    this.playMenuBGM();

    this.currentPanel = 'main';
    this.drawAll();

    this.scale.on('resize', () => this.drawAll());
  }

  shutdown(): void {
    // Stop BGM when leaving the scene
    if (this.menuBGM) {
      this.menuBGM.stop();
      this.menuBGM.destroy();
      this.menuBGM = null;
    }
  }

  private playMenuBGM(): void {
    // Try to play menu BGM if it exists in cache
    // This will be silent if audio files are not loaded yet
    if (this.cache.audio.exists('bgm-menu')) {
      this.menuBGM = this.sound.add('bgm-menu', {
        volume: this.musicVolume,
        loop: true,
      });
      this.menuBGM.play();
    }
  }

  private drawAll(): void {
    // Clear everything and redraw
    this.children.removeAll(true);

    const w = this.scale.width;
    const h = this.scale.height;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a2e, 0x1a0a2e, 0x16213e, 0x16213e, 1);
    bg.fillRect(0, 0, w, h);

    // Title
    const titleSize = Math.max(18, Math.min(w * 0.04, h * 0.06, 32));
    this.add.text(w / 2, h * 0.06, '⚔ 小俠想要活下去', {
      fontSize: `${titleSize}px`, color: '#ff4444', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.12, 'Wuxia Survivors', {
      fontSize: `${Math.max(10, titleSize * 0.4)}px`, color: '#cc8888',
    }).setOrigin(0.5);

    const line = this.add.graphics();
    line.lineStyle(1, 0xff4444, 0.4);
    line.lineBetween(w * 0.25, h * 0.16, w * 0.75, h * 0.16);

    // Version
    this.add.text(w - 6, h - 6, `v${VERSION}`, {
      fontSize: '9px', color: '#555555',
    }).setOrigin(1, 1);

    // Draw current panel
    switch (this.currentPanel) {
      case 'main': this.drawMainMenu(w, h); break;
      case 'upgrades': this.drawUpgrades(w, h); break;
      case 'settings': this.drawSettings(w, h); break;
    }
  }

  private makeBtn(x: number, y: number, text: string, onClick: () => void, btnW: number = 200, btnH: number = 48): void {
    // Ensure minimum touch-friendly size (48x48 CSS pixels)
    const actualW = Math.max(btnW, 48);
    const actualH = Math.max(btnH, 48);
    const fs = Math.max(12, Math.min(actualW * 0.08, 18));
    
    const bg = this.add.rectangle(x, y, actualW, actualH, 0x2a1a4a, 0.9)
      .setStrokeStyle(2, 0x6644aa, 0.6)
      .setInteractive({ useHandCursor: true });
    
    const label = this.add.text(x, y, text, { fontSize: `${fs}px`, color: '#ddddff' }).setOrigin(0.5);
    
    // Hover effect (for desktop)
    bg.on('pointerover', () => { 
      bg.setFillStyle(0x4a2a7a, 1); 
      bg.setStrokeStyle(2, 0x8866cc, 0.8);
      label.setColor('#ffffff'); 
    });
    
    bg.on('pointerout', () => { 
      bg.setFillStyle(0x2a1a4a, 0.9); 
      bg.setStrokeStyle(2, 0x6644aa, 0.6);
      label.setColor('#ddddff'); 
    });
    
    // Press effect (visual feedback for touch)
    bg.on('pointerdown', () => {
      bg.setFillStyle(0x6a4a9a, 1);
      bg.setStrokeStyle(2, 0xaa88ee, 1);
      label.setColor('#ffffff');
      label.setScale(0.95);
      
      // Trigger click action after brief visual feedback
      this.time.delayedCall(100, () => {
        onClick();
      });
    });
    
    bg.on('pointerup', () => {
      label.setScale(1);
    });
  }

  private drawMainMenu(w: number, h: number): void {
    const cx = w / 2;
    // Ensure minimum button width of 200px and height of 48px for touch-friendly targets
    const btnW = Math.max(200, Math.min(w * 0.45, 240));
    const btnH = Math.max(48, Math.min(h * 0.08, 52));
    const gap = Math.max(btnH + 12, Math.min(h * 0.1, 60));
    const startY = h * 0.26;

    const buttons = [
      { text: '▶  開始遊戲', cb: () => { this.scale.removeAllListeners('resize'); this.scene.start('CharacterSelect'); } },
      { text: '👤  角色選擇', cb: () => { this.scale.removeAllListeners('resize'); this.scene.start('CharacterSelect'); } },
      { text: '💎  永久升級', cb: () => { this.currentPanel = 'upgrades'; this.drawAll(); } },
      { text: '⚙  設定', cb: () => { this.currentPanel = 'settings'; this.drawAll(); } },
    ];

    buttons.forEach((btn, i) => this.makeBtn(cx, startY + i * gap, btn.text, btn.cb, btnW, btnH));

    const gold = this.upgradeSystem.getGold();
    this.add.text(cx, startY + buttons.length * gap + 10, `🪙 金幣：${gold}`, {
      fontSize: '13px', color: '#ffdd00',
    }).setOrigin(0.5);
  }

  private drawUpgrades(w: number, h: number): void {
    const cx = w / 2;
    const cardW = Math.min(w * 0.65, 320);

    this.add.text(cx, h * 0.19, '💎 永久升級', { fontSize: '20px', color: '#ffdd00' }).setOrigin(0.5);

    const gold = this.upgradeSystem.getGold();
    this.add.text(cx, h * 0.24, `🪙 ${gold}`, { fontSize: '14px', color: '#ffdd00' }).setOrigin(0.5);

    const levels = this.upgradeSystem.getUpgradeLevels();
    const gap = Math.min(h * 0.12, 60); // Increased gap for larger cards
    const startY = h * 0.3;

    PERMANENT_UPGRADES.forEach((upgrade, i) => {
      const y = startY + i * gap;
      const level = levels[i] ?? 0;
      const maxed = level >= upgrade.maxLevel;
      const cost = this.upgradeSystem.getNextCost(i);
      const canBuy = this.upgradeSystem.canPurchase(i);

      // Increase card height for better mobile touch targets and to fit description
      const cardH = Math.max(48, 52);
      this.add.rectangle(cx, y, cardW, cardH, 0x1a1a3a, 0.9).setStrokeStyle(1, maxed ? 0x44aa44 : 0x333355);
      
      // Upgrade name
      this.add.text(cx - cardW * 0.44, y - 12, upgrade.displayName, {
        fontSize: '13px', color: maxed ? '#44ff44' : '#ffffff', fontStyle: 'bold',
      });
      
      // Current level
      this.add.text(cx - cardW * 0.44, y + 2, `Lv ${level}/${upgrade.maxLevel}`, {
        fontSize: '10px', color: '#999999',
      });
      
      // Description
      this.add.text(cx - cardW * 0.44, y + 14, upgrade.description, {
        fontSize: '8px', color: '#888888',
      });

      if (!maxed && cost !== null) {
        // Ensure minimum 48x48 touch target for mobile
        const btnW = Math.max(56, 60);
        const btnH = Math.max(26, 36);
        const btn = this.add.rectangle(cx + cardW * 0.35, y, btnW, btnH, canBuy ? 0x336633 : 0x333333, 0.9)
          .setStrokeStyle(1, canBuy ? 0x44aa44 : 0x444444);
        this.add.text(cx + cardW * 0.35, y, `${cost}🪙`, {
          fontSize: '10px', color: canBuy ? '#ffffff' : '#666666',
        }).setOrigin(0.5);
        if (canBuy) {
          btn.setInteractive({ useHandCursor: true });
          btn.on('pointerdown', () => { 
            this.upgradeSystem.purchase(i); 
            this.drawAll(); 
          });
          // Add hover effect for better UX
          btn.on('pointerover', () => {
            btn.setFillStyle(0x44aa44, 1);
          });
          btn.on('pointerout', () => {
            btn.setFillStyle(0x336633, 0.9);
          });
        }
      } else if (maxed) {
        this.add.text(cx + cardW * 0.35, y, 'MAX', { fontSize: '11px', color: '#44ff44' }).setOrigin(0.5);
      }
    });

    this.drawBackButton(w, h);
  }

  private drawSettings(w: number, h: number): void {
    const cx = w / 2;

    this.add.text(cx, h * 0.22, '⚙ 設定', { fontSize: '20px', color: '#ddddff' }).setOrigin(0.5);

    this.drawSlider(cx, h * 0.38, w, '🎵 音樂', this.musicVolume, (v) => {
      this.musicVolume = v; this.saveSettings();
    });
    this.drawSlider(cx, h * 0.52, w, '🔊 音效', this.sfxVolume, (v) => {
      this.sfxVolume = v; this.saveSettings();
    });

    this.drawBackButton(w, h);
  }

  private drawSlider(cx: number, y: number, w: number, label: string, value: number, onChange: (v: number) => void): void {
    // Make slider more touch-friendly with larger hit areas
    const sliderW = Math.min(w * 0.5, 240); // Wider slider for easier interaction
    const sliderX = cx - sliderW / 2;
    const sliderH = 8; // Thicker track for easier touch
    const thumbRadius = 16; // Larger thumb (32px diameter) for touch-friendly interaction

    const labelText = this.add.text(cx, y - 24, `${label}: ${Math.round(value * 100)}%`, {
      fontSize: '15px', color: '#ccccdd', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Slider track background
    const trackBg = this.add.rectangle(cx, y + 4, sliderW, sliderH, 0x333355, 0.8)
      .setStrokeStyle(1, 0x555577);
    
    // Slider fill (shows current value)
    const fill = this.add.rectangle(sliderX + sliderW * value / 2, y + 4, sliderW * value, sliderH, 0x6644aa);

    // Slider thumb (larger for touch)
    const thumb = this.add.circle(sliderX + sliderW * value, y + 4, thumbRadius, 0xddddff)
      .setStrokeStyle(2, 0x6644aa, 0.8);
    
    // Make the entire thumb area interactive with a larger hit area for easier touch
    const hitArea = new Phaser.Geom.Circle(0, 0, thumbRadius + 8); // Extra padding for easier touch
    thumb.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
    this.input.setDraggable(thumb);

    // Also make the track clickable to jump to position
    trackBg.setInteractive();
    trackBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const localX = pointer.x;
      const clamped = Phaser.Math.Clamp(localX, sliderX, sliderX + sliderW);
      const newVal = (clamped - sliderX) / sliderW;
      
      // Update thumb position
      thumb.setPosition(clamped, y + 4);
      
      // Update fill
      fill.setSize(sliderW * newVal, sliderH);
      fill.setPosition(sliderX + (sliderW * newVal) / 2, y + 4);
      
      // Update label
      labelText.setText(`${label}: ${Math.round(newVal * 100)}%`);
      
      // Call onChange callback
      onChange(newVal);
      
      // Apply volume change immediately
      this.applyVolumeChange(label, newVal);
    });

    // Visual feedback on thumb hover/press
    thumb.on('pointerover', () => {
      thumb.setFillStyle(0xffffff);
      thumb.setScale(1.1);
    });
    
    thumb.on('pointerout', () => {
      thumb.setFillStyle(0xddddff);
      thumb.setScale(1);
    });

    thumb.on('drag', (_p: Phaser.Input.Pointer, dragX: number) => {
      const clamped = Phaser.Math.Clamp(dragX, sliderX, sliderX + sliderW);
      thumb.setPosition(clamped, y + 4);
      const newVal = (clamped - sliderX) / sliderW;
      
      // Update fill
      fill.setSize(sliderW * newVal, sliderH);
      fill.setPosition(sliderX + (sliderW * newVal) / 2, y + 4);
      
      // Update label
      labelText.setText(`${label}: ${Math.round(newVal * 100)}%`);
      
      // Call onChange callback
      onChange(newVal);
      
      // Apply volume change immediately
      this.applyVolumeChange(label, newVal);
    });
  }

  private applyVolumeChange(label: string, value: number): void {
    // Apply volume changes immediately to menu BGM
    if (label.includes('音樂') || label.includes('Music')) {
      if (this.menuBGM && 'setVolume' in this.menuBGM) {
        (this.menuBGM as Phaser.Sound.WebAudioSound).setVolume(value);
      }
    } else if (label.includes('音效') || label.includes('SFX')) {
      // Play a test SFX to demonstrate volume change
      if (this.cache.audio.exists('sfx-ui-click')) {
        const testSfx = this.sound.add('sfx-ui-click', { volume: value });
        testSfx.once('complete', () => testSfx.destroy());
        testSfx.play();
      }
    }
  }

  private drawBackButton(w: number, h: number): void {
    this.makeBtn(w / 2, h * 0.82, '← 返回', () => { this.currentPanel = 'main'; this.drawAll(); }, 120, 48);
  }

  private saveSettings(): void {
    const data = this.saveSystem.load();
    data.settings.musicVolume = this.musicVolume;
    data.settings.sfxVolume = this.sfxVolume;
    this.saveSystem.save(data);
  }
}
