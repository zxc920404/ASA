/**
 * 滑鼠點擊 UI 操作範例
 * 
 * 此範例展示如何使用 KeyboardMouseAdapter 的滑鼠點擊支援
 * 來實作 UI 按鈕互動功能
 */

import Phaser from 'phaser';
import { InputController } from '../src/infrastructure/input/InputController';

class MouseClickUIExample extends Phaser.Scene {
  private inputController!: InputController;
  private button!: Phaser.GameObjects.Rectangle;
  private buttonText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private clickCount: number = 0;
  private isButtonHovered: boolean = false;

  constructor() {
    super({ key: 'MouseClickUIExample' });
  }

  create(): void {
    // 初始化輸入控制器
    this.inputController = new InputController(this);

    // 建立 UI 按鈕
    this.button = this.add.rectangle(400, 300, 200, 80, 0x4a90e2);
    this.button.setStrokeStyle(2, 0xffffff);

    this.buttonText = this.add.text(400, 300, 'Click Me!', {
      fontSize: '24px',
      color: '#ffffff',
    });
    this.buttonText.setOrigin(0.5);

    // 建立狀態文字
    this.statusText = this.add.text(400, 100, 'Mouse Status: Not Clicked', {
      fontSize: '18px',
      color: '#ffffff',
    });
    this.statusText.setOrigin(0.5);

    // 建立點擊計數文字
    this.add.text(400, 500, 'Click Count: 0', {
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5).setName('clickCountText');
  }

  update(): void {
    // 獲取滑鼠狀態
    const isPointerDown = this.inputController.isPointerDown();
    const pointerPos = this.inputController.getPointerPosition();

    // 更新狀態文字
    this.statusText.setText(
      `Mouse Status: ${isPointerDown ? 'Clicked' : 'Not Clicked'}\n` +
      `Position: (${Math.round(pointerPos.x)}, ${Math.round(pointerPos.y)})`
    );

    // 檢查滑鼠是否懸停在按鈕上
    const buttonBounds = this.button.getBounds();
    const wasHovered = this.isButtonHovered;
    this.isButtonHovered = buttonBounds.contains(pointerPos.x, pointerPos.y);

    // 懸停效果
    if (this.isButtonHovered && !wasHovered) {
      this.onButtonHoverEnter();
    } else if (!this.isButtonHovered && wasHovered) {
      this.onButtonHoverExit();
    }

    // 點擊檢測
    if (this.isButtonHovered && isPointerDown) {
      this.onButtonClick();
    }
  }

  private onButtonHoverEnter(): void {
    // 懸停時放大按鈕
    this.button.setScale(1.1);
    this.buttonText.setScale(1.1);
    this.button.setFillStyle(0x5ba3f5);
  }

  private onButtonHoverExit(): void {
    // 離開時恢復按鈕大小
    this.button.setScale(1.0);
    this.buttonText.setScale(1.0);
    this.button.setFillStyle(0x4a90e2);
  }

  private onButtonClick(): void {
    // 點擊效果
    this.clickCount++;
    
    // 更新點擊計數
    const clickCountText = this.children.getByName('clickCountText') as Phaser.GameObjects.Text;
    if (clickCountText) {
      clickCountText.setText(`Click Count: ${this.clickCount}`);
    }

    // 按鈕點擊動畫
    this.tweens.add({
      targets: [this.button, this.buttonText],
      scaleX: 0.95,
      scaleY: 0.95,
      duration: 100,
      yoyo: true,
      ease: 'Power2',
    });

    // 顯示點擊特效
    this.showClickEffect(this.inputController.getPointerPosition());
  }

  private showClickEffect(position: Phaser.Math.Vector2): void {
    const circle = this.add.circle(position.x, position.y, 5, 0xffffff, 0.8);
    
    this.tweens.add({
      targets: circle,
      radius: 30,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => circle.destroy(),
    });
  }
}

/**
 * 拖曳操作範例
 */
class DragExample extends Phaser.Scene {
  private inputController!: InputController;
  private draggableBox!: Phaser.GameObjects.Rectangle;
  private isDragging: boolean = false;
  private dragOffset: Phaser.Math.Vector2 = new Phaser.Math.Vector2();

  constructor() {
    super({ key: 'DragExample' });
  }

  create(): void {
    this.inputController = new InputController(this);

    // 建立可拖曳的方塊
    this.draggableBox = this.add.rectangle(400, 300, 100, 100, 0xe74c3c);
    this.draggableBox.setStrokeStyle(2, 0xffffff);

    this.add.text(400, 100, 'Drag the red box!', {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);
  }

  update(): void {
    const isPointerDown = this.inputController.isPointerDown();
    const pointerPos = this.inputController.getPointerPosition();

    const boxBounds = this.draggableBox.getBounds();
    const isOverBox = boxBounds.contains(pointerPos.x, pointerPos.y);

    if (isPointerDown && isOverBox && !this.isDragging) {
      // 開始拖曳
      this.isDragging = true;
      this.dragOffset.set(
        pointerPos.x - this.draggableBox.x,
        pointerPos.y - this.draggableBox.y
      );
      this.draggableBox.setFillStyle(0xc0392b); // 深紅色
    } else if (!isPointerDown && this.isDragging) {
      // 結束拖曳
      this.isDragging = false;
      this.draggableBox.setFillStyle(0xe74c3c); // 恢復原色
    }

    if (this.isDragging) {
      // 更新方塊位置
      this.draggableBox.setPosition(
        pointerPos.x - this.dragOffset.x,
        pointerPos.y - this.dragOffset.y
      );
    }
  }
}

/**
 * 遊戲配置
 */
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#2c3e50',
  scene: [MouseClickUIExample, DragExample],
};

// 啟動遊戲（僅供範例參考，實際使用時需整合到主遊戲中）
// const game = new Phaser.Game(config);

export { MouseClickUIExample, DragExample };
