// === core/interfaces/ISaveProvider.ts ===

export interface ISaveProvider {
  save(key: string, jsonData: string): void;
  load(key: string): string | null;
  delete(key: string): void;
  exists(key: string): boolean;
}
