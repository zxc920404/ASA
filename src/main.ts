import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { GameScene } from './scenes/GameScene';

// Use visualViewport for accurate mobile dimensions, fallback to innerWidth/Height
function getScreenSize() {
  const vv = window.visualViewport;
  const w = vv ? vv.width : window.innerWidth;
  const h = vv ? vv.height : window.innerHeight;
  return { w, h };
}

// Dynamic resolution: short side = 540, long side scales to screen ratio
const SHORT_SIDE = 540;
const screen = getScreenSize();
const ratio = screen.w / screen.h;
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

new Phaser.Game(config);

// Request fullscreen on first user interaction (hides browser UI on mobile)
function requestFullscreen() {
  const el = document.documentElement;
  if (el.requestFullscreen) {
    el.requestFullscreen().catch(() => {});
  } else if ((el as any).webkitRequestFullscreen) {
    (el as any).webkitRequestFullscreen();
  }
  document.removeEventListener('touchstart', requestFullscreen);
  document.removeEventListener('click', requestFullscreen);
}
document.addEventListener('touchstart', requestFullscreen, { once: true });
document.addEventListener('click', requestFullscreen, { once: true });

// Reload on orientation change for correct dimensions
window.addEventListener('orientationchange', () => {
  setTimeout(() => window.location.reload(), 200);
});
