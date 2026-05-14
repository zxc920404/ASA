import Phaser from 'phaser';
import { CharacterConfig } from '../data/types';

export class CharacterSelectScene extends Phaser.Scene {
  private selectedCharacterId: string = 'char_blue_swordsman';
  private characters: CharacterConfig[] = [];

  constructor() {
    super({ key: 'CharacterSelect' });
  }

  create(): void {
    // 讀取角色設定
    this.characters = this.cache.json.get('characters-config') as CharacterConfig[];
    if (!this.characters || this.characters.length === 0) {
      console.error('No characters found in config!');
      this.scene.start('MainMenu');
      return;
    }

    // 預設選擇第一個角色
    this.selectedCharacterId = this.characters[0].characterId;

    this.drawAll();
    this.scale.on('resize', () => this.drawAll());
  }

  private drawAll(): void {
    this.children.removeAll(true);

    const w = this.scale.width;
    const h = this.scale.height;

    // 背景
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a2e, 0x1a0a2e, 0x16213e, 0x16213e, 1);
    bg.fillRect(0, 0, w, h);

    // 標題
    const titleSize = Math.max(18, Math.min(w * 0.04, h * 0.06, 28));
    this.add.text(w / 2, h * 0.08, '👤 選擇角色', {
      fontSize: `${titleSize}px`,
      color: '#ffdd00',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 分隔線
    const line = this.add.graphics();
    line.lineStyle(1, 0xffdd00, 0.4);
    line.lineBetween(w * 0.2, h * 0.14, w * 0.8, h * 0.14);

    // 繪製角色卡片
    this.drawCharacterCards(w, h);

    // 開始遊戲按鈕
    this.makeBtn(w / 2, h * 0.85, '⚔  開始戰鬥！', () => this.startGame(), Math.min(w * 0.4, 200));

    // 返回按鈕
    this.makeBtn(w / 2, h * 0.92, '← 返回', () => {
      this.scale.removeAllListeners('resize');
      this.scene.start('MainMenu');
    }, Math.min(w * 0.3, 140), 32);
  }

  private drawCharacterCards(w: number, h: number): void {
    const cardW = Math.min(w * 0.75, 400);
    const cardH = 140;
    const gap = Math.min(h * 0.02, 15);
    const startY = h * 0.22;

    this.characters.forEach((char, i) => {
      const y = startY + i * (cardH + gap);
      const isSelected = char.characterId === this.selectedCharacterId;

      // 卡片背景
      const card = this.add.rectangle(w / 2, y, cardW, cardH, isSelected ? 0x3a2a6a : 0x1a1a3a, 0.95)
        .setStrokeStyle(3, isSelected ? 0xffdd00 : 0x333355)
        .setInteractive({ useHandCursor: true });

      // 內層邊框
      if (isSelected) {
        this.add.rectangle(w / 2, y, cardW - 8, cardH - 8, 0x000000, 0)
          .setStrokeStyle(1, 0xffee88, 0.5);
      }

      // 角色頭像（左側色塊）
      const avatarSize = 80;
      const avatarX = w / 2 - cardW / 2 + avatarSize / 2 + 15;
      const avatarColor = this.getCharacterColor(char.characterId);
      this.add.rectangle(avatarX, y, avatarSize, avatarSize, avatarColor, 0.8)
        .setStrokeStyle(2, isSelected ? 0xffdd00 : 0x555555);

      // 角色名稱首字（大字）
      const initial = char.displayName.charAt(0);
      this.add.text(avatarX, y, initial, {
        fontSize: '48px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      }).setOrigin(0.5);

      // 右側資訊區
      const infoX = avatarX + avatarSize / 2 + 20;
      const infoStartY = y - cardH / 2 + 20;

      // 角色名稱
      this.add.text(infoX, infoStartY, char.displayName, {
        fontSize: '18px',
        color: isSelected ? '#ffdd00' : '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      });

      // 初始武器
      const weaponName = this.getWeaponName(char.startingWeaponId);
      this.add.text(infoX, infoStartY + 25, `⚔ 初始武器：${weaponName}`, {
        fontSize: '13px',
        color: '#ffaa44',
        stroke: '#000000',
        strokeThickness: 2,
      });

      // 屬性列表
      const statsY = infoStartY + 48;
      const statsText = `HP: ${char.baseHP}  |  速度: ${(char.baseMoveSpeed / 150).toFixed(2)}x  |  攻擊: ${char.baseAttackPower.toFixed(2)}x`;
      this.add.text(infoX, statsY, statsText, {
        fontSize: '11px',
        color: '#aaaaaa',
        stroke: '#000000',
        strokeThickness: 2,
      });

      // 角色天賦
      const talentY = infoStartY + 68;
      const talentText = `💎 ${char.talentName ?? '無天賦'}：${char.talentDescription ?? ''}`;
      this.add.text(infoX, talentY, talentText, {
        fontSize: '12px',
        color: '#44aaff',
        stroke: '#000000',
        strokeThickness: 2,
      });

      // 選中標記
      if (isSelected) {
        this.add.text(w / 2 - cardW / 2 + 10, y - cardH / 2 + 10, '✓', {
          fontSize: '24px',
          color: '#ffdd00',
          fontStyle: 'bold',
        });
      }

      // 點擊事件
      card.on('pointerdown', () => {
        this.selectedCharacterId = char.characterId;
        this.drawAll();
      });

      // Hover 效果
      card.on('pointerover', () => {
        if (!isSelected) {
          card.setFillStyle(0x2a2a4a, 1);
        }
      });
      card.on('pointerout', () => {
        if (!isSelected) {
          card.setFillStyle(0x1a1a3a, 0.95);
        }
      });
    });
  }

  private makeBtn(x: number, y: number, text: string, onClick: () => void, btnW: number = 200, btnH: number = 40): void {
    const fs = Math.max(12, Math.min(btnW * 0.08, 18));
    const bg = this.add.rectangle(x, y, btnW, btnH, 0x2a1a4a, 0.9)
      .setStrokeStyle(2, 0x6644aa, 0.8)
      .setInteractive({ useHandCursor: true });
    const label = this.add.text(x, y, text, {
      fontSize: `${fs}px`,
      color: '#ddddff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    bg.on('pointerover', () => {
      bg.setFillStyle(0x4a2a7a, 1);
      label.setColor('#ffffff');
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0x2a1a4a, 0.9);
      label.setColor('#ddddff');
    });
    bg.on('pointerdown', onClick);
  }

  private getCharacterColor(characterId: string): number {
    const colorMap: Record<string, number> = {
      'char_blue_swordsman': 0x4488ff,
      'char_armored_monk': 0xffaa44,
      'char_flame_master': 0xff4444,
    };
    return colorMap[characterId] ?? 0x888888;
  }

  private getWeaponName(weaponId: string): string {
    const weaponMap: Record<string, string> = {
      'weapon_wind_sword': '追風劍',
      'weapon_taichi_ring': '太極環',
      'weapon_flame_palm': '烈焰掌',
    };
    return weaponMap[weaponId] ?? '未知武器';
  }

  private startGame(): void {
    this.scale.removeAllListeners('resize');
    this.scene.start('Game', { characterId: this.selectedCharacterId });
  }
}
