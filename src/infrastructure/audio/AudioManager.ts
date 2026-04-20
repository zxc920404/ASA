import Phaser from 'phaser';
import { eventBus } from '../../core/events/EventBus';
import { GameEventNames } from '../../core/events/GameEvents';

export class AudioManager {
  private scene: Phaser.Scene;
  private musicVolume: number = 0.7;
  private sfxVolume: number = 1.0;
  private currentBGM: Phaser.Sound.BaseSound | null = null;
  private audioUnlocked: boolean = false;
  private maxConcurrentSFX: number = 8;
  private activeSFXCount: number = 0;

  constructor(scene: Phaser.Scene, musicVolume: number = 0.7, sfxVolume: number = 1.0) {
    this.scene = scene;
    this.musicVolume = musicVolume;
    this.sfxVolume = sfxVolume;
    this.setupAudioUnlock();
    this.setupEventListeners();
  }

  private setupAudioUnlock(): void {
    // Unlock AudioContext on first user interaction
    const unlock = () => {
      if (this.audioUnlocked) return;
      const ctx = this.scene.sound as Phaser.Sound.WebAudioSoundManager;
      if (ctx && ctx.context && ctx.context.state === 'suspended') {
        ctx.context.resume().then(() => {
          this.audioUnlocked = true;
        });
      } else {
        this.audioUnlocked = true;
      }
      // Remove listeners after unlock
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('mousedown', unlock);
      document.removeEventListener('keydown', unlock);
    };

    document.addEventListener('touchstart', unlock, { once: true });
    document.addEventListener('mousedown', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
  }

  private setupEventListeners(): void {
    eventBus.on(GameEventNames.ENEMY_KILLED, () => {
      this.playSFX('sfx-enemy-death');
    });

    eventBus.on(GameEventNames.PLAYER_DAMAGED, () => {
      this.playSFX('sfx-player-hit');
    });

    eventBus.on(GameEventNames.PLAYER_LEVEL_UP, () => {
      this.playSFX('sfx-level-up');
    });

    eventBus.on(GameEventNames.WEAPON_EVOLVED, () => {
      this.playSFX('sfx-evolve');
    });
  }

  playBGM(key: string): void {
    // Stop current BGM if playing
    if (this.currentBGM) {
      this.currentBGM.stop();
      this.currentBGM.destroy();
      this.currentBGM = null;
    }

    // Only play if the audio key exists in cache
    if (!this.scene.cache.audio.exists(key)) {
      console.warn(`[AudioManager] BGM key "${key}" not found in cache, skipping`);
      return;
    }

    this.currentBGM = this.scene.sound.add(key, {
      volume: this.musicVolume,
      loop: true,
    });
    this.currentBGM.play();
  }

  stopBGM(): void {
    if (this.currentBGM) {
      this.currentBGM.stop();
      this.currentBGM.destroy();
      this.currentBGM = null;
    }
  }

  playSFX(key: string): void {
    // Limit concurrent SFX
    if (this.activeSFXCount >= this.maxConcurrentSFX) return;

    // Only play if the audio key exists
    if (!this.scene.cache.audio.exists(key)) {
      return; // Silently skip missing SFX (placeholder mode)
    }

    this.activeSFXCount++;
    const sfx = this.scene.sound.add(key, {
      volume: this.sfxVolume,
    });
    sfx.once('complete', () => {
      this.activeSFXCount--;
      sfx.destroy();
    });
    sfx.play();
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Phaser.Math.Clamp(volume, 0, 1);
    if (this.currentBGM && 'setVolume' in this.currentBGM) {
      (this.currentBGM as Phaser.Sound.WebAudioSound).setVolume(this.musicVolume);
    }
  }

  setSFXVolume(volume: number): void {
    this.sfxVolume = Phaser.Math.Clamp(volume, 0, 1);
  }

  getMusicVolume(): number {
    return this.musicVolume;
  }

  getSFXVolume(): number {
    return this.sfxVolume;
  }

  destroy(): void {
    this.stopBGM();
    eventBus.off(GameEventNames.ENEMY_KILLED, () => {});
    eventBus.off(GameEventNames.PLAYER_DAMAGED, () => {});
    eventBus.off(GameEventNames.PLAYER_LEVEL_UP, () => {});
    eventBus.off(GameEventNames.WEAPON_EVOLVED, () => {});
  }
}
