import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { GameScene } from './scenes/GameScene';

// 動態計算遊戲尺寸（考慮 safe area）
function getGameSize() {
  // 使用 visualViewport 如果可用（更準確的可視區域）
  const vp = window.visualViewport;
  const width = vp ? vp.width : window.innerWidth;
  const height = vp ? vp.height : window.innerHeight;
  
  return { width, height };
}

const { width, height } = getGameSize();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width,
  height,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: document.body,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: import.meta.env.DEV,
    },
  },
  scene: [BootScene, MainMenuScene, CharacterSelectScene, GameScene],
  render: {
    pixelArt: true,
    antialias: false,
  },
  audio: {
    disableWebAudio: false,
  },
};

const game = new Phaser.Game(config);

// 監聽視窗大小變化，動態調整遊戲尺寸
function handleResize() {
  const { width, height } = getGameSize();
  game.scale.resize(width, height);
}

window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', () => {
  // 延遲執行，等待瀏覽器完成旋轉
  setTimeout(handleResize, 100);
});

// 監聽 visualViewport 變化（處理手機瀏覽器工具列顯示/隱藏）
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', handleResize);
}
