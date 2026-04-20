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
    const { width, height } = this.scale;

    // Initialize save & upgrade systems
    const provider = new LocalStorageSaveProvider();
    this.saveSystem = new SaveSystem(provider);
    this.upgradeSystem = new PermanentUpgradeSystem(this.saveSystem);

    // Load settings from save
    const saveData = this.saveSystem.load();
    this.musicVolume = saveData.settings.musicVolume;
    this.sfxVolume = saveData.settings.sfxVolume;

    // 背景漸層
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a2e, 0x1a0a2e, 0x16213e, 0x16213e, 1);
    bg.fillRect(0, 0, width, height);

    // 裝飾粒子（簡單的浮動方塊）
    for (let i = 0; i < 20; i++) {
      const px = Math.random() * width;
      const py = Math.random() * height;
      const size = 2 + Math.random() * 4;
      const particle = this.add.rectangle(px, py, size, size, 0xff4444, 0.15 + Math.random() * 0.15);
      this.tweens.add({
        targets: particle, y: py - 40 - Math.random() * 60, alpha: 0,
        duration: 3000 + Math.random() * 4000, repeat: -1, yoyo: true,
      });
    }

    // 標題
    this.add.text(width / 2, 60, '⚔ 小俠想要活下去', {
      fontSize: '44px', color: '#ff4444', fontStyle: 'bold',
    }).setOrigin(0.5);

    // 副標題
    this.add.text(width / 2, 110, 'Wuxia Survivors', {
      fontSize: '18px', color: '#cc8888',
    }).setOrigin(0.5);

    // 分隔線
    const line = this.add.graphics();
    line.lineStyle(2, 0xff4444, 0.4);
    line.lineBetween(width * 0.2, 140, width * 0.8, 140);

    this.panelContainer = this.add.container(0, 0);
    this.showMainMenu();

    // 版本號
    this.add.text(width - 10, height - 10, `v${VERSION}`, {
      fontSize: '12px', color: '#555555',
    }).setOrigin(1, 1);
  }

  private clearPanel(): void {
    this.panelContainer.removeAll(true);
  }

  private createButton(x: number, y: number, text: string, onClick: () => void, width: number = 280): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, width, 48, 0x2a1a4a, 0.9)
      .setStrokeStyle(1, 0x6644aa, 0.6);
    const label = this.add.text(0, 0, text, {
      fontSize: '22px', color: '#ddddff',
    }).setOrigin(0.5);

    container.add([bg, label]);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      bg.setFillStyle(0x4a2a7a, 1);
      label.setColor('#ffffff');
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0x2a1a4a, 0.9);
      label.setColor('#ddddff');
    });
    bg.on('pointerdown', onClick);

    return container;
  }

  private showMainMenu(): void {
    this.clearPanel();
    const { width } = this.scale;
    const cx = width / 2;

    const buttons = [
      { text: '▶  開始遊戲', cb: () => this.showMapSelect() },
      { text: '👤  角色選擇', cb: () => this.showCharacterSelect() },
      { text: '💎  永久升級', cb: () => this.showPermanentUpgrades() },
      { text: '⚙  設定', cb: () => this.showSettings() },
    ];

    buttons.forEach((btn, i) => {
      const b = this.createButton(cx, 200 + i * 64, btn.text, btn.cb);
      this.panelContainer.add(b);
    });

    // Gold display
    const gold = this.upgradeSystem.getGold();
    const goldText = this.add.text(cx, 470, `🪙 金幣：${gold}`, {
      fontSize: '16px', color: '#ffdd00',
    }).setOrigin(0.5);
    this.panelContainer.add(goldText);

    // 當前選擇提示
    const info = this.add.text(cx, 500, `角色：${this.getCharName()} | 地圖：${this.getMapName()}`, {
      fontSize: '14px', color: '#888899',
    }).setOrigin(0.5);
    this.panelContainer.add(info);
  }

  private showCharacterSelect(): void {
    this.clearPanel();
    const { width } = this.scale;
    const cx = width / 2;

    const title = this.add.text(cx, 170, '👤 角色選擇', {
      fontSize: '28px', color: '#ddddff',
    }).setOrigin(0.5);
    this.panelContainer.add(title);

    const characters = [
      { id: 'char_swordsman', name: '劍客・蕭風', desc: 'HP 100 | 攻擊 1.0x | 初始武器：追風劍', color: 0x4488ff },
      { id: 'char_monk', name: '武僧・空見', desc: 'HP 130 | 攻擊 0.9x | 初始武器：醉拳', color: 0xffaa44 },
      { id: 'char_assassin', name: '刺客・夜影', desc: 'HP 70 | 速度快 | 初始武器：暗器雨', color: 0x44ff88 },
    ];

    characters.forEach((ch, i) => {
      const y = 230 + i * 80;
      const selected = ch.id === this.selectedCharacterId;

      const cardBg = this.add.rectangle(cx, y, 340, 64, selected ? 0x3a2a6a : 0x1a1a3a, 0.9)
        .setStrokeStyle(2, selected ? 0xffdd00 : 0x333355, selected ? 1 : 0.5)
        .setInteractive({ useHandCursor: true });

      const icon = this.add.rectangle(cx - 140, y, 32, 32, ch.color);
      const name = this.add.text(cx - 110, y - 12, `${selected ? '✓ ' : ''}${ch.name}`, {
        fontSize: '18px', color: selected ? '#ffdd00' : '#ffffff',
      });
      const desc = this.add.text(cx - 110, y + 10, ch.desc, {
        fontSize: '12px', color: '#999999',
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
    const { width } = this.scale;
    const cx = width / 2;

    const title = this.add.text(cx, 170, '🗺 選擇地圖', {
      fontSize: '28px', color: '#ddddff',
    }).setOrigin(0.5);
    this.panelContainer.add(title);

    const maps = [
      { id: 'forest', name: '🌲 幽暗森林', desc: '適合新手，敵人較弱', color: 0x2d5a1e },
      { id: 'cemetery', name: '⚰ 荒廢墓地', desc: '進階難度，敵人更強', color: 0x3a3a5a },
    ];

    maps.forEach((m, i) => {
      const y = 240 + i * 90;
      const selected = m.id === this.selectedMapId;

      const cardBg = this.add.rectangle(cx, y, 340, 70, selected ? 0x3a2a6a : 0x1a1a3a, 0.9)
        .setStrokeStyle(2, selected ? 0xffdd00 : 0x333355, selected ? 1 : 0.5)
        .setInteractive({ useHandCursor: true });

      const preview = this.add.rectangle(cx - 130, y, 48, 48, m.color);
      const name = this.add.text(cx - 90, y - 14, m.name, {
        fontSize: '20px', color: selected ? '#ffdd00' : '#ffffff',
      });
      const desc = this.add.text(cx - 90, y + 12, m.desc, {
        fontSize: '13px', color: '#999999',
      });

      cardBg.on('pointerdown', () => {
        this.selectedMapId = m.id;
        this.showMapSelect();
      });

      this.panelContainer.add([cardBg, preview, name, desc]);
    });

    // 開始遊戲按鈕
    const startBtn = this.createButton(cx, 460, '⚔  開始戰鬥！', () => this.startGame(), 240);
    this.panelContainer.add(startBtn);

    this.addBackButton();
  }

  private showPermanentUpgrades(): void {
    this.clearPanel();
    const { width } = this.scale;
    const cx = width / 2;

    const title = this.add.text(cx, 160, '💎 永久升級', {
      fontSize: '28px', color: '#ffdd00',
    }).setOrigin(0.5);
    this.panelContainer.add(title);

    // Gold display
    const gold = this.upgradeSystem.getGold();
    const goldLabel = this.add.text(cx, 195, `🪙 ${gold}`, {
      fontSize: '18px', color: '#ffdd00',
    }).setOrigin(0.5);
    this.panelContainer.add(goldLabel);

    const levels = this.upgradeSystem.getUpgradeLevels();

    PERMANENT_UPGRADES.forEach((upgrade, i) => {
      const y = 235 + i * 62;
      const level = levels[i] ?? 0;
      const maxed = level >= upgrade.maxLevel;
      const cost = this.upgradeSystem.getNextCost(i);
      const canBuy = this.upgradeSystem.canPurchase(i);

      // Card background
      const cardBg = this.add.rectangle(cx, y, 360, 52, 0x1a1a3a, 0.9)
        .setStrokeStyle(1, maxed ? 0x44aa44 : 0x333355);
      this.panelContainer.add(cardBg);

      // Upgrade name & level
      const nameText = this.add.text(cx - 160, y - 12, `${upgrade.displayName}`, {
        fontSize: '16px', color: maxed ? '#44ff44' : '#ffffff',
      });
      this.panelContainer.add(nameText);

      const descText = this.add.text(cx - 160, y + 8, `${upgrade.description} (Lv ${level}/${upgrade.maxLevel})`, {
        fontSize: '12px', color: '#999999',
      });
      this.panelContainer.add(descText);

      // Buy button
      if (!maxed && cost !== null) {
        const btnColor = canBuy ? 0x336633 : 0x333333;
        const btnTextColor = canBuy ? '#ffffff' : '#666666';
        const buyBtn = this.add.rectangle(cx + 130, y, 80, 36, btnColor, 0.9)
          .setStrokeStyle(1, canBuy ? 0x44aa44 : 0x444444)
          .setInteractive({ useHandCursor: canBuy });
        const buyLabel = this.add.text(cx + 130, y, `${cost} 🪙`, {
          fontSize: '13px', color: btnTextColor,
        }).setOrigin(0.5);

        if (canBuy) {
          buyBtn.on('pointerover', () => buyBtn.setFillStyle(0x44aa44, 1));
          buyBtn.on('pointerout', () => buyBtn.setFillStyle(0x336633, 0.9));
          buyBtn.on('pointerdown', () => {
            this.upgradeSystem.purchase(i);
            this.showPermanentUpgrades(); // Refresh
          });
        }

        this.panelContainer.add([buyBtn, buyLabel]);
      } else if (maxed) {
        const maxLabel = this.add.text(cx + 130, y, 'MAX', {
          fontSize: '14px', color: '#44ff44',
        }).setOrigin(0.5);
        this.panelContainer.add(maxLabel);
      }
    });

    this.addBackButton();
  }

  private showSettings(): void {
    this.clearPanel();
    const { width } = this.scale;
    const cx = width / 2;

    const title = this.add.text(cx, 170, '⚙ 設定', {
      fontSize: '28px', color: '#ddddff',
    }).setOrigin(0.5);
    this.panelContainer.add(title);

    this.createSlider(cx, 260, '🎵 音樂音量', this.musicVolume, (v) => {
      this.musicVolume = v;
      this.saveSettings();
    });
    this.createSlider(cx, 340, '🔊 音效音量', this.sfxVolume, (v) => {
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
    const sliderWidth = 220;
    const sliderX = cx - sliderWidth / 2;

    const labelText = this.add.text(cx, y - 22, `${label}: ${Math.round(value * 100)}%`, {
      fontSize: '18px', color: '#ccccdd',
    }).setOrigin(0.5);
    this.panelContainer.add(labelText);

    const trackBg = this.add.rectangle(cx, y + 5, sliderWidth, 8, 0x333355, 0.8).setStrokeStyle(1, 0x555577);
    this.panelContainer.add(trackBg);

    const fillWidth = sliderWidth * value;
    const fill = this.add.rectangle(sliderX + fillWidth / 2, y + 5, fillWidth, 8, 0x6644aa);
    this.panelContainer.add(fill);

    const thumb = this.add.circle(sliderX + sliderWidth * value, y + 5, 12, 0xddddff);
    thumb.setInteractive(new Phaser.Geom.Circle(0, 0, 12), Phaser.Geom.Circle.Contains);
    this.input.setDraggable(thumb);
    this.panelContainer.add(thumb);

    thumb.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number) => {
      const clamped = Phaser.Math.Clamp(dragX, sliderX, sliderX + sliderWidth);
      thumb.setPosition(clamped, y + 5);
      const newVal = (clamped - sliderX) / sliderWidth;
      onChange(newVal);
      labelText.setText(`${label}: ${Math.round(newVal * 100)}%`);
      fill.setSize(sliderWidth * newVal, 8);
      fill.setPosition(sliderX + (sliderWidth * newVal) / 2, y + 5);
    });
  }

  private addBackButton(): void {
    const { width, height } = this.scale;
    const back = this.createButton(width / 2, height - 70, '← 返回', () => this.showMainMenu(), 160);
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
