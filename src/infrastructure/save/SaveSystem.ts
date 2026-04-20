import { ISaveProvider } from '../../core/interfaces/ISaveProvider';
import { SaveData } from '../../data/types';

export class SaveSystem {
  private provider: ISaveProvider;
  private static readonly SAVE_KEY = 'vampire_survivors_save';
  private autoSaveHandler: (() => void) | null = null;

  constructor(provider: ISaveProvider) {
    this.provider = provider;
    this.setupAutoSave();
  }

  save(data: SaveData): void {
    try {
      const json = JSON.stringify(data);
      this.provider.save(SaveSystem.SAVE_KEY, json);
    } catch (e) {
      console.warn('[SaveSystem] Failed to serialize save data:', e);
    }
  }

  load(): SaveData {
    if (!this.provider.exists(SaveSystem.SAVE_KEY)) {
      const defaultSave = this.createDefault();
      this.save(defaultSave);
      return defaultSave;
    }

    try {
      const json = this.provider.load(SaveSystem.SAVE_KEY);
      if (!json) {
        return this.createDefault();
      }
      const data = JSON.parse(json) as SaveData;
      // Validate basic structure
      if (!this.isValidSaveData(data)) {
        console.warn('[SaveSystem] Corrupted save data detected, creating default');
        const defaultSave = this.createDefault();
        this.save(defaultSave);
        return defaultSave;
      }
      return data;
    } catch {
      // Corrupted save - create default
      console.warn('[SaveSystem] Failed to parse save data, creating default');
      const defaultSave = this.createDefault();
      this.save(defaultSave);
      return defaultSave;
    }
  }

  createDefault(): SaveData {
    return {
      gold: 0,
      permanentUpgradeLevels: [0, 0, 0, 0, 0],
      unlockedCharacterIds: ['char_swordsman'],
      settings: {
        musicVolume: 0.7,
        sfxVolume: 1.0,
      },
      appVersion: '0.1.0',
    };
  }

  addGold(amount: number): void {
    const data = this.load();
    data.gold += amount;
    this.save(data);
  }

  getGold(): number {
    return this.load().gold;
  }

  private isValidSaveData(data: unknown): data is SaveData {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    if (typeof d.gold !== 'number') return false;
    if (!Array.isArray(d.permanentUpgradeLevels)) return false;
    if (d.permanentUpgradeLevels.length !== 5) return false;
    if (!Array.isArray(d.unlockedCharacterIds)) return false;
    if (!d.settings || typeof d.settings !== 'object') return false;
    return true;
  }

  private setupAutoSave(): void {
    this.autoSaveHandler = () => {
      if (document.visibilityState === 'hidden') {
        // Auto-save on page hide (tab switch, minimize, etc.)
        // Only save if there's existing data (don't create empty saves)
        if (this.provider.exists(SaveSystem.SAVE_KEY)) {
          // Data is already persisted via individual save calls
          // This is a safety net - re-save current data
          const data = this.load();
          this.save(data);
        }
      }
    };
    document.addEventListener('visibilitychange', this.autoSaveHandler);
  }

  destroy(): void {
    if (this.autoSaveHandler) {
      document.removeEventListener('visibilitychange', this.autoSaveHandler);
      this.autoSaveHandler = null;
    }
  }
}
