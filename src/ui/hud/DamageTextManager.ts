import Phaser from 'phaser';
import { eventBus } from '../../core/events/EventBus';
import { GameEventNames, EnemyDamagedEvent } from '../../core/events/GameEvents';

interface DamageTextItem {
  text: Phaser.GameObjects.Text;
  active: boolean;
}

export class DamageTextManager {
  private scene: Phaser.Scene;
  private pool: DamageTextItem[] = [];
  private readonly POOL_SIZE = 30;
  private readonly FLOAT_DURATION = 800; // ms
  private readonly FLOAT_DISTANCE = 40; // pixels upward

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initPool();
    this.setupListeners();
  }

  private initPool(): void {
    for (let i = 0; i < this.POOL_SIZE; i++) {
      const text = this.scene.add.text(0, 0, '', {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2,
      });
      text.setDepth(150);
      text.setVisible(false);
      text.setActive(false);
      this.pool.push({ text, active: false });
    }
  }

  private setupListeners(): void {
    eventBus.on<EnemyDamagedEvent>(GameEventNames.ENEMY_DAMAGED, (event) => {
      this.showDamage(event.position.x, event.position.y, event.damage);
    });
  }

  private getFromPool(): DamageTextItem | null {
    for (const item of this.pool) {
      if (!item.active) return item;
    }
    // Expand pool if needed (up to 10 extra)
    if (this.pool.length < this.POOL_SIZE + 10) {
      const text = this.scene.add.text(0, 0, '', {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2,
      });
      text.setDepth(150);
      text.setVisible(false);
      text.setActive(false);
      const item = { text, active: false };
      this.pool.push(item);
      return item;
    }
    return null;
  }

  showDamage(x: number, y: number, damage: number): void {
    const item = this.getFromPool();
    if (!item) return;

    item.active = true;
    item.text.setText(String(Math.round(damage)));
    item.text.setPosition(x + (Math.random() - 0.5) * 20, y - 10);
    item.text.setAlpha(1);
    item.text.setVisible(true);
    item.text.setActive(true);

    // Color based on damage amount
    if (damage >= 50) {
      item.text.setColor('#ff4444');
      item.text.setFontSize(22);
    } else if (damage >= 20) {
      item.text.setColor('#ffaa00');
      item.text.setFontSize(18);
    } else {
      item.text.setColor('#ffffff');
      item.text.setFontSize(16);
    }

    this.scene.tweens.add({
      targets: item.text,
      y: item.text.y - this.FLOAT_DISTANCE,
      alpha: 0,
      duration: this.FLOAT_DURATION,
      ease: 'Power2',
      onComplete: () => {
        item.text.setVisible(false);
        item.text.setActive(false);
        item.active = false;
      },
    });
  }

  destroy(): void {
    eventBus.off(GameEventNames.ENEMY_DAMAGED, () => {});
    for (const item of this.pool) {
      item.text.destroy();
    }
    this.pool = [];
  }
}
