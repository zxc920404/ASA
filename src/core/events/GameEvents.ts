// === core/events/GameEvents.ts ===

export interface EnemyKilledEvent {
  position: { x: number; y: number };
  enemyId: string;
  xpValue: number;
}

export interface PlayerLevelUpEvent {
  newLevel: number;
}

export interface PlayerDamagedEvent {
  damage: number;
  remainingHP: number;
}

export interface GameOverEvent {
  survivalTime: number;
  killCount: number;
  gold: number;
  maxLevel: number;
}

export interface GameVictoryEvent {
  survivalTime: number;
  killCount: number;
  gold: number;
}

export interface XPCollectedEvent {
  amount: number;
}

export interface WeaponEvolvedEvent {
  weaponId: string;
  evolvedWeaponId: string;
}

export interface WaveChangedEvent {
  waveIndex: number;
  difficultyMultiplier: number;
}

export interface EnemyDamagedEvent {
  position: { x: number; y: number };
  damage: number;
  enemyId: string;
}

// 事件名稱常數
export const GameEventNames = {
  ENEMY_KILLED: 'enemy:killed',
  ENEMY_DAMAGED: 'enemy:damaged',
  PLAYER_LEVEL_UP: 'player:levelUp',
  PLAYER_DAMAGED: 'player:damaged',
  GAME_OVER: 'game:over',
  GAME_VICTORY: 'game:victory',
  XP_COLLECTED: 'xp:collected',
  WEAPON_EVOLVED: 'weapon:evolved',
  WAVE_CHANGED: 'wave:changed',
  GAME_PAUSED: 'game:paused',
  GAME_RESUMED: 'game:resumed',
} as const;
