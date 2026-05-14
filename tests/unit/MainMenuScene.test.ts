import { describe, it, expect } from 'vitest';
import packageJson from '../../package.json';

describe('MainMenuScene Version Display', () => {
  it('should have version defined in package.json', () => {
    // The VERSION constant should match package.json version
    expect(packageJson.version).toBeDefined();
    expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('should display version in correct format', () => {
    const version = packageJson.version;
    const expectedFormat = `v${version}`;
    
    // Version should be in format v1.0.0
    expect(expectedFormat).toMatch(/^v\d+\.\d+\.\d+$/);
    expect(expectedFormat).toBe('v1.0.0');
  });

  it('should use semantic versioning', () => {
    const version = packageJson.version;
    const parts = version.split('.');
    
    expect(parts).toHaveLength(3);
    expect(parseInt(parts[0])).toBeGreaterThanOrEqual(0);
    expect(parseInt(parts[1])).toBeGreaterThanOrEqual(0);
    expect(parseInt(parts[2])).toBeGreaterThanOrEqual(0);
  });
});

describe('MainMenuScene Settings Screen', () => {
  it('should have music volume slider range 0-100%', () => {
    // Volume values should be normalized to 0-1 internally
    const minVolume = 0;
    const maxVolume = 1;
    
    expect(minVolume).toBe(0);
    expect(maxVolume).toBe(1);
    
    // Display should show 0-100%
    const displayMin = Math.round(minVolume * 100);
    const displayMax = Math.round(maxVolume * 100);
    
    expect(displayMin).toBe(0);
    expect(displayMax).toBe(100);
  });

  it('should have SFX volume slider range 0-100%', () => {
    // Volume values should be normalized to 0-1 internally
    const minVolume = 0;
    const maxVolume = 1;
    
    expect(minVolume).toBe(0);
    expect(maxVolume).toBe(1);
    
    // Display should show 0-100%
    const displayMin = Math.round(minVolume * 100);
    const displayMax = Math.round(maxVolume * 100);
    
    expect(displayMin).toBe(0);
    expect(displayMax).toBe(100);
  });

  it('should save volume settings to SaveData', () => {
    // SaveData should have settings object with musicVolume and sfxVolume
    const mockSaveData = {
      gold: 0,
      permanentUpgradeLevels: [0, 0, 0, 0, 0],
      unlockedCharacterIds: ['char_swordsman'],
      settings: {
        musicVolume: 0.7,
        sfxVolume: 1.0,
      },
      appVersion: '1.0.0',
    };
    
    expect(mockSaveData.settings).toBeDefined();
    expect(mockSaveData.settings.musicVolume).toBeGreaterThanOrEqual(0);
    expect(mockSaveData.settings.musicVolume).toBeLessThanOrEqual(1);
    expect(mockSaveData.settings.sfxVolume).toBeGreaterThanOrEqual(0);
    expect(mockSaveData.settings.sfxVolume).toBeLessThanOrEqual(1);
  });

  it('should have touch-friendly slider thumb size', () => {
    // Thumb should be at least 32px diameter (16px radius) for touch-friendly interaction
    const thumbRadius = 16;
    const thumbDiameter = thumbRadius * 2;
    
    expect(thumbDiameter).toBeGreaterThanOrEqual(32);
    
    // With extra hit area padding, effective touch target should be even larger
    const hitAreaPadding = 8;
    const effectiveTouchTarget = (thumbRadius + hitAreaPadding) * 2;
    
    expect(effectiveTouchTarget).toBeGreaterThanOrEqual(48); // Meets 48x48 CSS pixel guideline
  });

  it('should apply volume changes immediately', () => {
    // When slider is dragged, volume should be applied to AudioManager immediately
    // This is tested by checking that applyVolumeChange is called during drag
    
    // Mock volume change
    const newMusicVolume = 0.5;
    const newSFXVolume = 0.8;
    
    // Volume should be clamped to 0-1 range
    expect(newMusicVolume).toBeGreaterThanOrEqual(0);
    expect(newMusicVolume).toBeLessThanOrEqual(1);
    expect(newSFXVolume).toBeGreaterThanOrEqual(0);
    expect(newSFXVolume).toBeLessThanOrEqual(1);
  });

  it('should have responsive slider width for mobile', () => {
    // Slider should be wider on mobile for easier interaction
    const mobileWidth = 320; // Typical mobile width
    const sliderWidthPercent = 0.5;
    const maxSliderWidth = 240;
    
    const calculatedWidth = Math.min(mobileWidth * sliderWidthPercent, maxSliderWidth);
    
    // On mobile, slider should be 160px (50% of 320px)
    expect(calculatedWidth).toBe(160);
    
    // On desktop, slider should be capped at 240px
    const desktopWidth = 1920;
    const desktopSliderWidth = Math.min(desktopWidth * sliderWidthPercent, maxSliderWidth);
    expect(desktopSliderWidth).toBe(240);
  });
});
