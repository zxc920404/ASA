// === data/types.ts ===

// 武器設定
export interface WeaponConfig {
  weaponId: string;
  displayName: string;
  atlasFrame: string;
  projectileFrame: string;
  baseDamage: number;
  attackInterval: number;
  attackRange: number;
  maxLevel: number;
  attackPattern: 'projectile' | 'area' | 'orbit' | 'homing' | 'chain' | 'random';
  levelData: WeaponLevelData[];
  evolutionPassiveId: string;
  evolvedWeaponId: string;
}

export interface WeaponLevelData {
  level: number;
  damage: number;
  projectileCount: number;
  attackRange: number;
  attackInterval: number;
  description: string;
}

// 敵人設定
export interface EnemyConfig {
  enemyId: string;
  displayName: string;
  atlasFrame: string;
  baseHP: number;
  baseDamage: number;
  moveSpeed: number;
  bodySize: number;
  xpValue: number;
  isBoss: boolean;
  dropTable: DropTableEntry[];
}

export interface DropTableEntry {
  itemId: string;
  dropRate: number;
}

// 角色設定
export interface CharacterConfig {
  characterId: string;
  displayName: string;
  atlasFrame: string;
  baseHP: number;
  baseMoveSpeed: number;
  baseAttackPower: number;
  basePickupRange: number;
  startingWeaponId: string;
  unlockedByDefault: boolean;
  unlockCost: number;
}

// 被動道具設定
export interface PassiveItemConfig {
  itemId: string;
  displayName: string;
  atlasFrame: string;
  maxLevel: number;
  levelData: PassiveItemLevelData[];
}

export interface PassiveItemLevelData {
  level: number;
  statModifiers: StatModifier[];
  description: string;
}

// 屬性修改器
export interface StatModifier {
  stat: StatType;
  value: number;
  type: 'flat' | 'percent';
}

export type StatType =
  | 'maxHP'
  | 'attackPower'
  | 'moveSpeed'
  | 'pickupRange'
  | 'attackInterval'
  | 'projectileCount'
  | 'attackRange'
  | 'xpGain'
  | 'armor';

// 波次設定
export interface WaveConfig {
  waveId: string;
  startTime: number;
  endTime: number;
  enemyTypes: string[];
  spawnInterval: number;
  spawnCount: number;
  statMultiplier: number;
}

// 物件池設定
export interface PoolConfigData {
  pools: PoolEntry[];
}

export interface PoolEntry {
  poolId: string;
  preAllocateCount: number;
  maxBatchExpansion: number;
}

// 永久升級定義
export interface PermanentUpgrade {
  upgradeId: string;
  displayName: string;
  stat: StatType;
  valuePerLevel: number;
  maxLevel: number;
  costPerLevel: number[];
}

// 存檔資料
export interface SaveData {
  gold: number;
  permanentUpgradeLevels: number[];
  unlockedCharacterIds: string[];
  settings: {
    musicVolume: number;
    sfxVolume: number;
  };
  appVersion: string;
}
