import Phaser from 'phaser';
import { SaveSystem } from '../infrastructure/save/SaveSystem';
import { LocalStorageSaveProvider } from '../infrastructure/save/LocalStorageSaveProvider';
import { PermanentUpgradeSystem, PERMANENT_UPGRADES } from '../gameplay/level-up/PermanentUpgradeSystem';

const VERSION = '0.1.0';

export class MainMenuScene extends Phaser.Scene {
  private panelContainer!: Phaser.GameObjects.Container;
  private selectedCharacterId: string = 'char_swordsman';
  private selectedMapId: string = 'forest';
  private musicVolume: number = 0.7;
  private sfxVolume: number = 1.0;
  private saveSystem!: SaveSystem;
  private upgradeSystem!: PermanentUpgradeSystem;

  constructor() {
    super({ key: 'MainMenu' });
  }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    const provider = new LocalStorageSaveProvider();
    this.saveSystem = new SaveSystem(provider);
    this.upgradeSystem = new PermanentUpgradeSystem(this.saveSystem);

    const saveData = this.saveSystem.load();
    this.musicVolume = saveData.settings.musicVolume;
    this.sfxVolume = saveData.settings.sfxVolume;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a2e, 0x1a0a2e, 0x16213e, 0x16213e, 1);
    bg.fillRect(0, 0, w, h);

    // Particles
    for (let i = 0; i < 15; i++) {
      const px = Math.random() * w;
      const py = Math.random() * h;
      const size = 2 + Math.random() * 3;
      const particle = this.add.rectangle(px, py, size, size, 0xff4444, 0.15 + Math.random() * 0.15);
      this.tweens.add({
        targets: particle, y: py - 30 - Math.random() * 40, alpha: 0,
        duration: 3000 + Math.random() * 4000, repeat: -1, yoyo: true,
      });
    }

    // Title
    const titleSize = Math.min(w * 0.05, 36);
    this.add.text(w / 2, h * 0.08, '⚔ 小俠想要活下去', {
      fontSize: `${titleSize}px`, color: '#ff4444', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.15, 'Wuxia Survivors', {
      fontSize: `${Math.max(12, titleSize * 0.45)}px`, color: '#cc8888',
    }).setOrigin(0.5);

    // Divider
    const line = this.add.graphics();
    line.lineStyle(2, 0xff4444, 0.4);
    line.lineBetween(w * 0.25, h * 0.2, w * 0.75, h * 0.2);

    this.panelContainer = this.add.container(0, 0);
    this.showMainMenu();

    // Version
    this.add.text(w - 8, h - 8, `v${VERSION}`, {
      fontSize: '10px', color: '#555555',
    }).setOrigin(1, 1);
  }

  private clearPanel(): void {
    this.panelContainer.removeAll(true);
  }

  private createButton(x: number, y: number, text: string, onClick: () => void, btnWidth: number = 220): Phaser.GameObjects.Container {
    const btnHeight = 40;
    const container = this.add.container(x, y);
    const fontSize = Math.max(14, Math.min(btnWidth * 0.08, 20));

    const bg = this.add.rectangle(0, 0, btnWidth, btnHeight, 0x2a1a4a, 0.9)
      .setStrokeStyle(1, 0x6644aa, 0.6);
    const label = this.add.text(0, 0, text, {
      fontSize: `${fontSize}px`, color: '#ddddff',
    }).setOrigin(0.5);

    container.add([bg, label]);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => { bg.setFillStyle(0x4a2a7a, 1); label.setColor('#ffffff'); });
    bg.on('pointerout', () => { bg.setFillStyle(0x2a1a4a, 0.9); label.setColor('#ddddff'); });
    bg.on('pointerdown', onClick);

    return container;
  }

  private showMainMenu(): void {
    this.clearPanel();
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;
    const startY = h * 0.28;
    const gap = h * 0.12;
    const btnW = Math.min(w * 0.4, 260);

    const buttons = [
      { text: '▶  開始遊戲', cb: () => this.showMapSelect() },
      { text: '👤  角色選擇', cb: () => this.showCharacterSelect() },
      { text: '💎  永久升級', cb: () => this.showPermanentUpgrades() },
      { text: '⚙  設定', cb: () => this.showSettings() },
    ];

    buttons.forEach((btn, i) => {
      const b = this.createButton(cx, startY + i * gap, btn.text, btn.cb, btnW);
      this.panelContainer.add(b);
    });

    const gold = this.upgradeSystem.getGold();
    const goldText = this.add.text(cx, startY + buttons.length * gap + 10, `🪙 金幣：${gold}`, {
      fontSize: '14px', color: '#ffdd00',
    }).setOrigin(0.5);
    this.panelContainer.add(goldText);

    const info = this.add.text(cx, startY + buttons.length * gap + 30, `角色：${this.getCharName()} | 地圖：${this.getMapName()}`, {
      fontSize: '12px', color: '#888899',
    }).setOrigin(0.5);
    this.panelContainer.add(info);
  }

  private showCharacterSelect(): void {
    this.clearPanel();
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;
    const cardW = Math.min(w * 0.55, 320);

    const title = this.add.text(cx, h * 0.22, '👤 角色選擇', {
      fontSize: '22px', color: '#ddddff',
    }).setOrigin(0.5);
    this.panelContainer.add(title);

    const characters = [
      { id: 'char_swordsman', name: '劍客・蕭風', desc: 'HP 100 | 攻擊 1.0x', color: 0x4488ff },
      { id: 'char_monk', name: '武僧・空見', desc: 'HP 130 | 攻擊 0.9x', color: 0xffaa44 },
      { id: 'char_assassin', name: '刺客・夜影', desc: 'HP 70 | 速度快', color: 0x44ff88 },
    ];

    const startY = h * 0.34;
    const cardGap = h * 0.15;

    characters.forEach((ch, i) => {
      const y = startY + i * cardGap;
      const selected = ch.id === this.selectedCharacterId;

      const cardBg = this.add.rectangle(cx, y, cardW, 50, selected ? 0x3a2a6a : 0x1a1a3a, 0.9)
        .setStrokeStyle(2, selected ? 0xffdd00 : 0x333355, selected ? 1 : 0.5)
        .setInteractive({ useHandCursor: true });

      const icon = this.add.rectangle(cx - cardW * 0.4, y, 24, 24, ch.color);
      const name = this.add.text(cx - cardW * 0.3, y - 10, `${selected ? '✓ ' : ''}${ch.name}`, {
        fontSize: '15px', color: selected ? '#ffdd00' : '#ffffff',
      });
      const desc = this.add.text(cx - cardW * 0.3, y + 8, ch.desc, {
        fontSize: '11px', color: '#999999',
      });

      cardBg.on('pointerdown', () => {
        this.selectedCharacterId = ch.id;
        this.showCharacterSelect();
      });

      this.panelContainer.add([cardBg, icon, name, desc]);
    });

    this.addBackButton();
  }

  private showMapSelect(): void {
    this.clearPanel();
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;
    const cardW = Math.min(w * 0.55, 320);

    const title = this.add.text(cx, h * 0.22, '🗺 選擇地圖', {
      fontSize: '22px', color: '#ddddff',
    }).setOrigin(0.5);
    this.panelContainer.add(title);

    const maps = [
      { id: 'forest', name: '🌲 幽暗森林', desc: '適合新手，敵人較弱', color: 0x2d5a1e },
      { id: 'cemetery', name: '⚰ 荒廢墓地', desc: '進階難度，敵人更強', color: 0x3a3a5a },
    ];

    maps.forEach((m, i) => {
      const y = h * 0.38 + i * (h * 0.16);
      const selected = m.id === this.selectedMapId;

      const cardBg = this.add.rectangle(cx, y, cardW, 56, selected ? 0x3a2a6a : 0x1a1a3a, 0.9)
        .setStrokeStyle(2, selected ? 0xffdd00 : 0x333355, selected ? 1 : 0.5)
        .setInteractive({ useHandCursor: true });

      const preview = this.add.rectangle(cx - cardW * 0.38, y, 36, 36, m.color);
      const name = this.add.text(cx - cardW * 0.25, y - 10, m.name, {
        fontSize: '16px', color: selected ? '#ffdd00' : '#ffffff',
      });
      const desc = this.add.text(cx - cardW * 0.25, y + 10, m.desc, {
        fontSize: '11px', color: '#999999',
      });

      cardBg.on('pointerdown', () => {
        this.selectedMapId = m.id;
        this.showMapSelect();
      });

      this.panelContainer.add([cardBg, preview, name, desc]);
    });

    const startBtn = this.createButton(cx, h * 0.76, '⚔  開始戰鬥！', () => this.startGame(), Math.min(w * 0.35, 200));
    this.panelContainer.add(startBtn);

    this.addBackButton();
  }

  private showPermanentUpgrades(): void {
    this.clearPanel();
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;
    const cardW = Math.min(w * 0.6, 340);

    const title = this.add.text(cx, h * 0.18, '💎 永久升級', {
      fontSize: '22px', color: '#ffdd00',
    }).setOrigin(0.5);
    this.panelContainer.add(title);

    const gold = this.upgradeSystem.getGold();
    const goldLabel = this.add.text(cx, h * 0.25, `🪙 ${gold}`, {
      fontSize: '15px', color: '#ffdd00',
    }).setOrigin(0.5);
    this.panelContainer.add(goldLabel);

    const levels = this.upgradeSystem.getUpgradeLevels();
    const startY = h * 0.32;
    const itemGap = h * 0.11;

    PERMANENT_UPGRADES.forEach((upgrade, i) => {
      const y = startY + i * itemGap;
      const level = levels[i] ?? 0;
      const maxed = level >= upgrade.maxLevel;
      const cost = this.upgradeSystem.getNextCost(i);
      const canBuy = this.upgradeSystem.canPurchase(i);

      const cardBg = this.add.rectangle(cx, y, cardW, 44, 0x1a1a3a, 0.9)
        .setStrokeStyle(1, maxed ? 0x44aa44 : 0x333355);
      this.panelContainer.add(cardBg);

      const nameText = this.add.text(cx - cardW * 0.44, y - 9, upgrade.displayName, {
        fontSize: '13px', color: maxed ? '#44ff44' : '#ffffff',
      });
      this.panelContainer.add(nameText);

      const descText = this.add.text(cx - cardW * 0.44, y + 7, `${upgrade.description} (Lv ${level}/${upgrade.maxLevel})`, {
        fontSize: '10px', color: '#999999',
      });
      this.panelContainer.add(descText);

      if (!maxed && cost !== null) {
        const btnColor = canBuy ? 0x336633 : 0x333333;
        const btnTextColor = canBuy ? '#ffffff' : '#666666';
        const buyBtn = this.add.rectangle(cx + cardW * 0.35, y, 64, 30, btnColor, 0.9)
          .setStrokeStyle(1, canBuy ? 0x44aa44 : 0x444444)
          .setInteractive({ useHandCursor: canBuy });
        const buyLabel = this.add.text(cx + cardW * 0.35, y, `${cost} 🪙`, {
          fontSize: '11px', color: btnTextColor,
        }).setOrigin(0.5);

        if (canBuy) {
          buyBtn.on('pointerover', () => buyBtn.setFillStyle(0x44aa44, 1));
          buyBtn.on('pointerout', () => buyBtn.setFillStyle(0x336633, 0.9));
          buyBtn.on('pointerdown', () => {
            this.upgradeSystem.purchase(i);
            this.showPermanentUpgrades();
          });
        }
        this.panelContainer.add([buyBtn, buyLabel]);
      } else if (maxed) {
        const maxLabel = this.add.text(cx + cardW * 0.35, y, 'MAX', {
          fontSize: '12px', color: '#44ff44',
        }).setOrigin(0.5);
        this.panelContainer.add(maxLabel);
      }
    });

    this.addBackButton();
  }

  private showSettings(): void {
    this.clearPanel();
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;

    const title = this.add.text(cx, h * 0.25, '⚙ 設定', {
      fontSize: '22px', color: '#ddddff',
    }).setOrigin(0.5);
    this.panelContainer.add(title);

    this.createSlider(cx, h * 0.42, '🎵 音樂音量', this.musicVolume, (v) => {
      this.musicVolume = v;
      this.saveSettings();
    });
    this.createSlider(cx, h * 0.58, '🔊 音效音量', this.sfxVolume, (v) => {
      this.sfxVolume = v;
      this.saveSettings();
    });

    this.addBackButton();
  }

  private saveSettings(): void {
    const data = this.saveSystem.load();
    data.settings.musicVolume = this.musicVolume;
    data.settings.sfxVolume = this.sfxVolume;
    this.saveSystem.save(data);
  }

  private createSlider(cx: number, y: number, label: string, value: number, onChange: (v: number) => void): void {
    const sliderWidth = Math.min(this.scale.width * 0.35, 200);
    const sliderX = cx - sliderWidth / 2;

    const labelText = this.add.text(cx, y - 18, `${label}: ${Math.round(value * 100)}%`, {
      fontSize: '15px', color: '#ccccdd',
    }).setOrigin(0.5);
    this.panelContainer.add(labelText);

    const trackBg = this.add.rectangle(cx, y + 4, sliderWidth, 6, 0x333355, 0.8).setStrokeStyle(1, 0x555577);
    this.panelContainer.add(trackBg);

    const fillWidth = sliderWidth * value;
    const fill = this.add.rectangle(sliderX + fillWidth / 2, y + 4, fillWidth, 6, 0x6644aa);
    this.panelContainer.add(fill);

    const thumb = this.add.circle(sliderX + sliderWidth * value, y + 4, 10, 0xddddff);
    thumb.setInteractive(new Phaser.Geom.Circle(0, 0, 10), Phaser.Geom.Circle.Contains);
    this.input.setDraggable(thumb);
    this.panelContainer.add(thumb);

    thumb.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number) => {
      const clamped = Phaser.Math.Clamp(dragX, sliderX, sliderX + sliderWidth);
      thumb.setPosition(clamped, y + 4);
      const newVal = (clamped - sliderX) / sliderWidth;
      onChange(newVal);
      labelText.setText(`${label}: ${Math.round(newVal * 100)}%`);
      fill.setSize(sliderWidth * newVal, 6);
      fill.setPosition(sliderX + (sliderWidth * newVal) / 2, y + 4);
    });
  }

  private addBackButton(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const back = this.createButton(w / 2, h * 0.9, '← 返回', () => this.showMainMenu(), 140);
    this.panelContainer.add(back);
  }

  private startGame(): void {
    this.scene.start('Game', {
      characterId: this.selectedCharacterId,
      mapId: this.selectedMapId,
    });
  }

  private getCharName(): string {
    const names: Record<string, string> = {
      char_swordsman: '蕭風', char_monk: '空見', char_assassin: '夜影',
    };
    return names[this.selectedCharacterId] ?? '未知';
  }

  private getMapName(): string {
    return this.selectedMapId === 'forest' ? '幽暗森林' : '荒廢墓地';
  }
}
