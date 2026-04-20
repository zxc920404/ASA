import { ISaveProvider } from '../../core/interfaces/ISaveProvider';

export class LocalStorageSaveProvider implements ISaveProvider {
  private storageAvailable: boolean;

  constructor() {
    this.storageAvailable = this.checkStorageAvailable();
  }

  save(key: string, jsonData: string): void {
    if (!this.storageAvailable) return;
    try {
      localStorage.setItem(key, jsonData);
    } catch (e) {
      // Storage full or other error - silently fail
      console.warn('[SaveProvider] Failed to save:', e);
    }
  }

  load(key: string): string | null {
    if (!this.storageAvailable) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  delete(key: string): void {
    if (!this.storageAvailable) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Silently fail
    }
  }

  exists(key: string): boolean {
    if (!this.storageAvailable) return false;
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }

  get isAvailable(): boolean {
    return this.storageAvailable;
  }

  private checkStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}
