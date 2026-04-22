import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { GameScene } from './scenes/GameScene';

// Dynamic resolution: short side = 540, long side scales to screen ratio
const SHORT_SIDE = 540;
const screenW = window.innerWidth;
const screenH = window.innerHeight;
const ratio = screenW / screenH;
const gameW = ratio >= 1 ? Math.round(SHORT_SIDE * ratio) : SHORT_SIDE;
const gameH = ratio >= 1 ? SHORT_SIDE : Math.round(SHORT_SIDE / ratio);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: gameW,
    height: gameH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: import.meta.env.DEV,
    },
  },
  scene: [BootScene, MainMenuScene, GameScene],
  render: {
    pixelArt: true,
    antialias: false,
  },
  audio: {
    disableWebAudio: false,
  },
};

const game = new Phaser.Game(config);

// Reload page on orientation change to get correct dimensions
window.addEventListener('orientationchange', () => {
  setTimeout(() => window.location.reload(), 200);
});

void game;
