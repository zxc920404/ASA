import Phaser from 'phaser';
import { SaveSystem } from '../infrastructure/save/SaveSystem';
import { LocalStorageSaveProvider } from '../infrastructure/save/LocalStorageSaveProvider';
import { PermanentUpgradeSystem, PERMANENT_UPGRADES } from '../gameplay/level-up/PermanentUpgradeSystem';

const VERSION = '0.1.0';

type PanelType = 'main' | 'upgrades' | 'settings';

export class MainMenuScene extends Phaser.Scene {
  private musicVolume: number = 0.7;
  private sfxVolume: number = 1.0;
  private saveSystem!: SaveSystem;
  private upgradeSystem!: PermanentUpgradeSystem;
  private currentPanel: PanelType = 'main';

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

    this.currentPanel = 'main';
    this.drawAll();

    this.scale.on('resize', () => this.drawAll());
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

  private makeBtn(x: number, y: number, text: string, onClick: () => void, btnW: number = 200, btnH: number = 36): void {
    const fs = Math.max(12, Math.min(btnW * 0.08, 18));
    const bg = this.add.rectangle(x, y, btnW, btnH, 0x2a1a4a, 0.9)
      .setStrokeStyle(1, 0x6644aa, 0.6)
      .setInteractive({ useHandCursor: true });
    const label = this.add.text(x, y, text, { fontSize: `${fs}px`, color: '#ddddff' }).setOrigin(0.5);
    bg.on('pointerover', () => { bg.setFillStyle(0x4a2a7a, 1); label.setColor('#ffffff'); });
    bg.on('pointerout', () => { bg.setFillStyle(0x2a1a4a, 0.9); label.setColor('#ddddff'); });
    bg.on('pointerdown', onClick);
  }

  private drawMainMenu(w: number, h: number): void {
    const cx = w / 2;
    const btnW = Math.min(w * 0.45, 240);
    const gap = Math.min(h * 0.1, 50);
    const startY = h * 0.26;

    const buttons = [
      { text: '▶  開始遊戲', cb: () => { this.scale.removeAllListeners('resize'); this.scene.start('CharacterSelect'); } },
      { text: '💎  永久升級', cb: () => { this.currentPanel = 'upgrades'; this.drawAll(); } },
      { text: '⚙  設定', cb: () => { this.currentPanel = 'settings'; this.drawAll(); } },
    ];

    buttons.forEach((btn, i) => this.makeBtn(cx, startY + i * gap, btn.text, btn.cb, btnW));

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
    const gap = Math.min(h * 0.1, 48);
    const startY = h * 0.3;

    PERMANENT_UPGRADES.forEach((upgrade, i) => {
      const y = startY + i * gap;
      const level = levels[i] ?? 0;
      const maxed = level >= upgrade.maxLevel;
      const cost = this.upgradeSystem.getNextCost(i);
      const canBuy = this.upgradeSystem.canPurchase(i);

      this.add.rectangle(cx, y, cardW, 38, 0x1a1a3a, 0.9).setStrokeStyle(1, maxed ? 0x44aa44 : 0x333355);
      this.add.text(cx - cardW * 0.44, y - 7, upgrade.displayName, {
        fontSize: '12px', color: maxed ? '#44ff44' : '#ffffff',
      });
      this.add.text(cx - cardW * 0.44, y + 7, `Lv ${level}/${upgrade.maxLevel}`, {
        fontSize: '9px', color: '#999999',
      });

      if (!maxed && cost !== null) {
        const btn = this.add.rectangle(cx + cardW * 0.35, y, 56, 26, canBuy ? 0x336633 : 0x333333, 0.9)
          .setStrokeStyle(1, canBuy ? 0x44aa44 : 0x444444);
        this.add.text(cx + cardW * 0.35, y, `${cost}🪙`, {
          fontSize: '10px', color: canBuy ? '#ffffff' : '#666666',
        }).setOrigin(0.5);
        if (canBuy) {
          btn.setInteractive({ useHandCursor: true });
          btn.on('pointerdown', () => { this.upgradeSystem.purchase(i); this.drawAll(); });
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
    const sliderW = Math.min(w * 0.35, 180);
    const sliderX = cx - sliderW / 2;

    const labelText = this.add.text(cx, y - 14, `${label}: ${Math.round(value * 100)}%`, {
      fontSize: '13px', color: '#ccccdd',
    }).setOrigin(0.5);

    this.add.rectangle(cx, y + 4, sliderW, 5, 0x333355, 0.8).setStrokeStyle(1, 0x555577);
    const fill = this.add.rectangle(sliderX + sliderW * value / 2, y + 4, sliderW * value, 5, 0x6644aa);

    const thumb = this.add.circle(sliderX + sliderW * value, y + 4, 9, 0xddddff);
    thumb.setInteractive(new Phaser.Geom.Circle(0, 0, 9), Phaser.Geom.Circle.Contains);
    this.input.setDraggable(thumb);

    thumb.on('drag', (_p: Phaser.Input.Pointer, dragX: number) => {
      const clamped = Phaser.Math.Clamp(dragX, sliderX, sliderX + sliderW);
      thumb.setPosition(clamped, y + 4);
      const newVal = (clamped - sliderX) / sliderW;
      onChange(newVal);
      labelText.setText(`${label}: ${Math.round(newVal * 100)}%`);
      fill.setSize(sliderW * newVal, 5);
      fill.setPosition(sliderX + (sliderW * newVal) / 2, y + 4);
    });
  }

  private drawBackButton(w: number, h: number): void {
    this.makeBtn(w / 2, h * 0.82, '← 返回', () => { this.currentPanel = 'main'; this.drawAll(); }, 120, 32);
  }

  private saveSettings(): void {
    const data = this.saveSystem.load();
    data.settings.musicVolume = this.musicVolume;
    data.settings.sfxVolume = this.sfxVolume;
    this.saveSystem.save(data);
  }
}
