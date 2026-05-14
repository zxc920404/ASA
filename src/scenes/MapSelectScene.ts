import Phaser from 'phaser';

interface MapInfo {
  mapId: string;
  displayName: string;
  description: string;
  difficulty: string;
  previewColor: number;
  bgmKey: string;
}

export class MapSelectScene extends Phaser.Scene {
  private selectedMapId: string = 'forest';
  private characterId: string = '';
  private maps: MapInfo[] = [
    {
      mapId: 'forest',
      displayName: '🌲 迷霧森林',
      description: '古老的森林中潛藏著無數危險，適合初學者探索',
      difficulty: '★☆☆☆☆',
      previewColor: 0x2d5016,
      bgmKey: 'bgm-forest',
    },
    {
      mapId: 'cemetery',
      displayName: '⚰ 荒廢墓地',
      description: '亡靈遊蕩的墓地，充滿詭異的氣息',
      difficulty: '★★☆☆☆',
      previewColor: 0x3a2a4a,
      bgmKey: 'bgm-cemetery',
    },
  ];

  constructor() {
    super({ key: 'MapSelect' });
  }

  init(data: { characterId: string }): void {
    this.characterId = data.characterId || 'char_blue_swordsman';
    this.selectedMapId = 'forest'; // Default to forest
  }

  create(): void {
    this.drawAll();
    this.scale.on('resize', () => this.drawAll());
  }

  private drawAll(): void {
    this.children.removeAll(true);

    const w = this.scale.width;
    const h = this.scale.height;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a2e, 0x1a0a2e, 0x16213e, 0x16213e, 1);
    bg.fillRect(0, 0, w, h);

    // Title
    const titleSize = Math.max(18, Math.min(w * 0.04, h * 0.06, 28));
    this.add.text(w / 2, h * 0.08, '🗺 選擇地圖', {
      fontSize: `${titleSize}px`,
      color: '#44ff88',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Divider line
    const line = this.add.graphics();
    line.lineStyle(1, 0x44ff88, 0.4);
    line.lineBetween(w * 0.2, h * 0.14, w * 0.8, h * 0.14);

    // Draw map cards
    this.drawMapCards(w, h);

    // Start game button
    this.makeBtn(
      w / 2,
      h * 0.85,
      '⚔  開始戰鬥！',
      () => this.startGame(),
      Math.min(w * 0.4, 200)
    );

    // Back button
    this.makeBtn(
      w / 2,
      h * 0.92,
      '← 返回',
      () => {
        this.scale.removeAllListeners('resize');
        this.scene.start('CharacterSelect');
      },
      Math.min(w * 0.3, 140),
      32
    );
  }

  private drawMapCards(w: number, h: number): void {
    const cardW = Math.min(w * 0.75, 450);
    const cardH = 160;
    const gap = Math.min(h * 0.03, 20);
    const startY = h * 0.25;

    this.maps.forEach((map, i) => {
      const y = startY + i * (cardH + gap);
      const isSelected = map.mapId === this.selectedMapId;

      // Card background
      const card = this.add
        .rectangle(w / 2, y, cardW, cardH, isSelected ? 0x2a4a3a : 0x1a1a3a, 0.95)
        .setStrokeStyle(3, isSelected ? 0x44ff88 : 0x333355)
        .setInteractive({ useHandCursor: true });

      // Inner border for selected card
      if (isSelected) {
        this.add
          .rectangle(w / 2, y, cardW - 8, cardH - 8, 0x000000, 0)
          .setStrokeStyle(1, 0x88ffaa, 0.5);
      }

      // Map preview/thumbnail (left side)
      const previewSize = 120;
      const previewX = w / 2 - cardW / 2 + previewSize / 2 + 15;
      
      // Preview background with gradient
      const previewBg = this.add.graphics();
      previewBg.fillGradientStyle(
        map.previewColor,
        map.previewColor,
        Phaser.Display.Color.IntegerToColor(map.previewColor).darken(30).color,
        Phaser.Display.Color.IntegerToColor(map.previewColor).darken(30).color,
        1
      );
      previewBg.fillRoundedRect(
        previewX - previewSize / 2,
        y - previewSize / 2,
        previewSize,
        previewSize,
        8
      );
      previewBg.lineStyle(2, isSelected ? 0x44ff88 : 0x555555, 1);
      previewBg.strokeRoundedRect(
        previewX - previewSize / 2,
        y - previewSize / 2,
        previewSize,
        previewSize,
        8
      );

      // Map icon/emoji in preview
      const mapEmoji = map.mapId === 'forest' ? '🌲' : '⚰';
      this.add.text(previewX, y, mapEmoji, {
        fontSize: '56px',
      }).setOrigin(0.5);

      // Right side information area
      const infoX = previewX + previewSize / 2 + 20;
      const infoStartY = y - cardH / 2 + 20;

      // Map name
      this.add.text(infoX, infoStartY, map.displayName, {
        fontSize: '20px',
        color: isSelected ? '#44ff88' : '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      });

      // Difficulty
      this.add.text(infoX, infoStartY + 28, `難度：${map.difficulty}`, {
        fontSize: '13px',
        color: '#ffaa44',
        stroke: '#000000',
        strokeThickness: 2,
      });

      // Description
      const descLines = this.wrapText(map.description, 28);
      descLines.forEach((line, lineIdx) => {
        this.add.text(infoX, infoStartY + 52 + lineIdx * 18, line, {
          fontSize: '12px',
          color: '#aaaaaa',
          stroke: '#000000',
          strokeThickness: 2,
        });
      });

      // Selected checkmark
      if (isSelected) {
        this.add.text(w / 2 - cardW / 2 + 10, y - cardH / 2 + 10, '✓', {
          fontSize: '24px',
          color: '#44ff88',
          fontStyle: 'bold',
        });
      }

      // Click event
      card.on('pointerdown', () => {
        this.selectedMapId = map.mapId;
        this.drawAll();
      });

      // Hover effect
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

  private wrapText(text: string, maxChars: number): string[] {
    const words = text.split('');
    const lines: string[] = [];
    let currentLine = '';

    for (const char of words) {
      if (currentLine.length + 1 <= maxChars) {
        currentLine += char;
      } else {
        lines.push(currentLine);
        currentLine = char;
      }
    }

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    return lines;
  }

  private makeBtn(
    x: number,
    y: number,
    text: string,
    onClick: () => void,
    btnW: number = 200,
    btnH: number = 40
  ): void {
    const fs = Math.max(12, Math.min(btnW * 0.08, 18));
    const bg = this.add
      .rectangle(x, y, btnW, btnH, 0x2a1a4a, 0.9)
      .setStrokeStyle(2, 0x6644aa, 0.8)
      .setInteractive({ useHandCursor: true });
    const label = this.add
      .text(x, y, text, {
        fontSize: `${fs}px`,
        color: '#ddddff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

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

  private startGame(): void {
    this.scale.removeAllListeners('resize');
    this.scene.start('Game', {
      characterId: this.characterId,
      mapId: this.selectedMapId,
    });
  }
}
